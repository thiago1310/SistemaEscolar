import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, IsNull, Repository } from 'typeorm';
import { EscopoUsuarioService } from '../autorizacao/escopo-usuario.service';
import { Disciplina } from '../disciplinas/disciplinas.entities';
import { Escola } from '../escolas/escolas.entities';
import { Secretaria } from '../secretarias/secretarias.entities';
import {
  ImportarPlanejamentoDto,
  ItemPlanejamentoImportacaoDto,
  ListarPlanejamentoDto,
} from './planejamento-pedagogico.dto';
import {
  AnoSerieCurricular,
  AreaConhecimento,
  ComponenteCurricular,
  DocumentoCurricular,
  HabilidadeCurricular,
  ItemPlanejamentoHabilidade,
  ItemPlanejamentoPedagogico,
  ItemPlanejamentoPeriodo,
  ObjetoConhecimento,
  PeriodoPlanejamento,
  PlanoPedagogico,
  TipoPeriodoPlanejamento,
  UnidadeTematica,
} from './planejamento-pedagogico.entities';

@Injectable()
export class PlanejamentoPedagogicoService {
  constructor(
    @InjectRepository(DocumentoCurricular)
    private readonly documentosRepositorio: Repository<DocumentoCurricular>,
    @InjectRepository(AnoSerieCurricular)
    private readonly anosSeriesRepositorio: Repository<AnoSerieCurricular>,
    @InjectRepository(AreaConhecimento)
    private readonly areasRepositorio: Repository<AreaConhecimento>,
    @InjectRepository(ComponenteCurricular)
    private readonly componentesRepositorio: Repository<ComponenteCurricular>,
    @InjectRepository(PlanoPedagogico)
    private readonly planosRepositorio: Repository<PlanoPedagogico>,
    @InjectRepository(PeriodoPlanejamento)
    private readonly periodosRepositorio: Repository<PeriodoPlanejamento>,
    @InjectRepository(UnidadeTematica)
    private readonly unidadesRepositorio: Repository<UnidadeTematica>,
    @InjectRepository(ObjetoConhecimento)
    private readonly objetosRepositorio: Repository<ObjetoConhecimento>,
    @InjectRepository(HabilidadeCurricular)
    private readonly habilidadesRepositorio: Repository<HabilidadeCurricular>,
    @InjectRepository(ItemPlanejamentoPedagogico)
    private readonly itensRepositorio: Repository<ItemPlanejamentoPedagogico>,
    @InjectRepository(ItemPlanejamentoPeriodo)
    private readonly itensPeriodosRepositorio: Repository<ItemPlanejamentoPeriodo>,
    @InjectRepository(ItemPlanejamentoHabilidade)
    private readonly itensHabilidadesRepositorio: Repository<ItemPlanejamentoHabilidade>,
    @InjectRepository(Secretaria)
    private readonly secretariasRepositorio: Repository<Secretaria>,
    @InjectRepository(Escola)
    private readonly escolasRepositorio: Repository<Escola>,
    @InjectRepository(Disciplina)
    private readonly disciplinasRepositorio: Repository<Disciplina>,
    private readonly escopoUsuarioService: EscopoUsuarioService,
  ) {}

