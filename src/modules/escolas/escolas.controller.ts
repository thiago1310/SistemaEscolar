import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  RequisicaoAutenticada,
  TokenAcessoGuard,
} from '../autenticacao/autenticacao.guard';
import { NivelMinimo, Perfis } from '../autorizacao/permissao.decorator';
import { PermissaoGuard } from '../autorizacao/permissao.guard';
import {
  AtualizarEscolaDto,
  ConsultarConfiguracaoPedagogicaDto,
  CriarEscolaDto,
  SalvarConfiguracaoPedagogicaDto,
} from './escolas.dto';
import { EscolasService } from './escolas.service';

@Controller('escolas')
@UseGuards(TokenAcessoGuard, PermissaoGuard)
export class EscolasController {
  constructor(private readonly escolasService: EscolasService) {}

  @Post()
  @NivelMinimo(60)
  criar(@Body() dados: CriarEscolaDto, @Req() req: RequisicaoAutenticada) {
    return this.escolasService.criar(dados, req.usuario.id);
  }

  @Get()
  @NivelMinimo(10)
  listar(@Req() req: RequisicaoAutenticada) {
    return this.escolasService.listar(req.usuario.id);
  }

  @Get(':id/configuracao-pedagogica')
  @NivelMinimo(10)
  buscarConfiguracaoPedagogica(
    @Param('id') id: string,
    @Query() filtros: ConsultarConfiguracaoPedagogicaDto,
    @Req() req: RequisicaoAutenticada,
  ) {
    return this.escolasService.buscarConfiguracaoPedagogica(
      id,
      filtros.anoLetivo,
      req.usuario.id,
    );
  }

  @Put(':id/configuracao-pedagogica')
  @NivelMinimo(60)
  salvarConfiguracaoPedagogica(
    @Param('id') id: string,
    @Body() dados: SalvarConfiguracaoPedagogicaDto,
    @Req() req: RequisicaoAutenticada,
  ) {
    return this.escolasService.salvarConfiguracaoPedagogica(
      id,
      dados,
      req.usuario.id,
    );
  }

  @Get(':id/periodos-letivos')
  @NivelMinimo(10)
  listarPeriodosLetivos(
    @Param('id') id: string,
    @Query() filtros: ConsultarConfiguracaoPedagogicaDto,
    @Req() req: RequisicaoAutenticada,
  ) {
    return this.escolasService.listarPeriodosLetivos(
      id,
      filtros.anoLetivo,
      req.usuario.id,
    );
  }

  @Get(':id/periodo-letivo-atual')
  @NivelMinimo(10)
  buscarPeriodoLetivoAtual(
    @Param('id') id: string,
    @Query() filtros: ConsultarConfiguracaoPedagogicaDto,
    @Req() req: RequisicaoAutenticada,
  ) {
    return this.escolasService.buscarPeriodoLetivoAtual(
      id,
      filtros.anoLetivo,
      req.usuario.id,
      filtros.data,
    );
  }

  @Get(':id')
  @NivelMinimo(10)
  buscarPorId(@Param('id') id: string, @Req() req: RequisicaoAutenticada) {
    return this.escolasService.buscarPorId(id, req.usuario.id);
  }

  @Patch(':id')
  @NivelMinimo(60)
  atualizar(
    @Param('id') id: string,
    @Body() dados: AtualizarEscolaDto,
    @Req() req: RequisicaoAutenticada,
  ) {
    return this.escolasService.atualizar(id, dados, req.usuario.id);
  }

  @Patch(':id/inativar')
  @NivelMinimo(60)
  inativar(@Param('id') id: string, @Req() req: RequisicaoAutenticada) {
    return this.escolasService.inativar(id, req.usuario.id);
  }

  @Delete(':id')
  @Perfis('ADMIN_GERAL')
  remover(@Param('id') id: string, @Req() req: RequisicaoAutenticada) {
    return this.escolasService.remover(id, req.usuario.id);
  }
}
