import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class EntrarDto {
  @IsString()
  @IsNotEmpty()
  identificador: string;

  @IsString()
  @MinLength(6)
  senha: string;
}

export class RenovarTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class SairDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class AlterarSenhaDto {
  @IsString()
  @MinLength(6)
  @MaxLength(100)
  senhaAtual: string;

  @IsString()
  @MinLength(6)
  @MaxLength(100)
  novaSenha: string;

  @IsString()
  @MinLength(6)
  @MaxLength(100)
  confirmacaoSenha: string;
}
