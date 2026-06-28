import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import { EscopoUsuarioService } from '../autorizacao/escopo-usuario.service';
import { Escola } from '../escolas/escolas.entities';
import { Turma } from '../turmas/turmas.entities';
import {
  AtualizarAlunoDto,
  CriarAlunoDto,
  ListarAlunosDto,
  ResponsavelAlunoDto,
} from './alunos.dto';
import {
  Aluno,
  ResponsavelAluno,
  SexoAluno,
  SituacaoAluno,
} from './alunos.entities';

type ValorOpcional<T> = T | null | undefined;

type FiltrosAlunosNormalizados = {
  tenantSlug?: string;
  escolaId?: string;
  turmaId?: string;
  situacao?: SituacaoAluno;
  busca?: string;
  escolaIdsPermitidas?: string[];
};

@Injectable()
export class AlunosService {
  constructor(
    @InjectRepository(Aluno)
    private readonly alunosRepositorio: Repository<Aluno>,
    @InjectRepository(Escola)
    private readonly escolasRepositorio: Repository<Escola>,
    @InjectRepository(Turma)
    private readonly turmasRepositorio: Repository<Turma>,
    private readonly escopoUsuarioService: EscopoUsuarioService,
  ) {}

  async criar(
    dados: CriarAlunoDto,
    usuarioId: string,
    filtros: Pick<ListarAlunosDto, 'tenantSlug'> = {},
  ) {
    const situacao = SituacaoAluno.PENDENTE;
    const responsaveis = this.normalizarResponsaveis(
      this.primeiroDefinido(dados.responsaveis, dados.guardians),
      {
        nome: this.primeiroDefinido(dados.responsavelNome, dados.guardian),
        telefone: this.primeiroDefinido(dados.responsavelTelefone, dados.phone),
      },
    );
    const responsavelPrincipal = responsaveis?.[0] ?? null;

    const aluno = this.alunosRepositorio.create({
      escolaId: null,
      turmaId: null,
      nomeCompleto: this.obterTextoObrigatorio(
        this.primeiroDefinido(dados.nomeCompleto, dados.name),
        'Informe o nome completo do aluno.',
      ),
      cpfOuCertidao: this.normalizarTextoOpcional(
        this.primeiroDefinido(dados.cpfOuCertidao, dados.document),
      ),
      dataNascimento: this.normalizarTextoOpcional(
        this.primeiroDefinido(dados.dataNascimento, dados.birthDate),
      ),
      sexo: this.obterSexoObrigatorio(
        this.primeiroDefinido(
          dados.genero,
          dados.gender,
          dados.sexo,
          dados.sex,
        ),
      ),
      responsavelNome: responsavelPrincipal?.nome ?? null,
      responsavelTelefone: responsavelPrincipal?.telefone ?? null,
      responsaveis,
      situacao,
      ativo: this.obterAtivoPorSituacao(situacao),
    });

    const alunoSalvo = await this.alunosRepositorio.save(aluno);

    return this.buscarPorId(alunoSalvo.id, usuarioId, filtros);
  }

