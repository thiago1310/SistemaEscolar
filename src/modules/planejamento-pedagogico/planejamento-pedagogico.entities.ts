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
import { Disciplina } from '../disciplinas/disciplinas.entities';
import { Secretaria } from '../secretarias/secretarias.entities';

export enum TipoPeriodoPlanejamento {
  TRIMESTRE = 'TRIMESTRE',
  BIMESTRE = 'BIMESTRE',
  SEMESTRE = 'SEMESTRE',
  OUTRO = 'OUTRO',
}

interface FaixaEtariaBncc {
  codigo: string;
  nome: string;
  idadeInicialAnos: number;
  idadeFinalAnos: number;
  descricao: string;
}

@Entity('bncc_codigos')
@Unique('uq_bncc_codigos_codigo', ['codigo'])
export class CodigoBncc {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 40 })
  codigo: string;

  @Column({ name: 'etapa_ensino', type: 'varchar', length: 100 })
  etapaEnsino: string;

  @Column({ type: 'json', nullable: true })
  series: number[] | null;

  @Column({ name: 'faixa_etaria', type: 'json', nullable: true })
  faixaEtaria: FaixaEtariaBncc | null;

  @Column({ name: 'componente_ou_area', type: 'varchar', length: 180 })
  componenteOuArea: string;

  @Column({ name: 'primeira_ocorrencia_texto', type: 'int', nullable: true })
  primeiraOcorrenciaTexto: number | null;

  @Column({ name: 'fonte_url', type: 'text', nullable: true })
  fonteUrl: string | null;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}

@Entity('documentos_curriculares')
export class DocumentoCurricular {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'secretaria_id', type: 'varchar', length: 36 })
  secretariaId: string;

  @ManyToOne(() => Secretaria, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'secretaria_id' })
  secretaria: Secretaria;

  @Column({ type: 'varchar', length: 255 })
  titulo: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  municipio: string | null;

  @Column({ type: 'char', length: 2, nullable: true })
  uf: string | null;

  @Column({ name: 'url_fonte', type: 'text', nullable: true })
  urlFonte: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  versao: string | null;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}

@Entity('anos_series_curriculares')
@Unique('uq_anos_series_curriculares_codigo', ['codigo'])
export class AnoSerieCurricular {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 40 })
  codigo: string;

  @Column({ name: 'etapa_ensino', type: 'varchar', length: 100 })
  etapaEnsino: string;

  @Column({ type: 'int', nullable: true })
  numero: number | null;

  @Column({ type: 'varchar', length: 100 })
  rotulo: string;
}

@Entity('areas_conhecimento')
@Unique('uq_areas_conhecimento_slug', ['slug'])
export class AreaConhecimento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  nome: string;

  @Column({ type: 'varchar', length: 180 })
  slug: string;
}

@Entity('componentes_curriculares')
@Unique('uq_componentes_curriculares_area_slug', ['areaId', 'slug'])
export class ComponenteCurricular {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'area_id', type: 'varchar', length: 36 })
  areaId: string;

  @ManyToOne(() => AreaConhecimento, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'area_id' })
  area: AreaConhecimento;

  @Column({ name: 'disciplina_id', type: 'varchar', length: 36, nullable: true })
  disciplinaId: string | null;

  @ManyToOne(() => Disciplina, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'disciplina_id' })
  disciplina: Disciplina | null;

  @Column({ type: 'varchar', length: 150 })
  nome: string;

  @Column({ type: 'varchar', length: 180 })
  slug: string;
}

@Entity('planos_pedagogicos')
@Unique('uq_planos_pedagogicos_documento_ano_componente', [
  'documentoId',
  'anoSerieId',
  'componenteId',
])
export class PlanoPedagogico {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'documento_id', type: 'varchar', length: 36 })
  documentoId: string;

  @ManyToOne(() => DocumentoCurricular, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'documento_id' })
  documento: DocumentoCurricular;

  @Column({ name: 'ano_serie_id', type: 'varchar', length: 36 })
  anoSerieId: string;

  @ManyToOne(() => AnoSerieCurricular, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ano_serie_id' })
  anoSerie: AnoSerieCurricular;

  @Column({ name: 'componente_id', type: 'varchar', length: 36 })
  componenteId: string;

  @ManyToOne(() => ComponenteCurricular, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'componente_id' })
  componente: ComponenteCurricular;

  @Column({ type: 'varchar', length: 255, nullable: true })
  titulo: string | null;

  @Column({ name: 'pagina_inicio', type: 'int', nullable: true })
  paginaInicio: number | null;

  @Column({ name: 'pagina_fim', type: 'int', nullable: true })
  paginaFim: number | null;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;
}

