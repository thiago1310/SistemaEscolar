import { IsDateString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class FiltroAuditoriaDto {
  @IsUUID()
  @IsOptional()
  usuarioId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  entidade?: string;

  @IsUUID()
  @IsOptional()
  entidadeId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  acao?: string;

  @IsDateString()
  @IsOptional()
  dataInicio?: string;

  @IsDateString()
  @IsOptional()
  dataFim?: string;
}
