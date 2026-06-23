import { SetMetadata } from '@nestjs/common';

export const CHAVE_PERFIS = 'perfis';
export const CHAVE_NIVEL_MINIMO = 'nivelMinimo';

export const Perfis = (...perfis: string[]) => SetMetadata(CHAVE_PERFIS, perfis);

export const NivelMinimo = (nivel: number) =>
  SetMetadata(CHAVE_NIVEL_MINIMO, nivel);
