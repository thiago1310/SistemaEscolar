import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CriarUsuarioDto {
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

  @IsString()
  @IsOptional()
  @MaxLength(100)
  username?: string;

  @IsString()
  @MinLength(6)
  @MaxLength(100)
  senha: string;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}

export class AtualizarUsuarioDto {
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

  @IsString()
  @IsOptional()
  @MaxLength(100)
  username?: string;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}

export class RedefinirSenhaUsuarioDto {
  @IsString()
  @MinLength(6)
  @MaxLength(100)
  senha: string;
}
