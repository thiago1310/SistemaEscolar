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
import { AlunosService } from './alunos.service';
import { AtualizarAlunoDto, CriarAlunoDto } from './alunos.dto';

@Controller('alunos')
@UseGuards(TokenAcessoGuard, PermissaoGuard)
export class AlunosController {
  constructor(private readonly alunosService: AlunosService) {}

  @Post()
  @NivelMinimo(80)
  criar(@Body() dados: CriarAlunoDto, @Req() req: RequisicaoAutenticada) {
    return this.alunosService.criar(dados, req.usuario.id);
  }

  @Get()
  @NivelMinimo(30)
  listar(@Req() req: RequisicaoAutenticada) {
    return this.alunosService.listar(req.usuario.id);
  }

  @Get(':id')
  @NivelMinimo(30)
  buscarPorId(@Param('id') id: string, @Req() req: RequisicaoAutenticada) {
    return this.alunosService.buscarPorId(id, req.usuario.id);
  }

  @Patch(':id')
  @NivelMinimo(80)
  atualizar(
    @Param('id') id: string,
    @Body() dados: AtualizarAlunoDto,
    @Req() req: RequisicaoAutenticada,
  ) {
    return this.alunosService.atualizar(id, dados, req.usuario.id);
  }

  @Patch(':id/inativar')
  @NivelMinimo(80)
  inativar(@Param('id') id: string, @Req() req: RequisicaoAutenticada) {
    return this.alunosService.inativar(id, req.usuario.id);
  }

  @Delete(':id')
  @Perfis('ADMIN_GERAL')
  remover(@Param('id') id: string, @Req() req: RequisicaoAutenticada) {
    return this.alunosService.remover(id, req.usuario.id);
  }
}
