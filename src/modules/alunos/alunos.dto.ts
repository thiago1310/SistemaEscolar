import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { SituacaoAluno } from './alunos.entities';

export class ResponsavelAlunoDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  nome?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  telefone?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  phone?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  parentesco?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  relationship?: string | null;
}

export class CriarAlunoDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  nomeCompleto?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  cpfOuCertidao?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  document?: string | null;

  @IsDateString()
  @IsOptional()
  dataNascimento?: string | null;

  @IsDateString()
  @IsOptional()
  birthDate?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  sexo?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  genero?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  sex?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  gender?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  responsavelNome?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  guardian?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  responsavelTelefone?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  phone?: string | null;

  @IsArray()
  @IsOptional()
  responsaveis?: ResponsavelAlunoDto[] | null;

  @IsArray()
  @IsOptional()
  guardians?: ResponsavelAlunoDto[] | null;
}

export class AtualizarAlunoDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  nomeCompleto?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  cpfOuCertidao?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  document?: string | null;

  @IsDateString()
  @IsOptional()
  dataNascimento?: string | null;

  @IsDateString()
  @IsOptional()
  birthDate?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  sexo?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  genero?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  sex?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  gender?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  responsavelNome?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  guardian?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  responsavelTelefone?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  phone?: string | null;

  @IsArray()
  @IsOptional()
  responsaveis?: ResponsavelAlunoDto[] | null;

  @IsArray()
  @IsOptional()
  guardians?: ResponsavelAlunoDto[] | null;

  @IsEnum(SituacaoAluno)
  @IsOptional()
  situacao?: SituacaoAluno | null;

  @IsEnum(SituacaoAluno)
  @IsOptional()
  status?: SituacaoAluno | null;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}

export class ListarAlunosDto {
  @IsString()
  @IsOptional()
  @MaxLength(120)
  tenantSlug?: string;

  @IsUUID()
  @IsOptional()
  escolaId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(36)
  schoolId?: string;

  @IsUUID()
  @IsOptional()
  turmaId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(36)
  classId?: string;

  @IsEnum(SituacaoAluno)
  @IsOptional()
  situacao?: SituacaoAluno;

  @IsEnum(SituacaoAluno)
  @IsOptional()
  status?: SituacaoAluno;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  busca?: string;
}