  async listarItens(usuarioId: string, filtros: ListarPlanejamentoDto = {}) {
    const secretariaIds = await this.obterSecretariaIdsPermitidas(usuarioId);
    if (secretariaIds !== undefined && secretariaIds.length === 0) {
      return { data: [], total: 0, pagina: 1, limite: filtros.limite ?? 20 };
    }

    const pagina = filtros.pagina ?? 1;
    const limite = filtros.limite ?? 20;
    const consulta = this.itensRepositorio
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.plano', 'plano')
      .leftJoinAndSelect('plano.documento', 'documento')
      .leftJoinAndSelect('plano.anoSerie', 'anoSerie')
      .leftJoinAndSelect('plano.componente', 'componente')
      .leftJoinAndSelect('componente.area', 'area')
      .leftJoinAndSelect('item.unidade', 'unidade')
      .leftJoinAndSelect('item.objeto', 'objeto')
      .leftJoinAndSelect(ItemPlanejamentoPeriodo, 'itemPeriodo', 'itemPeriodo.item_id = item.id')
      .leftJoinAndSelect(PeriodoPlanejamento, 'periodo', 'periodo.id = itemPeriodo.periodo_id')
      .leftJoinAndSelect(ItemPlanejamentoHabilidade, 'itemHabilidade', 'itemHabilidade.item_id = item.id')
      .leftJoinAndSelect(HabilidadeCurricular, 'habilidade', 'habilidade.id = itemHabilidade.habilidade_id')
      .where('documento.ativo = true')
      .andWhere('plano.ativo = true');

    if (secretariaIds !== undefined) {
      consulta.andWhere('documento.secretaria_id IN (:...secretariaIds)', {
        secretariaIds,
      });
    }

    if (filtros.secretariaId) {
      await this.garantirSecretariaFiltroPermitida(filtros.secretariaId, usuarioId);
      consulta.andWhere('documento.secretaria_id = :secretariaId', {
        secretariaId: filtros.secretariaId,
      });
    }
    if (filtros.anoSerie) {
      consulta.andWhere('anoSerie.numero = :anoSerie', { anoSerie: filtros.anoSerie });
    }
    if (filtros.etapaEnsino) {
      consulta.andWhere('anoSerie.etapa_ensino = :etapaEnsino', {
        etapaEnsino: filtros.etapaEnsino,
      });
    }
    if (filtros.area) {
      consulta.andWhere('area.slug = :area', { area: this.gerarSlug(filtros.area) });
    }
    if (filtros.componente) {
      consulta.andWhere('componente.slug = :componente', {
        componente: this.gerarSlug(filtros.componente),
      });
    }
    if (filtros.disciplinaId) {
      consulta.andWhere('componente.disciplina_id = :disciplinaId', {
        disciplinaId: filtros.disciplinaId,
      });
    }
    if (filtros.periodo) {
      consulta.andWhere('periodo.numero = :periodo', { periodo: filtros.periodo });
    }
    if (filtros.habilidade) {
      consulta.andWhere('habilidade.codigo = :habilidade', {
        habilidade: filtros.habilidade.toUpperCase(),
      });
    }
    if (filtros.q) {
      const busca = `%${filtros.q.toLowerCase()}%`;
      consulta.andWhere(
        new Brackets((subconsulta) => {
          subconsulta
            .where('LOWER(unidade.nome) LIKE :busca', { busca })
            .orWhere('LOWER(objeto.nome) LIKE :busca', { busca })
            .orWhere('LOWER(habilidade.codigo) LIKE :busca', { busca })
            .orWhere('LOWER(habilidade.texto) LIKE :busca', { busca });
        }),
      );
    }

    const [itens, total] = await consulta
      .orderBy('anoSerie.numero', 'ASC')
      .addOrderBy('item.ordem', 'ASC')
      .skip((pagina - 1) * limite)
      .take(limite)
      .getManyAndCount();

    return {
      data: await Promise.all(itens.map((item) => this.serializarItemPorId(item.id))),
      total,
      pagina,
      limite,
    };
  }

  async buscarPorId(id: string, usuarioId: string) {
    const item = await this.itensRepositorio.findOne({
      where: { id },
      relations: {
        plano: { documento: true, anoSerie: true, componente: { area: true } },
        unidade: true,
        objeto: true,
      },
    });
    if (!item) {
      throw new NotFoundException('Item de planejamento nao encontrado.');
    }
    await this.garantirDocumentoPermitido(item.plano.documento, usuarioId);
    return this.serializarItemPorId(item.id);
  }

  async buscarPorHabilidade(codigo: string, usuarioId: string) {
    return this.listarItens(usuarioId, { habilidade: codigo, limite: 100 });
  }

