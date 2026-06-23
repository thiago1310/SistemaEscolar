import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('secretarias')
@Check('ck_secretarias_cnpj_somente_numeros', "`cnpj` IS NULL OR `cnpj` REGEXP '^[0-9]+$'")
@Check('ck_secretarias_telefone_somente_numeros', "`telefone` IS NULL OR `telefone` REGEXP '^[0-9]+$'")
export class Secretaria {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  nome: string;

  @Column({ type: 'varchar', length: 150 })
  municipio: string;

  @Column({ type: 'char', length: 2 })
  uf: string;

  @Column({ type: 'varchar', length: 14, nullable: true })
  cnpj: string | null;

  @Column({ type: 'varchar', length: 11, nullable: true })
  telefone: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  email: string | null;

  @Column({ type: 'boolean', default: true })
  ativa: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}
