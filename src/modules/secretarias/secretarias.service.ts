import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EscopoUsuarioService } from '../autorizacao/escopo-usuario.service';
import {
  AtualizarSecretariaDto,
  CriarSecretariaDto,
} from './secretarias.dto';
import { Secretaria } from './secretarias.entities';

@Injectable()
export class SecretariasService {
  constructor(
    @InjectRepository(Secretaria)
    private readonly secretariasRepositorio: Repository<Secretaria>,
    private readonly escopoUsuarioService: EscopoUsuarioService,
  ) {}

  async criar(dados: CriarSecretariaDto, usuarioId: string) {
    await this.escopoUsuarioService.garantirEscopoGlobal(usuarioId);

    const secretaria = this.secretariasRepositorio.create({
      ...dados,
      uf: dados.uf.toUpperCase(),
      ativa: dados.ativa ?? true,
    });

    return this.secretariasRepositorio.save(secretaria);
  }

  async listar(usuarioId: string) {
    const where = await this.escopoUsuarioService.filtroSecretarias(usuarioId);

    if (where === null) {
      return [];
    }

    return this.secretariasRepositorio.find({
      where,
      order: {
        nome: 'ASC',
      },
    });
  }

  async buscarPorId(id: string, usuarioId: string) {
    const secretaria = await this.secretariasRepositorio.findOneBy({ id });

    if (!secretaria) {
      throw new NotFoundException('Secretaria nao encontrada.');
    }

    await this.escopoUsuarioService.garantirSecretariaPermitida(usuarioId, id);

    return secretaria;
  }

  async atualizar(id: string, dados: AtualizarSecretariaDto, usuarioId: string) {
    const secretaria = await this.buscarPorId(id, usuarioId);

    Object.assign(secretaria, {
      ...dados,
      uf: dados.uf?.toUpperCase() ?? secretaria.uf,
    });

    return this.secretariasRepositorio.save(secretaria);
  }

  async remover(id: string, usuarioId: string) {
    const secretaria = await this.buscarPorId(id, usuarioId);
    await this.secretariasRepositorio.remove(secretaria);

    return { mensagem: 'Secretaria removida com sucesso.' };
  }

  async inativar(id: string, usuarioId: string) {
    const secretaria = await this.buscarPorId(id, usuarioId);
    secretaria.ativa = false;

    return this.secretariasRepositorio.save(secretaria);
  }
}
