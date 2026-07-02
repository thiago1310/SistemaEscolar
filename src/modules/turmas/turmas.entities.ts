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
import { Usuario } from '../autenticacao/autenticacao.entities';
import { Disciplina } from '../disciplinas/disciplinas.entities';
import { Escola } from '../escolas/escolas.entities';
import { Professor } from '../professores/professores.entities';

export enum EtapaEnsinoTurma {
  CRECHE = 'Creche',
  PRE_ESCOLA = 'Pré-escola',
  FUNDAMENTAL_ANOS_INICIAIS = 'Ensino Fundamental - Anos Iniciais',
  FUNDAMENTAL_ANOS_FINAIS = 'Ensino Fundamental - Anos Finais',
}

export enum TurnoTurma {
  MATUTINO = 'Matutino',
  VESPERTINO = 'Vespertino',
  NOTURNO = 'Noturno',
  INTEGRAL = 'Integral',
}

@Entity('turmas')
@Unique('uq_turmas_escola_ano_nome', ['escolaId', 'anoLetivo', 'nome'])
export class Turma {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'escola_id', type: 'varchar', length: 36 })
  escolaId: string;

  @ManyToOne(() => Escola, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'escola_id' })
  escola: Escola;

  @Column({ type: 'varchar', length: 120 })
  nome: string;

  @Column({ name: 'sala_referencia', type: 'varchar', length: 120, nullable: true })
  salaReferencia: string | null;

  @Column({ name: 'ano_letivo', type: 'int' })
  anoLetivo: number;

  @Column({ name: 'etapa_ensino', type: 'varchar', length: 80 })
  etapaEnsino: EtapaEnsinoTurma;

  @Column({ name: 'ano_serie', type: 'varchar', length: 80 })
  anoSerie: string;

  @Column({ type: 'varchar', length: 30 })
  turno: TurnoTurma;

  @Column({ type: 'int' })
  capacidade: number;

  @Column({
    name: 'professor_regente_id',
    type: 'varchar',
    length: 36,
    nullable: true,
  })
  professorRegenteId: string | null;

  @ManyToOne(() => Usuario, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'professor_regente_id' })
  professorRegente: Usuario | null;

  @Column({ type: 'boolean', default: true })
  ativa: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}

@Entity('turma_vinculos_docentes')
@Unique('uq_turma_vinculos_docentes_turma_professor_disciplina', [
  'turmaId',
  'professorId',
  'disciplinaId',
])
export class TurmaVinculoDocente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'turma_id', type: 'varchar', length: 36 })
  turmaId: string;

  @ManyToOne(() => Turma, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'turma_id' })
  turma: Turma;

  @Column({ name: 'professor_id', type: 'varchar', length: 36 })
  professorId: string;

  @ManyToOne(() => Professor, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'professor_id' })
  professor: Professor;

  @Column({ name: 'disciplina_id', type: 'varchar', length: 36 })
  disciplinaId: string;

  @ManyToOne(() => Disciplina, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'disciplina_id' })
  disciplina: Disciplina;

  @Column({ name: 'carga_horaria_semanal', type: 'int' })
  cargaHorariaSemanal: number;

  @Column({ name: 'data_inicio_responsabilidade', type: 'date', nullable: true })
  dataInicioResponsabilidade: string | null;

  @Column({ name: 'data_fim_responsabilidade', type: 'date', nullable: true })
  dataFimResponsabilidade: string | null;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}