  async listarPlanos(usuarioId: string, filtros: ListarPlanejamentoDto = {}) {
    const secretariaIds = await this.obterSecretariaIdsPermitidas(usuarioId);
    const consulta = this.planosRepositorio
      .createQueryBuilder('plano')
      .leftJoinAndSelect('plano.documento', 'documento')
      .leftJoinAndSelect('plano.anoSerie', 'anoSerie')
      .leftJoinAndSelect('plano.componente', 'componente')
      .leftJoinAndSelect('componente.area', 'area')
      .where('documento.ativo = true')
      .andWhere('plano.ativo = true');

    if (secretariaIds !== undefined) {
      if (secretariaIds.length === 0) {
        return [];
      }
      consulta.andWhere('documento.secretaria_id IN (:...secretariaIds)', {
        secretariaIds,
      });
    }
    if (filtros.anoSerie) {
      consulta.andWhere('anoSerie.numero = :anoSerie', { anoSerie: filtros.anoSerie });
    }
    if (filtros.area) {
      consulta.andWhere('area.slug = :area', { area: this.gerarSlug(filtros.area) });
    }
    if (filtros.componente) {
      consulta.andWhere('componente.slug = :componente', {
        componente: this.gerarSlug(filtros.componente),
      });
    }

    const planos = await consulta.orderBy('anoSerie.numero', 'ASC').getMany();
    return planos.map((plano) => this.serializarPlano(plano));
  }

  async listarOpcoes(usuarioId: string) {
    const secretariaIds = await this.obterSecretariaIdsPermitidas(usuarioId);
    const planos = await this.planosRepositorio.find({
      where:
        secretariaIds === undefined
          ? { ativo: true }
          : { ativo: true, documento: { secretariaId: In(secretariaIds) } },
      relations: { documento: true, anoSerie: true, componente: { area: true } },
    });
    const periodos = await this.periodosRepositorio.find({
      order: { tipo: 'ASC', numero: 'ASC' },
    });

    return {
      anosSeries: this.unicosPorId(planos.map((plano) => plano.anoSerie)),
      areas: this.unicosPorId(planos.map((plano) => plano.componente.area)),
      componentes: this.unicosPorId(planos.map((plano) => plano.componente)),
      periodos,
    };
  }

  async importarPlanejamento(dados: ImportarPlanejamentoDto, usuarioId: string) {
    await this.garantirImportacaoPermitida(usuarioId, dados.secretariaId);
    const secretaria = await this.secretariasRepositorio.findOneBy({
      id: dados.secretariaId,
    });
    if (!secretaria) {
      throw new NotFoundException('Secretaria nao encontrada.');
    }

    const documento = await this.obterOuCriarDocumento(dados, secretaria);
    let totalItens = 0;

    for (const item of dados.itens) {
      await this.importarItem(documento, item);
      totalItens += 1;
    }

    return {
      mensagem: 'Planejamento pedagogico importado com sucesso.',
      documentoId: documento.id,
      itensImportados: totalItens,
    };
  }

  private async importarItem(
    documento: DocumentoCurricular,
    item: ItemPlanejamentoImportacaoDto,
  ) {
    this.validarItemImportacao(item);
    const anoSerie = await this.obterOuCriarAnoSerie(item);
    const area = await this.obterOuCriarArea(item.area);
    const componente = await this.obterOuCriarComponente(area, item);
    const plano = await this.obterOuCriarPlano(documento, anoSerie, componente);
    const unidade = await this.obterOuCriarUnidade(plano, item);
    const objeto = await this.obterOuCriarObjeto(plano, unidade, item);

    const itemSalvo = await this.obterOuCriarItem(plano, unidade, objeto, item);

    for (const numeroPeriodo of item.periodos) {
      const periodo = await this.obterOuCriarPeriodo(
        item.tipoPeriodo ?? TipoPeriodoPlanejamento.TRIMESTRE,
        numeroPeriodo,
      );
      await this.relacionarItemPeriodo(itemSalvo, periodo);
    }

    for (const [indice, habilidadeItem] of item.habilidades.entries()) {
      const habilidade = await this.obterOuCriarHabilidade(
        componente,
        habilidadeItem.codigo,
        habilidadeItem.texto,
      );
      await this.relacionarItemHabilidade(itemSalvo, habilidade, indice + 1);
    }
  }

