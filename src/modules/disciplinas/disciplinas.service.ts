import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Secretaria } from '../secretarias/secretarias.entities';
import {
  AtualizarDisciplinaDto,
  CriarDisciplinaDto,
} from './disciplinas.dto';
import { Disciplina } from './disciplinas.entities';

@Injectable()
export class DisciplinasService {
  constructor(
    @InjectRepository(Disciplina)
    private readonly disciplinasRepositorio: Repository<Disciplina>,
    @InjectRepository(Secretaria)
    private readonly secretariasRepositorio: Repository<Secretaria>,
  ) {}

  async criar(dados: CriarDisciplinaDto) {
    await this.garantirSecretariaExiste(dados.secretariaId);

    const disciplina = this.disciplinasRepositorio.create({
      ...dados,
      codigo: dados.codigo ?? null,
      ativa: dados.ativa ?? true,
    });

    return this.disciplinasRepositorio.save(disciplina);
  }

  listar() {
    return this.disciplinasRepositorio.find({
      relations: {
        secretaria: true,
      },
      order: {
        nome: 'ASC',
      },
    });
  }

  async buscarPorId(id: string) {
    const disciplina = await this.disciplinasRepositorio.findOne({
      where: { id },
      relations: {
        secretaria: true,
      },
    });

    if (!disciplina) {
      throw new NotFoundException('Disciplina não encontrada.');
    }

    return disciplina;
  }

  async atualizar(id: string, dados: AtualizarDisciplinaDto) {
    const disciplina = await this.buscarPorId(id);

    if (dados.secretariaId) {
      await this.garantirSecretariaExiste(dados.secretariaId);
    }

    Object.assign(disciplina, dados);

    return this.disciplinasRepositorio.save(disciplina);
  }

  async remover(id: string) {
    const disciplina = await this.buscarPorId(id);
    await this.disciplinasRepositorio.remove(disciplina);

    return { mensagem: 'Disciplina removida com sucesso.' };
  }

  async inativar(id: string) {
    const disciplina = await this.buscarPorId(id);
    disciplina.ativa = false;

    return this.disciplinasRepositorio.save(disciplina);
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
