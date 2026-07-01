import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../autenticacao/autenticacao.entities';
import { EscopoUsuarioService } from '../autorizacao/escopo-usuario.service';
import { Perfil } from '../perfis-permissoes/perfis-permissoes.entities';
import { Secretaria } from '../secretarias/secretarias.entities';
import { UsuarioAcesso } from '../usuario-acessos/usuario-acessos.entities';
import {
  AtualizarEscolaDto,
  CriarEscolaDto,
  SalvarConfiguracaoPedagogicaDto,
  SalvarPeriodoLetivoDto,
} from './escolas.dto';
import {
  Escola,
  EscolaConfiguracaoPedagogica,
  EscolaPeriodoLetivo,
  TipoPeriodoLetivo,
} from './escolas.entities';

@Injectable()
export class EscolasService {
  constructor(
    @InjectRepository(Escola)
    private readonly escolasRepositorio: Repository<Escola>,
    @InjectRepository(Secretaria)
    private readonly secretariasRepositorio: Repository<Secretaria>,
    @InjectRepository(Usuario)
    private readonly usuariosRepositorio: Repository<Usuario>,
    @InjectRepository(Perfil)
    private readonly perfisRepositorio: Repository<Perfil>,
    @InjectRepository(UsuarioAcesso)
    private readonly usuarioAcessosRepositorio: Repository<UsuarioAcesso>,
    @InjectRepository(EscolaConfiguracaoPedagogica)
    private readonly configuracoesPedagogicasRepositorio: Repository<EscolaConfiguracaoPedagogica>,
    @InjectRepository(EscolaPeriodoLetivo)
    private readonly periodosLetivosRepositorio: Repository<EscolaPeriodoLetivo>,
    private readonly escopoUsuarioService: EscopoUsuarioService,
  ) {}

  async criar(dados: CriarEscolaDto, usuarioId: string) {
    await this.garantirSecretariaExiste(dados.secretariaId);
    await this.escopoUsuarioService.garantirSecretariaPermitida(
      usuarioId,
      dados.secretariaId,
    );
    await this.garantirDiretorExiste(dados.diretorId);

    const escola = this.escolasRepositorio.create({
      ...dados,
      tipoEscola: dados.tipoEscola ?? null,
      modalidadesEnsino: dados.modalidadesEnsino ?? null,
      diretorId: dados.diretorId ?? null,
      observacoes: dados.observacoes ?? null,
      uf: dados.uf?.toUpperCase(),
      ativa: dados.ativa ?? true,
    });

    const escolaSalva = await this.escolasRepositorio.save(escola);
    await this.sincronizarDiretorGestorEscolar(
      null,
      escolaSalva.diretorId,
      escolaSalva,
      null,
    );

    return this.buscarPorId(escolaSalva.id, usuarioId);
  }

  async listar(usuarioId: string) {
    const where = await this.escopoUsuarioService.filtroEscolas(usuarioId);

    if (where === null) {
      return [];
    }

    const escolas = await this.escolasRepositorio.find({
      where,
      relations: {
        secretaria: true,
        diretor: true,
      },
      order: {
        nome: 'ASC',
      },
    });

    return escolas.map((escola) => this.serializarEscola(escola));
  }

  async buscarPorId(id: string, usuarioId: string) {
    return this.serializarEscola(await this.buscarEntidadePorId(id, usuarioId));
  }

  async buscarConfiguracaoPedagogica(
    escolaId: string,
    anoLetivo: number,
    usuarioId: string,
  ) {
    await this.buscarEntidadePorId(escolaId, usuarioId);
    const configuracao = await this.obterConfiguracaoPedagogica(escolaId, anoLetivo);

    return this.serializarConfiguracaoPedagogica(
      configuracao,
      escolaId,
      anoLetivo,
    );
  }

  async listarPeriodosLetivos(
    escolaId: string,
    anoLetivo: number,
    usuarioId: string,
  ) {
    const configuracao = await this.buscarConfiguracaoPedagogica(
      escolaId,
      anoLetivo,
      usuarioId,
    );

    return configuracao.periodos;
  }

