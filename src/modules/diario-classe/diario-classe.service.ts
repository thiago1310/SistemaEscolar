import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import { Aluno, SituacaoAluno } from '../alunos/alunos.entities';
import { EscopoUsuarioService } from '../autorizacao/escopo-usuario.service';
import { Disciplina } from '../disciplinas/disciplinas.entities';
import {
  Escola,
  EscolaConfiguracaoPedagogica,
  EscolaPeriodoLetivo,
} from '../escolas/escolas.entities';
import { Matricula, SituacaoMatricula } from '../matriculas/matriculas.entities';
import { Professor } from '../professores/professores.entities';
import { Turma, TurmaVinculoDocente } from '../turmas/turmas.entities';
import {
  AtualizarAulaDto,
  AtualizarAvaliacaoDto,
  AtualizarObservacaoDto,
  CriarAulaDto,
  CriarAvaliacaoDto,
  CriarObservacaoDto,
  ListarAulasDto,
  ListarAvaliacoesDto,
  ListarDiarioTurmasDto,
  ListarDiariosClasseDto,
  ListarFrequenciasDto,
  ListarNotasDto,
  ListarObservacoesDto,
  ReabrirDiarioClasseDto,
  SalvarFrequenciasDto,
  SalvarNotasDto,
  FecharDiarioClasseDto,
} from './diario-classe.dto';
import {
  DiarioClasse,
  DiarioAula,
  DiarioAvaliacao,
  DiarioFrequencia,
  DiarioNota,
  DiarioObservacao,
  SituacaoFrequenciaDiario,
  StatusDiarioClasse,
} from './diario-classe.entities';

@Injectable()
export class DiarioClasseService {
  constructor(
    @InjectRepository(Turma)
    private readonly turmasRepositorio: Repository<Turma>,
    @InjectRepository(TurmaVinculoDocente)
    private readonly vinculosRepositorio: Repository<TurmaVinculoDocente>,
    @InjectRepository(Professor)
    private readonly professoresRepositorio: Repository<Professor>,
    @InjectRepository(Aluno)
    private readonly alunosRepositorio: Repository<Aluno>,
    @InjectRepository(Matricula)
    private readonly matriculasRepositorio: Repository<Matricula>,
    @InjectRepository(Disciplina)
    private readonly disciplinasRepositorio: Repository<Disciplina>,
    @InjectRepository(Escola)
    private readonly escolasRepositorio: Repository<Escola>,
    @InjectRepository(EscolaConfiguracaoPedagogica)
    private readonly configuracoesPedagogicasRepositorio: Repository<EscolaConfiguracaoPedagogica>,
    @InjectRepository(DiarioClasse)
    private readonly diariosRepositorio: Repository<DiarioClasse>,
    @InjectRepository(DiarioFrequencia)
    private readonly frequenciasRepositorio: Repository<DiarioFrequencia>,
    @InjectRepository(DiarioAula)
    private readonly aulasRepositorio: Repository<DiarioAula>,
    @InjectRepository(DiarioAvaliacao)
    private readonly avaliacoesRepositorio: Repository<DiarioAvaliacao>,
    @InjectRepository(DiarioNota)
    private readonly notasRepositorio: Repository<DiarioNota>,
    @InjectRepository(DiarioObservacao)
    private readonly observacoesRepositorio: Repository<DiarioObservacao>,
    private readonly escopoUsuarioService: EscopoUsuarioService,
  ) {}

  async listarTurmas(usuarioId: string, filtros: ListarDiarioTurmasDto = {}) {
    const consulta = this.vinculosRepositorio
      .createQueryBuilder('vinculo')
      .leftJoinAndSelect('vinculo.turma', 'turma')
      .leftJoinAndSelect('turma.escola', 'escola')
      .leftJoinAndSelect('vinculo.professor', 'professor')
      .leftJoinAndSelect('professor.usuario', 'usuario')
      .leftJoinAndSelect('vinculo.disciplina', 'disciplina')
      .where('vinculo.ativo = true')
      .andWhere('turma.ativa = true');

    await this.aplicarEscopoTurmas(usuarioId, consulta);

    if (filtros.escolaId) {
      consulta.andWhere('turma.escola_id = :escolaId', {
        escolaId: filtros.escolaId,
      });
    }

    if (filtros.disciplinaId) {
      consulta.andWhere('vinculo.disciplina_id = :disciplinaId', {
        disciplinaId: filtros.disciplinaId,
      });
    }

    if (filtros.turno) {
      consulta.andWhere('turma.turno = :turno', { turno: filtros.turno });
    }

    if (filtros.busca) {
      const busca = `%${filtros.busca.toLowerCase()}%`;
      consulta.andWhere(
        new Brackets((subconsulta) => {
          subconsulta
            .where('LOWER(turma.nome) LIKE :busca', { busca })
            .orWhere('LOWER(escola.nome) LIKE :busca', { busca })
            .orWhere('LOWER(disciplina.nome) LIKE :busca', { busca });
        }),
      );
    }

    const vinculos = await consulta
      .orderBy('turma.ano_letivo', 'DESC')
      .addOrderBy('turma.nome', 'ASC')
      .getMany();

    const grupos = this.agruparVinculosPorTurmaProfessor(vinculos);
    const turmaIds = [...new Set(vinculos.map((vinculo) => vinculo.turmaId))];
    const totaisAlunos = await this.contarAlunosPorTurma(turmaIds);
    const progresso = await this.calcularProgressoPorTurma(turmaIds);

    return {
      turmas: grupos.map((vinculosGrupo) =>
        this.serializarTurmaDiario(
          vinculosGrupo,
          totaisAlunos.get(vinculosGrupo[0].turmaId) ?? 0,
          progresso.get(vinculosGrupo[0].turmaId) ?? 0,
        ),
      ),
      resumo: {
        turmasAtribuidas: turmaIds.length,
        alunosNoTotal: [...totaisAlunos.values()].reduce((total, item) => total + item, 0),
        disciplinasLecionadas: new Set(vinculos.map((item) => item.disciplinaId)).size,
        cargaHorariaSemanal: vinculos.reduce(
          (total, item) => total + Number(item.cargaHorariaSemanal ?? 0),
          0,
        ),
        mediaProgresso: this.media([...progresso.values()]),
      },
    };
  }