@Entity('periodos_planejamento')
@Unique('uq_periodos_planejamento_tipo_numero', ['tipo', 'numero'])
export class PeriodoPlanejamento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 30 })
  tipo: TipoPeriodoPlanejamento;

  @Column({ type: 'int' })
  numero: number;

  @Column({ type: 'varchar', length: 80 })
  rotulo: string;
}

@Entity('unidades_tematicas')
@Unique('uq_unidades_tematicas_plano_slug', ['planoId', 'slug'])
export class UnidadeTematica {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'plano_id', type: 'varchar', length: 36 })
  planoId: string;

  @ManyToOne(() => PlanoPedagogico, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plano_id' })
  plano: PlanoPedagogico;

  @Column({ type: 'varchar', length: 255 })
  nome: string;

  @Column({ type: 'varchar', length: 280 })
  slug: string;

  @Column({ type: 'int', default: 1 })
  ordem: number;
}

@Entity('objetos_conhecimento')
@Unique('uq_objetos_conhecimento_unidade_slug', ['unidadeId', 'slug'])
export class ObjetoConhecimento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'plano_id', type: 'varchar', length: 36 })
  planoId: string;

  @ManyToOne(() => PlanoPedagogico, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plano_id' })
  plano: PlanoPedagogico;

  @Column({ name: 'unidade_id', type: 'varchar', length: 36 })
  unidadeId: string;

  @ManyToOne(() => UnidadeTematica, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'unidade_id' })
  unidade: UnidadeTematica;

  @Column({ type: 'varchar', length: 255 })
  nome: string;

  @Column({ type: 'varchar', length: 280 })
  slug: string;

  @Column({ type: 'int', default: 1 })
  ordem: number;
}

@Entity('habilidades_curriculares')
@Unique('uq_habilidades_curriculares_codigo', ['codigo'])
export class HabilidadeCurricular {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'componente_id', type: 'varchar', length: 36, nullable: true })
  componenteId: string | null;

  @ManyToOne(() => ComponenteCurricular, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'componente_id' })
  componente: ComponenteCurricular | null;

  @Column({ type: 'varchar', length: 40 })
  codigo: string;

  @Column({ type: 'text' })
  texto: string;
}

@Entity('itens_planejamento_pedagogico')
export class ItemPlanejamentoPedagogico {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'plano_id', type: 'varchar', length: 36 })
  planoId: string;

  @ManyToOne(() => PlanoPedagogico, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plano_id' })
  plano: PlanoPedagogico;

  @Column({ name: 'unidade_id', type: 'varchar', length: 36 })
  unidadeId: string;

  @ManyToOne(() => UnidadeTematica, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'unidade_id' })
  unidade: UnidadeTematica;

  @Column({ name: 'objeto_id', type: 'varchar', length: 36 })
  objetoId: string;

  @ManyToOne(() => ObjetoConhecimento, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'objeto_id' })
  objeto: ObjetoConhecimento;

  @Column({ type: 'int', default: 1 })
  ordem: number;

  @Column({ name: 'pagina_fonte', type: 'int', nullable: true })
  paginaFonte: number | null;

  @Column({ type: 'text', nullable: true })
  observacoes: string | null;
}

@Entity('itens_planejamento_periodos')
@Unique('uq_itens_planejamento_periodos_item_periodo', ['itemId', 'periodoId'])
export class ItemPlanejamentoPeriodo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'item_id', type: 'varchar', length: 36 })
  itemId: string;

  @ManyToOne(() => ItemPlanejamentoPedagogico, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item: ItemPlanejamentoPedagogico;

  @Column({ name: 'periodo_id', type: 'varchar', length: 36 })
  periodoId: string;

  @ManyToOne(() => PeriodoPlanejamento, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'periodo_id' })
  periodo: PeriodoPlanejamento;
}

@Entity('itens_planejamento_habilidades')
@Unique('uq_itens_planejamento_habilidades_item_habilidade', [
  'itemId',
  'habilidadeId',
])
export class ItemPlanejamentoHabilidade {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'item_id', type: 'varchar', length: 36 })
  itemId: string;

  @ManyToOne(() => ItemPlanejamentoPedagogico, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item: ItemPlanejamentoPedagogico;

  @Column({ name: 'habilidade_id', type: 'varchar', length: 36 })
  habilidadeId: string;

  @ManyToOne(() => HabilidadeCurricular, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'habilidade_id' })
  habilidade: HabilidadeCurricular;

  @Column({ type: 'int', default: 1 })
  ordem: number;
}
