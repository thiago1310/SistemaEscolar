import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import { Aluno, SituacaoAluno } from '../alunos/alunos.entities';
import { EscopoUsuarioService } from '../autorizacao/escopo-usuario.service';
import { Escola } from '../escolas/escolas.entities';
import { Turma } from '../turmas/turmas.entities';
import {
  AtualizarMatriculaDto,
  CriarMatriculaDto,
  ListarMatriculasDto,
} from './matriculas.dto';
import {
  Matricula,
  SituacaoMatricula,
  TipoMatricula,
} from './matriculas.entities';

type ValorOpcional<T> = T | null | undefined;

type FiltrosMatriculasNormalizados = {
  tenantSlug?: string;
  alunoId?: string;
  escolaId?: string;
  turmaId?: string;
  tipo?: TipoMatricula;
  situacao?: SituacaoMatricula;
  anoLetivo?: number;
  busca?: string;
  escolaIdsPermitidas?: string[];
};

@Injectable()
export class MatriculasService {
  constructor(
    @InjectRepository(Matricula)
    private readonly matriculasRepositorio: Repository<Matricula>,
    @InjectRepository(Aluno)
    private readonly alunosRepositorio: Repository<Aluno>,
    @InjectRepository(Escola)
    private readonly escolasRepositorio: Repository<Escola>,
    @InjectRepository(Turma)
    private readonly turmasRepositorio: Repository<Turma>,
    private readonly escopoUsuarioService: EscopoUsuarioService,
  ) {}

  async criar(
    dados: CriarMatriculaDto,
    usuarioId: string,
    filtros: Pick<ListarMatriculasDto, 'tenantSlug'> = {},
  ) {
    const alunoId = this.obterTextoObrigatorio(
      this.primeiroDefinido(dados.alunoId, dados.studentId),
      'Informe o aluno da matricula.',
    );
    const turmaId = this.obterTextoObrigatorio(
      this.primeiroDefinido(dados.turmaId, dados.classId, dados.targetClassId),
      'Informe a turma da matricula.',
    );
    const turma = await this.buscarTurma(turmaId);
    const escolaIdRecebida = this.primeiroDefinido(
      dados.escolaId,
      dados.schoolId,
      dados.targetSchoolId,
    );
    const escolaId = escolaIdRecebida ?? turma.escolaId;

    this.garantirTurmaPertenceAEscola(turma, escolaId);
    await this.escopoUsuarioService.garantirEscolaPermitida(
      usuarioId,
      turma.escola,
    );

    const aluno = await this.buscarAluno(alunoId);
    await this.garantirAlunoPermitido(aluno, usuarioId);

    const anoLetivo = this.normalizarAnoLetivo(
      this.primeiroDefinido<number | string>(dados.anoLetivo, dados.year),
      turma.anoLetivo,
    );
    const tipo = this.normalizarTipo(
      this.primeiroDefinido(dados.tipo, dados.type),
      TipoMatricula.MATRICULA,
    );
    const situacao = this.normalizarSituacao(
      this.primeiroDefinido(dados.situacao, dados.situation, dados.status),
      tipo === TipoMatricula.TRANSFERENCIA
        ? SituacaoMatricula.ANALISE
        : SituacaoMatricula.ATIVA,
    );
    const numeroMatricula =
      this.normalizarTextoOpcional(
        this.primeiroDefinido(dados.numeroMatricula, dados.registration),
      ) ?? (await this.gerarNumeroMatricula(anoLetivo));

    await this.garantirNumeroMatriculaUnico(numeroMatricula);

    if (situacao === SituacaoMatricula.ATIVA) {
      await this.prepararMatriculaAtiva(aluno.id, anoLetivo, tipo, undefined);
    }

    const matricula = this.matriculasRepositorio.create({
      alunoId: aluno.id,
      escolaId,
      turmaId: turma.id,
      escolaOrigemId:
        tipo === TipoMatricula.TRANSFERENCIA ? aluno.escolaId : null,
      turmaOrigemId:
        tipo === TipoMatricula.TRANSFERENCIA ? aluno.turmaId : null,
      numeroMatricula,
      anoLetivo,
      tipo,
      situacao,
      dataMatricula: this.normalizarData(
        this.primeiroDefinido(dados.dataMatricula, dados.enrollmentDate),
      ),
      motivo: this.normalizarTextoOpcional(
        this.primeiroDefinido(dados.motivo, dados.reason),
      ),
      observacoes: this.normalizarTextoOpcional(
        this.primeiroDefinido(dados.observacoes, dados.observation),
      ),
      anoOrigem: dados.sourceYear ?? null,
      anoDestino: dados.targetYear ?? null,
      criterioRematricula: this.normalizarTextoOpcional(dados.mode),
      ativa: situacao !== SituacaoMatricula.DOCUMENTACAO,
    });

    const matriculaSalva = await this.matriculasRepositorio.save(matricula);

    if (matriculaSalva.situacao === SituacaoMatricula.ATIVA) {
      await this.vincularAlunoNaMatricula(matriculaSalva);
    }

    return this.buscarPorId(matriculaSalva.id, usuarioId, filtros);
  }