  async obterResumoTurma(turmaId: string, usuarioId: string) {
    const turma = await this.buscarTurmaPermitida(turmaId, usuarioId);
    const hoje = this.dataAtual();
    const [totalAlunos, frequencias, ultimaAula, ultimaAvaliacao, observacoes] =
      await Promise.all([
        this.contarAlunosTurma(turmaId),
        this.frequenciasRepositorio.find({ where: { turmaId, data: hoje } }),
        this.aulasRepositorio.findOne({
          where: { turmaId, ativo: true },
          relations: { disciplina: true },
          order: { data: 'DESC', createdAt: 'DESC' },
        }),
        this.avaliacoesRepositorio.findOne({
          where: { turmaId, ativo: true },
          relations: { disciplina: true },
          order: { data: 'DESC', createdAt: 'DESC' },
        }),
        this.observacoesRepositorio.find({
          where: { turmaId, ativo: true },
          relations: { aluno: true, professor: { usuario: true } },
          order: { data: 'DESC' },
          take: 5,
        }),
      ]);

    return {
      turma: this.serializarTurma(turma),
      frequenciaHoje: {
        data: hoje,
        totalAlunos,
        presentes: frequencias.filter(
          (item) => item.situacao === SituacaoFrequenciaDiario.PRESENTE,
        ).length,
        ausentes: frequencias.filter(
          (item) => item.situacao === SituacaoFrequenciaDiario.AUSENTE,
        ).length,
        atrasos: frequencias.filter(
          (item) => item.situacao === SituacaoFrequenciaDiario.ATRASO,
        ).length,
        justificadas: frequencias.filter(
          (item) => item.situacao === SituacaoFrequenciaDiario.JUSTIFICADA,
        ).length,
      },
      ultimoConteudo: ultimaAula ? this.serializarAula(ultimaAula) : null,
      ultimaAvaliacao: ultimaAvaliacao
        ? this.serializarAvaliacao(ultimaAvaliacao)
        : null,
      observacoes: observacoes.map((item) => this.serializarObservacao(item)),
    };
  }

  async listarDiarios(
    turmaId: string,
    usuarioId: string,
    filtros: ListarDiariosClasseDto = {},
  ) {
    const turma = await this.buscarTurmaPermitida(turmaId, usuarioId);
    await this.sincronizarDiariosDaTurma(turma);

    const consulta = this.diariosRepositorio
      .createQueryBuilder('diario')
      .leftJoinAndSelect('diario.periodoLetivo', 'periodoLetivo')
      .leftJoinAndSelect('diario.disciplina', 'disciplina')
      .leftJoinAndSelect('diario.professor', 'professor')
      .leftJoinAndSelect('professor.usuario', 'usuario')
      .leftJoinAndSelect('diario.vinculoDocente', 'vinculoDocente')
      .where('diario.turma_id = :turmaId', { turmaId });

    if (filtros.disciplinaId) {
      consulta.andWhere('diario.disciplina_id = :disciplinaId', {
        disciplinaId: filtros.disciplinaId,
      });
    }

    if (filtros.professorId) {
      consulta.andWhere('diario.professor_id = :professorId', {
        professorId: filtros.professorId,
      });
    }

    if (filtros.periodoLetivoId) {
      consulta.andWhere('diario.periodo_letivo_id = :periodoLetivoId', {
        periodoLetivoId: filtros.periodoLetivoId,
      });
    }

    const escopo = await this.escopoUsuarioService.obterEscopo(usuarioId);
    if (!escopo.global && escopo.perfis.includes('PROFESSOR')) {
      const professor = await this.professoresRepositorio.findOneBy({
        usuarioId,
        ativo: true,
      });
      if (professor) {
        consulta.andWhere('diario.professor_id = :professorLogadoId', {
          professorLogadoId: professor.id,
        });
      }
    }

    const diarios = await consulta
      .orderBy('periodoLetivo.numero', 'ASC')
      .addOrderBy('disciplina.nome', 'ASC')
      .getMany();

    return diarios.map((diario) => this.serializarDiario(diario));
  }

  async fecharDiario(
    diarioId: string,
    dados: FecharDiarioClasseDto,
    usuarioId: string,
  ) {
    const diario = await this.buscarDiarioPermitido(diarioId, usuarioId);

    if (
      diario.status === StatusDiarioClasse.FECHADO ||
      diario.status === StatusDiarioClasse.SUBSTITUIDO
    ) {
      throw new BadRequestException('Diario de classe ja esta encerrado.');
    }

    const vinculo = await this.garantirProfessorPodeEscrever(
      diario.turmaId,
      usuarioId,
      diario.disciplinaId,
    );
    if (vinculo.id !== diario.vinculoDocenteId) {
      throw new ForbiddenException('Professor nao pode fechar este diario.');
    }

    diario.status = StatusDiarioClasse.FECHADO;
    diario.parecerFinal = dados.parecerFinal;
    diario.fechadoEm = new Date();
    diario.fechadoPorUsuarioId = usuarioId;

    return this.serializarDiario(await this.diariosRepositorio.save(diario));
  }

  async reabrirDiario(
    diarioId: string,
    dados: ReabrirDiarioClasseDto,
    usuarioId: string,
  ) {
    const diario = await this.buscarDiarioPermitido(diarioId, usuarioId);

    if (diario.status === StatusDiarioClasse.SUBSTITUIDO) {
      throw new BadRequestException('Diario substituido nao pode ser reaberto.');
    }

    diario.status = StatusDiarioClasse.REABERTO;
    diario.reabertoEm = new Date();
    diario.reabertoPorUsuarioId = usuarioId;
    diario.motivoReabertura = dados.motivoReabertura;

    return this.serializarDiario(await this.diariosRepositorio.save(diario));
  }

  async listarFrequencias(
    turmaId: string,
    filtros: ListarFrequenciasDto,
    usuarioId: string,
  ) {
    await this.buscarTurmaPermitida(turmaId, usuarioId);
    const alunos = await this.listarAlunosTurma(turmaId);
    const frequencias = await this.frequenciasRepositorio.find({
      where: { turmaId, data: filtros.data },
      relations: { aluno: true },
    });
    const porAluno = new Map(frequencias.map((item) => [item.alunoId, item]));

    return {
      data: filtros.data,
      registros: alunos.map((aluno) =>
        this.serializarFrequencia(
          porAluno.get(aluno.id) ??
            this.frequenciasRepositorio.create({
              turmaId,
              alunoId: aluno.id,
              aluno,
              data: filtros.data,
              situacao: SituacaoFrequenciaDiario.PRESENTE,
            }),
        ),
      ),
    };
  }

