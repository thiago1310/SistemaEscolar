import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TipoPeriodoPlanejamento } from './planejamento-pedagogico.entities';

export class ListarPlanejamentoDto {
  @IsUUID()
  @IsOptional()
  secretariaId?: string;

  @IsInt()
  @Type(() => Number)
  @IsOptional()
  anoSerie?: number;

  @IsString()
  @IsOptional()
  etapaEnsino?: string;

  @IsString()
  @IsOptional()
  area?: string;

  @IsString()
  @IsOptional()
  componente?: string;

  @IsUUID()
  @IsOptional()
  disciplinaId?: string;

  @IsInt()
  @Type(() => Number)
  @IsOptional()
  periodo?: number;

  @IsString()
  @IsOptional()
  habilidade?: string;

  @IsString()
  @IsOptional()
  q?: string;

  @IsInt()
  @Type(() => Number)
  @Min(1)
  @IsOptional()
  pagina?: number;

  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  @IsOptional()
  limite?: number;
}

export class HabilidadeImportacaoDto {
  @IsString()
  codigo: string;

  @IsString()
  texto: string;
}

export class ItemPlanejamentoImportacaoDto {
  @IsInt()
  @Type(() => Number)
  anoSerie: number;

  @IsString()
  etapaEnsino: string;

  @IsString()
  area: string;

  @IsString()
  componente: string;

  @IsUUID()
  @IsOptional()
  disciplinaId?: string;

  @IsArray()
  @IsInt({ each: true })
  periodos: number[];

  @IsString()
  @IsOptional()
  tipoPeriodo?: TipoPeriodoPlanejamento;

  @IsString()
  unidadeTematica: string;

  @IsString()
  objetoConhecimento: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HabilidadeImportacaoDto)
  habilidades: HabilidadeImportacaoDto[];

  @IsInt()
  @Type(() => Number)
  @IsOptional()
  paginaFonte?: number;

  @IsInt()
  @Type(() => Number)
  @IsOptional()
  ordem?: number;
}

export class ImportarPlanejamentoDto {
  @IsUUID()
  secretariaId: string;

  @IsString()
  @IsOptional()
  tituloDocumento?: string;

  @IsString()
  @IsOptional()
  municipio?: string;

  @IsString()
  @IsOptional()
  uf?: string;

  @IsString()
  @IsOptional()
  urlFonte?: string;

  @IsString()
  @IsOptional()
  versao?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemPlanejamentoImportacaoDto)
  itens: ItemPlanejamentoImportacaoDto[];
}
