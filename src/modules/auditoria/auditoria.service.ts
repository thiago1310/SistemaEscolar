import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, MoreThanOrEqual, LessThanOrEqual, Repository } from 'typeorm';
import { FiltroAuditoriaDto } from './auditoria.dto';
import { AuditoriaLog } from './auditoria.entities';

interface RegistrarAuditoriaDados {
  usuarioId?: string | null;
  entidade: string;
  entidadeId?: string | null;
  acao: string;
  dadosAntes?: Record<string, unknown> | null;
  dadosDepois?: Record<string, unknown> | null;
  ip?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuditoriaService {
  constructor(
    @InjectRepository(AuditoriaLog)
    private readonly auditoriaRepositorio: Repository<AuditoriaLog>,
  ) {}

  registrar(dados: RegistrarAuditoriaDados) {
    const log = this.auditoriaRepositorio.create({
      usuarioId: dados.usuarioId ?? null,
      entidade: dados.entidade,
      entidadeId: dados.entidadeId ?? null,
      acao: dados.acao,
      dadosAntes: dados.dadosAntes ?? null,
      dadosDepois: dados.dadosDepois ?? null,
      ip: dados.ip ?? null,
      userAgent: dados.userAgent ?? null,
    });

    return this.auditoriaRepositorio.save(log);
  }

  listar(filtro: FiltroAuditoriaDto) {
    const where: FindOptionsWhere<AuditoriaLog> = {};

    if (filtro.usuarioId) where.usuarioId = filtro.usuarioId;
    if (filtro.entidade) where.entidade = filtro.entidade;
    if (filtro.entidadeId) where.entidadeId = filtro.entidadeId;
    if (filtro.acao) where.acao = filtro.acao;

    if (filtro.dataInicio && filtro.dataFim) {
      where.createdAt = Between(new Date(filtro.dataInicio), new Date(filtro.dataFim));
    } else if (filtro.dataInicio) {
      where.createdAt = MoreThanOrEqual(new Date(filtro.dataInicio));
    } else if (filtro.dataFim) {
      where.createdAt = LessThanOrEqual(new Date(filtro.dataFim));
    }

    return this.auditoriaRepositorio.find({
      where,
      relations: { usuario: true },
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }

  buscarPorId(id: string) {
    return this.auditoriaRepositorio.findOne({
      where: { id },
      relations: { usuario: true },
    });
  }
}
