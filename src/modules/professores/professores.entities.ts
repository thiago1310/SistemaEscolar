import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Usuario } from '../autenticacao/autenticacao.entities';

@Entity('professores')
@Unique('uq_professores_usuario_id', ['usuarioId'])
@Unique('uq_professores_matricula', ['matricula'])
export class Professor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'usuario_id', type: 'varchar', length: 36 })
  usuarioId: string;

  @OneToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ type: 'varchar', length: 50, nullable: true })
  matricula: string | null;

  @Column({ name: 'data_admissao', type: 'date', nullable: true })
  dataAdmissao: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  formacao: string | null;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}
