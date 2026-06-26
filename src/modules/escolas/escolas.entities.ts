import {
  Check,
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

@Entity('escolas')
@Unique('uq_escolas_secretaria_nome', ['secretariaId', 'nome'])
@Unique('uq_escolas_codigo_inep', ['codigoInep'])
@Check('ck_escolas_cnpj_somente_numeros', "`cnpj` IS NULL OR `cnpj` REGEXP '^[0-9]+$'")
@Check('ck_escolas_telefone_somente_numeros', "`telefone` IS NULL OR `telefone` REGEXP '^[0-9]+$'")
@Check('ck_escolas_cep_somente_numeros', "`cep` IS NULL OR `cep` REGEXP '^[0-9]+$'")
export class Escola {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'secretaria_id', type: 'varchar', length: 36 })
  secretariaId: string;

  @ManyToOne(() => Secretaria, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'secretaria_id' })
  secretaria: Secretaria;

  @Column({ type: 'varchar', length: 255 })
  nome: string;

  @Column({ name: 'codigo_inep', type: 'varchar', length: 30, nullable: true })
  codigoInep: string | null;

  @Column({ name: 'tipo_escola', type: 'varchar', length: 30, nullable: true })
  tipoEscola: string | null;

  @Column({ name: 'modalidades_ensino', type: 'json', nullable: true })
  modalidadesEnsino: string[] | null;

  @Column({ type: 'varchar', length: 14, nullable: true })
  cnpj: string | null;

  @Column({ type: 'varchar', length: 11, nullable: true })
  telefone: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 8, nullable: true })
  cep: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  endereco: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  numero: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  complemento: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  bairro: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  municipio: string | null;

  @Column({ type: 'char', length: 2, nullable: true })
  uf: string | null;

  @Column({ type: 'text', nullable: true })
  observacoes: string | null;

  @Column({ type: 'boolean', default: true })
  ativa: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}
