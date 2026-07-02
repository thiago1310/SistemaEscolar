import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { CodigoBncc } from '../planejamento-pedagogico/planejamento-pedagogico.entities';
import { ListarCodigosBnccDto } from './bncc-codigos.dto';

@Injectable()
export class BnccCodigosService {
  constructor(
    @InjectRepository(CodigoBncc)
    private readonly codigosBnccRepositorio: Repository<CodigoBncc>,
  ) {}

  async listar(filtros: ListarCodigosBnccDto = {}) {
    const pagina = filtros.pagina ?? 1;
    const limite = filtros.limite ?? 50;
    const consulta = this.codigosBnccRepositorio.createQueryBuilder('codigo');

    consulta.where('codigo.ativo = :ativo', {
      ativo: this.normalizarAtivo(filtros.ativo),
    });

    if (filtros.etapaEnsino) {
      consulta.andWhere('codigo.etapa_ensino = :etapaEnsino', {
        etapaEnsino: filtros.etapaEnsino,
      });
    }

    if (filtros.componenteOuArea) {
      consulta.andWhere('codigo.componente_ou_area = :componenteOuArea', {
        componenteOuArea: filtros.componenteOuArea,
      });
    }

    if (filtros.codigo) {
      consulta.andWhere('codigo.codigo = :codigo', {
        codigo: filtros.codigo.trim().toUpperCase(),
      });
    }

    if (filtros.serie !== undefined) {
      consulta.andWhere('JSON_CONTAINS(codigo.series, :serie)', {
        serie: JSON.stringify(filtros.serie),
      });
    }

    if (filtros.idade !== undefined) {
      consulta
        .andWhere('codigo.faixa_etaria IS NOT NULL')
        .andWhere(
          'CAST(JSON_UNQUOTE(JSON_EXTRACT(codigo.faixa_etaria, "$.idadeInicialAnos")) AS DECIMAL(5,2)) <= :idade',
          { idade: filtros.idade },
        )
        .andWhere(
          'CAST(JSON_UNQUOTE(JSON_EXTRACT(codigo.faixa_etaria, "$.idadeFinalAnos")) AS DECIMAL(5,2)) >= :idade',
          { idade: filtros.idade },
        );
    }

    if (filtros.busca) {
      const busca = `%${filtros.busca.trim().toLowerCase()}%`;
      consulta.andWhere(
        new Brackets((subconsulta) => {
          subconsulta
            .where('LOWER(codigo.codigo) LIKE :busca', { busca })
            .orWhere('LOWER(codigo.etapa_ensino) LIKE :busca', { busca })
            .orWhere('LOWER(codigo.componente_ou_area) LIKE :busca', {
              busca,
            })
            .orWhere(
              'LOWER(JSON_UNQUOTE(JSON_EXTRACT(codigo.faixa_etaria, "$.nome"))) LIKE :busca',
              { busca },
            );
        }),
      );
    }

    const [codigos, total] = await consulta
      .orderBy('codigo.etapa_ensino', 'ASC')
      .addOrderBy('codigo.componente_ou_area', 'ASC')
      .addOrderBy('codigo.codigo', 'ASC')
      .skip((pagina - 1) * limite)
      .take(limite)
      .getManyAndCount();

    return {
      registros: codigos.map((codigo) => this.serializarCodigo(codigo)),
      paginacao: {
        pagina,
        limite,
        total,
        totalPaginas: Math.ceil(total / limite),
      },
    };
  }

  async listarOpcoes() {
    const codigos = await this.codigosBnccRepositorio.find({
      where: { ativo: true },
      select: {
        etapaEnsino: true,
        componenteOuArea: true,
        series: true,
        faixaEtaria: true,
      },
    });

    const etapas = new Set<string>();
    const componentesOuAreas = new Set<string>();
    const series = new Set<number>();
    const faixasEtarias = new Map<string, NonNullable<CodigoBncc['faixaEtaria']>>();

    for (const codigo of codigos) {
      etapas.add(codigo.etapaEnsino);
      componentesOuAreas.add(codigo.componenteOuArea);
      for (const serie of codigo.series ?? []) {
        series.add(serie);
      }
      if (codigo.faixaEtaria) {
        faixasEtarias.set(codigo.faixaEtaria.codigo, codigo.faixaEtaria);
      }
    }

    return {
      etapas: [...etapas].sort((a, b) => a.localeCompare(b)),
      componentesOuAreas: [...componentesOuAreas].sort((a, b) =>
        a.localeCompare(b),
      ),
      series: [...series].sort((a, b) => a - b),
      faixasEtarias: [...faixasEtarias.values()].sort(
        (a, b) => a.idadeInicialAnos - b.idadeInicialAnos,
      ),
    };
  }

  async buscarPorCodigo(codigo: string) {
    const codigoBncc = await this.codigosBnccRepositorio.findOne({
      where: {
        codigo: codigo.trim().toUpperCase(),
        ativo: true,
      },
    });

    if (!codigoBncc) {
      throw new NotFoundException('Codigo BNCC nao encontrado.');
    }

    return this.serializarCodigo(codigoBncc);
  }

  private normalizarAtivo(ativo?: string) {
    if (ativo === undefined) {
      return true;
    }

    return ativo !== 'false';
  }

  private serializarCodigo(codigo: CodigoBncc) {
    return {
      id: codigo.id,
      codigo: codigo.codigo,
      etapaEnsino: codigo.etapaEnsino,
      series: codigo.series ?? [],
      faixaEtaria: codigo.faixaEtaria,
      componenteOuArea: codigo.componenteOuArea,
      primeiraOcorrenciaTexto: codigo.primeiraOcorrenciaTexto,
      fonteUrl: codigo.fonteUrl,
      ativo: codigo.ativo,
      createdAt: codigo.createdAt,
      updatedAt: codigo.updatedAt,
    };
  }
}
