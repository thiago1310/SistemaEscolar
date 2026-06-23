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
import { AtualizarEscolaDto, CriarEscolaDto } from './escolas.dto';
import { EscolasService } from './escolas.service';

@Controller('escolas')
@UseGuards(TokenAcessoGuard, PermissaoGuard)
export class EscolasController {
  constructor(private readonly escolasService: EscolasService) {}

  @Post()
  @NivelMinimo(60)
  criar(@Body() dados: CriarEscolaDto) {
    return this.escolasService.criar(dados);
  }

  @Get()
  @NivelMinimo(10)
  listar() {
    return this.escolasService.listar();
  }

  @Get(':id')
  @NivelMinimo(10)
  buscarPorId(@Param('id') id: string) {
    return this.escolasService.buscarPorId(id);
  }

  @Patch(':id')
  @NivelMinimo(60)
  atualizar(@Param('id') id: string, @Body() dados: AtualizarEscolaDto) {
    return this.escolasService.atualizar(id, dados);
  }

  @Patch(':id/inativar')
  @NivelMinimo(60)
  inativar(@Param('id') id: string) {
    return this.escolasService.inativar(id);
  }

  @Delete(':id')
  @Perfis('ADMIN_GERAL')
  remover(@Param('id') id: string) {
    return this.escolasService.remover(id);
  }
}
