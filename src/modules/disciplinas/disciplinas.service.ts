import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EscopoUsuarioService } from '../autorizacao/escopo-usuario.service';
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
    private readonly escopoUsuarioService: EscopoUsuarioService,
  ) {}

  async criar(dados: CriarDisciplinaDto, usuarioId: string) {
    await this.garantirSecretariaExiste(dados.secretariaId);
    await this.escopoUsuarioService.garantirSecretariaPermitida(
      usuarioId,
      dados.secretariaId,
    );

    const disciplina = this.disciplinasRepositorio.create({
      ...dados,
      ativa: dados.ativa ?? true,
    });

    return this.disciplinasRepositorio.save(disciplina);
  }

  async listar(usuarioId: string) {
    const where = await this.escopoUsuarioService.filtroPorSecretaria(usuarioId);

    if (where === null) {
      return [];
    }

    return this.disciplinasRepositorio.find({
      where,
      relations: {
        secretaria: true,
      },
      order: {
        nome: 'ASC',
      },
    });
  }

  async buscarPorId(id: string, usuarioId: string) {
    const disciplina = await this.disciplinasRepositorio.findOne({
      where: { id },
      relations: {
        secretaria: true,
      },
    });

    if (!disciplina) {
      throw new NotFoundException('Disciplina nao encontrada.');
    }

    await this.escopoUsuarioService.garantirSecretariaPermitida(
      usuarioId,
      disciplina.secretariaId,
    );

    return disciplina;
  }

  async atualizar(id: string, dados: AtualizarDisciplinaDto, usuarioId: string) {
    const disciplina = await this.buscarPorId(id, usuarioId);

    if (dados.secretariaId) {
      await this.garantirSecretariaExiste(dados.secretariaId);
      await this.escopoUsuarioService.garantirSecretariaPermitida(
        usuarioId,
        dados.secretariaId,
      );
    }

    Object.assign(disciplina, dados);

    return this.disciplinasRepositorio.save(disciplina);
  }

  async remover(id: string, usuarioId: string) {
    const disciplina = await this.buscarPorId(id, usuarioId);
    await this.disciplinasRepositorio.remove(disciplina);

    return { mensagem: 'Disciplina removida com sucesso.' };
  }

  async inativar(id: string, usuarioId: string) {
    const disciplina = await this.buscarPorId(id, usuarioId);
    disciplina.ativa = false;

    return this.disciplinasRepositorio.save(disciplina);
  }

  private async garantirSecretariaExiste(secretariaId: string) {
    const secretaria = await this.secretariasRepositorio.findOneBy({
      id: secretariaId,
    });

    if (!secretaria) {
      throw new NotFoundException('Secretaria nao encontrada.');
    }
  }
}