  async listar(usuarioId: string, filtros: ListarAlunosDto = {}) {
    const filtrosNormalizados = await this.normalizarFiltros(filtros, usuarioId);

    if (filtrosNormalizados === null) {
      return [];
    }

    const consulta = this.alunosRepositorio
      .createQueryBuilder('aluno')
      .leftJoinAndSelect('aluno.escola', 'escola')
      .leftJoinAndSelect('aluno.turma', 'turma');

    if (filtrosNormalizados.escolaIdsPermitidas) {
      consulta.andWhere(
        new Brackets((subconsulta) => {
          subconsulta
            .where('aluno.escola_id IN (:...escolaIdsPermitidas)', {
              escolaIdsPermitidas: filtrosNormalizados.escolaIdsPermitidas,
            })
            .orWhere('aluno.escola_id IS NULL');
        }),
      );
    }

    if (filtrosNormalizados.escolaId) {
      consulta.andWhere('aluno.escola_id = :escolaId', {
        escolaId: filtrosNormalizados.escolaId,
      });
    }

    if (filtrosNormalizados.turmaId) {
      consulta.andWhere('aluno.turma_id = :turmaId', {
        turmaId: filtrosNormalizados.turmaId,
      });
    }

    if (filtrosNormalizados.situacao) {
      if (filtrosNormalizados.situacao === SituacaoAluno.PENDENTE) {
        consulta
          .andWhere('aluno.situacao <> :situacaoInativa', {
            situacaoInativa: SituacaoAluno.INATIVO,
          })
          .andWhere(
            new Brackets((subconsulta) => {
              subconsulta
                .where('aluno.escola_id IS NULL')
                .orWhere('aluno.turma_id IS NULL');
            }),
          );
      } else if (filtrosNormalizados.situacao === SituacaoAluno.ATIVO) {
        consulta
          .andWhere('aluno.situacao = :situacao', {
            situacao: SituacaoAluno.ATIVO,
          })
          .andWhere('aluno.escola_id IS NOT NULL')
          .andWhere('aluno.turma_id IS NOT NULL');
      } else {
        consulta.andWhere('aluno.situacao = :situacao', {
          situacao: filtrosNormalizados.situacao,
        });
      }
    }

    if (filtrosNormalizados.busca) {
      consulta.andWhere(
        new Brackets((subconsulta) => {
          subconsulta
            .where('LOWER(aluno.nome_completo) LIKE :busca', {
              busca: filtrosNormalizados.busca,
            })
            .orWhere('LOWER(COALESCE(aluno.cpf_ou_certidao, "")) LIKE :busca', {
              busca: filtrosNormalizados.busca,
            })
            .orWhere('LOWER(COALESCE(aluno.responsavel_nome, "")) LIKE :busca', {
              busca: filtrosNormalizados.busca,
            })
            .orWhere('LOWER(COALESCE(escola.nome, "")) LIKE :busca', {
              busca: filtrosNormalizados.busca,
            })
            .orWhere('LOWER(COALESCE(turma.nome, "")) LIKE :busca', {
              busca: filtrosNormalizados.busca,
            });
        }),
      );
    }

    const alunos = await consulta
      .orderBy('aluno.nome_completo', 'ASC')
      .getMany();

    return alunos.map((aluno) =>
      this.serializarAluno(aluno, filtrosNormalizados.tenantSlug),
    );
  }

  async buscarPorId(
    id: string,
    usuarioId: string,
    filtros: Pick<ListarAlunosDto, 'tenantSlug'> = {},
  ) {
    const aluno = await this.buscarEntidadePorId(id, usuarioId);

    return this.serializarAluno(aluno, filtros.tenantSlug);
  }

