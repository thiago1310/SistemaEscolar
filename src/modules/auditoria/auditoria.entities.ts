import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from '../autenticacao/autenticacao.entities';

@Entity('auditoria_logs')
export class AuditoriaLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'usuario_id', type: 'varchar', length: 36, nullable: true })
  usuarioId: string | null;

  @ManyToOne(() => Usuario, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario | null;

  @Column({ type: 'varchar', length: 100 })
  entidade: string;

  @Column({ name: 'entidade_id', type: 'varchar', length: 36, nullable: true })
  entidadeId: string | null;

  @Column({ type: 'varchar', length: 50 })
  acao: string;

  @Column({ name: 'dados_antes', type: 'json', nullable: true })
  dadosAntes: Record<string, unknown> | null;

  @Column({ name: 'dados_depois', type: 'json', nullable: true })
  dadosDepois: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ip: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;
}
