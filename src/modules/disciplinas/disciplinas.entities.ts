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
import { Secretaria } from '../secretarias/secretarias.entities';

@Entity('disciplinas')
@Unique('uq_disciplinas_secretaria_nome', ['secretariaId', 'nome'])
@Unique('uq_disciplinas_secretaria_codigo', ['secretariaId', 'codigo'])
export class Disciplina {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'secretaria_id', type: 'varchar', length: 36 })
  secretariaId: string;

  @ManyToOne(() => Secretaria, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'secretaria_id' })
  secretaria: Secretaria;

  @Column({ type: 'varchar', length: 150 })
  nome: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  codigo: string | null;

  @Column({ type: 'boolean', default: true })
  ativa: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}
