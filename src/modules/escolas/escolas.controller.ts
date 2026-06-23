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
import { AtualizarEscolaDto, CriarEscolaDto } from './escolas.dto';
import { EscolasService } from './escolas.service';

@Controller('escolas')
@UseGuards(TokenAcessoGuard)
export class EscolasController {
  constructor(private readonly escolasService: EscolasService) {}

  @Post()
  criar(@Body() dados: CriarEscolaDto) {
    return this.escolasService.criar(dados);
  }

  @Get()
  listar() {
    return this.escolasService.listar();
  }

  @Get(':id')
  buscarPorId(@Param('id') id: string) {
    return this.escolasService.buscarPorId(id);
  }

  @Patch(':id')
  atualizar(@Param('id') id: string, @Body() dados: AtualizarEscolaDto) {
    return this.escolasService.atualizar(id, dados);
  }

  @Patch(':id/inativar')
  inativar(@Param('id') id: string) {
    return this.escolasService.inativar(id);
  }

  @Delete(':id')
  remover(@Param('id') id: string) {
    return this.escolasService.remover(id);
  }
}