  async listar(usuarioId: string, filtros: ListarMatriculasDto = {}) {
    const filtrosNormalizados = await this.normalizarFiltros(
      filtros,
      usuarioId,
    );

    if (filtrosNormalizados === null) {
      return [];
    }

    const consulta = this.matriculasRepositorio
      .createQueryBuilder('matricula')
      .leftJoinAndSelect('matricula.aluno', 'aluno')
      .leftJoinAndSelect('matricula.escola', 'escola')
      .leftJoinAndSelect('matricula.turma', 'turma')
      .leftJoinAndSelect('matricula.escolaOrigem', 'escolaOrigem')
      .leftJoinAndSelect('matricula.turmaOrigem', 'turmaOrigem');

    if (filtrosNormalizados.escolaIdsPermitidas) {
      consulta.andWhere('matricula.escola_id IN (:...escolaIdsPermitidas)', {
        escolaIdsPermitidas: filtrosNormalizados.escolaIdsPermitidas,
      });
    }

    if (filtrosNormalizados.alunoId) {
      consulta.andWhere('matricula.aluno_id = :alunoId', {
        alunoId: filtrosNormalizados.alunoId,
      });
    }

    if (filtrosNormalizados.escolaId) {
      consulta.andWhere('matricula.escola_id = :escolaId', {
        escolaId: filtrosNormalizados.escolaId,
      });
    }

    if (filtrosNormalizados.turmaId) {
      consulta.andWhere('matricula.turma_id = :turmaId', {
        turmaId: filtrosNormalizados.turmaId,
      });
    }

    if (filtrosNormalizados.tipo) {
      consulta.andWhere('matricula.tipo = :tipo', {
        tipo: filtrosNormalizados.tipo,
      });
    }

    if (filtrosNormalizados.situacao) {
      consulta.andWhere('matricula.situacao = :situacao', {
        situacao: filtrosNormalizados.situacao,
      });
    }

    if (filtrosNormalizados.anoLetivo) {
      consulta.andWhere('matricula.ano_letivo = :anoLetivo', {
        anoLetivo: filtrosNormalizados.anoLetivo,
      });
    }

    if (filtrosNormalizados.busca) {
      consulta.andWhere(
        new Brackets((subconsulta) => {
          subconsulta
            .where('LOWER(aluno.nome_completo) LIKE :busca', {
              busca: filtrosNormalizados.busca,
            })
            .orWhere(
              'LOWER(COALESCE(aluno.responsavel_nome, "")) LIKE :busca',
              {
                busca: filtrosNormalizados.busca,
              },
            )
            .orWhere('LOWER(COALESCE(aluno.cpf_ou_certidao, "")) LIKE :busca', {
              busca: filtrosNormalizados.busca,
            })
            .orWhere('LOWER(matricula.numero_matricula) LIKE :busca', {
              busca: filtrosNormalizados.busca,
            })
            .orWhere('LOWER(escola.nome) LIKE :busca', {
              busca: filtrosNormalizados.busca,
            })
            .orWhere('LOWER(turma.nome) LIKE :busca', {
              busca: filtrosNormalizados.busca,
            })
            .orWhere('LOWER(turma.ano_serie) LIKE :busca', {
              busca: filtrosNormalizados.busca,
            });
        }),
      );
    }

    const matriculas = await consulta
      .orderBy('matricula.data_matricula', 'DESC')
      .addOrderBy('aluno.nome_completo', 'ASC')
      .getMany();

    return matriculas.map((matricula) =>
      this.serializarMatricula(matricula, filtrosNormalizados.tenantSlug),
    );
  }