  async salvarFrequencias(
    turmaId: string,
    dados: SalvarFrequenciasDto,
    usuarioId: string,
  ) {
    const vinculo = await this.garantirProfessorPodeEscrever(
      turmaId,
      usuarioId,
      dados.disciplinaId,
    );
    const diario = await this.garantirDiarioEditavel(vinculo, dados.data);
    const alunos = await this.listarAlunosTurma(turmaId);
    const alunosPermitidos = new Set(alunos.map((aluno) => aluno.id));

    for (const registro of dados.registros) {
      if (!alunosPermitidos.has(registro.alunoId)) {
        throw new BadRequestException('Aluno nao pertence a esta turma.');
      }

      const existente = await this.frequenciasRepositorio.findOne({
        where: { turmaId, data: dados.data, alunoId: registro.alunoId },
      });
      const frequencia =
        existente ??
        this.frequenciasRepositorio.create({
          turmaId,
          data: dados.data,
          alunoId: registro.alunoId,
        });

      Object.assign(frequencia, {
        disciplinaId: dados.disciplinaId ?? vinculo.disciplinaId,
        professorId: vinculo.professorId,
        vinculoDocenteId: vinculo.id,
        diarioClasseId: diario?.id ?? null,
        situacao: registro.situacao,
        observacao: registro.observacao ?? null,
      });

      await this.frequenciasRepositorio.save(frequencia);
    }

    return this.listarFrequencias(turmaId, { data: dados.data }, usuarioId);
  }

  async listarAulas(turmaId: string, usuarioId: string, filtros: ListarAulasDto = {}) {
    await this.buscarTurmaPermitida(turmaId, usuarioId);
    const consulta = this.aulasRepositorio
      .createQueryBuilder('aula')
      .leftJoinAndSelect('aula.disciplina', 'disciplina')
      .leftJoinAndSelect('aula.professor', 'professor')
      .leftJoinAndSelect('professor.usuario', 'usuario')
      .where('aula.turma_id = :turmaId', { turmaId })
      .andWhere('aula.ativo = true');

    if (filtros.disciplinaId) {
      consulta.andWhere('aula.disciplina_id = :disciplinaId', {
        disciplinaId: filtros.disciplinaId,
      });
    }
    if (filtros.periodo) {
      consulta.andWhere('aula.periodo = :periodo', { periodo: filtros.periodo });
    }
    if (filtros.dataInicial) {
      consulta.andWhere('aula.data >= :dataInicial', {
        dataInicial: filtros.dataInicial,
      });
    }
    if (filtros.dataFinal) {
      consulta.andWhere('aula.data <= :dataFinal', { dataFinal: filtros.dataFinal });
    }
    if (filtros.busca) {
      const busca = `%${filtros.busca.toLowerCase()}%`;
      consulta.andWhere(
        new Brackets((subconsulta) => {
          subconsulta
            .where('LOWER(aula.titulo) LIKE :busca', { busca })
            .orWhere('LOWER(aula.conteudo) LIKE :busca', { busca })
            .orWhere('LOWER(COALESCE(aula.habilidades, "")) LIKE :busca', {
              busca,
            });
        }),
      );
    }

    const aulas = await consulta.orderBy('aula.data', 'DESC').getMany();
    return aulas.map((aula) => this.serializarAula(aula));
  }

  async criarAula(turmaId: string, dados: CriarAulaDto, usuarioId: string) {
    const vinculo = await this.garantirProfessorPodeEscrever(
      turmaId,
      usuarioId,
      dados.disciplinaId,
    );
    const diario = await this.garantirDiarioEditavel(vinculo, dados.data);
    const aula = this.aulasRepositorio.create({
      ...dados,
      turmaId,
      professorId: vinculo.professorId,
      vinculoDocenteId: vinculo.id,
      diarioClasseId: diario?.id ?? null,
      horaInicio: dados.horaInicio ?? null,
      horaFim: dados.horaFim ?? null,
      habilidades: dados.habilidades ?? null,
      recursos: dados.recursos ?? null,
      periodo: dados.periodo ?? null,
      ativo: true,
    });

    return this.serializarAula(await this.aulasRepositorio.save(aula));
  }

  async atualizarAula(id: string, dados: AtualizarAulaDto, usuarioId: string) {
    const aula = await this.buscarAula(id, usuarioId);
    const vinculo = await this.garantirProfessorPodeEscrever(
      aula.turmaId,
      usuarioId,
      dados.disciplinaId ?? aula.disciplinaId,
    );
    const diario = await this.garantirDiarioEditavel(
      vinculo,
      dados.data ?? aula.data,
    );
    aula.diarioClasseId = diario?.id ?? aula.diarioClasseId ?? null;
    Object.assign(aula, dados);
    return this.serializarAula(await this.aulasRepositorio.save(aula));
  }

  async inativarAula(id: string, usuarioId: string) {
    const aula = await this.buscarAula(id, usuarioId);
    const vinculo = await this.garantirProfessorPodeEscrever(
      aula.turmaId,
      usuarioId,
      aula.disciplinaId,
    );
    await this.garantirDiarioEditavel(vinculo, aula.data);
    aula.ativo = false;
    return this.serializarAula(await this.aulasRepositorio.save(aula));
  }

  async listarAvaliacoes(
    turmaId: string,
    usuarioId: string,
    filtros: ListarAvaliacoesDto = {},
  ) {
    await this.buscarTurmaPermitida(turmaId, usuarioId);
    const where = {
      turmaId,
      ativo: true,
      ...(filtros.disciplinaId ? { disciplinaId: filtros.disciplinaId } : {}),
      ...(filtros.periodo ? { periodo: filtros.periodo } : {}),
    };
    const avaliacoes = await this.avaliacoesRepositorio.find({
      where,
      relations: { disciplina: true, professor: { usuario: true } },
      order: { periodo: 'ASC', createdAt: 'ASC' },
    });
    return avaliacoes.map((avaliacao) => this.serializarAvaliacao(avaliacao));
  }

