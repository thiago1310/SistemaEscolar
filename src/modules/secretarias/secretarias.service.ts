import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  ) {}

  criar(dados: CriarSecretariaDto) {
    const secretaria = this.secretariasRepositorio.create({
      ...dados,
      uf: dados.uf.toUpperCase(),
      ativa: dados.ativa ?? true,
    });

    return this.secretariasRepositorio.save(secretaria);
  }

  listar() {
    return this.secretariasRepositorio.find({
      order: {
        nome: 'ASC',
      },
    });
  }

  async buscarPorId(id: string) {
    const secretaria = await this.secretariasRepositorio.findOneBy({ id });

    if (!secretaria) {
      throw new NotFoundException('Secretaria não encontrada.');
    }

    return secretaria;
  }

  async atualizar(id: string, dados: AtualizarSecretariaDto) {
    const secretaria = await this.buscarPorId(id);

    Object.assign(secretaria, {
      ...dados,
      uf: dados.uf?.toUpperCase() ?? secretaria.uf,
    });

    return this.secretariasRepositorio.save(secretaria);
  }

  async remover(id: string) {
    const secretaria = await this.buscarPorId(id);
    await this.secretariasRepositorio.remove(secretaria);

    return { mensagem: 'Secretaria removida com sucesso.' };
  }

  async inativar(id: string) {
    const secretaria = await this.buscarPorId(id);
    secretaria.ativa = false;

    return this.secretariasRepositorio.save(secretaria);
  }
}
