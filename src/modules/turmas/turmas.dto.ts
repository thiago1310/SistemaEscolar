import {
  IsBoolean,
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
import { EtapaEnsinoTurma, TurnoTurma } from './turmas.entities';

export class CriarTurmaDto {
  @IsUUID()
  escolaId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nome: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  salaReferencia?: string;

  @IsInt()
  @Min(2000)
  @Max(2100)
  anoLetivo: number;

  @IsEnum(EtapaEnsinoTurma)
  etapaEnsino: EtapaEnsinoTurma;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  anoSerie: string;

  @IsEnum(TurnoTurma)
  turno: TurnoTurma;

  @IsInt()
  @Min(1)
  @Max(999)
  capacidade: number;

  @IsUUID()
  @IsOptional()
  professorRegenteId?: string;

  @IsBoolean()
  @IsOptional()
  ativa?: boolean;
}

export class AtualizarTurmaDto {
  @IsUUID()
  @IsOptional()
  escolaId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  nome?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  salaReferencia?: string;

  @IsInt()
  @IsOptional()
  @Min(2000)
  @Max(2100)
  anoLetivo?: number;

  @IsEnum(EtapaEnsinoTurma)
  @IsOptional()
  etapaEnsino?: EtapaEnsinoTurma;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  anoSerie?: string;

  @IsEnum(TurnoTurma)
  @IsOptional()
  turno?: TurnoTurma;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(999)
  capacidade?: number;

  @IsUUID()
  @IsOptional()
  professorRegenteId?: string;

  @IsBoolean()
  @IsOptional()
  ativa?: boolean;
}
