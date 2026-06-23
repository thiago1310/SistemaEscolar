import { SetMetadata } from '@nestjs/common';

export const CHAVE_PERMISSOES = 'permissoes';

export const Permissao = (...permissoes: string[]) =>
  SetMetadata(CHAVE_PERMISSOES, permissoes);
