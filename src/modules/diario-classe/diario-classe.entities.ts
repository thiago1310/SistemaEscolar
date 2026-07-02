import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Aluno } from '../alunos/alunos.entities';
import { Usuario } from '../autenticacao/autenticacao.entities';
import { Disciplina } from '../disciplinas/disciplinas.entities';
import { EscolaPeriodoLetivo } from '../escolas/escolas.entities';
import { Professor } from '../professores/professores.entities';
import { Turma, TurmaVinculoDocente } from '../turmas/turmas.entities';

export enum SituacaoFrequenciaDiario {
  PRESENTE = 'PRESENTE',
  AUSENTE = 'AUSENTE',
  ATRASO = 'ATRASO',
  JUSTIFICADA = 'JUSTIFICADA',
}

export enum SituacaoDiario {
  RASCUNHO = 'RASCUNHO',
  PUBLICADO = 'PUBLICADO',
}

export enum TipoObservacaoDiario {
  PEDAGOGICA = 'PEDAGOGICA',
  COMPORTAMENTAL = 'COMPORTAMENTAL',
  FAMILIA = 'FAMILIA',
  ACOMPANHAMENTO = 'ACOMPANHAMENTO',
}

export enum SituacaoObservacaoDiario {
  ACOMPANHAR = 'ACOMPANHAR',
  CONCLUIDO = 'CONCLUIDO',
  PENDENTE_RETORNO = 'PENDENTE_RETORNO',
}

export enum StatusDiarioClasse {
  NAO_INICIADO = 'NAO_INICIADO',
  ABERTO = 'ABERTO',
  PENDENTE_FECHAMENTO = 'PENDENTE_FECHAMENTO',
  FECHADO = 'FECHADO',
  REABERTO = 'REABERTO',
  SUBSTITUIDO = 'SUBSTITUIDO',
}

@Entity('diarios_classe')
@Unique('uq_diarios_classe_vinculo_periodo', ['vinculoDocenteId', 'periodoLetivoId'])
export class DiarioClasse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'turma_id', type: 'varchar', length: 36 })
  turmaId: string;

  @ManyToOne(() => Turma, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'turma_id' })
  turma: Turma;

  @Column({ name: 'disciplina_id', type: 'varchar', length: 36 })
  disciplinaId: string;

  @ManyToOne(() => Disciplina, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'disciplina_id' })
  disciplina: Disciplina;

  @Column({ name: 'professor_id', type: 'varchar', length: 36 })
  professorId: string;

  @ManyToOne(() => Professor, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'professor_id' })
  professor: Professor;

  @Column({ name: 'vinculo_docente_id', type: 'varchar', length: 36 })
  vinculoDocenteId: string;

  @ManyToOne(() => TurmaVinculoDocente, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vinculo_docente_id' })
  vinculoDocente: TurmaVinculoDocente;

  @Column({ name: 'periodo_letivo_id', type: 'varchar', length: 36 })
  periodoLetivoId: string;

  @ManyToOne(() => EscolaPeriodoLetivo, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'periodo_letivo_id' })
  periodoLetivo: EscolaPeriodoLetivo;

  @Column({ name: 'ano_letivo', type: 'int' })
  anoLetivo: number;

  @Column({ name: 'periodo_label', type: 'varchar', length: 80 })
  periodoLabel: string;

  @Column({ name: 'data_inicio_responsabilidade', type: 'date', nullable: true })
  dataInicioResponsabilidade: string | null;

  @Column({ name: 'data_fim_responsabilidade', type: 'date', nullable: true })
  dataFimResponsabilidade: string | null;

  @Column({ type: 'varchar', length: 30, default: StatusDiarioClasse.NAO_INICIADO })
  status: StatusDiarioClasse;

  @Column({ name: 'parecer_final', type: 'text', nullable: true })
  parecerFinal: string | null;

  @Column({ name: 'fechado_em', type: 'datetime', nullable: true })
  fechadoEm: Date | null;

  @Column({ name: 'fechado_por_usuario_id', type: 'varchar', length: 36, nullable: true })
  fechadoPorUsuarioId: string | null;

  @ManyToOne(() => Usuario, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'fechado_por_usuario_id' })
  fechadoPorUsuario: Usuario | null;

  @Column({ name: 'reaberto_em', type: 'datetime', nullable: true })
  reabertoEm: Date | null;

  @Column({ name: 'reaberto_por_usuario_id', type: 'varchar', length: 36, nullable: true })
  reabertoPorUsuarioId: string | null;

  @ManyToOne(() => Usuario, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'reaberto_por_usuario_id' })
  reabertoPorUsuario: Usuario | null;

  @Column({ name: 'motivo_reabertura', type: 'text', nullable: true })
  motivoReabertura: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}

