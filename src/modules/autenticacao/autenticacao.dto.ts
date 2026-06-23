import { IsNotEmpty, IsString, MinLength } from 'class-validator';

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
