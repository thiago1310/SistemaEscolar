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
  AtualizarAnoLetivoDto,
  CriarAnoLetivoDto,
} from './anos-letivos.dto';
import { AnosLetivosService } from './anos-letivos.service';

@Controller('anos-letivos')
@UseGuards(TokenAcessoGuard, PermissaoGuard)
export class AnosLetivosController {
  constructor(private readonly anosLetivosService: AnosLetivosService) {}

  @Post()
  @NivelMinimo(80)
  criar(@Body() dados: CriarAnoLetivoDto, @Req() req: RequisicaoAutenticada) {
    return this.anosLetivosService.criar(dados, req.usuario.id);
  }

  @Get()
  @NivelMinimo(10)
  listar(@Req() req: RequisicaoAutenticada) {
    return this.anosLetivosService.listar(req.usuario.id);
  }

  @Get(':id')
  @NivelMinimo(10)
  buscarPorId(@Param('id') id: string, @Req() req: RequisicaoAutenticada) {
    return this.anosLetivosService.buscarPorId(id, req.usuario.id);
  }

  @Patch(':id')
  @NivelMinimo(80)
  atualizar(
    @Param('id') id: string,
    @Body() dados: AtualizarAnoLetivoDto,
    @Req() req: RequisicaoAutenticada,
  ) {
    return this.anosLetivosService.atualizar(id, dados, req.usuario.id);
  }

  @Patch(':id/ativar')
  @NivelMinimo(80)
  ativar(@Param('id') id: string, @Req() req: RequisicaoAutenticada) {
    return this.anosLetivosService.ativar(id, req.usuario.id);
  }

  @Patch(':id/inativar')
  @NivelMinimo(80)
  inativar(@Param('id') id: string, @Req() req: RequisicaoAutenticada) {
    return this.anosLetivosService.inativar(id, req.usuario.id);
  }

  @Delete(':id')
  @Perfis('ADMIN_GERAL')
  remover(@Param('id') id: string, @Req() req: RequisicaoAutenticada) {
    return this.anosLetivosService.remover(id, req.usuario.id);
  }
}