@Entity('diario_frequencias')
@Unique('uq_diario_frequencias_turma_data_aluno', [
  'turmaId',
  'data',
  'alunoId',
])
@Unique('uq_diario_frequencias_diario_data_aluno', [
  'diarioClasseId',
  'data',
  'alunoId',
])
export class DiarioFrequencia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'turma_id', type: 'varchar', length: 36 })
  turmaId: string;

  @ManyToOne(() => Turma, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'turma_id' })
  turma: Turma;

  @Column({ name: 'disciplina_id', type: 'varchar', length: 36, nullable: true })
  disciplinaId: string | null;

  @ManyToOne(() => Disciplina, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'disciplina_id' })
  disciplina: Disciplina | null;

  @Column({ name: 'professor_id', type: 'varchar', length: 36, nullable: true })
  professorId: string | null;

  @ManyToOne(() => Professor, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'professor_id' })
  professor: Professor | null;

  @Column({
    name: 'vinculo_docente_id',
    type: 'varchar',
    length: 36,
    nullable: true,
  })
  vinculoDocenteId: string | null;

  @ManyToOne(() => TurmaVinculoDocente, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'vinculo_docente_id' })
  vinculoDocente: TurmaVinculoDocente | null;

  @Column({ name: 'diario_classe_id', type: 'varchar', length: 36, nullable: true })
  diarioClasseId: string | null;

  @ManyToOne(() => DiarioClasse, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'diario_classe_id' })
  diarioClasse: DiarioClasse | null;

  @Column({ name: 'aluno_id', type: 'varchar', length: 36 })
  alunoId: string;

  @ManyToOne(() => Aluno, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'aluno_id' })
  aluno: Aluno;

  @Column({ type: 'date' })
  data: string;

  @Column({ type: 'varchar', length: 20, default: SituacaoFrequenciaDiario.PRESENTE })
  situacao: SituacaoFrequenciaDiario;

  @Column({ type: 'text', nullable: true })
  observacao: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}

@Entity('diario_aulas')
export class DiarioAula {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'turma_id', type: 'varchar', length: 36 })
  turmaId: string;

  @ManyToOne(() => Turma, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'turma_id' })
  turma: Turma;

  @Column({ name: 'disciplina_id', type: 'varchar', length: 36 })
  disciplinaId: string;

  @ManyToOne(() => Disciplina, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'disciplina_id' })
  disciplina: Disciplina;

  @Column({ name: 'professor_id', type: 'varchar', length: 36 })
  professorId: string;

  @ManyToOne(() => Professor, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'professor_id' })
  professor: Professor;

  @Column({
    name: 'vinculo_docente_id',
    type: 'varchar',
    length: 36,
    nullable: true,
  })
  vinculoDocenteId: string | null;

  @ManyToOne(() => TurmaVinculoDocente, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'vinculo_docente_id' })
  vinculoDocente: TurmaVinculoDocente | null;

  @Column({ name: 'diario_classe_id', type: 'varchar', length: 36, nullable: true })
  diarioClasseId: string | null;

  @ManyToOne(() => DiarioClasse, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'diario_classe_id' })
  diarioClasse: DiarioClasse | null;

  @Column({ type: 'date' })
  data: string;

  @Column({ name: 'hora_inicio', type: 'varchar', length: 5, nullable: true })
  horaInicio: string | null;

  @Column({ name: 'hora_fim', type: 'varchar', length: 5, nullable: true })
  horaFim: string | null;

  @Column({ type: 'varchar', length: 120 })
  titulo: string;

  @Column({ type: 'text' })
  conteudo: string;

  @Column({ type: 'text', nullable: true })
  habilidades: string | null;

  @Column({ type: 'text', nullable: true })
  recursos: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  periodo: string | null;

  @Column({ type: 'varchar', length: 20, default: SituacaoDiario.PUBLICADO })
  situacao: SituacaoDiario;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}