  async criarAvaliacao(turmaId: string, dados: CriarAvaliacaoDto, usuarioId: string) {
    const vinculo = await this.garantirProfessorPodeEscrever(
      turmaId,
      usuarioId,
      dados.disciplinaId,
    );
    const diario = await this.garantirDiarioEditavel(
      vinculo,
      dados.data,
    );
    const avaliacao = this.avaliacoesRepositorio.create({
      ...dados,
      turmaId,
      professorId: vinculo.professorId,
      vinculoDocenteId: vinculo.id,
      diarioClasseId: diario?.id ?? null,
      peso: String(dados.peso),
      data: dados.data ?? null,
      periodo: dados.periodo ?? diario?.periodoLabel,
      observacao: dados.observacao ?? null,
      ativo: true,
    });
    return this.serializarAvaliacao(
      await this.avaliacoesRepositorio.save(avaliacao),
    );
  }

  async atualizarAvaliacao(
    id: string,
    dados: AtualizarAvaliacaoDto,
    usuarioId: string,
  ) {
    const avaliacao = await this.buscarAvaliacao(id, usuarioId);
    const vinculo = await this.garantirProfessorPodeEscrever(
      avaliacao.turmaId,
      usuarioId,
      avaliacao.disciplinaId,
    );
    const diario = await this.garantirDiarioEditavel(
      vinculo,
      dados.data ?? avaliacao.data,
    );
    avaliacao.diarioClasseId = diario?.id ?? avaliacao.diarioClasseId ?? null;
    Object.assign(avaliacao, {
      ...dados,
      peso: dados.peso === undefined ? avaliacao.peso : String(dados.peso),
    });
    return this.serializarAvaliacao(
      await this.avaliacoesRepositorio.save(avaliacao),
    );
  }

  async inativarAvaliacao(id: string, usuarioId: string) {
    const avaliacao = await this.buscarAvaliacao(id, usuarioId);
    const vinculo = await this.garantirProfessorPodeEscrever(
      avaliacao.turmaId,
      usuarioId,
      avaliacao.disciplinaId,
    );
    await this.garantirDiarioEditavel(vinculo, avaliacao.data);
    avaliacao.ativo = false;
    return this.serializarAvaliacao(
      await this.avaliacoesRepositorio.save(avaliacao),
    );
  }

  async listarNotas(turmaId: string, usuarioId: string, filtros: ListarNotasDto = {}) {
    await this.buscarTurmaPermitida(turmaId, usuarioId);
    const alunos = await this.listarAlunosTurma(turmaId);
    const avaliacoes = await this.avaliacoesRepositorio.find({
      where: {
        turmaId,
        ativo: true,
        ...(filtros.disciplinaId ? { disciplinaId: filtros.disciplinaId } : {}),
        ...(filtros.periodo ? { periodo: filtros.periodo } : {}),
        ...(filtros.avaliacaoId ? { id: filtros.avaliacaoId } : {}),
      },
      relations: { disciplina: true },
      order: { createdAt: 'ASC' },
    });
    const notas = await this.notasRepositorio.find({
      where: { avaliacaoId: In(avaliacoes.map((avaliacao) => avaliacao.id)) },
    });
    const mapaNotas = new Map(
      notas.map((nota) => [`${nota.avaliacaoId}:${nota.alunoId}`, nota]),
    );

    const registros = alunos
      .filter((aluno) =>
        filtros.busca
          ? aluno.nomeCompleto.toLowerCase().includes(filtros.busca.toLowerCase())
          : true,
      )
      .map((aluno) => {
        const notasAluno = avaliacoes.map((avaliacao) => {
          const nota = mapaNotas.get(`${avaliacao.id}:${aluno.id}`);
          return {
            avaliacaoId: avaliacao.id,
            valor: nota?.valor === null || nota?.valor === undefined ? null : Number(nota.valor),
            observacao: nota?.observacao ?? null,
          };
        });
        const media = this.calcularMedia(avaliacoes, notasAluno);
        return {
          alunoId: aluno.id,
          aluno: { id: aluno.id, nome: aluno.nomeCompleto, documento: aluno.cpfOuCertidao },
          notas: notasAluno,
          media,
          situacao: this.obterSituacaoMedia(media),
        };
      });

    return {
      avaliacoes: avaliacoes.map((avaliacao) => this.serializarAvaliacao(avaliacao)),
      registros,
      resumo: this.resumirNotas(registros),
    };
  }

  async salvarNotas(avaliacaoId: string, dados: SalvarNotasDto, usuarioId: string) {
    const avaliacao = await this.buscarAvaliacao(avaliacaoId, usuarioId);
    const vinculo = await this.garantirProfessorPodeEscrever(
      avaliacao.turmaId,
      usuarioId,
      avaliacao.disciplinaId,
    );
    await this.garantirDiarioEditavel(vinculo, avaliacao.data);
    const alunos = await this.listarAlunosTurma(avaliacao.turmaId);
    const alunosPermitidos = new Set(alunos.map((aluno) => aluno.id));

    for (const item of dados.notas) {
      if (!alunosPermitidos.has(item.alunoId)) {
        throw new BadRequestException('Aluno nao pertence a esta turma.');
      }
      const existente = await this.notasRepositorio.findOne({
        where: { avaliacaoId, alunoId: item.alunoId },
      });
      const nota =
        existente ??
        this.notasRepositorio.create({ avaliacaoId, alunoId: item.alunoId });

      nota.valor = item.valor === undefined || item.valor === null ? null : String(item.valor);
      nota.observacao = item.observacao ?? null;
      await this.notasRepositorio.save(nota);
    }

    return this.listarNotas(avaliacao.turmaId, usuarioId, {
      disciplinaId: avaliacao.disciplinaId,
      periodo: avaliacao.periodo,
    });
  }