  async buscarPorId(
    id: string,
    usuarioId: string,
    filtros: Pick<ListarMatriculasDto, 'tenantSlug'> = {},
  ) {
    const matricula = await this.buscarEntidadePorId(id, usuarioId);

    return this.serializarMatricula(matricula, filtros.tenantSlug);
  }

  async atualizar(
    id: string,
    dados: AtualizarMatriculaDto,
    usuarioId: string,
    filtros: Pick<ListarMatriculasDto, 'tenantSlug'> = {},
  ) {
    const matricula = await this.buscarEntidadePorId(id, usuarioId);
    const turmaId = this.primeiroDefinido(
      dados.turmaId,
      dados.classId,
      dados.targetClassId,
    );
    const escolaIdRecebida = this.primeiroDefinido(
      dados.escolaId,
      dados.schoolId,
      dados.targetSchoolId,
    );
    const turma = turmaId ? await this.buscarTurma(turmaId) : matricula.turma;
    const escolaId = escolaIdRecebida ?? turma.escolaId;

    this.garantirTurmaPertenceAEscola(turma, escolaId);
    await this.escopoUsuarioService.garantirEscolaPermitida(
      usuarioId,
      turma.escola,
    );

    const tipoRecebido = this.primeiroDefinido(dados.tipo, dados.type);
    const situacaoRecebida = this.primeiroDefinido(
      dados.situacao,
      dados.situation,
      dados.status,
    );
    const numeroRecebido = this.primeiroDefinido(
      dados.numeroMatricula,
      dados.registration,
    );

    if (tipoRecebido !== undefined) {
      matricula.tipo = this.normalizarTipo(tipoRecebido, matricula.tipo);
    }

    if (situacaoRecebida !== undefined) {
      matricula.situacao = this.normalizarSituacao(
        situacaoRecebida,
        matricula.situacao,
      );
    }

    if (dados.ativa !== undefined) {
      matricula.ativa = dados.ativa;
    } else if (situacaoRecebida !== undefined) {
      matricula.ativa = matricula.situacao !== SituacaoMatricula.DOCUMENTACAO;
    }

    if (dados.anoLetivo !== undefined || dados.year !== undefined) {
      matricula.anoLetivo = this.normalizarAnoLetivo(
        this.primeiroDefinido<number | string>(dados.anoLetivo, dados.year),
        matricula.anoLetivo,
      );
    }

    if (numeroRecebido !== undefined) {
      const numeroMatricula = this.obterTextoObrigatorio(
        numeroRecebido,
        'Informe o numero da matricula.',
      );
      await this.garantirNumeroMatriculaUnico(numeroMatricula, matricula.id);
      matricula.numeroMatricula = numeroMatricula;
    }

    if (
      dados.dataMatricula !== undefined ||
      dados.enrollmentDate !== undefined
    ) {
      matricula.dataMatricula = this.normalizarData(
        this.primeiroDefinido(dados.dataMatricula, dados.enrollmentDate),
      );
    }

    if (dados.motivo !== undefined || dados.reason !== undefined) {
      matricula.motivo = this.normalizarTextoOpcional(
        this.primeiroDefinido(dados.motivo, dados.reason),
      );
    }

    if (dados.observacoes !== undefined || dados.observation !== undefined) {
      matricula.observacoes = this.normalizarTextoOpcional(
        this.primeiroDefinido(dados.observacoes, dados.observation),
      );
    }

    if (dados.mode !== undefined) {
      matricula.criterioRematricula = this.normalizarTextoOpcional(dados.mode);
    }

    if (dados.sourceYear !== undefined) {
      matricula.anoOrigem = dados.sourceYear ?? null;
    }

    if (dados.targetYear !== undefined) {
      matricula.anoDestino = dados.targetYear ?? null;
    }

    matricula.escolaId = escolaId;
    matricula.turmaId = turma.id;

    if (
      matricula.situacao === SituacaoMatricula.ATIVA &&
      matricula.ativa === true
    ) {
      await this.prepararMatriculaAtiva(
        matricula.alunoId,
        matricula.anoLetivo,
        matricula.tipo,
        matricula.id,
      );
    }

    const matriculaSalva = await this.matriculasRepositorio.save(matricula);

    if (
      matriculaSalva.situacao === SituacaoMatricula.ATIVA &&
      matriculaSalva.ativa === true
    ) {
      await this.vincularAlunoNaMatricula(matriculaSalva);
    } else {
      await this.sincronizarAlunoAposMatriculaInativa(matriculaSalva);
    }

    return this.buscarPorId(matriculaSalva.id, usuarioId, filtros);
  }