@Entity('diario_avaliacoes')
@Unique('uq_diario_avaliacoes_turma_disciplina_periodo_nome', [
  'turmaId',
  'disciplinaId',
  'periodo',
  'nome',
])
@Unique('uq_diario_avaliacoes_diario_nome', ['diarioClasseId', 'nome'])
export class DiarioAvaliacao {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'turma_id', type: 'varchar', length: 36 })
  turmaId: string;

  @ManyToOne(() => Turma, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'turma_id' })
  turma: Turma;

  @Column({ name: 'disciplina_id', type: 'varchar', length: 36 })
  disciplinaId: string;

  @ManyToOne(() => Disciplina, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'disciplina_id' })
  disciplina: Disciplina;

  @Column({ name: 'professor_id', type: 'varchar', length: 36 })
  professorId: string;

  @ManyToOne(() => Professor, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'professor_id' })
  professor: Professor;

  @Column({
    name: 'vinculo_docente_id',
    type: 'varchar',
    length: 36,
    nullable: true,
  })
  vinculoDocenteId: string | null;

  @ManyToOne(() => TurmaVinculoDocente, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'vinculo_docente_id' })
  vinculoDocente: TurmaVinculoDocente | null;

  @Column({ name: 'diario_classe_id', type: 'varchar', length: 36, nullable: true })
  diarioClasseId: string | null;

  @ManyToOne(() => DiarioClasse, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'diario_classe_id' })
  diarioClasse: DiarioClasse | null;

  @Column({ type: 'varchar', length: 120 })
  nome: string;

  @Column({ type: 'varchar', length: 80 })
  periodo: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  peso: string;

  @Column({ type: 'date', nullable: true })
  data: string | null;

  @Column({ type: 'text', nullable: true })
  observacao: string | null;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}

@Entity('diario_notas')
@Unique('uq_diario_notas_avaliacao_aluno', ['avaliacaoId', 'alunoId'])
export class DiarioNota {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'avaliacao_id', type: 'varchar', length: 36 })
  avaliacaoId: string;

  @ManyToOne(() => DiarioAvaliacao, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'avaliacao_id' })
  avaliacao: DiarioAvaliacao;

  @Column({ name: 'diario_classe_id', type: 'varchar', length: 36, nullable: true })
  diarioClasseId: string | null;

  @ManyToOne(() => DiarioClasse, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'diario_classe_id' })
  diarioClasse: DiarioClasse | null;

  @Column({ name: 'aluno_id', type: 'varchar', length: 36 })
  alunoId: string;

  @ManyToOne(() => Aluno, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'aluno_id' })
  aluno: Aluno;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  valor: string | null;

  @Column({ type: 'text', nullable: true })
  observacao: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}

@Entity('diario_observacoes')
export class DiarioObservacao {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'turma_id', type: 'varchar', length: 36 })
  turmaId: string;

  @ManyToOne(() => Turma, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'turma_id' })
  turma: Turma;

  @Column({ name: 'aluno_id', type: 'varchar', length: 36, nullable: true })
  alunoId: string | null;

  @ManyToOne(() => Aluno, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'aluno_id' })
  aluno: Aluno | null;

  @Column({ name: 'professor_id', type: 'varchar', length: 36, nullable: true })
  professorId: string | null;

  @ManyToOne(() => Professor, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'professor_id' })
  professor: Professor | null;

  @Column({ name: 'diario_classe_id', type: 'varchar', length: 36, nullable: true })
  diarioClasseId: string | null;

  @ManyToOne(() => DiarioClasse, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'diario_classe_id' })
  diarioClasse: DiarioClasse | null;

  @Column({ type: 'date' })
  data: string;

  @Column({ type: 'varchar', length: 30, default: TipoObservacaoDiario.PEDAGOGICA })
  tipo: TipoObservacaoDiario;

  @Column({ type: 'varchar', length: 30, default: SituacaoObservacaoDiario.ACOMPANHAR })
  situacao: SituacaoObservacaoDiario;

  @Column({ type: 'varchar', length: 180 })
  resumo: string;

  @Column({ type: 'text' })
  descricao: string;

  @Column({ type: 'text', nullable: true })
  encaminhamentos: string | null;

  @Column({ name: 'proxima_data', type: 'date', nullable: true })
  proximaData: string | null;

  @Column({ name: 'responsaveis_comunicados', type: 'boolean', default: false })
  responsaveisComunicados: boolean;

  @Column({ name: 'data_comunicacao', type: 'datetime', nullable: true })
  dataComunicacao: Date | null;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}
