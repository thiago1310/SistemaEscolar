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
  AtualizarAnoLetivoDto,
  CriarAnoLetivoDto,
} from './anos-letivos.dto';
import { AnosLetivosService } from './anos-letivos.service';

@Controller('anos-letivos')
@UseGuards(TokenAcessoGuard)
export class AnosLetivosController {
  constructor(private readonly anosLetivosService: AnosLetivosService) {}

  @Post()
  criar(@Body() dados: CriarAnoLetivoDto) {
    return this.anosLetivosService.criar(dados);
  }

  @Get()
  listar() {
    return this.anosLetivosService.listar();
  }

  @Get(':id')
  buscarPorId(@Param('id') id: string) {
    return this.anosLetivosService.buscarPorId(id);
  }

  @Patch(':id')
  atualizar(@Param('id') id: string, @Body() dados: AtualizarAnoLetivoDto) {
    return this.anosLetivosService.atualizar(id, dados);
  }

  @Patch(':id/ativar')
  ativar(@Param('id') id: string) {
    return this.anosLetivosService.ativar(id);
  }

  @Patch(':id/inativar')
  inativar(@Param('id') id: string) {
    return this.anosLetivosService.inativar(id);
  }

  @Delete(':id')
  remover(@Param('id') id: string) {
    return this.anosLetivosService.remover(id);
  }
}
