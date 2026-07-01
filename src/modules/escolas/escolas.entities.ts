import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Usuario } from '../autenticacao/autenticacao.entities';
import { Secretaria } from '../secretarias/secretarias.entities';

export enum TipoPeriodoLetivo {
  BIMESTRAL = 'BIMESTRAL',
  TRIMESTRAL = 'TRIMESTRAL',
  SEMESTRAL = 'SEMESTRAL',
}

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

  @Column({ name: 'diretor_id', type: 'varchar', length: 36, nullable: true })
  diretorId: string | null;

  @ManyToOne(() => Usuario, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'diretor_id' })
  diretor: Usuario | null;

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

@Entity('escola_configuracoes_pedagogicas')
@Unique('uq_escola_configuracao_ano', ['escolaId', 'anoLetivo'])
export class EscolaConfiguracaoPedagogica {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'escola_id', type: 'varchar', length: 36 })
  escolaId: string;

  @ManyToOne(() => Escola, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'escola_id' })
  escola: Escola;

  @Column({ name: 'ano_letivo', type: 'int' })
  anoLetivo: number;

  @Column({
    name: 'media_minima_aprovacao',
    type: 'decimal',
    precision: 4,
    scale: 2,
    nullable: true,
  })
  mediaMinimaAprovacao: string | null;

  @Column({
    name: 'tipo_periodo_letivo',
    type: 'enum',
    enum: TipoPeriodoLetivo,
    nullable: true,
  })
  tipoPeriodoLetivo: TipoPeriodoLetivo | null;

  @Column({ type: 'boolean', default: true })
  ativa: boolean;

  @OneToMany(
    () => EscolaPeriodoLetivo,
    (periodoLetivo) => periodoLetivo.configuracaoPedagogica,
  )
  periodos: EscolaPeriodoLetivo[];

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}

@Entity('escola_periodos_letivos')
@Unique('uq_escola_periodo_configuracao_numero', [
  'configuracaoPedagogicaId',
  'numero',
])
export class EscolaPeriodoLetivo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'configuracao_pedagogica_id', type: 'varchar', length: 36 })
  configuracaoPedagogicaId: string;

  @ManyToOne(
    () => EscolaConfiguracaoPedagogica,
    (configuracaoPedagogica) => configuracaoPedagogica.periodos,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'configuracao_pedagogica_id' })
  configuracaoPedagogica: EscolaConfiguracaoPedagogica;

  @Column({ type: 'int' })
  numero: number;

  @Column({ type: 'varchar', length: 50 })
  label: string;

  @Column({ name: 'data_inicio', type: 'date', nullable: true })
  dataInicio: string | null;

  @Column({ name: 'data_fim', type: 'date', nullable: true })
  dataFim: string | null;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}