  async listarObservacoes(
    turmaId: string,
    usuarioId: string,
    filtros: ListarObservacoesDto = {},
  ) {
    await this.buscarTurmaPermitida(turmaId, usuarioId);
    const consulta = this.observacoesRepositorio
      .createQueryBuilder('observacao')
      .leftJoinAndSelect('observacao.aluno', 'aluno')
      .leftJoinAndSelect('observacao.professor', 'professor')
      .leftJoinAndSelect('professor.usuario', 'usuario')
      .where('observacao.turma_id = :turmaId', { turmaId })
      .andWhere('observacao.ativo = true');

    if (filtros.alunoId) {
      consulta.andWhere('observacao.aluno_id = :alunoId', {
        alunoId: filtros.alunoId,
      });
    }
    if (filtros.tipo) {
      consulta.andWhere('observacao.tipo = :tipo', { tipo: filtros.tipo });
    }
    if (filtros.busca) {
      const busca = `%${filtros.busca.toLowerCase()}%`;
      consulta.andWhere(
        new Brackets((subconsulta) => {
          subconsulta
            .where('LOWER(observacao.resumo) LIKE :busca', { busca })
            .orWhere('LOWER(observacao.descricao) LIKE :busca', { busca });
        }),
      );
    }

    const observacoes = await consulta.orderBy('observacao.data', 'DESC').getMany();
    return {
      registros: observacoes.map((observacao) => this.serializarObservacao(observacao)),
      resumo: {
        total: observacoes.length,
        pedagogicas: observacoes.filter((item) => item.tipo === 'PEDAGOGICA').length,
        comportamentais: observacoes.filter((item) => item.tipo === 'COMPORTAMENTAL').length,
        acompanhamentos: observacoes.filter((item) => item.tipo === 'ACOMPANHAMENTO').length,
      },
    };
  }

  async criarObservacao(
    turmaId: string,
    dados: CriarObservacaoDto,
    usuarioId: string,
  ) {
    const professor = await this.obterProfessorUsuario(usuarioId);
    const vinculo = await this.garantirProfessorPodeEscrever(turmaId, usuarioId);
    const diario = await this.garantirDiarioEditavel(vinculo, dados.data);
    if (dados.alunoId) {
      await this.garantirAlunoTurma(dados.alunoId, turmaId);
    }
    const observacao = this.observacoesRepositorio.create({
      ...dados,
      turmaId,
      professorId: professor.id,
      diarioClasseId: diario?.id ?? null,
      alunoId: dados.alunoId ?? null,
      situacao: dados.situacao ?? undefined,
      encaminhamentos: dados.encaminhamentos ?? null,
      proximaData: dados.proximaData ?? null,
      responsaveisComunicados: dados.responsaveisComunicados ?? false,
      dataComunicacao: dados.responsaveisComunicados ? new Date() : null,
    });
    return this.serializarObservacao(
      await this.observacoesRepositorio.save(observacao),
    );
  }

  async atualizarObservacao(
    id: string,
    dados: AtualizarObservacaoDto,
    usuarioId: string,
  ) {
    const observacao = await this.buscarObservacao(id, usuarioId);
    const vinculo = await this.garantirProfessorPodeEscrever(
      observacao.turmaId,
      usuarioId,
    );
    const diario = await this.garantirDiarioEditavel(
      vinculo,
      dados.data ?? observacao.data,
    );
    observacao.diarioClasseId = diario?.id ?? observacao.diarioClasseId ?? null;
    if (dados.alunoId) {
      await this.garantirAlunoTurma(dados.alunoId, observacao.turmaId);
    }
    Object.assign(observacao, dados);
    if (dados.responsaveisComunicados && !observacao.dataComunicacao) {
      observacao.dataComunicacao = new Date();
    }
    return this.serializarObservacao(
      await this.observacoesRepositorio.save(observacao),
    );
  }

  async inativarObservacao(id: string, usuarioId: string) {
    const observacao = await this.buscarObservacao(id, usuarioId);
    const vinculo = await this.garantirProfessorPodeEscrever(
      observacao.turmaId,
      usuarioId,
    );
    await this.garantirDiarioEditavel(vinculo, observacao.data);
    observacao.ativo = false;
    return this.serializarObservacao(
      await this.observacoesRepositorio.save(observacao),
    );
  }

  private async aplicarEscopoTurmas(usuarioId: string, consulta: any) {
    const escopo = await this.escopoUsuarioService.obterEscopo(usuarioId);
    if (escopo.global) {
      return;
    }

    if (escopo.perfis.includes('PROFESSOR')) {
      const professor = await this.professoresRepositorio.findOneBy({
        usuarioId,
        ativo: true,
      });
      if (professor) {
        consulta.andWhere('vinculo.professor_id = :professorId', {
          professorId: professor.id,
        });
        return;
      }
    }

    if (escopo.escolaIds.length > 0) {
      consulta.andWhere('turma.escola_id IN (:...escolaIds)', {
        escolaIds: escopo.escolaIds,
      });
      return;
    }

    if (escopo.secretariaIds.length > 0) {
      consulta.andWhere('escola.secretaria_id IN (:...secretariaIds)', {
        secretariaIds: escopo.secretariaIds,
      });
      return;
    }

    consulta.andWhere('1 = 0');
  }

  private async buscarTurmaPermitida(turmaId: string, usuarioId: string) {
    const turma = await this.turmasRepositorio.findOne({
      where: { id: turmaId },
      relations: { escola: true },
    });
    if (!turma) {
      throw new NotFoundException('Turma nao encontrada.');
    }

    const escopo = await this.escopoUsuarioService.obterEscopo(usuarioId);
    if (escopo.global) {
      return turma;
    }

    if (escopo.perfis.includes('PROFESSOR')) {
      const professor = await this.professoresRepositorio.findOneBy({
        usuarioId,
        ativo: true,
      });
      if (professor) {
        const vinculo = await this.vinculosRepositorio.findOneBy({
          turmaId,
          professorId: professor.id,
          ativo: true,
        });
        if (vinculo) {
          return turma;
        }
      }
    }

    await this.escopoUsuarioService.garantirEscolaPermitida(usuarioId, turma.escola);
    return turma;
  }

  private async garantirProfessorPodeEscrever(
    turmaId: string,
    usuarioId: string,
    disciplinaId?: string,
  ) {
    const professor = await this.obterProfessorUsuario(usuarioId);
    const where = {
      turmaId,
      professorId: professor.id,
      ativo: true,
      ...(disciplinaId ? { disciplinaId } : {}),
    };
    const vinculo = await this.vinculosRepositorio.findOne({
      where,
      relations: { turma: { escola: true }, disciplina: true },
    });
    if (!vinculo) {
      throw new ForbiddenException('Professor sem vinculo ativo com esta turma.');
    }
    return vinculo;
  }

  private async obterProfessorUsuario(usuarioId: string) {
    const professor = await this.professoresRepositorio.findOne({
      where: { usuarioId, ativo: true },
      relations: { usuario: true },
    });
    if (!professor || !professor.usuario?.ativo) {
      throw new ForbiddenException('Usuario nao possui professor ativo.');
    }
    return professor;
  }

