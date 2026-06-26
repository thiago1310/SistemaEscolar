import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CriarDisciplinaDto {
  @IsUUID()
  secretariaId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nome: string;

  @IsBoolean()
  @IsOptional()
  ativa?: boolean;
}

export class AtualizarDisciplinaDto {
  @IsUUID()
  @IsOptional()
  secretariaId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  nome?: string;

  @IsBoolean()
  @IsOptional()
  ativa?: boolean;
}
