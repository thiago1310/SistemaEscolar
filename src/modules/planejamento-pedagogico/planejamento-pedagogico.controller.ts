import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import {
  RequisicaoAutenticada,
  TokenAcessoGuard,
} from '../autenticacao/autenticacao.guard';
import { NivelMinimo, Perfis } from '../autorizacao/permissao.decorator';
import { PermissaoGuard } from '../autorizacao/permissao.guard';
import {
  ImportarPlanejamentoDto,
  ListarPlanejamentoDto,
} from './planejamento-pedagogico.dto';
import { PlanejamentoPedagogicoService } from './planejamento-pedagogico.service';

@Controller('planejamento-pedagogico')
@UseGuards(TokenAcessoGuard, PermissaoGuard)
export class PlanejamentoPedagogicoController {
  constructor(
    private readonly planejamentoPedagogicoService: PlanejamentoPedagogicoService,
  ) {}

  @Get()
  @NivelMinimo(10)
  listar(
    @Query() filtros: ListarPlanejamentoDto,
    @Req() req: RequisicaoAutenticada,
  ) {
    return this.planejamentoPedagogicoService.listarItens(
      req.usuario.id,
      filtros,
    );
  }

  @Get('opcoes')
  @NivelMinimo(10)
  listarOpcoes(@Req() req: RequisicaoAutenticada) {
    return this.planejamentoPedagogicoService.listarOpcoes(req.usuario.id);
  }

  @Get('planos')
  @NivelMinimo(10)
  listarPlanos(
    @Query() filtros: ListarPlanejamentoDto,
    @Req() req: RequisicaoAutenticada,
  ) {
    return this.planejamentoPedagogicoService.listarPlanos(
      req.usuario.id,
      filtros,
    );
  }

  @Get('habilidades/:codigo')
  @NivelMinimo(10)
  buscarPorHabilidade(
    @Param('codigo') codigo: string,
    @Req() req: RequisicaoAutenticada,
  ) {
    return this.planejamentoPedagogicoService.buscarPorHabilidade(
      codigo,
      req.usuario.id,
    );
  }

  @Get(':id')
  @NivelMinimo(10)
  buscarPorId(@Param('id') id: string, @Req() req: RequisicaoAutenticada) {
    return this.planejamentoPedagogicoService.buscarPorId(id, req.usuario.id);
  }

  @Post('importar')
  @Perfis('ADMIN_GERAL', 'SECRETARIA_MUNICIPAL')
  importar(
    @Body() dados: ImportarPlanejamentoDto,
    @Req() req: RequisicaoAutenticada,
  ) {
    return this.planejamentoPedagogicoService.importarPlanejamento(
      dados,
      req.usuario.id,
    );
  }
}