  private async sincronizarDiariosDaTurma(turma: Turma) {
    const periodos = await this.listarPeriodosLetivosTurma(turma);
    if (periodos.length === 0) {
      return;
    }

    const vinculos = await this.vinculosRepositorio.find({
      where: { turmaId: turma.id, ativo: true },
      relations: { turma: { escola: true }, disciplina: true, professor: { usuario: true } },
    });

    for (const vinculo of vinculos) {
      for (const periodo of periodos) {
        await this.obterOuCriarDiario(vinculo, periodo);
      }
    }
  }

  private async garantirDiarioEditavel(
    vinculo: TurmaVinculoDocente,
    dataRegistro?: string | null,
  ) {
    const periodo = await this.obterPeriodoPermitidoParaLancamento(
      vinculo.turma,
      dataRegistro,
    );

    if (!periodo) {
      return null;
    }

    const diario = await this.obterOuCriarDiario(vinculo, periodo);

    if (
      diario.status === StatusDiarioClasse.FECHADO ||
      diario.status === StatusDiarioClasse.SUBSTITUIDO
    ) {
      throw new BadRequestException(
        'Diario de classe encerrado para este periodo.',
      );
    }

    if (diario.status === StatusDiarioClasse.REABERTO) {
      return diario;
    }

    const hoje = this.dataAtual();
    if (
      periodo.dataInicio &&
      periodo.dataFim &&
      (hoje < periodo.dataInicio || hoje > periodo.dataFim)
    ) {
      throw new BadRequestException(
        'Lancamentos permitidos apenas no periodo letivo atual ou em diario reaberto.',
      );
    }

    if (diario.status !== StatusDiarioClasse.ABERTO) {
      diario.status = StatusDiarioClasse.ABERTO;
      return this.diariosRepositorio.save(diario);
    }

    return diario;
  }

  private async obterPeriodoPermitidoParaLancamento(
    turma: Turma,
    dataRegistro?: string | null,
  ) {
    const periodos = await this.listarPeriodosLetivosTurma(turma);
    if (periodos.length === 0) {
      return null;
    }

    if (periodos.some((periodo) => !periodo.dataInicio || !periodo.dataFim)) {
      return null;
    }

    const data = dataRegistro ?? this.dataAtual();
    const periodoRegistro = periodos.find(
      (periodo) =>
        periodo.dataInicio &&
        periodo.dataFim &&
        periodo.dataInicio <= data &&
        periodo.dataFim >= data,
    );

    if (!periodoRegistro) {
      throw new BadRequestException(
        'Data fora dos periodos letivos configurados para esta escola.',
      );
    }

    return periodoRegistro;
  }

  private async listarPeriodosLetivosTurma(turma: Turma) {
    const configuracao = await this.configuracoesPedagogicasRepositorio.findOne({
      where: {
        escolaId: turma.escolaId,
        anoLetivo: turma.anoLetivo,
        ativa: true,
      },
      relations: { periodos: true },
    });

    if (!configuracao?.tipoPeriodoLetivo) {
      return [];
    }

    return [...(configuracao.periodos ?? [])]
      .filter((periodo) => periodo.ativo)
      .sort((a, b) => a.numero - b.numero);
  }

  private async obterOuCriarDiario(
    vinculo: TurmaVinculoDocente,
    periodo: EscolaPeriodoLetivo,
  ) {
    let diario = await this.diariosRepositorio.findOne({
      where: {
        vinculoDocenteId: vinculo.id,
        periodoLetivoId: periodo.id,
      },
      relations: {
        periodoLetivo: true,
        disciplina: true,
        professor: { usuario: true },
        vinculoDocente: true,
      },
    });

    const statusCalculado = this.calcularStatusInicialDiario(periodo);

    if (!diario) {
      diario = this.diariosRepositorio.create({
        turmaId: vinculo.turmaId,
        disciplinaId: vinculo.disciplinaId,
        professorId: vinculo.professorId,
        vinculoDocenteId: vinculo.id,
        periodoLetivoId: periodo.id,
        anoLetivo:
          vinculo.turma?.anoLetivo ??
          periodo.configuracaoPedagogica?.anoLetivo ??
          new Date().getFullYear(),
        periodoLabel: periodo.label,
        dataInicioResponsabilidade: vinculo.dataInicioResponsabilidade ?? null,
        dataFimResponsabilidade: vinculo.dataFimResponsabilidade ?? null,
        status: statusCalculado,
      });
      return this.diariosRepositorio.save(diario);
    }

    diario.turmaId = vinculo.turmaId;
    diario.disciplinaId = vinculo.disciplinaId;
    diario.professorId = vinculo.professorId;
    diario.anoLetivo = vinculo.turma?.anoLetivo ?? diario.anoLetivo;
    diario.periodoLabel = periodo.label;
    diario.dataInicioResponsabilidade = vinculo.dataInicioResponsabilidade ?? null;
    diario.dataFimResponsabilidade = vinculo.dataFimResponsabilidade ?? null;
    diario.periodoLetivo = periodo;
    diario.disciplina = vinculo.disciplina;
    diario.professor = vinculo.professor;
    diario.vinculoDocente = vinculo;

    if (
      ![
        StatusDiarioClasse.FECHADO,
        StatusDiarioClasse.REABERTO,
        StatusDiarioClasse.SUBSTITUIDO,
      ].includes(diario.status)
    ) {
      diario.status = statusCalculado;
    }

    return this.diariosRepositorio.save(diario);
  }

  private calcularStatusInicialDiario(periodo: EscolaPeriodoLetivo) {
    if (!periodo.dataInicio || !periodo.dataFim) {
      return StatusDiarioClasse.ABERTO;
    }

    const hoje = this.dataAtual();
    if (hoje < periodo.dataInicio) {
      return StatusDiarioClasse.NAO_INICIADO;
    }
    if (hoje > periodo.dataFim) {
      return StatusDiarioClasse.PENDENTE_FECHAMENTO;
    }
    return StatusDiarioClasse.ABERTO;
  }

  private async buscarDiarioPermitido(diarioId: string, usuarioId: string) {
    const diario = await this.diariosRepositorio.findOne({
      where: { id: diarioId },
      relations: {
        turma: { escola: true },
        periodoLetivo: true,
        disciplina: true,
        professor: { usuario: true },
        vinculoDocente: true,
      },
    });

    if (!diario) {
      throw new NotFoundException('Diario de classe nao encontrado.');
    }

    await this.buscarTurmaPermitida(diario.turmaId, usuarioId);
    return diario;
  }

