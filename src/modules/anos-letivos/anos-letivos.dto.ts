import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { StatusAnoLetivo } from './anos-letivos.entities';

export class CriarAnoLetivoDto {
  @IsUUID()
  secretariaId: string;

  @IsInt()
  @Min(2000)
  @Max(2100)
  ano: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  descricao?: string;

  @IsDateString()
  @IsNotEmpty()
  dataInicio: string;

  @IsDateString()
  @IsNotEmpty()
  dataFim: string;

  @IsEnum(StatusAnoLetivo)
  @IsOptional()
  status?: StatusAnoLetivo;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}

export class AtualizarAnoLetivoDto {
  @IsUUID()
  @IsOptional()
  secretariaId?: string;

  @IsInt()
  @IsOptional()
  @Min(2000)
  @Max(2100)
  ano?: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  descricao?: string;

  @IsDateString()
  @IsOptional()
  dataInicio?: string;

  @IsDateString()
  @IsOptional()
  dataFim?: string;

  @IsEnum(StatusAnoLetivo)
  @IsOptional()
  status?: StatusAnoLetivo;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}
