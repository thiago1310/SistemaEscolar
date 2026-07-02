import { Type } from 'class-transformer';
import {
  IsBooleanString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class ListarCodigosBnccDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  etapaEnsino?: string;

  @IsString()
  @IsOptional()
  @MaxLength(180)
  componenteOuArea?: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(12)
  serie?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(18)
  idade?: number;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  codigo?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  busca?: string;

  @IsBooleanString()
  @IsOptional()
  ativo?: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(1)
  pagina?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(200)
  limite?: number;
}
