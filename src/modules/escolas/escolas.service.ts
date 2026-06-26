import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EscopoUsuarioService } from '../autorizacao/escopo-usuario.service';
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
    private readonly escopoUsuarioService: EscopoUsuarioService,
  ) {}

  async criar(dados: CriarEscolaDto, usuarioId: string) {
    await this.garantirSecretariaExiste(dados.secretariaId);
    await this.escopoUsuarioService.garantirSecretariaPermitida(
      usuarioId,
      dados.secretariaId,
    );

    const escola = this.escolasRepositorio.create({
      ...dados,
      tipoEscola: dados.tipoEscola ?? null,
      modalidadesEnsino: dados.modalidadesEnsino ?? null,
      observacoes: dados.observacoes ?? null,
      uf: dados.uf?.toUpperCase(),
      ativa: dados.ativa ?? true,
    });

    return this.escolasRepositorio.save(escola);
  }

  async listar(usuarioId: string) {
    const where = await this.escopoUsuarioService.filtroEscolas(usuarioId);

    if (where === null) {
      return [];
    }

    return this.escolasRepositorio.find({
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
    const escola = await this.escolasRepositorio.findOne({
      where: { id },
      relations: {
        secretaria: true,
      },
    });

    if (!escola) {
      throw new NotFoundException('Escola nao encontrada.');
    }

    await this.escopoUsuarioService.garantirEscolaPermitida(usuarioId, escola);

    return escola;
  }

  async atualizar(id: string, dados: AtualizarEscolaDto, usuarioId: string) {
    const escola = await this.buscarPorId(id, usuarioId);

    if (dados.secretariaId) {
      await this.garantirSecretariaExiste(dados.secretariaId);
      await this.escopoUsuarioService.garantirSecretariaPermitida(
        usuarioId,
        dados.secretariaId,
      );
    }

    Object.assign(escola, {
      ...dados,
      tipoEscola:
        dados.tipoEscola === undefined ? escola.tipoEscola : dados.tipoEscola ?? null,
      modalidadesEnsino:
        dados.modalidadesEnsino === undefined
          ? escola.modalidadesEnsino
          : dados.modalidadesEnsino ?? null,
      observacoes:
        dados.observacoes === undefined
          ? escola.observacoes
          : dados.observacoes ?? null,
      uf: dados.uf?.toUpperCase() ?? escola.uf,
    });

    return this.escolasRepositorio.save(escola);
  }

  async remover(id: string, usuarioId: string) {
    const escola = await this.buscarPorId(id, usuarioId);
    await this.escolasRepositorio.remove(escola);

    return { mensagem: 'Escola removida com sucesso.' };
  }

  async inativar(id: string, usuarioId: string) {
    const escola = await this.buscarPorId(id, usuarioId);
    escola.ativa = false;

    return this.escolasRepositorio.save(escola);
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
