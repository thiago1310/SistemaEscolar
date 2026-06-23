import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AtualizarPerfilDto,
  AtualizarPermissaoDto,
  CriarPerfilDto,
  CriarPermissaoDto,
} from './perfis-permissoes.dto';
import { Perfil, PerfilPermissao, Permissao } from './perfis-permissoes.entities';

@Injectable()
export class PerfisPermissoesService {
  constructor(
    @InjectRepository(Perfil)
    private readonly perfisRepositorio: Repository<Perfil>,
    @InjectRepository(Permissao)
    private readonly permissoesRepositorio: Repository<Permissao>,
    @InjectRepository(PerfilPermissao)
    private readonly perfilPermissoesRepositorio: Repository<PerfilPermissao>,
  ) {}

  criarPerfil(dados: CriarPerfilDto) {
    const perfil = this.perfisRepositorio.create({
      ...dados,
      nivel: dados.nivel ?? 0,
      sistema: dados.sistema ?? false,
      ativo: dados.ativo ?? true,
    });

    return this.perfisRepositorio.save(perfil);
  }

  listarPerfis() {
    return this.perfisRepositorio.find({ order: { nivel: 'DESC', nome: 'ASC' } });
  }

  async buscarPerfilPorId(id: string) {
    const perfil = await this.perfisRepositorio.findOneBy({ id });

    if (!perfil) {
      throw new NotFoundException('Perfil não encontrado.');
    }

    return perfil;
  }

  async atualizarPerfil(id: string, dados: AtualizarPerfilDto) {
    const perfil = await this.buscarPerfilPorId(id);
    Object.assign(perfil, dados);

    return this.perfisRepositorio.save(perfil);
  }

  async removerPerfil(id: string) {
    const perfil = await this.buscarPerfilPorId(id);
    await this.perfisRepositorio.remove(perfil);

    return { mensagem: 'Perfil removido com sucesso.' };
  }

  criarPermissao(dados: CriarPermissaoDto) {
    const permissao = this.permissoesRepositorio.create(dados);
    return this.permissoesRepositorio.save(permissao);
  }

  listarPermissoes() {
    return this.permissoesRepositorio.find({ order: { modulo: 'ASC', acao: 'ASC' } });
  }

  async buscarPermissaoPorId(id: string) {
    const permissao = await this.permissoesRepositorio.findOneBy({ id });

    if (!permissao) {
      throw new NotFoundException('Permissão não encontrada.');
    }

    return permissao;
  }

  async atualizarPermissao(id: string, dados: AtualizarPermissaoDto) {
    const permissao = await this.buscarPermissaoPorId(id);
    Object.assign(permissao, dados);

    return this.permissoesRepositorio.save(permissao);
  }

  async removerPermissao(id: string) {
    const permissao = await this.buscarPermissaoPorId(id);
    await this.permissoesRepositorio.remove(permissao);

    return { mensagem: 'Permissão removida com sucesso.' };
  }

  async vincularPermissao(perfilId: string, permissaoId: string) {
    await this.buscarPerfilPorId(perfilId);
    await this.buscarPermissaoPorId(permissaoId);

    const existente = await this.perfilPermissoesRepositorio.findOneBy({
      perfilId,
      permissaoId,
    });

    if (existente) {
      return existente;
    }

    return this.perfilPermissoesRepositorio.save({ perfilId, permissaoId });
  }

  async desvincularPermissao(perfilId: string, permissaoId: string) {
    const vinculo = await this.perfilPermissoesRepositorio.findOneBy({
      perfilId,
      permissaoId,
    });

    if (!vinculo) {
      throw new NotFoundException('Permissão do perfil não encontrada.');
    }

    await this.perfilPermissoesRepositorio.remove(vinculo);
    return { mensagem: 'Permissão removida do perfil com sucesso.' };
  }

  listarPermissoesDoPerfil(perfilId: string) {
    return this.perfilPermissoesRepositorio.find({
      where: { perfilId },
      relations: { permissao: true },
      order: { createdAt: 'ASC' },
    });
  }
}
