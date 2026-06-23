import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Secretaria } from '../secretarias/secretarias.entities';
import {
  AtualizarAnoLetivoDto,
  CriarAnoLetivoDto,
} from './anos-letivos.dto';
import { AnoLetivo, StatusAnoLetivo } from './anos-letivos.entities';

@Injectable()
export class AnosLetivosService {
  constructor(
    @InjectRepository(AnoLetivo)
    private readonly anosLetivosRepositorio: Repository<AnoLetivo>,
    @InjectRepository(Secretaria)
    private readonly secretariasRepositorio: Repository<Secretaria>,
  ) {}

  async criar(dados: CriarAnoLetivoDto) {
    await this.garantirSecretariaExiste(dados.secretariaId);
    this.validarPeriodo(dados.dataInicio, dados.dataFim);

    if (dados.ativo) {
      await this.inativarAnosDaSecretaria(dados.secretariaId);
    }

    const anoLetivo = this.anosLetivosRepositorio.create({
      ...dados,
      status: dados.status ?? StatusAnoLetivo.PLANEJAMENTO,
      ativo: dados.ativo ?? false,
    });

    return this.anosLetivosRepositorio.save(anoLetivo);
  }

  listar() {
    return this.anosLetivosRepositorio.find({
      relations: {
        secretaria: true,
      },
      order: {
        ano: 'DESC',
      },
    });
  }

  async buscarPorId(id: string) {
    const anoLetivo = await this.anosLetivosRepositorio.findOne({
      where: { id },
      relations: {
        secretaria: true,
      },
    });

    if (!anoLetivo) {
      throw new NotFoundException('Ano letivo não encontrado.');
    }

    return anoLetivo;
  }

  async atualizar(id: string, dados: AtualizarAnoLetivoDto) {
    const anoLetivo = await this.buscarPorId(id);
    const secretariaId = dados.secretariaId ?? anoLetivo.secretariaId;
    const dataInicio = dados.dataInicio ?? anoLetivo.dataInicio;
    const dataFim = dados.dataFim ?? anoLetivo.dataFim;

    if (dados.secretariaId) {
      await this.garantirSecretariaExiste(dados.secretariaId);
    }

    this.validarPeriodo(dataInicio, dataFim);

    if (dados.ativo) {
      await this.inativarAnosDaSecretaria(secretariaId, id);
    }

    Object.assign(anoLetivo, dados);

    return this.anosLetivosRepositorio.save(anoLetivo);
  }

  async remover(id: string) {
    const anoLetivo = await this.buscarPorId(id);
    await this.anosLetivosRepositorio.remove(anoLetivo);

    return { mensagem: 'Ano letivo removido com sucesso.' };
  }

  async ativar(id: string) {
    const anoLetivo = await this.buscarPorId(id);
    await this.inativarAnosDaSecretaria(anoLetivo.secretariaId, id);

    anoLetivo.ativo = true;
    return this.anosLetivosRepositorio.save(anoLetivo);
  }

  async inativar(id: string) {
    const anoLetivo = await this.buscarPorId(id);
    anoLetivo.ativo = false;

    return this.anosLetivosRepositorio.save(anoLetivo);
  }

  private async garantirSecretariaExiste(secretariaId: string) {
    const secretaria = await this.secretariasRepositorio.findOneBy({
      id: secretariaId,
    });

    if (!secretaria) {
      throw new NotFoundException('Secretaria não encontrada.');
    }
  }

  private validarPeriodo(dataInicio: string, dataFim: string) {
    if (new Date(dataFim) < new Date(dataInicio)) {
      throw new BadRequestException(
        'A data final deve ser maior ou igual à data inicial.',
      );
    }
  }

  private async inativarAnosDaSecretaria(secretariaId: string, ignorarId?: string) {
    const consulta = this.anosLetivosRepositorio
      .createQueryBuilder()
      .update(AnoLetivo)
      .set({ ativo: false })
      .where('secretaria_id = :secretariaId', { secretariaId })
      .andWhere('ativo = :ativo', { ativo: true });

    if (ignorarId) {
      consulta.andWhere('id != :ignorarId', { ignorarId });
    }

    await consulta.execute();
  }
}
