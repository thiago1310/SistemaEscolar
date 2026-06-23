import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AnoLetivo } from '../anos-letivos/anos-letivos.entities';
import { Usuario } from '../autenticacao/autenticacao.entities';
import { EscopoUsuarioService } from '../autorizacao/escopo-usuario.service';
import { Escola } from '../escolas/escolas.entities';
import { Perfil } from '../perfis-permissoes/perfis-permissoes.entities';
import { Secretaria } from '../secretarias/secretarias.entities';
import {
  AtualizarUsuarioAcessoDto,
  CriarUsuarioAcessoDto,
} from './usuario-acessos.dto';
import { UsuarioAcesso } from './usuario-acessos.entities';

@Injectable()
export class UsuarioAcessosService {
  constructor(
    @InjectRepository(UsuarioAcesso)
    private readonly usuarioAcessosRepositorio: Repository<UsuarioAcesso>,
    @InjectRepository(Usuario)
    private readonly usuariosRepositorio: Repository<Usuario>,
    @InjectRepository(Perfil)
    private readonly perfisRepositorio: Repository<Perfil>,
    @InjectRepository(Secretaria)
    private readonly secretariasRepositorio: Repository<Secretaria>,
    @InjectRepository(Escola)
    private readonly escolasRepositorio: Repository<Escola>,
    @InjectRepository(AnoLetivo)
    private readonly anosLetivosRepositorio: Repository<AnoLetivo>,
    private readonly escopoUsuarioService: EscopoUsuarioService,
  ) {}

  async criar(dados: CriarUsuarioAcessoDto, usuarioExecutorId: string) {
    await this.validarRelacionamentos(dados);
    await this.garantirEscopoGerenciavel(usuarioExecutorId, dados);
    await this.garantirAcessoNaoDuplicado(dados);

    const acesso = this.usuarioAcessosRepositorio.create({
      ...dados,
      secretariaId: dados.secretariaId ?? null,
      escolaId: dados.escolaId ?? null,
      anoLetivoId: dados.anoLetivoId ?? null,
      ativo: dados.ativo ?? true,
    });

    return this.usuarioAcessosRepositorio.save(acesso);
  }

