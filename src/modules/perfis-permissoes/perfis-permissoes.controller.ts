import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TokenAcessoGuard } from '../autenticacao/autenticacao.guard';
import {
  AtualizarPerfilDto,
  AtualizarPermissaoDto,
  CriarPerfilDto,
  CriarPermissaoDto,
  VincularPermissaoDto,
} from './perfis-permissoes.dto';
import { PerfisPermissoesService } from './perfis-permissoes.service';

@Controller()
@UseGuards(TokenAcessoGuard)
export class PerfisPermissoesController {
  constructor(private readonly perfisPermissoesService: PerfisPermissoesService) {}

  @Post('perfis')
  criarPerfil(@Body() dados: CriarPerfilDto) {
    return this.perfisPermissoesService.criarPerfil(dados);
  }

  @Get('perfis')
  listarPerfis() {
    return this.perfisPermissoesService.listarPerfis();
  }

  @Get('perfis/:id')
  buscarPerfilPorId(@Param('id') id: string) {
    return this.perfisPermissoesService.buscarPerfilPorId(id);
  }

  @Patch('perfis/:id')
  atualizarPerfil(@Param('id') id: string, @Body() dados: AtualizarPerfilDto) {
    return this.perfisPermissoesService.atualizarPerfil(id, dados);
  }

  @Delete('perfis/:id')
  removerPerfil(@Param('id') id: string) {
    return this.perfisPermissoesService.removerPerfil(id);
  }

  @Post('permissoes')
  criarPermissao(@Body() dados: CriarPermissaoDto) {
    return this.perfisPermissoesService.criarPermissao(dados);
  }

  @Get('permissoes')
  listarPermissoes() {
    return this.perfisPermissoesService.listarPermissoes();
  }

  @Get('permissoes/:id')
  buscarPermissaoPorId(@Param('id') id: string) {
    return this.perfisPermissoesService.buscarPermissaoPorId(id);
  }

  @Patch('permissoes/:id')
  atualizarPermissao(
    @Param('id') id: string,
    @Body() dados: AtualizarPermissaoDto,
  ) {
    return this.perfisPermissoesService.atualizarPermissao(id, dados);
  }

  @Delete('permissoes/:id')
  removerPermissao(@Param('id') id: string) {
    return this.perfisPermissoesService.removerPermissao(id);
  }

  @Post('perfis/:perfilId/permissoes')
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
  listarPermissoesDoPerfil(@Param('perfilId') perfilId: string) {
    return this.perfisPermissoesService.listarPermissoesDoPerfil(perfilId);
  }

  @Delete('perfis/:perfilId/permissoes/:permissaoId')
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
