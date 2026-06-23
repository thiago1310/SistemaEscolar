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
  criar(@Body() dados: CriarAnoLetivoDto) {
    return this.anosLetivosService.criar(dados);
  }

  @Get()
  @NivelMinimo(10)
  listar() {
    return this.anosLetivosService.listar();
  }

  @Get(':id')
  @NivelMinimo(10)
  buscarPorId(@Param('id') id: string) {
    return this.anosLetivosService.buscarPorId(id);
  }

  @Patch(':id')
  @NivelMinimo(80)
  atualizar(@Param('id') id: string, @Body() dados: AtualizarAnoLetivoDto) {
    return this.anosLetivosService.atualizar(id, dados);
  }

  @Patch(':id/ativar')
  @NivelMinimo(80)
  ativar(@Param('id') id: string) {
    return this.anosLetivosService.ativar(id);
  }

  @Patch(':id/inativar')
  @NivelMinimo(80)
  inativar(@Param('id') id: string) {
    return this.anosLetivosService.inativar(id);
  }

  @Delete(':id')
  @Perfis('ADMIN_GERAL')
  remover(@Param('id') id: string) {
    return this.anosLetivosService.remover(id);
  }
}