  async listar(usuarioExecutorId: string) {
    const where = await this.filtroAcessosGerenciaveis(usuarioExecutorId);

    if (where === null) {
      return [];
    }

    return this.usuarioAcessosRepositorio.find({
      where,
      relations: {
        usuario: true,
        perfil: true,
        secretaria: true,
        escola: true,
        anoLetivo: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async buscarPorId(id: string, usuarioExecutorId: string) {
    const acesso = await this.usuarioAcessosRepositorio.findOne({
      where: { id },
      relations: {
        usuario: true,
        perfil: true,
        secretaria: true,
        escola: true,
        anoLetivo: true,
      },
    });

    if (!acesso) {
      throw new NotFoundException('Acesso do usuario nao encontrado.');
    }

    await this.garantirEscopoGerenciavel(usuarioExecutorId, acesso);

    return acesso;
  }

  async atualizar(
    id: string,
    dados: AtualizarUsuarioAcessoDto,
    usuarioExecutorId: string,
  ) {
    const acesso = await this.buscarPorId(id, usuarioExecutorId);
    const dadosCompletos = {
      usuarioId: dados.usuarioId ?? acesso.usuarioId,
      perfilId: dados.perfilId ?? acesso.perfilId,
      secretariaId: dados.secretariaId ?? acesso.secretariaId ?? undefined,
      escolaId: dados.escolaId ?? acesso.escolaId ?? undefined,
      anoLetivoId: dados.anoLetivoId ?? acesso.anoLetivoId ?? undefined,
      ativo: dados.ativo ?? acesso.ativo,
    };

    await this.validarRelacionamentos(dadosCompletos);
    await this.garantirEscopoGerenciavel(usuarioExecutorId, dadosCompletos);
    await this.garantirAcessoNaoDuplicado(dadosCompletos, id);

    Object.assign(acesso, {
      ...dados,
      secretariaId: dadosCompletos.secretariaId ?? null,
      escolaId: dadosCompletos.escolaId ?? null,
      anoLetivoId: dadosCompletos.anoLetivoId ?? null,
    });

    return this.usuarioAcessosRepositorio.save(acesso);
  }

  async remover(id: string, usuarioExecutorId: string) {
    const acesso = await this.buscarPorId(id, usuarioExecutorId);
    await this.usuarioAcessosRepositorio.remove(acesso);

    return { mensagem: 'Acesso do usuario removido com sucesso.' };
  }

  async inativar(id: string, usuarioExecutorId: string) {
    const acesso = await this.buscarPorId(id, usuarioExecutorId);
    acesso.ativo = false;

    return this.usuarioAcessosRepositorio.save(acesso);
  }

  private async validarRelacionamentos(dados: CriarUsuarioAcessoDto) {
    const usuario = await this.usuariosRepositorio.findOneBy({ id: dados.usuarioId });
    if (!usuario) {
      throw new NotFoundException('Usuario nao encontrado.');
    }

    const perfil = await this.perfisRepositorio.findOneBy({ id: dados.perfilId });
    if (!perfil) {
      throw new NotFoundException('Perfil nao encontrado.');
    }

    const secretaria = dados.secretariaId
      ? await this.secretariasRepositorio.findOneBy({ id: dados.secretariaId })
      : null;

    if (dados.secretariaId && !secretaria) {
      throw new NotFoundException('Secretaria nao encontrada.');
    }

    const escola = dados.escolaId
      ? await this.escolasRepositorio.findOneBy({ id: dados.escolaId })
      : null;

    if (dados.escolaId && !escola) {
      throw new NotFoundException('Escola nao encontrada.');
    }

    if (escola && !dados.secretariaId) {
      throw new BadRequestException('Acesso com escola deve informar secretaria.');
    }

    if (escola && dados.secretariaId !== escola.secretariaId) {
      throw new BadRequestException('Escola nao pertence a secretaria informada.');
    }

    const anoLetivo = dados.anoLetivoId
      ? await this.anosLetivosRepositorio.findOneBy({ id: dados.anoLetivoId })
      : null;

    if (dados.anoLetivoId && !anoLetivo) {
      throw new NotFoundException('Ano letivo nao encontrado.');
    }

    if (anoLetivo && dados.secretariaId && anoLetivo.secretariaId !== dados.secretariaId) {
      throw new BadRequestException('Ano letivo nao pertence a secretaria informada.');
    }
  }

  private async garantirEscopoGerenciavel(
    usuarioExecutorId: string,
    dados: {
      perfilId: string;
      secretariaId?: string | null;
      escolaId?: string | null;
      anoLetivoId?: string | null;
    },
  ) {
    const escopo = await this.escopoUsuarioService.obterEscopo(usuarioExecutorId);
    const perfil = await this.perfisRepositorio.findOneBy({ id: dados.perfilId });

    if (!perfil) {
      throw new NotFoundException('Perfil nao encontrado.');
    }

    if (escopo.global) {
      return;
    }

    if (perfil.nivel > escopo.maiorNivel) {
      throw new ForbiddenException('Usuario nao pode conceder perfil superior.');
    }

    if (!dados.secretariaId && !dados.escolaId && !dados.anoLetivoId) {
      throw new ForbiddenException('Usuario sem permissao para gerenciar escopo global.');
    }

    if (
      dados.secretariaId &&
      !escopo.secretariaIds.includes(dados.secretariaId)
    ) {
      throw new ForbiddenException('Usuario sem acesso a esta secretaria.');
    }

    if (dados.escolaId && !escopo.escolaIds.includes(dados.escolaId)) {
      const escola = await this.escolasRepositorio.findOneBy({ id: dados.escolaId });

      if (!escola || !escopo.secretariaIds.includes(escola.secretariaId)) {
        throw new ForbiddenException('Usuario sem acesso a esta escola.');
      }
    }

    if (
      dados.anoLetivoId &&
      !escopo.anoLetivoIds.includes(dados.anoLetivoId)
    ) {
      const anoLetivo = await this.anosLetivosRepositorio.findOneBy({
        id: dados.anoLetivoId,
      });

      if (!anoLetivo || !escopo.secretariaIds.includes(anoLetivo.secretariaId)) {
        throw new ForbiddenException('Usuario sem acesso a este ano letivo.');
      }
    }
  }

  private async filtroAcessosGerenciaveis(usuarioExecutorId: string) {
    const escopo = await this.escopoUsuarioService.obterEscopo(usuarioExecutorId);

    if (escopo.global) {
      return undefined;
    }

    const filtros = [];

    if (escopo.secretariaIds.length > 0) {
      filtros.push({ secretariaId: In(escopo.secretariaIds) });
    }

    if (escopo.escolaIds.length > 0) {
      filtros.push({ escolaId: In(escopo.escolaIds) });
    }

    if (escopo.anoLetivoIds.length > 0) {
      filtros.push({ anoLetivoId: In(escopo.anoLetivoIds) });
    }

    return filtros.length > 0 ? filtros : null;
  }

  private async garantirAcessoNaoDuplicado(
    dados: CriarUsuarioAcessoDto,
    ignorarId?: string,
  ) {
    const consulta = this.usuarioAcessosRepositorio
      .createQueryBuilder('acesso')
      .where('acesso.usuario_id = :usuarioId', { usuarioId: dados.usuarioId })
      .andWhere('acesso.perfil_id = :perfilId', { perfilId: dados.perfilId })
      .andWhere(this.condicaoEscopo('secretaria_id', dados.secretariaId))
      .andWhere(this.condicaoEscopo('escola_id', dados.escolaId))
      .andWhere(this.condicaoEscopo('ano_letivo_id', dados.anoLetivoId));

    if (ignorarId) {
      consulta.andWhere('acesso.id != :ignorarId', { ignorarId });
    }

    const existente = await consulta.getOne();

    if (existente) {
      throw new BadRequestException('Ja existe acesso para este usuario, perfil e escopo.');
    }
  }

  private condicaoEscopo(coluna: string, valor?: string | null) {
    return valor
      ? `acesso.${coluna} = '${valor}'`
      : `acesso.${coluna} IS NULL`;
  }
}