  private async listarAlunosTurma(turmaId: string) {
    const matriculas = await this.matriculasRepositorio.find({
      where: { turmaId, ativa: true, situacao: SituacaoMatricula.ATIVA },
      relations: { aluno: true },
      order: { numeroMatricula: 'ASC' },
    });
    if (matriculas.length > 0) {
      return matriculas
        .map((matricula) => matricula.aluno)
        .filter((aluno) => aluno?.ativo);
    }
    return this.alunosRepositorio.find({
      where: { turmaId, ativo: true, situacao: SituacaoAluno.ATIVO },
      order: { nomeCompleto: 'ASC' },
    });
  }

  private async garantirAlunoTurma(alunoId: string, turmaId: string) {
    const aluno = await this.alunosRepositorio.findOneBy({ id: alunoId });
    if (!aluno || aluno.turmaId !== turmaId) {
      throw new BadRequestException('Aluno nao pertence a esta turma.');
    }
  }

  private async buscarAula(id: string, usuarioId: string) {
    const aula = await this.aulasRepositorio.findOne({
      where: { id },
      relations: { disciplina: true, professor: { usuario: true } },
    });
    if (!aula) {
      throw new NotFoundException('Aula nao encontrada.');
    }
    await this.buscarTurmaPermitida(aula.turmaId, usuarioId);
    return aula;
  }

  private async buscarAvaliacao(id: string, usuarioId: string) {
    const avaliacao = await this.avaliacoesRepositorio.findOne({
      where: { id },
      relations: { disciplina: true, professor: { usuario: true } },
    });
    if (!avaliacao) {
      throw new NotFoundException('Avaliacao nao encontrada.');
    }
    await this.buscarTurmaPermitida(avaliacao.turmaId, usuarioId);
    return avaliacao;
  }

  private async buscarObservacao(id: string, usuarioId: string) {
    const observacao = await this.observacoesRepositorio.findOne({
      where: { id },
      relations: { aluno: true, professor: { usuario: true } },
    });
    if (!observacao) {
      throw new NotFoundException('Observacao nao encontrada.');
    }
    await this.buscarTurmaPermitida(observacao.turmaId, usuarioId);
    return observacao;
  }

  private async contarAlunosPorTurma(turmaIds: string[]) {
    const resultado = new Map<string, number>();
    for (const turmaId of turmaIds) {
      resultado.set(turmaId, await this.contarAlunosTurma(turmaId));
    }
    return resultado;
  }

  private async contarAlunosTurma(turmaId: string) {
    const totalMatriculas = await this.matriculasRepositorio.count({
      where: { turmaId, ativa: true, situacao: SituacaoMatricula.ATIVA },
    });
    if (totalMatriculas > 0) {
      return totalMatriculas;
    }
    return this.alunosRepositorio.count({
      where: { turmaId, ativo: true, situacao: SituacaoAluno.ATIVO },
    });
  }

  private async calcularProgressoPorTurma(turmaIds: string[]) {
    const resultado = new Map<string, number>();
    for (const turmaId of turmaIds) {
      const turma = await this.turmasRepositorio.findOneBy({ id: turmaId });
      const aulas = await this.aulasRepositorio.count({ where: { turmaId, ativo: true } });
      const carga = await this.vinculosRepositorio.find({ where: { turmaId, ativo: true } });
      const previsto = Math.max(
        1,
        carga.reduce((total, item) => total + Number(item.cargaHorariaSemanal ?? 0), 0) * 8,
      );
      const progresso = Math.min(100, Math.round((aulas / previsto) * 100));
      resultado.set(turma?.id ?? turmaId, progresso);
    }
    return resultado;
  }

  private formatarData(data: Date) {
    return data.toISOString().slice(0, 10);
  }

  private calcularMedia(avaliacoes: DiarioAvaliacao[], notas: Array<{ valor: number | null }>) {
    const pesoTotal = avaliacoes.reduce((total, avaliacao) => total + Number(avaliacao.peso), 0);
    if (pesoTotal <= 0) {
      const valores = notas.map((nota) => nota.valor).filter((valor): valor is number => valor !== null);
      return valores.length ? Number((valores.reduce((a, b) => a + b, 0) / valores.length).toFixed(2)) : null;
    }
    const soma = avaliacoes.reduce((total, avaliacao, indice) => {
      const valor = notas[indice]?.valor;
      return total + (valor ?? 0) * Number(avaliacao.peso);
    }, 0);
    return Number((soma / pesoTotal).toFixed(2));
  }

  private obterSituacaoMedia(media: number | null) {
    if (media === null) return 'Pendente';
    if (media >= 6) return 'Aprovado';
    if (media >= 4) return 'Recuperacao';
    return 'Reprovado';
  }

  private resumirNotas(registros: Array<{ media: number | null; situacao: string }>) {
    return {
      alunosAvaliados: registros.filter((item) => item.media !== null).length,
      mediaTurma: this.media(registros.map((item) => item.media).filter((valor): valor is number => valor !== null)),
      aprovados: registros.filter((item) => item.situacao === 'Aprovado').length,
      recuperacao: registros.filter((item) => item.situacao === 'Recuperacao').length,
      reprovados: registros.filter((item) => item.situacao === 'Reprovado').length,
    };
  }

  private media(valores: number[]) {
    return valores.length
      ? Number((valores.reduce((total, item) => total + item, 0) / valores.length).toFixed(2))
      : 0;
  }

  private agruparVinculosPorTurmaProfessor(vinculos: TurmaVinculoDocente[]) {
    const grupos = new Map<string, TurmaVinculoDocente[]>();

    for (const vinculo of vinculos) {
      const chave = `${vinculo.turmaId}:${vinculo.professorId}`;
      const grupo = grupos.get(chave) ?? [];
      grupo.push(vinculo);
      grupos.set(chave, grupo);
    }

    return [...grupos.values()];
  }

