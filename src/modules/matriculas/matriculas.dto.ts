import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { SituacaoMatricula, TipoMatricula } from './matriculas.entities';

export class CriarMatriculaDto {
  @IsUUID()
  @IsOptional()
  alunoId?: string;

  @IsUUID()
  @IsOptional()
  studentId?: string;

  @IsUUID()
  @IsOptional()
  escolaId?: string;

  @IsUUID()
  @IsOptional()
  schoolId?: string;

  @IsUUID()
  @IsOptional()
  targetSchoolId?: string;

  @IsUUID()
  @IsOptional()
  turmaId?: string;

  @IsUUID()
  @IsOptional()
  classId?: string;

  @IsUUID()
  @IsOptional()
  targetClassId?: string;

  @IsEnum(TipoMatricula)
  @IsOptional()
  tipo?: TipoMatricula;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  type?: string;

  @IsEnum(SituacaoMatricula)
  @IsOptional()
  situacao?: SituacaoMatricula;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  situation?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  status?: string;

  @IsInt()
  @Min(2000)
  @Max(2100)
  @IsOptional()
  @Type(() => Number)
  anoLetivo?: number;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  year?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  dataMatricula?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  enrollmentDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  numeroMatricula?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  registration?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  motivo?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  reason?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  observacoes?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  observation?: string;

  @IsInt()
  @Min(2000)
  @Max(2100)
  @IsOptional()
  @Type(() => Number)
  sourceYear?: number;

  @IsInt()
  @Min(2000)
  @Max(2100)
  @IsOptional()
  @Type(() => Number)
  targetYear?: number;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  mode?: string;
}

export class AtualizarMatriculaDto {
  @IsUUID()
  @IsOptional()
  escolaId?: string;

  @IsUUID()
  @IsOptional()
  schoolId?: string;

  @IsUUID()
  @IsOptional()
  targetSchoolId?: string;

  @IsUUID()
  @IsOptional()
  turmaId?: string;

  @IsUUID()
  @IsOptional()
  classId?: string;

  @IsUUID()
  @IsOptional()
  targetClassId?: string;

  @IsEnum(TipoMatricula)
  @IsOptional()
  tipo?: TipoMatricula;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  type?: string;

  @IsEnum(SituacaoMatricula)
  @IsOptional()
  situacao?: SituacaoMatricula;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  situation?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  status?: string;

  @IsInt()
  @Min(2000)
  @Max(2100)
  @IsOptional()
  @Type(() => Number)
  anoLetivo?: number;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  year?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  dataMatricula?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  enrollmentDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  numeroMatricula?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  registration?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  motivo?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  reason?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  observacoes?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  observation?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  mode?: string | null;

  @IsInt()
  @Min(2000)
  @Max(2100)
  @IsOptional()
  @Type(() => Number)
  sourceYear?: number | null;

  @IsInt()
  @Min(2000)
  @Max(2100)
  @IsOptional()
  @Type(() => Number)
  targetYear?: number | null;

  @IsBoolean()
  @IsOptional()
  ativa?: boolean;
}

export class ListarMatriculasDto {
  @IsString()
  @IsOptional()
  @MaxLength(120)
  tenantSlug?: string;

  @IsUUID()
  @IsOptional()
  alunoId?: string;

  @IsUUID()
  @IsOptional()
  studentId?: string;

  @IsUUID()
  @IsOptional()
  escolaId?: string;

  @IsUUID()
  @IsOptional()
  schoolId?: string;

  @IsUUID()
  @IsOptional()
  turmaId?: string;

  @IsUUID()
  @IsOptional()
  classId?: string;

  @IsEnum(TipoMatricula)
  @IsOptional()
  tipo?: TipoMatricula;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  type?: string;

  @IsEnum(SituacaoMatricula)
  @IsOptional()
  situacao?: SituacaoMatricula;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  situation?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  status?: string;

  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  @IsOptional()
  anoLetivo?: number;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  busca?: string;
}