  async atualizar(
    id: string,
    dados: AtualizarAlunoDto,
    usuarioId: string,
    filtros: Pick<ListarAlunosDto, 'tenantSlug'> = {},
  ) {
    const aluno = await this.buscarEntidadePorId(id, usuarioId);
    const nomeCompleto = this.primeiroDefinido(dados.nomeCompleto, dados.name);

    if (nomeCompleto !== undefined) {
      aluno.nomeCompleto = this.obterTextoObrigatorio(
        nomeCompleto,
        'Informe o nome completo do aluno.',
      );
    }

    const cpfOuCertidao = this.primeiroDefinido(
      dados.cpfOuCertidao,
      dados.document,
    );
    const dataNascimento = this.primeiroDefinido(
      dados.dataNascimento,
      dados.birthDate,
    );
    const sexo = this.primeiroDefinido(
      dados.genero,
      dados.gender,
      dados.sexo,
      dados.sex,
    );
    const responsavelNome = this.primeiroDefinido(
      dados.responsavelNome,
      dados.guardian,
    );
    const responsavelTelefone = this.primeiroDefinido(
      dados.responsavelTelefone,
      dados.phone,
    );
    const responsaveisRecebidos = this.primeiroDefinido(
      dados.responsaveis,
      dados.guardians,
    );
    const situacaoRecebida = this.primeiroDefinido(dados.situacao, dados.status);

    if (cpfOuCertidao !== undefined) {
      aluno.cpfOuCertidao = this.normalizarTextoOpcional(cpfOuCertidao);
    }

    if (dataNascimento !== undefined) {
      aluno.dataNascimento = this.normalizarTextoOpcional(dataNascimento);
    }

    if (sexo !== undefined) {
      aluno.sexo = this.normalizarSexoOpcional(sexo);
    }

    if (responsavelNome !== undefined) {
      aluno.responsavelNome = this.normalizarTextoOpcional(responsavelNome);
    }

    if (responsavelTelefone !== undefined) {
      aluno.responsavelTelefone =
        this.normalizarTextoOpcional(responsavelTelefone);
    }

    if (responsaveisRecebidos !== undefined) {
      const responsaveis = this.normalizarResponsaveis(responsaveisRecebidos);
      const responsavelPrincipal = responsaveis?.[0] ?? null;

      aluno.responsaveis = responsaveis;
      aluno.responsavelNome = responsavelPrincipal?.nome ?? null;
      aluno.responsavelTelefone = responsavelPrincipal?.telefone ?? null;
    }

    if (situacaoRecebida !== undefined || dados.ativo !== undefined) {
      aluno.situacao = this.normalizarSituacao(
        situacaoRecebida,
        dados.ativo,
        aluno.situacao ?? this.obterSituacaoPorAtivo(aluno.ativo),
      );
      aluno.ativo = this.obterAtivoPorSituacao(aluno.situacao);
    }

    const alunoSalvo = await this.alunosRepositorio.save(aluno);

    return this.buscarPorId(alunoSalvo.id, usuarioId, filtros);
  }

  async inativar(
    id: string,
    usuarioId: string,
    filtros: Pick<ListarAlunosDto, 'tenantSlug'> = {},
  ) {
    const aluno = await this.buscarEntidadePorId(id, usuarioId);
    aluno.situacao = SituacaoAluno.INATIVO;
    aluno.ativo = false;

    const alunoSalvo = await this.alunosRepositorio.save(aluno);

    return this.buscarPorId(alunoSalvo.id, usuarioId, filtros);
  }

  async remover(id: string, usuarioId: string) {
    const aluno = await this.buscarEntidadePorId(id, usuarioId);
    await this.alunosRepositorio.remove(aluno);

    return { mensagem: 'Aluno removido com sucesso.' };
  }

  private async buscarEntidadePorId(id: string, usuarioId: string) {
    const aluno = await this.alunosRepositorio.findOne({
      where: { id },
      relations: {
        escola: true,
        turma: true,
      },
    });

    if (!aluno) {
      throw new NotFoundException('Aluno nao encontrado.');
    }

    await this.garantirAlunoPermitido(aluno, usuarioId);

    return aluno;
  }

  private async normalizarFiltros(
    filtros: ListarAlunosDto,
    usuarioId: string,
  ): Promise<FiltrosAlunosNormalizados | null> {
    const escolaIdsPermitidas = await this.obterEscolaIdsPermitidas(usuarioId);

    if (escolaIdsPermitidas === null) {
      return null;
    }

    const escolaId = this.primeiroDefinido(filtros.escolaId, filtros.schoolId);
    const turmaId = this.primeiroDefinido(filtros.turmaId, filtros.classId);
    const situacao = this.primeiroDefinido(filtros.situacao, filtros.status);
    let escolaIdNormalizada = escolaId;

    if (escolaIdNormalizada) {
      const escola = await this.buscarEscola(escolaIdNormalizada);
      await this.escopoUsuarioService.garantirEscolaPermitida(usuarioId, escola);
    }

    if (turmaId) {
      const turma = await this.buscarTurma(turmaId);
      await this.escopoUsuarioService.garantirEscolaPermitida(
        usuarioId,
        turma.escola,
      );

      if (escolaIdNormalizada && escolaIdNormalizada !== turma.escolaId) {
        throw new BadRequestException(
          'A turma informada nao pertence a escola selecionada.',
        );
      }

      escolaIdNormalizada = turma.escolaId;
    }

    return {
      tenantSlug: filtros.tenantSlug,
      escolaId: escolaIdNormalizada,
      turmaId,
      situacao,
      busca: this.normalizarBusca(filtros.busca),
      escolaIdsPermitidas,
    };
  }