  private async obterOuCriarItem(
    plano: PlanoPedagogico,
    unidade: UnidadeTematica,
    objeto: ObjetoConhecimento,
    item: ItemPlanejamentoImportacaoDto,
  ) {
    const ordem = item.ordem ?? 1;
    const consulta = this.itensRepositorio
      .createQueryBuilder('item')
      .where('item.plano_id = :planoId', { planoId: plano.id })
      .andWhere('item.unidade_id = :unidadeId', { unidadeId: unidade.id })
      .andWhere('item.objeto_id = :objetoId', { objetoId: objeto.id })
      .andWhere('item.ordem = :ordem', { ordem });

    if (item.paginaFonte === undefined || item.paginaFonte === null) {
      consulta.andWhere('item.pagina_fonte IS NULL');
    } else {
      consulta.andWhere('item.pagina_fonte = :paginaFonte', {
        paginaFonte: item.paginaFonte,
      });
    }

    const existente = await consulta.getOne();
    if (existente) {
      return existente;
    }

    return this.itensRepositorio.save(
      this.itensRepositorio.create({
        planoId: plano.id,
        unidadeId: unidade.id,
        objetoId: objeto.id,
        ordem,
        paginaFonte: item.paginaFonte ?? null,
        observacoes: null,
      }),
    );
  }

  private async relacionarItemPeriodo(
    item: ItemPlanejamentoPedagogico,
    periodo: PeriodoPlanejamento,
  ) {
    const existente = await this.itensPeriodosRepositorio.findOneBy({
      itemId: item.id,
      periodoId: periodo.id,
    });
    if (existente) {
      return existente;
    }
    return this.itensPeriodosRepositorio.save(
      this.itensPeriodosRepositorio.create({
        itemId: item.id,
        periodoId: periodo.id,
      }),
    );
  }

  private async relacionarItemHabilidade(
    item: ItemPlanejamentoPedagogico,
    habilidade: HabilidadeCurricular,
    ordem: number,
  ) {
    const existente = await this.itensHabilidadesRepositorio.findOneBy({
      itemId: item.id,
      habilidadeId: habilidade.id,
    });
    if (existente) {
      return existente;
    }
    return this.itensHabilidadesRepositorio.save(
      this.itensHabilidadesRepositorio.create({
        itemId: item.id,
        habilidadeId: habilidade.id,
        ordem,
      }),
    );
  }

  private validarItemImportacao(item: ItemPlanejamentoImportacaoDto) {
    if (
      !item.anoSerie ||
      !item.area?.trim() ||
      !item.componente?.trim() ||
      !item.unidadeTematica?.trim() ||
      !item.objetoConhecimento?.trim()
    ) {
      throw new BadRequestException('Item de importacao incompleto.');
    }
  }

  private async obterOuCriarDocumento(
    dados: ImportarPlanejamentoDto,
    secretaria: Secretaria,
  ) {
    const titulo =
      dados.tituloDocumento ??
      `Plano curricular - ${secretaria.nome} - ${dados.versao ?? 'versao inicial'}`;
    const existente = await this.documentosRepositorio.findOne({
      where: {
        secretariaId: secretaria.id,
        titulo,
        versao: dados.versao ?? IsNull(),
      },
    });
    if (existente) {
      return existente;
    }
    return this.documentosRepositorio.save(
      this.documentosRepositorio.create({
        secretariaId: secretaria.id,
        titulo,
        municipio: dados.municipio ?? secretaria.municipio,
        uf: dados.uf ?? secretaria.uf,
        urlFonte: dados.urlFonte ?? null,
        versao: dados.versao ?? null,
        ativo: true,
      }),
    );
  }

  private async obterOuCriarAnoSerie(item: ItemPlanejamentoImportacaoDto) {
    const codigo = `ANO_${item.anoSerie}`;
    const existente = await this.anosSeriesRepositorio.findOneBy({ codigo });
    if (existente) return existente;
    return this.anosSeriesRepositorio.save(
      this.anosSeriesRepositorio.create({
        codigo,
        etapaEnsino: item.etapaEnsino,
        numero: item.anoSerie,
        rotulo: `${item.anoSerie} ano`,
      }),
    );
  }

  private async obterOuCriarArea(nome: string) {
    const slug = this.gerarSlug(nome);
    const existente = await this.areasRepositorio.findOneBy({ slug });
    if (existente) return existente;
    return this.areasRepositorio.save(
      this.areasRepositorio.create({ nome: nome.trim(), slug }),
    );
  }

