import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('perfis')
export class Perfil {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  nome: string;

  @Column({ type: 'varchar', length: 80, unique: true })
  codigo: string;

  @Column({ type: 'text', nullable: true })
  descricao: string | null;

  @Column({ type: 'int', default: 0 })
  nivel: number;

  @Column({ type: 'boolean', default: false })
  sistema: boolean;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}

@Entity('permissoes')
@Unique('uq_permissoes_modulo_acao', ['modulo', 'acao'])
export class Permissao {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  modulo: string;

  @Column({ type: 'varchar', length: 100 })
  acao: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  codigo: string;

  @Column({ type: 'text', nullable: true })
  descricao: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;
}

@Entity('perfil_permissoes')
export class PerfilPermissao {
  @PrimaryColumn({ name: 'perfil_id', type: 'varchar', length: 36 })
  perfilId: string;

  @PrimaryColumn({ name: 'permissao_id', type: 'varchar', length: 36 })
  permissaoId: string;

  @ManyToOne(() => Perfil, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'perfil_id' })
  perfil: Perfil;

  @ManyToOne(() => Permissao, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permissao_id' })
  permissao: Permissao;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;
}