  async buscarPeriodoLetivoAtual(
    escolaId: string,
    anoLetivo: number,
    usuarioId: string,
    dataReferencia?: string,
  ) {
    const configuracao = await this.buscarConfiguracaoPedagogica(
      escolaId,
      anoLetivo,
      usuarioId,
    );
    const data = dataReferencia ?? this.formatarData(new Date());

    if (!configuracao.configurado || !configuracao.tipoPeriodoLetivo) {
      return {
        ...configuracao,
        dataReferencia: data,
        periodoAtual: null,
        status: 'NAO_CONFIGURADO',
      };
    }

    if (!configuracao.calendarioPronto) {
      return {
        ...configuracao,
        dataReferencia: data,
        periodoAtual: null,
        status: 'CALENDARIO_INCOMPLETO',
      };
    }

    const periodos = configuracao.periodos;
    const periodoAtual = periodos.find(
      (periodo) =>
        periodo.dataInicio &&
        periodo.dataFim &&
        periodo.dataInicio <= data &&
        periodo.dataFim >= data,
    );

    if (periodoAtual) {
      return {
        ...configuracao,
        dataReferencia: data,
        periodoAtual,
        status: 'EM_ANDAMENTO',
      };
    }

    const primeiroPeriodo = periodos[0];
    const ultimoPeriodo = periodos[periodos.length - 1];

    if (primeiroPeriodo?.dataInicio && data < primeiroPeriodo.dataInicio) {
      return {
        ...configuracao,
        dataReferencia: data,
        periodoAtual: null,
        status: 'ANTES_DO_INICIO',
      };
    }

    if (ultimoPeriodo?.dataFim && data > ultimoPeriodo.dataFim) {
      return {
        ...configuracao,
        dataReferencia: data,
        periodoAtual: null,
        status: 'ENCERRADO',
      };
    }

    return {
      ...configuracao,
      dataReferencia: data,
      periodoAtual: null,
      status: 'ENTRE_PERIODOS',
    };
  }

  async salvarConfiguracaoPedagogica(
    escolaId: string,
    dados: SalvarConfiguracaoPedagogicaDto,
    usuarioId: string,
  ) {
    await this.buscarEntidadePorId(escolaId, usuarioId);

    const periodos = this.normalizarPeriodosLetivos(
      dados.tipoPeriodoLetivo ?? null,
      dados.periodos ?? [],
    );

    let configuracao = await this.obterConfiguracaoPedagogica(
      escolaId,
      dados.anoLetivo,
    );

    if (!configuracao) {
      configuracao = this.configuracoesPedagogicasRepositorio.create({
        escolaId,
        anoLetivo: dados.anoLetivo,
      });
    }

    configuracao.mediaMinimaAprovacao =
      dados.mediaMinimaAprovacao === undefined ||
      dados.mediaMinimaAprovacao === null
        ? null
        : dados.mediaMinimaAprovacao.toFixed(2);
    configuracao.tipoPeriodoLetivo = dados.tipoPeriodoLetivo ?? null;
    configuracao.ativa = true;

    const configuracaoSalva =
      await this.configuracoesPedagogicasRepositorio.save(configuracao);

    await this.periodosLetivosRepositorio.delete({
      configuracaoPedagogicaId: configuracaoSalva.id,
    });

    if (periodos.length > 0) {
      await this.periodosLetivosRepositorio.save(
        periodos.map((periodo) =>
          this.periodosLetivosRepositorio.create({
            ...periodo,
            configuracaoPedagogicaId: configuracaoSalva.id,
            ativo: true,
          }),
        ),
      );
    }

    return this.buscarConfiguracaoPedagogica(
      escolaId,
      dados.anoLetivo,
      usuarioId,
    );
  }

