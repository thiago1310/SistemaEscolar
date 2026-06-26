import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UsuarioAcesso } from '../usuario-acessos/usuario-acessos.entities';

export interface EscopoUsuario {
  global: boolean;
  secretariaIds: string[];
  escolaIds: string[];
  maiorNivel: number;
  perfis: string[];
}

@Injectable()
export class EscopoUsuarioService {
  constructor(
    @InjectRepository(UsuarioAcesso)
    private readonly usuarioAcessosRepositorio: Repository<UsuarioAcesso>,
  ) {}

  async obterEscopo(usuarioId: string): Promise<EscopoUsuario> {
    const acessos = await this.usuarioAcessosRepositorio.find({
      where: { usuarioId, ativo: true },
      relations: { perfil: true },
    });

    const acessosAtivos = acessos.filter((acesso) => acesso.perfil?.ativo);

    if (acessosAtivos.length === 0) {
      throw new ForbiddenException('Usuario sem escopo ativo.');
    }

    const perfis = acessosAtivos.map((acesso) => acesso.perfil.codigo);
    const maiorNivel = acessosAtivos.reduce(
      (nivel, acesso) => Math.max(nivel, acesso.perfil.nivel),
      0,
    );

    return {
      global: perfis.includes('ADMIN_GERAL') || maiorNivel >= 100,
      secretariaIds: this.unicos(
        acessosAtivos.map((acesso) => acesso.secretariaId),
      ),
      escolaIds: this.unicos(acessosAtivos.map((acesso) => acesso.escolaId)),
      maiorNivel,
      perfis,
    };
  }

  async garantirEscopoGlobal(usuarioId: string) {
    const escopo = await this.obterEscopo(usuarioId);

    if (!escopo.global) {
      throw new ForbiddenException('Usuario sem escopo global.');
    }
  }

  async garantirSecretariaPermitida(usuarioId: string, secretariaId: string) {
    const escopo = await this.obterEscopo(usuarioId);

    if (escopo.global || escopo.secretariaIds.includes(secretariaId)) {
      return;
    }

    throw new ForbiddenException('Usuario sem acesso a esta secretaria.');
  }

  async garantirEscolaPermitida(
    usuarioId: string,
    escola: { id: string; secretariaId: string },
  ) {
    const escopo = await this.obterEscopo(usuarioId);

    if (
      escopo.global ||
      escopo.escolaIds.includes(escola.id) ||
      escopo.secretariaIds.includes(escola.secretariaId)
    ) {
      return;
    }

    throw new ForbiddenException('Usuario sem acesso a esta escola.');
  }

  async filtroSecretarias(usuarioId: string) {
    const escopo = await this.obterEscopo(usuarioId);

    if (escopo.global) {
      return undefined;
    }

    return escopo.secretariaIds.length > 0
      ? { id: In(escopo.secretariaIds) }
      : null;
  }

  async filtroPorSecretaria(usuarioId: string) {
    const escopo = await this.obterEscopo(usuarioId);

    if (escopo.global) {
      return undefined;
    }

    return escopo.secretariaIds.length > 0
      ? { secretariaId: In(escopo.secretariaIds) }
      : null;
  }

  async filtroEscolas(usuarioId: string) {
    const escopo = await this.obterEscopo(usuarioId);

    if (escopo.global) {
      return undefined;
    }

    const filtros = [];

    if (escopo.secretariaIds.length > 0) {
      filtros.push({ secretariaId: In(escopo.secretariaIds) });
    }

    if (escopo.escolaIds.length > 0) {
      filtros.push({ id: In(escopo.escolaIds) });
    }

    return filtros.length > 0 ? filtros : null;
  }

  private unicos(valores: Array<string | null>) {
    return [...new Set(valores.filter((valor): valor is string => Boolean(valor)))];
  }
}
