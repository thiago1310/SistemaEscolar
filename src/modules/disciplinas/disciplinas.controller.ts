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
  AtualizarDisciplinaDto,
  CriarDisciplinaDto,
} from './disciplinas.dto';
import { DisciplinasService } from './disciplinas.service';

@Controller('disciplinas')
@UseGuards(TokenAcessoGuard, PermissaoGuard)
export class DisciplinasController {
  constructor(private readonly disciplinasService: DisciplinasService) {}

  @Post()
  @NivelMinimo(80)
  criar(@Body() dados: CriarDisciplinaDto, @Req() req: RequisicaoAutenticada) {
    return this.disciplinasService.criar(dados, req.usuario.id);
  }

  @Get()
  @NivelMinimo(30)
  listar(@Req() req: RequisicaoAutenticada) {
    return this.disciplinasService.listar(req.usuario.id);
  }

  @Get(':id')
  @NivelMinimo(30)
  buscarPorId(@Param('id') id: string, @Req() req: RequisicaoAutenticada) {
    return this.disciplinasService.buscarPorId(id, req.usuario.id);
  }

  @Patch(':id')
  @NivelMinimo(80)
  atualizar(
    @Param('id') id: string,
    @Body() dados: AtualizarDisciplinaDto,
    @Req() req: RequisicaoAutenticada,
  ) {
    return this.disciplinasService.atualizar(id, dados, req.usuario.id);
  }

  @Patch(':id/inativar')
  @NivelMinimo(80)
  inativar(@Param('id') id: string, @Req() req: RequisicaoAutenticada) {
    return this.disciplinasService.inativar(id, req.usuario.id);
  }

  @Delete(':id')
  @Perfis('ADMIN_GERAL')
  remover(@Param('id') id: string, @Req() req: RequisicaoAutenticada) {
    return this.disciplinasService.remover(id, req.usuario.id);
  }
}