  private async buscarEntidadePorId(id: string, usuarioId: string) {
    const escola = await this.escolasRepositorio.findOne({
      where: { id },
      relations: {
        secretaria: true,
        diretor: true,
      },
    });

    if (!escola) {
      throw new NotFoundException('Escola nao encontrada.');
    }

    await this.escopoUsuarioService.garantirEscolaPermitida(usuarioId, escola);

    return escola;
  }

  async atualizar(id: string, dados: AtualizarEscolaDto, usuarioId: string) {
    const escola = await this.buscarEntidadePorId(id, usuarioId);
    const diretorAnteriorId = escola.diretorId;
    const secretariaAnteriorId = escola.secretariaId;

    if (dados.secretariaId) {
      await this.garantirSecretariaExiste(dados.secretariaId);
      await this.escopoUsuarioService.garantirSecretariaPermitida(
        usuarioId,
        dados.secretariaId,
      );
    }

    if (dados.diretorId !== undefined) {
      await this.garantirDiretorExiste(dados.diretorId);
    }

    const dadosAtualizados = {
      secretariaId:
        dados.secretariaId === undefined ? escola.secretariaId : dados.secretariaId,
      nome: dados.nome === undefined ? escola.nome : dados.nome,
      codigoInep:
        dados.codigoInep === undefined ? escola.codigoInep : dados.codigoInep ?? null,
      tipoEscola:
        dados.tipoEscola === undefined ? escola.tipoEscola : dados.tipoEscola ?? null,
      modalidadesEnsino:
        dados.modalidadesEnsino === undefined
          ? escola.modalidadesEnsino
          : dados.modalidadesEnsino ?? null,
      diretorId:
        dados.diretorId === undefined ? escola.diretorId : dados.diretorId ?? null,
      cnpj: dados.cnpj === undefined ? escola.cnpj : dados.cnpj ?? null,
      telefone:
        dados.telefone === undefined ? escola.telefone : dados.telefone ?? null,
      email: dados.email === undefined ? escola.email : dados.email ?? null,
      cep: dados.cep === undefined ? escola.cep : dados.cep ?? null,
      endereco:
        dados.endereco === undefined ? escola.endereco : dados.endereco ?? null,
      numero: dados.numero === undefined ? escola.numero : dados.numero ?? null,
      complemento:
        dados.complemento === undefined
          ? escola.complemento
          : dados.complemento ?? null,
      bairro: dados.bairro === undefined ? escola.bairro : dados.bairro ?? null,
      municipio:
        dados.municipio === undefined ? escola.municipio : dados.municipio ?? null,
      observacoes:
        dados.observacoes === undefined
          ? escola.observacoes
          : dados.observacoes ?? null,
      uf: dados.uf?.toUpperCase() ?? escola.uf,
      ativa: dados.ativa ?? escola.ativa,
    };

    await this.escolasRepositorio.update(id, dadosAtualizados);
    await this.sincronizarDiretorGestorEscolar(
      diretorAnteriorId,
      dadosAtualizados.diretorId,
      {
        id: escola.id,
        secretariaId: dadosAtualizados.secretariaId,
      },
      secretariaAnteriorId,
    );

    return this.buscarPorId(id, usuarioId);
  }

  async remover(id: string, usuarioId: string) {
    const escola = await this.buscarEntidadePorId(id, usuarioId);
    await this.escolasRepositorio.remove(escola);

    return { mensagem: 'Escola removida com sucesso.' };
  }

  async inativar(id: string, usuarioId: string) {
    const escola = await this.buscarEntidadePorId(id, usuarioId);
    escola.ativa = false;

    const escolaSalva = await this.escolasRepositorio.save(escola);

    return this.buscarPorId(escolaSalva.id, usuarioId);
  }

  private async garantirSecretariaExiste(secretariaId: string) {
    const secretaria = await this.secretariasRepositorio.findOneBy({
      id: secretariaId,
    });

    if (!secretaria) {
      throw new NotFoundException('Secretaria nao encontrada.');
    }
  }

