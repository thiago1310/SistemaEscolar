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
  AtualizarDisciplinaDto,
  CriarDisciplinaDto,
} from './disciplinas.dto';
import { DisciplinasService } from './disciplinas.service';

@Controller('disciplinas')
@UseGuards(TokenAcessoGuard)
export class DisciplinasController {
  constructor(private readonly disciplinasService: DisciplinasService) {}

  @Post()
  criar(@Body() dados: CriarDisciplinaDto) {
    return this.disciplinasService.criar(dados);
  }

  @Get()
  listar() {
    return this.disciplinasService.listar();
  }

  @Get(':id')
  buscarPorId(@Param('id') id: string) {
    return this.disciplinasService.buscarPorId(id);
  }

  @Patch(':id')
  atualizar(@Param('id') id: string, @Body() dados: AtualizarDisciplinaDto) {
    return this.disciplinasService.atualizar(id, dados);
  }

  @Patch(':id/inativar')
  inativar(@Param('id') id: string) {
    return this.disciplinasService.inativar(id);
  }

  @Delete(':id')
  remover(@Param('id') id: string) {
    return this.disciplinasService.remover(id);
  }
}
