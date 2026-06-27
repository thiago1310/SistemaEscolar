import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

const ufsBrasileiras = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

const tiposEscola = ['Urbana', 'Rural'];

const modalidadesEnsino = [
  'Creche',
  'Pre-escola',
  'Pré-escola',
  'Ensino Fundamental - Anos Iniciais',
  'Ensino Fundamental - Anos Finais',
];

export class CriarEscolaDto {
  @IsUUID()
  secretariaId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nome: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  codigoInep?: string;

  @IsString()
  @IsOptional()
  @IsIn(tiposEscola)
  tipoEscola?: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  @IsIn(modalidadesEnsino, { each: true })
  modalidadesEnsino?: string[];

  @IsUUID()
  @IsOptional()
  diretorId?: string | null;

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

  @IsString()
  @IsOptional()
  @Length(8, 8)
  @Matches(/^\d+$/, { message: 'cep deve conter somente números.' })
  cep?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  endereco?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  numero?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  complemento?: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  bairro?: string;

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
  @MaxLength(2000)
  observacoes?: string;

  @IsBoolean()
  @IsOptional()
  ativa?: boolean;
}

export class AtualizarEscolaDto {
  @IsUUID()
  @IsOptional()
  secretariaId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  nome?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  codigoInep?: string;

  @IsString()
  @IsOptional()
  @IsIn(tiposEscola)
  tipoEscola?: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  @IsIn(modalidadesEnsino, { each: true })
  modalidadesEnsino?: string[];

  @IsUUID()
  @IsOptional()
  diretorId?: string | null;

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

  @IsString()
  @IsOptional()
  @Length(8, 8)
  @Matches(/^\d+$/, { message: 'cep deve conter somente números.' })
  cep?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  endereco?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  numero?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  complemento?: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  bairro?: string;

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
  @MaxLength(2000)
  observacoes?: string;

  @IsBoolean()
  @IsOptional()
  ativa?: boolean;
}
