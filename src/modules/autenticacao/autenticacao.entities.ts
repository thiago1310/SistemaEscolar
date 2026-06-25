import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum OrigemAutenticacao {
  LOCAL = 'LOCAL',
  LDAP = 'LDAP',
  ACTIVE_DIRECTORY = 'ACTIVE_DIRECTORY',
  OIDC = 'OIDC',
  GOOGLE = 'GOOGLE',
  MICROSOFT = 'MICROSOFT',
}

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  nome: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  cpf: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  telefone: string | null;

  @Column({ name: 'data_nascimento', type: 'date', nullable: true })
  dataNascimento: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  cargo: string | null;

  @Column({ type: 'text', nullable: true })
  observacoes: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  username: string | null;

  @Column({ name: 'senha_hash', type: 'text', nullable: true })
  senhaHash: string | null;

  @Column({
    name: 'origem_auth',
    type: 'enum',
    enum: OrigemAutenticacao,
    default: OrigemAutenticacao.LOCAL,
  })
  origemAuth: OrigemAutenticacao;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @Column({ name: 'primeiro_acesso', type: 'boolean', default: true })
  primeiroAcesso: boolean;

  @Column({ name: 'ultimo_login_at', type: 'datetime', nullable: true })
  ultimoLoginAt: Date | null;

  @Column({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'datetime', nullable: true })
  deletedAt: Date | null;
}

@Entity('usuario_sessoes')
export class SessaoUsuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'usuario_id', type: 'varchar', length: 36 })
  usuarioId: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ name: 'refresh_token_hash', type: 'text' })
  refreshTokenHash: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ip: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @Column({ type: 'datetime' })
  expiracao: Date;

  @Column({ type: 'boolean', default: false })
  revogada: boolean;

  @Column({ name: 'created_at', type: 'datetime' })
  createdAt: Date;
}
