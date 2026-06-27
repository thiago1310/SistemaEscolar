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
import { Escola } from '../escolas/escolas.entities';
import { Turma } from '../turmas/turmas.entities';

export enum TipoMatricula {
  MATRICULA = 'Matrícula',
  REMATRICULA = 'Rematrícula',
  TRANSFERENCIA = 'Transferência',
}

export enum SituacaoMatricula {
  ATIVA = 'active',
  ANALISE = 'analysis',
  DOCUMENTACAO = 'documentation',
}

@Entity('matriculas')
@Unique('uq_matriculas_numero_matricula', ['numeroMatricula'])
export class Matricula {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'aluno_id', type: 'varchar', length: 36 })
  alunoId: string;

  @ManyToOne(() => Aluno, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'aluno_id' })
  aluno: Aluno;

  @Column({ name: 'escola_id', type: 'varchar', length: 36 })
  escolaId: string;

  @ManyToOne(() => Escola, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'escola_id' })
  escola: Escola;

  @Column({ name: 'turma_id', type: 'varchar', length: 36 })
  turmaId: string;

  @ManyToOne(() => Turma, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'turma_id' })
  turma: Turma;

  @Column({
    name: 'escola_origem_id',
    type: 'varchar',
    length: 36,
    nullable: true,
  })
  escolaOrigemId: string | null;

  @ManyToOne(() => Escola, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'escola_origem_id' })
  escolaOrigem: Escola | null;

  @Column({
    name: 'turma_origem_id',
    type: 'varchar',
    length: 36,
    nullable: true,
  })
  turmaOrigemId: string | null;

  @ManyToOne(() => Turma, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'turma_origem_id' })
  turmaOrigem: Turma | null;

  @Column({ name: 'numero_matricula', type: 'varchar', length: 30 })
  numeroMatricula: string;

  @Column({ name: 'ano_letivo', type: 'int' })
  anoLetivo: number;

  @Column({ type: 'varchar', length: 30, default: TipoMatricula.MATRICULA })
  tipo: TipoMatricula;

  @Column({
    type: 'varchar',
    length: 30,
    default: SituacaoMatricula.ATIVA,
  })
  situacao: SituacaoMatricula;

  @Column({ name: 'data_matricula', type: 'date' })
  dataMatricula: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  motivo: string | null;

  @Column({ type: 'text', nullable: true })
  observacoes: string | null;

  @Column({ name: 'ano_origem', type: 'int', nullable: true })
  anoOrigem: number | null;

  @Column({ name: 'ano_destino', type: 'int', nullable: true })
  anoDestino: number | null;

  @Column({
    name: 'criterio_rematricula',
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  criterioRematricula: string | null;

  @Column({ type: 'boolean', default: true })
  ativa: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}
