import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Escola } from '../escolas/escolas.entities';
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
    @InjectRepository(Escola)
    private readonly escolasRepositorio: Repository<Escola>,
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

    if (escopo.global) {
      return;
    }

    if (
      escopo.escolaIds.length === 0 &&
      escopo.secretariaIds.includes(secretariaId)
    ) {
      return;
    }

    throw new ForbiddenException('Usuario sem acesso a esta secretaria.');
  }

  async garantirEscolaPermitida(
    usuarioId: string,
    escola: { id: string; secretariaId: string },
  ) {
    const escopo = await this.obterEscopo(usuarioId);

    if (escopo.global) {
      return;
    }

    if (escopo.escolaIds.length > 0 && escopo.escolaIds.includes(escola.id)) {
      return;
    }

    if (
      escopo.escolaIds.length === 0 &&
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

    const secretariaIdsPermitidas =
      await this.obterSecretariaIdsPermitidasPorEscopo(escopo);

    return secretariaIdsPermitidas.length > 0
      ? { id: In(secretariaIdsPermitidas) }
      : null;
  }

  async filtroPorSecretaria(usuarioId: string) {
    const escopo = await this.obterEscopo(usuarioId);

    if (escopo.global) {
      return undefined;
    }

    const secretariaIdsPermitidas =
      await this.obterSecretariaIdsPermitidasPorEscopo(escopo);

    return secretariaIdsPermitidas.length > 0
      ? { secretariaId: In(secretariaIdsPermitidas) }
      : null;
  }

  async filtroEscolas(usuarioId: string) {
    const escopo = await this.obterEscopo(usuarioId);

    if (escopo.global) {
      return undefined;
    }

    if (escopo.escolaIds.length > 0) {
      return { id: In(escopo.escolaIds) };
    }

    if (escopo.secretariaIds.length > 0) {
      return { secretariaId: In(escopo.secretariaIds) };
    }

    return null;
  }

  private unicos(valores: Array<string | null>) {
    return [...new Set(valores.filter((valor): valor is string => Boolean(valor)))];
  }

  private async obterSecretariaIdsPermitidasPorEscopo(escopo: EscopoUsuario) {
    const secretariaIds = new Set(escopo.secretariaIds);

    if (escopo.escolaIds.length > 0) {
      const escolas = await this.escolasRepositorio.find({
        where: { id: In(escopo.escolaIds) },
        select: { secretariaId: true },
      });

      for (const escola of escolas) {
        secretariaIds.add(escola.secretariaId);
      }
    }

    return [...secretariaIds];
  }
}
