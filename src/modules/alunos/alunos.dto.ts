import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CriarAlunoDto {
  @IsUUID()
  @IsOptional()
  escolaId?: string | null;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nomeCompleto: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  cpfOuCertidao?: string | null;

  @IsDateString()
  @IsOptional()
  dataNascimento?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  responsavelNome?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  responsavelTelefone?: string | null;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}

export class AtualizarAlunoDto {
  @IsUUID()
  @IsOptional()
  escolaId?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  nomeCompleto?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  cpfOuCertidao?: string | null;

  @IsDateString()
  @IsOptional()
  dataNascimento?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  responsavelNome?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  responsavelTelefone?: string | null;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}
