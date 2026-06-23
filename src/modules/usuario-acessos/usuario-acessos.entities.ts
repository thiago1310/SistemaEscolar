import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AnoLetivo } from '../anos-letivos/anos-letivos.entities';
import { Usuario } from '../autenticacao/autenticacao.entities';
import { Escola } from '../escolas/escolas.entities';
import { Perfil } from '../perfis-permissoes/perfis-permissoes.entities';
import { Secretaria } from '../secretarias/secretarias.entities';

@Entity('usuario_acessos')
@Check('ck_usuario_acessos_escopo_consistente', 'NOT (`escola_id` IS NOT NULL AND `secretaria_id` IS NULL)')
export class UsuarioAcesso {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'usuario_id', type: 'varchar', length: 36 })
  usuarioId: string;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ name: 'perfil_id', type: 'varchar', length: 36 })
  perfilId: string;

  @ManyToOne(() => Perfil, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'perfil_id' })
  perfil: Perfil;

  @Column({ name: 'secretaria_id', type: 'varchar', length: 36, nullable: true })
  secretariaId: string | null;

  @ManyToOne(() => Secretaria, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'secretaria_id' })
  secretaria: Secretaria | null;

  @Column({ name: 'escola_id', type: 'varchar', length: 36, nullable: true })
  escolaId: string | null;

  @ManyToOne(() => Escola, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'escola_id' })
  escola: Escola | null;

  @Column({ name: 'ano_letivo_id', type: 'varchar', length: 36, nullable: true })
  anoLetivoId: string | null;

  @ManyToOne(() => AnoLetivo, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'ano_letivo_id' })
  anoLetivo: AnoLetivo | null;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}
