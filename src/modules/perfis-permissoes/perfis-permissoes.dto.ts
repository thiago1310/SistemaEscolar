import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CriarPerfilDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nome: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  codigo: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  nivel?: number;

  @IsBoolean()
  @IsOptional()
  sistema?: boolean;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}

export class AtualizarPerfilDto {
  @IsString()
  @IsOptional()
  @MaxLength(150)
  nome?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  codigo?: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  nivel?: number;

  @IsBoolean()
  @IsOptional()
  sistema?: boolean;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}

export class CriarPermissaoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  modulo: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  acao: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  codigo: string;

  @IsString()
  @IsOptional()
  descricao?: string;
}

export class AtualizarPermissaoDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  modulo?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  acao?: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  codigo?: string;

  @IsString()
  @IsOptional()
  descricao?: string;
}

export class VincularPermissaoDto {
  @IsUUID()
  permissaoId: string;
}