  private serializarTurmaDiario(vinculos: TurmaVinculoDocente[], studentCount: number, progress: number) {
    const vinculo = vinculos[0];
    const disciplinas = this.serializarDisciplinasVinculadas(vinculos);
    const nomesDisciplinas = disciplinas.map((disciplina) => disciplina.nome);

    return {
      id: vinculo.id,
      classId: vinculo.turmaId,
      turmaId: vinculo.turmaId,
      vinculoDocenteId: vinculo.id,
      disciplinaId: vinculo.disciplinaId,
      name: vinculo.turma?.nome,
      school: vinculo.turma?.escola?.nome ?? 'Escola nao informada',
      schoolId: vinculo.turma?.escolaId,
      subject: nomesDisciplinas[0] ?? 'Componente nao informado',
      subjects: nomesDisciplinas,
      disciplinas,
      teacher: vinculo.professor?.usuario?.nome ?? 'Professor nao informado',
      shift: vinculo.turma?.turno,
      year: vinculo.turma?.anoLetivo,
      studentCount,
      progress,
      nextClass: 'Sem aula agendada',
      cargaHorariaSemanal: vinculos.reduce(
        (total, item) => total + Number(item.cargaHorariaSemanal ?? 0),
        0,
      ),
    };
  }

  private serializarDisciplinasVinculadas(vinculos: TurmaVinculoDocente[]) {
    const disciplinas = new Map<string, {
      id: string | null;
      nome: string;
      vinculoDocenteId: string;
      cargaHorariaSemanal: number;
    }>();

    for (const vinculo of vinculos) {
      const nome = vinculo.disciplina?.nome ?? 'Componente nao informado';
      const chave = vinculo.disciplinaId ?? nome;

      if (!disciplinas.has(chave)) {
        disciplinas.set(chave, {
          id: vinculo.disciplinaId ?? null,
          nome,
          vinculoDocenteId: vinculo.id,
          cargaHorariaSemanal: Number(vinculo.cargaHorariaSemanal ?? 0),
        });
      }
    }

    return [...disciplinas.values()];
  }

  private serializarTurma(turma: Turma) {
    return {
      id: turma.id,
      nome: turma.nome,
      escolaId: turma.escolaId,
      escola: turma.escola?.nome,
      turno: turma.turno,
      anoLetivo: turma.anoLetivo,
      etapaEnsino: turma.etapaEnsino,
      anoSerie: turma.anoSerie,
    };
  }

  private serializarFrequencia(frequencia: DiarioFrequencia) {
    return {
      id: frequencia.id,
      alunoId: frequencia.alunoId,
      aluno: frequencia.aluno
        ? { id: frequencia.aluno.id, nome: frequencia.aluno.nomeCompleto }
        : null,
      data: frequencia.data,
      diarioClasseId: frequencia.diarioClasseId,
      situacao: frequencia.situacao,
      observacao: frequencia.observacao,
    };
  }

  private serializarDiario(diario: DiarioClasse) {
    return {
      id: diario.id,
      turmaId: diario.turmaId,
      disciplinaId: diario.disciplinaId,
      disciplina: diario.disciplina?.nome,
      professorId: diario.professorId,
      professor: diario.professor?.usuario?.nome,
      vinculoDocenteId: diario.vinculoDocenteId,
      periodoLetivoId: diario.periodoLetivoId,
      periodoLabel: diario.periodoLabel,
      periodo: diario.periodoLetivo
        ? {
            id: diario.periodoLetivo.id,
            numero: diario.periodoLetivo.numero,
            label: diario.periodoLetivo.label,
            dataInicio: diario.periodoLetivo.dataInicio,
            dataFim: diario.periodoLetivo.dataFim,
          }
        : null,
      anoLetivo: diario.anoLetivo,
      status: diario.status,
      bloqueadoParaEdicao: [
        StatusDiarioClasse.FECHADO,
        StatusDiarioClasse.SUBSTITUIDO,
      ].includes(diario.status),
      parecerFinal: diario.parecerFinal,
      fechadoEm: diario.fechadoEm,
      fechadoPorUsuarioId: diario.fechadoPorUsuarioId,
      reabertoEm: diario.reabertoEm,
      reabertoPorUsuarioId: diario.reabertoPorUsuarioId,
      motivoReabertura: diario.motivoReabertura,
      dataInicioResponsabilidade: diario.dataInicioResponsabilidade,
      dataFimResponsabilidade: diario.dataFimResponsabilidade,
      createdAt: diario.createdAt,
      updatedAt: diario.updatedAt,
    };
  }

  private serializarAula(aula: DiarioAula) {
    return {
      id: aula.id,
      turmaId: aula.turmaId,
      disciplinaId: aula.disciplinaId,
      disciplina: aula.disciplina?.nome,
      professorId: aula.professorId,
      professor: aula.professor?.usuario?.nome,
      diarioClasseId: aula.diarioClasseId,
      data: aula.data,
      horaInicio: aula.horaInicio,
      horaFim: aula.horaFim,
      titulo: aula.titulo,
      conteudo: aula.conteudo,
      habilidades: aula.habilidades,
      recursos: aula.recursos,
      periodo: aula.periodo,
      situacao: aula.situacao,
      ativo: aula.ativo,
    };
  }

  private serializarAvaliacao(avaliacao: DiarioAvaliacao) {
    return {
      id: avaliacao.id,
      turmaId: avaliacao.turmaId,
      disciplinaId: avaliacao.disciplinaId,
      disciplina: avaliacao.disciplina?.nome,
      professorId: avaliacao.professorId,
      professor: avaliacao.professor?.usuario?.nome,
      diarioClasseId: avaliacao.diarioClasseId,
      nome: avaliacao.nome,
      periodo: avaliacao.periodo,
      peso: Number(avaliacao.peso),
      data: avaliacao.data,
      observacao: avaliacao.observacao,
      ativo: avaliacao.ativo,
    };
  }

  private serializarObservacao(observacao: DiarioObservacao) {
    return {
      id: observacao.id,
      turmaId: observacao.turmaId,
      alunoId: observacao.alunoId,
      aluno: observacao.aluno
        ? { id: observacao.aluno.id, nome: observacao.aluno.nomeCompleto }
        : null,
      professorId: observacao.professorId,
      professor: observacao.professor?.usuario?.nome,
      diarioClasseId: observacao.diarioClasseId,
      data: observacao.data,
      tipo: observacao.tipo,
      situacao: observacao.situacao,
      resumo: observacao.resumo,
      descricao: observacao.descricao,
      encaminhamentos: observacao.encaminhamentos,
      proximaData: observacao.proximaData,
      responsaveisComunicados: observacao.responsaveisComunicados,
      dataComunicacao: observacao.dataComunicacao,
      ativo: observacao.ativo,
    };
  }

  private dataAtual() {
    return new Date().toISOString().slice(0, 10);
  }
}
