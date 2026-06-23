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
  criar(@Body() dados: CriarDisciplinaDto) {
    return this.disciplinasService.criar(dados);
  }

  @Get()
  @NivelMinimo(30)
  listar() {
    return this.disciplinasService.listar();
  }

  @Get(':id')
  @NivelMinimo(30)
  buscarPorId(@Param('id') id: string) {
    return this.disciplinasService.buscarPorId(id);
  }

  @Patch(':id')
  @NivelMinimo(80)
  atualizar(@Param('id') id: string, @Body() dados: AtualizarDisciplinaDto) {
    return this.disciplinasService.atualizar(id, dados);
  }

  @Patch(':id/inativar')
  @NivelMinimo(80)
  inativar(@Param('id') id: string) {
    return this.disciplinasService.inativar(id);
  }

  @Delete(':id')
  @Perfis('ADMIN_GERAL')
  remover(@Param('id') id: string) {
    return this.disciplinasService.remover(id);
  }
}