  private serializarEscola(escola: Escola) {
    return {
      ...escola,
      diretor: escola.diretor
        ? {
            id: escola.diretor.id,
            nome: escola.diretor.nome,
            email: escola.diretor.email,
            username: escola.diretor.username,
            cpf: escola.diretor.cpf,
            ativo: escola.diretor.ativo,
          }
        : null,
    };
  }

  private async garantirDiretorExiste(diretorId?: string | null) {
    if (!diretorId) {
      return;
    }

    const diretor = await this.usuariosRepositorio.findOneBy({ id: diretorId });

    if (!diretor) {
      throw new NotFoundException('Diretor nao encontrado.');
    }
  }

  private async sincronizarDiretorGestorEscolar(
    diretorAnteriorId: string | null,
    diretorAtualId: string | null,
    escola: { id: string; secretariaId: string },
    secretariaAnteriorId: string | null,
  ) {
    if (!diretorAnteriorId && !diretorAtualId) {
      return;
    }

    if (
      diretorAnteriorId === diretorAtualId &&
      secretariaAnteriorId === escola.secretariaId
    ) {
      return;
    }

    const perfilGestor = await this.buscarPerfilGestorEscolar();

    if (diretorAnteriorId) {
      await this.usuarioAcessosRepositorio.delete({
        usuarioId: diretorAnteriorId,
        perfilId: perfilGestor.id,
        escolaId: escola.id,
      });
    }

    if (!diretorAtualId) {
      return;
    }

    const acessoExistente = await this.usuarioAcessosRepositorio.findOne({
      where: {
        usuarioId: diretorAtualId,
        perfilId: perfilGestor.id,
        secretariaId: escola.secretariaId,
        escolaId: escola.id,
      },
    });

    if (acessoExistente) {
      acessoExistente.ativo = true;
      await this.usuarioAcessosRepositorio.save(acessoExistente);
      return;
    }

    await this.usuarioAcessosRepositorio.save(
      this.usuarioAcessosRepositorio.create({
        usuarioId: diretorAtualId,
        perfilId: perfilGestor.id,
        secretariaId: escola.secretariaId,
        escolaId: escola.id,
        ativo: true,
      }),
    );
  }

  private async buscarPerfilGestorEscolar() {
    const perfil = await this.perfisRepositorio.findOneBy({
      codigo: 'GESTOR_ESCOLAR',
    });

    if (!perfil) {
      throw new NotFoundException('Perfil GESTOR_ESCOLAR nao encontrado.');
    }

    return perfil;
  }

  private async obterConfiguracaoPedagogica(escolaId: string, anoLetivo: number) {
    return this.configuracoesPedagogicasRepositorio.findOne({
      where: { escolaId, anoLetivo, ativa: true },
      relations: { periodos: true },
      order: { periodos: { numero: 'ASC' } },
    });
  }

  private normalizarPeriodosLetivos(
    tipoPeriodoLetivo: TipoPeriodoLetivo | null,
    periodosRecebidos: SalvarPeriodoLetivoDto[],
  ) {
    if (!tipoPeriodoLetivo) {
      if (periodosRecebidos.length > 0) {
        throw new BadRequestException(
          'Nao envie periodos quando o tipo de periodo letivo estiver vazio.',
        );
      }

      return [];
    }

    const totalPeriodos = this.obterTotalPeriodos(tipoPeriodoLetivo);
    const periodosPorNumero = new Map(
      periodosRecebidos.map((periodo) => [periodo.numero, periodo]),
    );

    for (const periodo of periodosRecebidos) {
      if (periodo.numero > totalPeriodos) {
        throw new BadRequestException(
          `O tipo ${tipoPeriodoLetivo} permite no maximo ${totalPeriodos} periodos.`,
        );
      }
    }

    const periodos = Array.from({ length: totalPeriodos }, (_, indice) => {
      const numero = indice + 1;
      const periodoRecebido = periodosPorNumero.get(numero);
      return {
        numero,
        label: this.montarLabelPeriodo(tipoPeriodoLetivo, numero),
        dataInicio: periodoRecebido?.dataInicio ?? null,
        dataFim: periodoRecebido?.dataFim ?? null,
      };
    });

    this.validarDatasPeriodos(periodos);

    return periodos;
  }

