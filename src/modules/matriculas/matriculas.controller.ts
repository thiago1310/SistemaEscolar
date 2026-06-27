import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
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
  AtualizarMatriculaDto,
  CriarMatriculaDto,
  ListarMatriculasDto,
} from './matriculas.dto';
import { MatriculasService } from './matriculas.service';

@Controller('matriculas')
@UseGuards(TokenAcessoGuard, PermissaoGuard)
export class MatriculasController {
  constructor(private readonly matriculasService: MatriculasService) {}

  @Post()
  @NivelMinimo(50)
  criar(
    @Body() dados: CriarMatriculaDto,
    @Query() filtros: ListarMatriculasDto,
    @Req() req: RequisicaoAutenticada,
  ) {
    return this.matriculasService.criar(dados, req.usuario.id, filtros);
  }

  @Get()
  @NivelMinimo(30)
  listar(
    @Query() filtros: ListarMatriculasDto,
    @Req() req: RequisicaoAutenticada,
  ) {
    return this.matriculasService.listar(req.usuario.id, filtros);
  }

  @Get(':id')
  @NivelMinimo(30)
  buscarPorId(
    @Param('id') id: string,
    @Query() filtros: ListarMatriculasDto,
    @Req() req: RequisicaoAutenticada,
  ) {
    return this.matriculasService.buscarPorId(id, req.usuario.id, filtros);
  }

  @Patch(':id')
  @NivelMinimo(50)
  atualizar(
    @Param('id') id: string,
    @Body() dados: AtualizarMatriculaDto,
    @Query() filtros: ListarMatriculasDto,
    @Req() req: RequisicaoAutenticada,
  ) {
    return this.matriculasService.atualizar(id, dados, req.usuario.id, filtros);
  }

  @Patch(':id/inativar')
  @NivelMinimo(50)
  inativar(
    @Param('id') id: string,
    @Query() filtros: ListarMatriculasDto,
    @Req() req: RequisicaoAutenticada,
  ) {
    return this.matriculasService.inativar(id, req.usuario.id, filtros);
  }

  @Delete(':id')
  @Perfis('ADMIN_GERAL')
  remover(@Param('id') id: string, @Req() req: RequisicaoAutenticada) {
    return this.matriculasService.remover(id, req.usuario.id);
  }
}
