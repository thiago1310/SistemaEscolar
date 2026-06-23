import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

const ufsBrasileiras = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
];

export class CriarSecretariaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nome: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  municipio: string;

  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  @Length(2, 2)
  @IsIn(ufsBrasileiras)
  uf: string;

  @IsString()
  @IsOptional()
  @Length(14, 14)
  @Matches(/^\d+$/, { message: 'cnpj deve conter somente números.' })
  cnpj?: string;

  @IsString()
  @IsOptional()
  @MaxLength(11)
  @Matches(/^\d+$/, { message: 'telefone deve conter somente números.' })
  telefone?: string;

  @IsEmail()
  @IsOptional()
  @MaxLength(150)
  email?: string;

  @IsBoolean()
  @IsOptional()
  ativa?: boolean;
}

export class AtualizarSecretariaDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  nome?: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  municipio?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  @Length(2, 2)
  @IsIn(ufsBrasileiras)
  uf?: string;

  @IsString()
  @IsOptional()
  @Length(14, 14)
  @Matches(/^\d+$/, { message: 'cnpj deve conter somente números.' })
  cnpj?: string;

  @IsString()
  @IsOptional()
  @MaxLength(11)
  @Matches(/^\d+$/, { message: 'telefone deve conter somente números.' })
  telefone?: string;

  @IsEmail()
  @IsOptional()
  @MaxLength(150)
  email?: string;

  @IsBoolean()
  @IsOptional()
  ativa?: boolean;
}