  private validarDatasPeriodos(
    periodos: Array<{ numero: number; dataInicio: string | null; dataFim: string | null }>,
  ) {
    let dataFimAnterior: string | null = null;

    for (const periodo of periodos) {
      if (
        (periodo.dataInicio && !periodo.dataFim) ||
        (!periodo.dataInicio && periodo.dataFim)
      ) {
        throw new BadRequestException(
          `Informe inicio e fim do ${periodo.numero} periodo, ou deixe ambos vazios.`,
        );
      }

      if (
        periodo.dataInicio &&
        periodo.dataFim &&
        periodo.dataInicio > periodo.dataFim
      ) {
        throw new BadRequestException(
          `A data inicial do ${periodo.numero} periodo deve ser menor ou igual a data final.`,
        );
      }

      if (
        dataFimAnterior &&
        periodo.dataInicio &&
        periodo.dataInicio <= dataFimAnterior
      ) {
        throw new BadRequestException(
          'Os periodos letivos devem estar em ordem e sem sobreposicao.',
        );
      }

      if (periodo.dataFim) {
        dataFimAnterior = periodo.dataFim;
      }
    }
  }

  private obterTotalPeriodos(tipoPeriodoLetivo: TipoPeriodoLetivo) {
    const totais = {
      [TipoPeriodoLetivo.BIMESTRAL]: 4,
      [TipoPeriodoLetivo.TRIMESTRAL]: 3,
      [TipoPeriodoLetivo.SEMESTRAL]: 2,
    };

    return totais[tipoPeriodoLetivo];
  }

  private montarLabelPeriodo(tipoPeriodoLetivo: TipoPeriodoLetivo, numero: number) {
    const nomes = {
      [TipoPeriodoLetivo.BIMESTRAL]: 'bimestre',
      [TipoPeriodoLetivo.TRIMESTRAL]: 'trimestre',
      [TipoPeriodoLetivo.SEMESTRAL]: 'semestre',
    };

    return `${numero}º ${nomes[tipoPeriodoLetivo]}`;
  }

  private serializarConfiguracaoPedagogica(
    configuracao: EscolaConfiguracaoPedagogica | null,
    escolaId: string,
    anoLetivo: number,
  ) {
    const periodos = [...(configuracao?.periodos ?? [])]
      .filter((periodo) => periodo.ativo)
      .sort((a, b) => a.numero - b.numero)
      .map((periodo) => ({
        id: periodo.id,
        numero: periodo.numero,
        label: periodo.label,
        dataInicio: periodo.dataInicio,
        dataFim: periodo.dataFim,
        ativo: periodo.ativo,
      }));

    const calendarioPronto =
      Boolean(configuracao?.tipoPeriodoLetivo) &&
      periodos.length ===
        this.obterTotalPeriodos(configuracao!.tipoPeriodoLetivo!) &&
      periodos.every((periodo) => periodo.dataInicio && periodo.dataFim);

    return {
      id: configuracao?.id ?? null,
      escolaId,
      anoLetivo,
      configurado: Boolean(configuracao),
      mediaMinimaAprovacao:
        configuracao?.mediaMinimaAprovacao === null ||
        configuracao?.mediaMinimaAprovacao === undefined
          ? null
          : Number(configuracao.mediaMinimaAprovacao),
      tipoPeriodoLetivo: configuracao?.tipoPeriodoLetivo ?? null,
      totalPeriodos: configuracao?.tipoPeriodoLetivo
        ? this.obterTotalPeriodos(configuracao.tipoPeriodoLetivo)
        : 0,
      calendarioPronto,
      periodos,
      ativa: configuracao?.ativa ?? false,
    };
  }

  private formatarData(data: Date) {
    return data.toISOString().slice(0, 10);
  }
}
