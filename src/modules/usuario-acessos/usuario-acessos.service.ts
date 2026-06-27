import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Usuario } from '../autenticacao/autenticacao.entities';
import { EscopoUsuarioService } from '../autorizacao/escopo-usuario.service';
import { Escola } from '../escolas/escolas.entities';
import { Perfil } from '../perfis-permissoes/perfis-permissoes.entities';
import { ProfessoresService } from '../professores/professores.service';
import { Secretaria } from '../secretarias/secretarias.entities';
import {
  AtualizarUsuarioAcessoDto,
  CriarUsuarioAcessoDto,
} from './usuario-acessos.dto';
import { UsuarioAcesso } from './usuario-acessos.entities';

type DadosUsuarioAcesso = {
  usuarioId: string;
  perfilId: string;
  secretariaId?: string | null;
  escolaId?: string | null;
  ativo?: boolean;
};

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
    private readonly escopoUsuarioService: EscopoUsuarioService,
    private readonly professoresService: ProfessoresService,
  ) {}

  async criar(dados: CriarUsuarioAcessoDto, usuarioExecutorId: string) {
    await this.validarRelacionamentos(dados);
    await this.garantirEscopoGerenciavel(usuarioExecutorId, dados);

    const acessoExistente = await this.buscarAcessoDuplicado(dados);

    if (acessoExistente) {
      Object.assign(acessoExistente, {
        secretariaId: dados.secretariaId ?? null,
        escolaId: dados.escolaId ?? null,
        ativo: dados.ativo ?? true,
      });

      const acessoSalvo =
        await this.usuarioAcessosRepositorio.save(acessoExistente);
      await this.professoresService.sincronizarUsuarioProfessor(
        acessoSalvo.usuarioId,
      );

      return acessoSalvo;
    }

    const acesso = this.usuarioAcessosRepositorio.create({
      ...dados,
      secretariaId: dados.secretariaId ?? null,
      escolaId: dados.escolaId ?? null,
      ativo: dados.ativo ?? true,
    });

    const acessoSalvo = await this.usuarioAcessosRepositorio.save(acesso);
    await this.professoresService.sincronizarUsuarioProfessor(acessoSalvo.usuarioId);

    return acessoSalvo;
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
    const usuarioIdAnterior = acesso.usuarioId;
    const dadosCompletos = {
      usuarioId:
        dados.usuarioId === undefined ? acesso.usuarioId : dados.usuarioId,
      perfilId: dados.perfilId === undefined ? acesso.perfilId : dados.perfilId,
      secretariaId:
        dados.secretariaId === undefined ? acesso.secretariaId : dados.secretariaId,
      escolaId: dados.escolaId === undefined ? acesso.escolaId : dados.escolaId,
      ativo: dados.ativo ?? acesso.ativo,
    };

    await this.validarRelacionamentos(dadosCompletos);
    await this.garantirEscopoGerenciavel(usuarioExecutorId, dadosCompletos);
    await this.garantirAcessoNaoDuplicado(dadosCompletos, id);

    await this.usuarioAcessosRepositorio.update(id, {
      usuarioId: dadosCompletos.usuarioId,
      perfilId: dadosCompletos.perfilId,
      secretariaId: dadosCompletos.secretariaId ?? null,
      escolaId: dadosCompletos.escolaId ?? null,
      ativo: dadosCompletos.ativo,
    });

    await this.professoresService.sincronizarUsuarioProfessor(usuarioIdAnterior);

    if (usuarioIdAnterior !== dadosCompletos.usuarioId) {
      await this.professoresService.sincronizarUsuarioProfessor(dadosCompletos.usuarioId);
    }

    return this.buscarPorId(id, usuarioExecutorId);
  }

  async remover(id: string, usuarioExecutorId: string) {
    const acesso = await this.buscarPorId(id, usuarioExecutorId);
    const usuarioId = acesso.usuarioId;
    await this.usuarioAcessosRepositorio.remove(acesso);
    await this.professoresService.sincronizarUsuarioProfessor(usuarioId);

    return { mensagem: 'Acesso do usuario removido com sucesso.' };
  }

  async inativar(id: string, usuarioExecutorId: string) {
    const acesso = await this.buscarPorId(id, usuarioExecutorId);
    acesso.ativo = false;

    const acessoSalvo = await this.usuarioAcessosRepositorio.save(acesso);
    await this.professoresService.sincronizarUsuarioProfessor(acessoSalvo.usuarioId);

    return acessoSalvo;
  }

  private async validarRelacionamentos(dados: DadosUsuarioAcesso) {
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

    this.validarEscopoObrigatorioPorPerfil(perfil, dados);

  }

  private validarEscopoObrigatorioPorPerfil(
    perfil: Perfil,
    dados: DadosUsuarioAcesso,
  ) {
    if (perfil.codigo === 'GESTOR_ESCOLAR' && !dados.escolaId) {
      throw new BadRequestException(
        'Gestor escolar deve estar vinculado a uma escola.',
      );
    }
  }

  private async garantirEscopoGerenciavel(
    usuarioExecutorId: string,
    dados: {
      perfilId: string;
      secretariaId?: string | null;
      escolaId?: string | null;
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

    if (!dados.secretariaId && !dados.escolaId) {
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

    return filtros.length > 0 ? filtros : null;
  }

  private async garantirAcessoNaoDuplicado(
    dados: DadosUsuarioAcesso,
    ignorarId?: string,
  ) {
    const existente = await this.buscarAcessoDuplicado(dados, ignorarId);

    if (existente) {
      throw new BadRequestException('Ja existe acesso para este usuario, perfil e escopo.');
    }
  }

  private buscarAcessoDuplicado(dados: DadosUsuarioAcesso, ignorarId?: string) {
    const consulta = this.usuarioAcessosRepositorio
      .createQueryBuilder('acesso')
      .where('acesso.usuario_id = :usuarioId', { usuarioId: dados.usuarioId })
      .andWhere('acesso.perfil_id = :perfilId', { perfilId: dados.perfilId })
      .andWhere(this.condicaoEscopo('secretaria_id', dados.secretariaId))
      .andWhere(this.condicaoEscopo('escola_id', dados.escolaId));

    if (ignorarId) {
      consulta.andWhere('acesso.id != :ignorarId', { ignorarId });
    }

    return consulta.getOne();
  }

  private condicaoEscopo(coluna: string, valor?: string | null) {
    return valor
      ? `acesso.${coluna} = '${valor}'`
      : `acesso.${coluna} IS NULL`;
  }
}