  private async obterEscolaIdsPermitidas(usuarioId: string) {
    const escopo = await this.escopoUsuarioService.obterEscopo(usuarioId);

    if (escopo.global) {
      return undefined;
    }

    const escolaIds = new Set<string>(escopo.escolaIds);

    if (escopo.secretariaIds.length > 0) {
      const escolas = await this.escolasRepositorio.find({
        where: { secretariaId: In(escopo.secretariaIds) },
        select: { id: true },
      });

      for (const escola of escolas) {
        escolaIds.add(escola.id);
      }
    }

    return escolaIds.size > 0 ? [...escolaIds] : null;
  }

  private async buscarEscola(escolaId: string) {
    const escola = await this.escolasRepositorio.findOneBy({ id: escolaId });

    if (!escola) {
      throw new NotFoundException('Escola nao encontrada.');
    }

    return escola;
  }

  private async buscarTurma(turmaId: string) {
    const turma = await this.turmasRepositorio.findOne({
      where: { id: turmaId },
      relations: {
        escola: true,
      },
    });

    if (!turma) {
      throw new NotFoundException('Turma nao encontrada.');
    }

    return turma;
  }

  private async garantirAlunoPermitido(aluno: Aluno, usuarioId: string) {
    if (!aluno.escolaId) {
      await this.escopoUsuarioService.obterEscopo(usuarioId);
      return;
    }

    const escola = aluno.escola ?? (await this.buscarEscola(aluno.escolaId));
    await this.escopoUsuarioService.garantirEscolaPermitida(usuarioId, escola);
  }

  private serializarAluno(aluno: Aluno, tenantSlug?: string) {
    const situacao = aluno.situacao ?? this.obterSituacaoPorAtivo(aluno.ativo);
    const status = this.obterStatusAluno(aluno, situacao);
    const responsaveis = this.obterResponsaveisSerializados(aluno);

    return {
      ...aluno,
      situacao: status,
      ativo: this.obterAtivoPorSituacao(status),
      tenantSlug: tenantSlug ?? '',
      schoolId: aluno.escolaId,
      classId: aluno.turmaId,
      name: aluno.nomeCompleto,
      document: aluno.cpfOuCertidao ?? '',
      birthDate: aluno.dataNascimento ?? '',
      genero: aluno.sexo,
      sexo: aluno.sexo,
      gender: aluno.sexo,
      sex: aluno.sexo,
      school: aluno.escola?.nome ?? 'Sem escola vinculada',
      className: aluno.turma?.nome ?? 'Sem turma vinculada',
      responsaveis,
      guardians: responsaveis,
      guardian: responsaveis[0]?.nome ?? '',
      phone: responsaveis[0]?.telefone ?? '',
      status,
    };
  }

  private primeiroDefinido<T>(...valores: Array<T | undefined>) {
    return valores.find((valor) => valor !== undefined);
  }

  private obterTextoObrigatorio(valor: ValorOpcional<string>, mensagem: string) {
    const texto = this.normalizarTextoOpcional(valor);

    if (!texto) {
      throw new BadRequestException(mensagem);
    }

    return texto;
  }

  private normalizarTextoOpcional(valor: ValorOpcional<string>) {
    if (valor === undefined || valor === null) {
      return null;
    }

    const texto = valor.trim();

    return texto.length > 0 ? texto : null;
  }