  async inativar(
    id: string,
    usuarioId: string,
    filtros: Pick<ListarMatriculasDto, 'tenantSlug'> = {},
  ) {
    const matricula = await this.buscarEntidadePorId(id, usuarioId);
    matricula.situacao = SituacaoMatricula.DOCUMENTACAO;
    matricula.ativa = false;

    const matriculaSalva = await this.matriculasRepositorio.save(matricula);
    await this.sincronizarAlunoAposMatriculaInativa(matriculaSalva);

    return this.buscarPorId(matriculaSalva.id, usuarioId, filtros);
  }

  async remover(id: string, usuarioId: string) {
    const matricula = await this.buscarEntidadePorId(id, usuarioId);
    await this.matriculasRepositorio.remove(matricula);
    await this.sincronizarAlunoAposMatriculaInativa(matricula);

    return { mensagem: 'Matricula removida com sucesso.' };
  }

  private async buscarEntidadePorId(id: string, usuarioId: string) {
    const matricula = await this.matriculasRepositorio.findOne({
      where: { id },
      relations: {
        aluno: true,
        escola: true,
        turma: true,
        escolaOrigem: true,
        turmaOrigem: true,
      },
    });

    if (!matricula) {
      throw new NotFoundException('Matricula nao encontrada.');
    }

    await this.escopoUsuarioService.garantirEscolaPermitida(
      usuarioId,
      matricula.escola,
    );

    return matricula;
  }

  private async normalizarFiltros(
    filtros: ListarMatriculasDto,
    usuarioId: string,
  ): Promise<FiltrosMatriculasNormalizados | null> {
    const escolaIdsPermitidas = await this.obterEscolaIdsPermitidas(usuarioId);

    if (escolaIdsPermitidas === null) {
      return null;
    }

    const alunoId = this.primeiroDefinido(filtros.alunoId, filtros.studentId);
    const escolaId = this.primeiroDefinido(filtros.escolaId, filtros.schoolId);
    const turmaId = this.primeiroDefinido(filtros.turmaId, filtros.classId);
    const tipoRecebido = this.primeiroDefinido(filtros.tipo, filtros.type);
    const situacaoRecebida = this.primeiroDefinido(
      filtros.situacao,
      filtros.situation,
      filtros.status,
    );
    let escolaIdNormalizada = escolaId;

    if (alunoId) {
      const aluno = await this.buscarAluno(alunoId);
      await this.garantirAlunoPermitido(aluno, usuarioId);
    }

    if (escolaIdNormalizada) {
      const escola = await this.buscarEscola(escolaIdNormalizada);
      await this.escopoUsuarioService.garantirEscolaPermitida(
        usuarioId,
        escola,
      );
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
      alunoId,
      escolaId: escolaIdNormalizada,
      turmaId,
      tipo:
        tipoRecebido === undefined
          ? undefined
          : this.normalizarTipo(tipoRecebido, TipoMatricula.MATRICULA),
      situacao:
        situacaoRecebida === undefined
          ? undefined
          : this.normalizarSituacao(situacaoRecebida, SituacaoMatricula.ATIVA),
      anoLetivo: filtros.anoLetivo,
      busca: this.normalizarBusca(filtros.busca),
      escolaIdsPermitidas,
    };
  }