  private async obterOuCriarComponente(
    area: AreaConhecimento,
    item: ItemPlanejamentoImportacaoDto,
  ) {
    const slug = this.gerarSlug(item.componente);
    const existente = await this.componentesRepositorio.findOneBy({
      areaId: area.id,
      slug,
    });
    if (existente) return existente;
    if (item.disciplinaId) {
      const disciplina = await this.disciplinasRepositorio.findOneBy({
        id: item.disciplinaId,
      });
      if (!disciplina) {
        throw new NotFoundException('Disciplina nao encontrada.');
      }
    }
    return this.componentesRepositorio.save(
      this.componentesRepositorio.create({
        areaId: area.id,
        disciplinaId: item.disciplinaId ?? null,
        nome: item.componente.trim(),
        slug,
      }),
    );
  }

  private async obterOuCriarPlano(
    documento: DocumentoCurricular,
    anoSerie: AnoSerieCurricular,
    componente: ComponenteCurricular,
  ) {
    const existente = await this.planosRepositorio.findOneBy({
      documentoId: documento.id,
      anoSerieId: anoSerie.id,
      componenteId: componente.id,
    });
    if (existente) return existente;
    return this.planosRepositorio.save(
      this.planosRepositorio.create({
        documentoId: documento.id,
        anoSerieId: anoSerie.id,
        componenteId: componente.id,
        titulo: `${anoSerie.rotulo} - ${componente.nome}`,
        ativo: true,
      }),
    );
  }

  private async obterOuCriarUnidade(
    plano: PlanoPedagogico,
    item: ItemPlanejamentoImportacaoDto,
  ) {
    const slug = this.gerarSlug(item.unidadeTematica);
    const existente = await this.unidadesRepositorio.findOneBy({
      planoId: plano.id,
      slug,
    });
    if (existente) return existente;
    return this.unidadesRepositorio.save(
      this.unidadesRepositorio.create({
        planoId: plano.id,
        nome: item.unidadeTematica.trim(),
        slug,
        ordem: item.ordem ?? 1,
      }),
    );
  }

  private async obterOuCriarObjeto(
    plano: PlanoPedagogico,
    unidade: UnidadeTematica,
    item: ItemPlanejamentoImportacaoDto,
  ) {
    const slug = this.gerarSlug(item.objetoConhecimento);
    const existente = await this.objetosRepositorio.findOneBy({
      unidadeId: unidade.id,
      slug,
    });
    if (existente) return existente;
    return this.objetosRepositorio.save(
      this.objetosRepositorio.create({
        planoId: plano.id,
        unidadeId: unidade.id,
        nome: item.objetoConhecimento.trim(),
        slug,
        ordem: item.ordem ?? 1,
      }),
    );
  }

  private async obterOuCriarPeriodo(tipo: TipoPeriodoPlanejamento, numero: number) {
    const existente = await this.periodosRepositorio.findOneBy({ tipo, numero });
    if (existente) return existente;
    return this.periodosRepositorio.save(
      this.periodosRepositorio.create({
        tipo,
        numero,
        rotulo: `${numero} ${tipo.toLowerCase()}`,
      }),
    );
  }

  private async obterOuCriarHabilidade(
    componente: ComponenteCurricular,
    codigo: string,
    texto: string,
  ) {
    const codigoNormalizado = codigo.trim().toUpperCase();
    const existente = await this.habilidadesRepositorio.findOneBy({
      codigo: codigoNormalizado,
    });
    if (existente) return existente;
    return this.habilidadesRepositorio.save(
      this.habilidadesRepositorio.create({
        componenteId: componente.id,
        codigo: codigoNormalizado,
        texto: texto.trim(),
      }),
    );
  }