  private normalizarResponsaveis(
    responsaveis?: ResponsavelAlunoDto[] | null,
    responsavelPrincipal?: {
      nome?: string | null;
      telefone?: string | null;
    },
  ): ResponsavelAluno[] | null {
    const lista = responsaveis ?? [];
    const normalizados = lista
      .map((responsavel) => {
        const nome = this.normalizarTextoOpcional(
          this.primeiroDefinido(responsavel.nome, responsavel.name),
        );

        if (!nome) {
          return null;
        }

        return {
          nome,
          telefone: this.normalizarTextoOpcional(
            this.primeiroDefinido(responsavel.telefone, responsavel.phone),
          ),
          parentesco: this.normalizarTextoOpcional(
            this.primeiroDefinido(
              responsavel.parentesco,
              responsavel.relationship,
            ),
          ),
        };
      })
      .filter(
        (responsavel): responsavel is ResponsavelAluno => responsavel !== null,
      );

    if (normalizados.length > 0) {
      return normalizados;
    }

    const nomePrincipal = this.normalizarTextoOpcional(responsavelPrincipal?.nome);

    if (!nomePrincipal) {
      return null;
    }

    return [
      {
        nome: nomePrincipal,
        telefone: this.normalizarTextoOpcional(responsavelPrincipal?.telefone),
        parentesco: null,
      },
    ];
  }

  private obterResponsaveisSerializados(aluno: Aluno) {
    if (aluno.responsaveis?.length) {
      return aluno.responsaveis;
    }

    const nome = this.normalizarTextoOpcional(aluno.responsavelNome);

    if (!nome) {
      return [];
    }

    return [
      {
        nome,
        telefone: this.normalizarTextoOpcional(aluno.responsavelTelefone),
        parentesco: null,
      },
    ];
  }

  private obterSexoObrigatorio(valor: ValorOpcional<string>) {
    const sexo = this.normalizarSexoOpcional(valor);

    if (!sexo) {
      throw new BadRequestException('Informe o genero do aluno.');
    }

    return sexo;
  }

  private normalizarSexoOpcional(valor: ValorOpcional<string>) {
    if (valor === undefined || valor === null) {
      return null;
    }

    const texto = valor.trim().toLowerCase();

    if (!texto) {
      return null;
    }

    if (['masculino', 'male', 'm'].includes(texto)) {
      return SexoAluno.MASCULINO;
    }

    if (['feminino', 'female', 'f'].includes(texto)) {
      return SexoAluno.FEMININO;
    }

    throw new BadRequestException(
      'Informe um genero valido para o aluno: masculino ou feminino.',
    );
  }

  private normalizarSituacao(
    situacao: ValorOpcional<SituacaoAluno>,
    ativo: boolean | undefined,
    situacaoPadrao: SituacaoAluno,
  ) {
    if (situacao) {
      return situacao;
    }

    if (ativo !== undefined) {
      return ativo ? SituacaoAluno.ATIVO : SituacaoAluno.INATIVO;
    }

    return situacaoPadrao;
  }

  private obterAtivoPorSituacao(situacao: SituacaoAluno) {
    return situacao !== SituacaoAluno.INATIVO;
  }

  private obterStatusAluno(aluno: Aluno, situacao: SituacaoAluno) {
    if (situacao === SituacaoAluno.INATIVO) {
      return SituacaoAluno.INATIVO;
    }

    if (!aluno.escolaId || !aluno.turmaId) {
      return SituacaoAluno.PENDENTE;
    }

    return SituacaoAluno.ATIVO;
  }

  private obterSituacaoPorAtivo(ativo: boolean) {
    return ativo ? SituacaoAluno.ATIVO : SituacaoAluno.INATIVO;
  }

  private normalizarBusca(busca?: string) {
    const texto = busca?.trim().toLowerCase();

    return texto ? `%${texto}%` : undefined;
  }
}
