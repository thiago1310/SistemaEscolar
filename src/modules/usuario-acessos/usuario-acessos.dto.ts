import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class CriarUsuarioAcessoDto {
  @IsUUID()
  usuarioId: string;

  @IsUUID()
  perfilId: string;

  @IsUUID()
  @IsOptional()
  secretariaId?: string;

  @IsUUID()
  @IsOptional()
  escolaId?: string;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}

export class AtualizarUsuarioAcessoDto {
  @IsUUID()
  @IsOptional()
  usuarioId?: string;

  @IsUUID()
  @IsOptional()
  perfilId?: string;

  @IsUUID()
  @IsOptional()
  secretariaId?: string;

  @IsUUID()
  @IsOptional()
  escolaId?: string;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}
