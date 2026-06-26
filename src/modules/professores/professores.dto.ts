import {
  ArrayNotEmpty,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CriarProfessorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nome: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  cpf?: string;

  @IsEmail()
  @IsOptional()
  @MaxLength(150)
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  telefone?: string;

  @IsDateString()
  @IsOptional()
  dataNascimento?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  cargo?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  observacoes?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  username?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  matricula?: string;

  @IsDateString()
  @IsOptional()
  dataAdmissao?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  formacao?: string;

  @IsUUID()
  @IsOptional()
  secretariaId?: string;

  @IsUUID()
  @IsOptional()
  escolaId?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  escolaIds?: string[];

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;

  @IsBoolean()
  @IsOptional()
  enviarEmailBoasVindas?: boolean;
}

export class AtualizarProfessorDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  nome?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  cpf?: string;

  @IsEmail()
  @IsOptional()
  @MaxLength(150)
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  telefone?: string;

  @IsDateString()
  @IsOptional()
  dataNascimento?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  cargo?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  observacoes?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  username?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  matricula?: string;

  @IsDateString()
  @IsOptional()
  dataAdmissao?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  formacao?: string;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}
