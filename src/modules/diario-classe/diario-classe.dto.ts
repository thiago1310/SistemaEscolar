import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  SituacaoFrequenciaDiario,
  SituacaoObservacaoDiario,
  TipoObservacaoDiario,
} from './diario-classe.entities';

export class ListarDiarioTurmasDto {
  @IsString()
  @IsOptional()
  busca?: string;

  @IsUUID()
  @IsOptional()
  escolaId?: string;

  @IsUUID()
  @IsOptional()
  disciplinaId?: string;

  @IsString()
  @IsOptional()
  turno?: string;
}

export class ListarDiariosClasseDto {
  @IsUUID()
  @IsOptional()
  disciplinaId?: string;

  @IsUUID()
  @IsOptional()
  professorId?: string;

  @IsUUID()
  @IsOptional()
  periodoLetivoId?: string;
}

export class FecharDiarioClasseDto {
  @IsString()
  parecerFinal: string;
}

export class ReabrirDiarioClasseDto {
  @IsString()
  @MaxLength(2000)
  motivoReabertura: string;
}

export class ListarFrequenciasDto {
  @IsDateString()
  data: string;

  @IsUUID()
  @IsOptional()
  disciplinaId?: string;

  @IsUUID()
  @IsOptional()
  diarioClasseId?: string;
}

export class RegistroFrequenciaDto {
  @IsUUID()
  alunoId: string;

  @IsIn(Object.values(SituacaoFrequenciaDiario))
  situacao: SituacaoFrequenciaDiario;

  @IsString()
  @IsOptional()
  observacao?: string | null;
}

export class SalvarFrequenciasDto {
  @IsDateString()
  data: string;

  @IsUUID()
  @IsOptional()
  disciplinaId?: string;

  @IsUUID()
  @IsOptional()
  diarioClasseId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RegistroFrequenciaDto)
  registros: RegistroFrequenciaDto[];
}

export class ListarAulasDto {
  @IsUUID()
  @IsOptional()
  disciplinaId?: string;

  @IsUUID()
  @IsOptional()
  diarioClasseId?: string;

  @IsString()
  @IsOptional()
  periodo?: string;

  @IsDateString()
  @IsOptional()
  dataInicial?: string;

  @IsDateString()
  @IsOptional()
  dataFinal?: string;

  @IsString()
  @IsOptional()
  busca?: string;
}

export class CriarAulaDto {
  @IsUUID()
  disciplinaId: string;

  @IsDateString()
  data: string;

  @IsString()
  @IsOptional()
  @MaxLength(5)
  horaInicio?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(5)
  horaFim?: string | null;

  @IsString()
  @MaxLength(120)
  titulo: string;

  @IsString()
  conteudo: string;

  @IsString()
  @IsOptional()
  habilidades?: string | null;

  @IsString()
  @IsOptional()
  recursos?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  periodo?: string | null;
}

export class AtualizarAulaDto {
  @IsUUID()
  @IsOptional()
  disciplinaId?: string;

  @IsDateString()
  @IsOptional()
  data?: string;

  @IsString()
  @IsOptional()
  @MaxLength(5)
  horaInicio?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(5)
  horaFim?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  titulo?: string;

  @IsString()
  @IsOptional()
  conteudo?: string;

  @IsString()
  @IsOptional()
  habilidades?: string | null;

  @IsString()
  @IsOptional()
  recursos?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  periodo?: string | null;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}

export class ListarAvaliacoesDto {
  @IsUUID()
  @IsOptional()
  disciplinaId?: string;

  @IsUUID()
  @IsOptional()
  diarioClasseId?: string;

  @IsString()
  @IsOptional()
  periodo?: string;
}

export class CriarAvaliacaoDto {
  @IsUUID()
  disciplinaId: string;

  @IsString()
  @MaxLength(120)
  nome: string;

  @IsString()
  @MaxLength(80)
  periodo: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  peso: number;

  @IsDateString()
  @IsOptional()
  data?: string | null;

  @IsString()
  @IsOptional()
  observacao?: string | null;
}

export class AtualizarAvaliacaoDto {
  @IsString()
  @IsOptional()
  @MaxLength(120)
  nome?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  periodo?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  peso?: number;

  @IsDateString()
  @IsOptional()
  data?: string | null;

  @IsString()
  @IsOptional()
  observacao?: string | null;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}

export class RegistroNotaDto {
  @IsUUID()
  alunoId: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(10)
  valor?: number | null;

  @IsString()
  @IsOptional()
  observacao?: string | null;
}

export class SalvarNotasDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RegistroNotaDto)
  notas: RegistroNotaDto[];
}

export class ListarNotasDto {
  @IsUUID()
  @IsOptional()
  disciplinaId?: string;

  @IsUUID()
  @IsOptional()
  diarioClasseId?: string;

  @IsString()
  @IsOptional()
  periodo?: string;

  @IsUUID()
  @IsOptional()
  avaliacaoId?: string;

  @IsString()
  @IsOptional()
  busca?: string;
}

export class ListarObservacoesDto {
  @IsUUID()
  @IsOptional()
  alunoId?: string;

  @IsUUID()
  @IsOptional()
  diarioClasseId?: string;

  @IsIn(Object.values(TipoObservacaoDiario))
  @IsOptional()
  tipo?: TipoObservacaoDiario;

  @IsString()
  @IsOptional()
  periodo?: string;

  @IsString()
  @IsOptional()
  busca?: string;
}

export class CriarObservacaoDto {
  @IsUUID()
  @IsOptional()
  alunoId?: string | null;

  @IsDateString()
  data: string;

  @IsIn(Object.values(TipoObservacaoDiario))
  tipo: TipoObservacaoDiario;

  @IsIn(Object.values(SituacaoObservacaoDiario))
  @IsOptional()
  situacao?: SituacaoObservacaoDiario;

  @IsString()
  @MaxLength(180)
  resumo: string;

  @IsString()
  descricao: string;

  @IsString()
  @IsOptional()
  encaminhamentos?: string | null;

  @IsDateString()
  @IsOptional()
  proximaData?: string | null;

  @IsBoolean()
  @IsOptional()
  responsaveisComunicados?: boolean;
}

export class AtualizarObservacaoDto {
  @IsUUID()
  @IsOptional()
  alunoId?: string | null;

  @IsDateString()
  @IsOptional()
  data?: string;

  @IsIn(Object.values(TipoObservacaoDiario))
  @IsOptional()
  tipo?: TipoObservacaoDiario;

  @IsIn(Object.values(SituacaoObservacaoDiario))
  @IsOptional()
  situacao?: SituacaoObservacaoDiario;

  @IsString()
  @IsOptional()
  @MaxLength(180)
  resumo?: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsString()
  @IsOptional()
  encaminhamentos?: string | null;

  @IsDateString()
  @IsOptional()
  proximaData?: string | null;

  @IsBoolean()
  @IsOptional()
  responsaveisComunicados?: boolean;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}