  private async obterEscolaIdsPermitidas(usuarioId: string) {
    const escopo = await this.escopoUsuarioService.obterEscopo(usuarioId);

    if (escopo.global) {
      return undefined;
    }

    if (escopo.escolaIds.length > 0) {
      return escopo.escolaIds;
    }

    if (escopo.secretariaIds.length > 0) {
      const escolas = await this.escolasRepositorio.find({
        where: { secretariaId: In(escopo.secretariaIds) },
        select: { id: true },
      });

      return escolas.map((escola) => escola.id);
    }

    return null;
  }

  private async buscarAluno(alunoId: string) {
    const aluno = await this.alunosRepositorio.findOne({
      where: { id: alunoId },
      relations: {
        escola: true,
        turma: true,
      },
    });

    if (!aluno) {
      throw new NotFoundException('Aluno nao encontrado.');
    }

    return aluno;
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

  private garantirTurmaPertenceAEscola(turma: Turma, escolaId: string) {
    if (turma.escolaId !== escolaId) {
      throw new BadRequestException(
        'A turma informada nao pertence a escola selecionada.',
      );
    }
  }

  private async garantirNumeroMatriculaUnico(
    numeroMatricula: string,
    ignorarId?: string,
  ) {
    const consulta = this.matriculasRepositorio
      .createQueryBuilder('matricula')
      .where('matricula.numero_matricula = :numeroMatricula', {
        numeroMatricula,
      });

    if (ignorarId) {
      consulta.andWhere('matricula.id != :ignorarId', { ignorarId });
    }

    const existente = await consulta.getOne();

    if (existente) {
      throw new BadRequestException('Ja existe matricula com este numero.');
    }
  }

  private async prepararMatriculaAtiva(
    alunoId: string,
    anoLetivo: number,
    tipo: TipoMatricula,
    ignorarId?: string,
  ) {
    if (tipo === TipoMatricula.TRANSFERENCIA) {
      await this.desativarMatriculasAtivasDoAluno(
        alunoId,
        anoLetivo,
        ignorarId,
      );
      return;
    }

    await this.garantirMatriculaAtivaNaoDuplicada(
      alunoId,
      anoLetivo,
      ignorarId,
    );
  }

  private async garantirMatriculaAtivaNaoDuplicada(
    alunoId: string,
    anoLetivo: number,
    ignorarId?: string,
  ) {
    const consulta = this.matriculasRepositorio
      .createQueryBuilder('matricula')
      .where('matricula.aluno_id = :alunoId', { alunoId })
      .andWhere('matricula.ano_letivo = :anoLetivo', { anoLetivo })
      .andWhere('matricula.situacao = :situacao', {
        situacao: SituacaoMatricula.ATIVA,
      })
      .andWhere('matricula.ativa = :ativa', { ativa: true });

    if (ignorarId) {
      consulta.andWhere('matricula.id != :ignorarId', { ignorarId });
    }

    const existente = await consulta.getOne();

    if (existente) {
      throw new BadRequestException(
        'Aluno ja possui matricula ativa para este ano letivo.',
      );
    }
  }

  private async desativarMatriculasAtivasDoAluno(
    alunoId: string,
    anoLetivo: number,
    ignorarId?: string,
  ) {
    const atualizacao = this.matriculasRepositorio
      .createQueryBuilder()
      .update(Matricula)
      .set({
        situacao: SituacaoMatricula.DOCUMENTACAO,
        ativa: false,
      })
      .where('aluno_id = :alunoId', { alunoId })
      .andWhere('ano_letivo = :anoLetivo', { anoLetivo })
      .andWhere('situacao = :situacao', { situacao: SituacaoMatricula.ATIVA })
      .andWhere('ativa = :ativa', { ativa: true });

    if (ignorarId) {
      atualizacao.andWhere('id != :ignorarId', { ignorarId });
    }

    await atualizacao.execute();
  }

  private async gerarNumeroMatricula(anoLetivo: number) {
    const quantidade = await this.matriculasRepositorio.count({
      where: { anoLetivo },
    });

    for (let indice = 1; indice <= 100; indice += 1) {
      const sequencial = quantidade + indice;
      const numeroMatricula = `${anoLetivo}${String(sequencial).padStart(6, '0')}`;
      const existente = await this.matriculasRepositorio.findOne({
        where: { numeroMatricula },
        select: { id: true },
      });

      if (!existente) {
        return numeroMatricula;
      }
    }

    throw new BadRequestException(
      'Nao foi possivel gerar numero de matricula.',
    );
  }

  private async vincularAlunoNaMatricula(matricula: Matricula) {
    const aluno =
      matricula.aluno ??
      (await this.alunosRepositorio.findOneBy({ id: matricula.alunoId }));

    if (!aluno) {
      return;
    }

    aluno.escolaId = matricula.escolaId;
    aluno.turmaId = matricula.turmaId;
    aluno.situacao = SituacaoAluno.ATIVO;
    aluno.ativo = true;

    await this.alunosRepositorio.save(aluno);
  }

  private async sincronizarAlunoAposMatriculaInativa(matricula: Matricula) {
    const aluno =
      matricula.aluno ??
      (await this.alunosRepositorio.findOneBy({ id: matricula.alunoId }));

    if (!aluno) {
      return;
    }

    const outraMatriculaAtiva = await this.matriculasRepositorio.findOne({
      where: {
        alunoId: aluno.id,
        situacao: SituacaoMatricula.ATIVA,
        ativa: true,
      },
      order: {
        dataMatricula: 'DESC',
        createdAt: 'DESC',
      },
    });

    if (outraMatriculaAtiva) {
      aluno.escolaId = outraMatriculaAtiva.escolaId;
      aluno.turmaId = outraMatriculaAtiva.turmaId;
      aluno.situacao = SituacaoAluno.ATIVO;
      aluno.ativo = true;
      await this.alunosRepositorio.save(aluno);
      return;
    }

    if (
      aluno.escolaId === matricula.escolaId &&
      aluno.turmaId === matricula.turmaId
    ) {
      aluno.escolaId = null;
      aluno.turmaId = null;
      aluno.situacao = SituacaoAluno.PENDENTE;
      aluno.ativo = true;
      await this.alunosRepositorio.save(aluno);
    }
  }

  private serializarMatricula(matricula: Matricula, tenantSlug?: string) {
    const aluno = matricula.aluno;
    const escola = matricula.escola;
    const turma = matricula.turma;

    return {
      ...matricula,
      tenantSlug: tenantSlug ?? '',
      studentId: matricula.alunoId,
      studentName: aluno?.nomeCompleto ?? 'Aluno nao informado',
      guardian: aluno?.responsavelNome ?? '',
      guardianPhone: aluno?.responsavelTelefone ?? '',
      registration: matricula.numeroMatricula,
      schoolId: matricula.escolaId,
      schoolName: escola?.nome ?? 'Escola nao informada',
      schoolInep: escola?.codigoInep ?? '',
      classId: matricula.turmaId,
      className: turma?.nome ?? 'Turma nao informada',
      grade: turma?.anoSerie ?? '',
      shift: turma?.turno ?? '',
      type: matricula.tipo,
      situation: matricula.situacao,
      status:
        matricula.situacao === SituacaoMatricula.ATIVA
          ? 'completed'
          : 'pending',
      enrollmentDate: this.formatarDataBr(matricula.dataMatricula),
      sourceSchoolId: matricula.escolaOrigemId,
      sourceClassId: matricula.turmaOrigemId,
      targetSchoolId: matricula.escolaId,
      targetClassId: matricula.turmaId,
      reason: matricula.motivo ?? '',
      observation: matricula.observacoes ?? '',
      sourceYear: matricula.anoOrigem,
      targetYear: matricula.anoDestino,
      mode: matricula.criterioRematricula ?? '',
    };
  }

  private primeiroDefinido<T>(...valores: Array<T | undefined>) {
    return valores.find((valor) => valor !== undefined);
  }

  private obterTextoObrigatorio(
    valor: ValorOpcional<string>,
    mensagem: string,
  ) {
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

  private normalizarAnoLetivo(
    valor: ValorOpcional<number | string>,
    anoPadrao: number,
  ) {
    if (valor === undefined || valor === null || valor === '') {
      return anoPadrao;
    }

    const anoLetivo = Number(valor);

    if (!Number.isInteger(anoLetivo) || anoLetivo < 2000 || anoLetivo > 2100) {
      throw new BadRequestException('Informe um ano letivo valido.');
    }

    return anoLetivo;
  }

  private normalizarTipo(
    valor: ValorOpcional<string | TipoMatricula>,
    tipoPadrao: TipoMatricula,
  ) {
    const texto = this.normalizarTextoOpcional(valor);

    if (!texto) {
      return tipoPadrao;
    }

    const textoNormalizado = this.normalizarTextoParaComparacao(texto);

    if (
      ['matricula', 'nova matricula', 'enrollment'].includes(textoNormalizado)
    ) {
      return TipoMatricula.MATRICULA;
    }

    if (['rematricula', 'renewal'].includes(textoNormalizado)) {
      return TipoMatricula.REMATRICULA;
    }

    if (['transferencia', 'transfer'].includes(textoNormalizado)) {
      return TipoMatricula.TRANSFERENCIA;
    }

    throw new BadRequestException(
      'Informe um tipo valido: Matricula, Rematricula ou Transferencia.',
    );
  }

  private normalizarSituacao(
    valor: ValorOpcional<string | SituacaoMatricula>,
    situacaoPadrao: SituacaoMatricula,
  ) {
    const texto = this.normalizarTextoOpcional(valor);

    if (!texto) {
      return situacaoPadrao;
    }

    const textoNormalizado = this.normalizarTextoParaComparacao(texto);

    if (
      ['active', 'completed', 'ativa', 'ativo', 'concluida'].includes(
        textoNormalizado,
      )
    ) {
      return SituacaoMatricula.ATIVA;
    }

    if (
      ['analysis', 'pending', 'analise', 'em analise'].includes(
        textoNormalizado,
      )
    ) {
      return SituacaoMatricula.ANALISE;
    }

    if (
      [
        'documentation',
        'documentacao',
        'documentacao pendente',
        'inactive',
      ].includes(textoNormalizado)
    ) {
      return SituacaoMatricula.DOCUMENTACAO;
    }

    throw new BadRequestException(
      'Informe uma situacao valida: active, analysis ou documentation.',
    );
  }

  private normalizarData(valor: ValorOpcional<string>) {
    const texto = this.normalizarTextoOpcional(valor);

    if (!texto) {
      return this.obterDataAtualIso();
    }

    const dataIso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (dataIso) {
      return `${dataIso[1]}-${dataIso[2]}-${dataIso[3]}`;
    }

    const dataBr = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

    if (dataBr) {
      return `${dataBr[3]}-${dataBr[2]}-${dataBr[1]}`;
    }

    throw new BadRequestException(
      'Informe a data da matricula em YYYY-MM-DD ou DD/MM/YYYY.',
    );
  }

  private obterDataAtualIso() {
    return new Date().toISOString().slice(0, 10);
  }

  private formatarDataBr(valor: string | Date) {
    const texto =
      valor instanceof Date ? valor.toISOString().slice(0, 10) : valor;
    const data = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (!data) {
      return texto;
    }

    return `${data[3]}/${data[2]}/${data[1]}`;
  }

  private normalizarBusca(busca?: string) {
    const texto = busca?.trim().toLowerCase();

    return texto ? `%${texto}%` : undefined;
  }

  private normalizarTextoParaComparacao(texto: string) {
    return texto
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
}
