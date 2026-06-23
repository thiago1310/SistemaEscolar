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
import { AtualizarEscolaDto, CriarEscolaDto } from './escolas.dto';
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
