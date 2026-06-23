import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Secretaria } from '../secretarias/secretarias.entities';
import { AtualizarEscolaDto, CriarEscolaDto } from './escolas.dto';
import { Escola } from './escolas.entities';

@Injectable()
export class EscolasService {
  constructor(
    @InjectRepository(Escola)
    private readonly escolasRepositorio: Repository<Escola>,
    @InjectRepository(Secretaria)
    private readonly secretariasRepositorio: Repository<Secretaria>,
  ) {}

  async criar(dados: CriarEscolaDto) {
    await this.garantirSecretariaExiste(dados.secretariaId);

    const escola = this.escolasRepositorio.create({
      ...dados,
      uf: dados.uf?.toUpperCase(),
      ativa: dados.ativa ?? true,
    });

    return this.escolasRepositorio.save(escola);
  }

  listar() {
    return this.escolasRepositorio.find({
      relations: {
        secretaria: true,
      },
      order: {
        nome: 'ASC',
      },
    });
  }

  async buscarPorId(id: string) {
    const escola = await this.escolasRepositorio.findOne({
      where: { id },
      relations: {
        secretaria: true,
      },
    });

    if (!escola) {
      throw new NotFoundException('Escola não encontrada.');
    }

    return escola;
  }

  async atualizar(id: string, dados: AtualizarEscolaDto) {
    const escola = await this.buscarPorId(id);

    if (dados.secretariaId) {
      await this.garantirSecretariaExiste(dados.secretariaId);
    }

    Object.assign(escola, {
      ...dados,
      uf: dados.uf?.toUpperCase() ?? escola.uf,
    });

    return this.escolasRepositorio.save(escola);
  }

  async remover(id: string) {
    const escola = await this.buscarPorId(id);
    await this.escolasRepositorio.remove(escola);

    return { mensagem: 'Escola removida com sucesso.' };
  }

  async inativar(id: string) {
    const escola = await this.buscarPorId(id);
    escola.ativa = false;

    return this.escolasRepositorio.save(escola);
  }

  private async garantirSecretariaExiste(secretariaId: string) {
    const secretaria = await this.secretariasRepositorio.findOneBy({
      id: secretariaId,
    });

    if (!secretaria) {
      throw new NotFoundException('Secretaria não encontrada.');
    }
  }
}
