import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
  AtualizarPerfilDto,
  AtualizarPermissaoDto,
  CriarPerfilDto,
  CriarPermissaoDto,
  VincularPermissaoDto,
} from './perfis-permissoes.dto';
import { PerfisPermissoesService } from './perfis-permissoes.service';

@Controller()
@UseGuards(TokenAcessoGuard, PermissaoGuard)
export class PerfisPermissoesController {
  constructor(private readonly perfisPermissoesService: PerfisPermissoesService) {}

  @Post('perfis')
  @Perfis('ADMIN_GERAL')
  criarPerfil(@Body() dados: CriarPerfilDto) {
    return this.perfisPermissoesService.criarPerfil(dados);
  }

  @Get('perfis')
  @NivelMinimo(80)
  listarPerfis(@Req() req: RequisicaoAutenticada) {
    return this.perfisPermissoesService.listarPerfis(req.usuario.id);
  }

  @Get('perfis/:id')
  @NivelMinimo(80)
  buscarPerfilPorId(
    @Param('id') id: string,
    @Req() req: RequisicaoAutenticada,
  ) {
    return this.perfisPermissoesService.buscarPerfilPorId(id, req.usuario.id);
  }

  @Patch('perfis/:id')
  @Perfis('ADMIN_GERAL')
  atualizarPerfil(@Param('id') id: string, @Body() dados: AtualizarPerfilDto) {
    return this.perfisPermissoesService.atualizarPerfil(id, dados);
  }

  @Delete('perfis/:id')
  @Perfis('ADMIN_GERAL')
  removerPerfil(@Param('id') id: string) {
    return this.perfisPermissoesService.removerPerfil(id);
  }

  @Post('permissoes')
  @Perfis('ADMIN_GERAL')
  criarPermissao(@Body() dados: CriarPermissaoDto) {
    return this.perfisPermissoesService.criarPermissao(dados);
  }

  @Get('permissoes')
  @NivelMinimo(80)
  listarPermissoes() {
    return this.perfisPermissoesService.listarPermissoes();
  }

  @Get('permissoes/:id')
  @NivelMinimo(80)
  buscarPermissaoPorId(@Param('id') id: string) {
    return this.perfisPermissoesService.buscarPermissaoPorId(id);
  }

  @Patch('permissoes/:id')
  @Perfis('ADMIN_GERAL')
  atualizarPermissao(
    @Param('id') id: string,
    @Body() dados: AtualizarPermissaoDto,
  ) {
    return this.perfisPermissoesService.atualizarPermissao(id, dados);
  }

  @Delete('permissoes/:id')
  @Perfis('ADMIN_GERAL')
  removerPermissao(@Param('id') id: string) {
    return this.perfisPermissoesService.removerPermissao(id);
  }

  @Post('perfis/:perfilId/permissoes')
  @Perfis('ADMIN_GERAL')
  vincularPermissao(
    @Param('perfilId') perfilId: string,
    @Body() dados: VincularPermissaoDto,
  ) {
    return this.perfisPermissoesService.vincularPermissao(
      perfilId,
      dados.permissaoId,
    );
  }

  @Get('perfis/:perfilId/permissoes')
  @NivelMinimo(80)
  listarPermissoesDoPerfil(@Param('perfilId') perfilId: string) {
    return this.perfisPermissoesService.listarPermissoesDoPerfil(perfilId);
  }

  @Delete('perfis/:perfilId/permissoes/:permissaoId')
  @Perfis('ADMIN_GERAL')
  desvincularPermissao(
    @Param('perfilId') perfilId: string,
    @Param('permissaoId') permissaoId: string,
  ) {
    return this.perfisPermissoesService.desvincularPermissao(
      perfilId,
      permissaoId,
    );
  }
}