  private async serializarItemPorId(id: string) {
    const item = await this.itensRepositorio.findOne({
      where: { id },
      relations: {
        plano: { documento: true, anoSerie: true, componente: { area: true } },
        unidade: true,
        objeto: true,
      },
    });
    if (!item) {
      throw new NotFoundException('Item de planejamento nao encontrado.');
    }
    const [periodos, habilidades] = await Promise.all([
      this.itensPeriodosRepositorio.find({
        where: { itemId: id },
        relations: { periodo: true },
      }),
      this.itensHabilidadesRepositorio.find({
        where: { itemId: id },
        relations: { habilidade: true },
        order: { ordem: 'ASC' },
      }),
    ]);

    return {
      id: item.id,
      documento: {
        id: item.plano.documento.id,
        titulo: item.plano.documento.titulo,
        secretariaId: item.plano.documento.secretariaId,
        versao: item.plano.documento.versao,
        urlFonte: item.plano.documento.urlFonte,
      },
      ano: {
        id: item.plano.anoSerie.id,
        codigo: item.plano.anoSerie.codigo,
        rotulo: item.plano.anoSerie.rotulo,
        numero: item.plano.anoSerie.numero,
        etapaEnsino: item.plano.anoSerie.etapaEnsino,
      },
      area: {
        id: item.plano.componente.area.id,
        nome: item.plano.componente.area.nome,
        slug: item.plano.componente.area.slug,
      },
      componente: {
        id: item.plano.componente.id,
        nome: item.plano.componente.nome,
        slug: item.plano.componente.slug,
        disciplinaId: item.plano.componente.disciplinaId,
      },
      planoId: item.planoId,
      periodos: periodos.map((itemPeriodo) => itemPeriodo.periodo),
      unidadeTematica: item.unidade.nome,
      objetoConhecimento: item.objeto.nome,
      habilidades: habilidades.map((itemHabilidade) => ({
        id: itemHabilidade.habilidade.id,
        codigo: itemHabilidade.habilidade.codigo,
        texto: itemHabilidade.habilidade.texto,
      })),
      paginaFonte: item.paginaFonte,
      ordem: item.ordem,
      observacoes: item.observacoes,
    };
  }

  private serializarPlano(plano: PlanoPedagogico) {
    return {
      id: plano.id,
      titulo: plano.titulo,
      documento: {
        id: plano.documento.id,
        titulo: plano.documento.titulo,
        secretariaId: plano.documento.secretariaId,
      },
      ano: {
        id: plano.anoSerie.id,
        rotulo: plano.anoSerie.rotulo,
        numero: plano.anoSerie.numero,
        etapaEnsino: plano.anoSerie.etapaEnsino,
      },
      area: {
        id: plano.componente.area.id,
        nome: plano.componente.area.nome,
        slug: plano.componente.area.slug,
      },
      componente: {
        id: plano.componente.id,
        nome: plano.componente.nome,
        slug: plano.componente.slug,
        disciplinaId: plano.componente.disciplinaId,
      },
      ativo: plano.ativo,
    };
  }

  private async garantirImportacaoPermitida(usuarioId: string, secretariaId: string) {
    const escopo = await this.escopoUsuarioService.obterEscopo(usuarioId);
    if (
      !escopo.global &&
      !escopo.perfis.includes('SECRETARIA_MUNICIPAL') &&
      !escopo.perfis.includes('ADMIN_GERAL')
    ) {
      throw new ForbiddenException('Usuario sem permissao para importar planejamento.');
    }
    await this.escopoUsuarioService.garantirSecretariaPermitida(usuarioId, secretariaId);
  }

  private async garantirDocumentoPermitido(
    documento: DocumentoCurricular,
    usuarioId: string,
  ) {
    const secretariaIds = await this.obterSecretariaIdsPermitidas(usuarioId);
    if (secretariaIds === undefined) return;
    if (!secretariaIds.includes(documento.secretariaId)) {
      throw new ForbiddenException('Usuario sem acesso a este planejamento.');
    }
  }

  private async garantirSecretariaFiltroPermitida(secretariaId: string, usuarioId: string) {
    const secretariaIds = await this.obterSecretariaIdsPermitidas(usuarioId);
    if (secretariaIds === undefined) return;
    if (!secretariaIds.includes(secretariaId)) {
      throw new ForbiddenException('Usuario sem acesso a esta secretaria.');
    }
  }

  private async obterSecretariaIdsPermitidas(usuarioId: string) {
    const escopo = await this.escopoUsuarioService.obterEscopo(usuarioId);
    if (escopo.global) {
      return undefined;
    }
    if (escopo.escolaIds.length > 0) {
      const escolas = await this.escolasRepositorio.find({
        where: { id: In(escopo.escolaIds) },
        select: { secretariaId: true },
      });
      return [...new Set(escolas.map((escola) => escola.secretariaId))];
    }
    return escopo.secretariaIds;
  }

  private unicosPorId<T extends { id: string }>(itens: T[]) {
    const mapa = new Map<string, T>();
    for (const item of itens) {
      mapa.set(item.id, item);
    }
    return [...mapa.values()];
  }

  private gerarSlug(texto: string) {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
