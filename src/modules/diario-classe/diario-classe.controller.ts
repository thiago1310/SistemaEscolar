import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  RequisicaoAutenticada,
  TokenAcessoGuard,
} from '../autenticacao/autenticacao.guard';
import { NivelMinimo } from '../autorizacao/permissao.decorator';
import { PermissaoGuard } from '../autorizacao/permissao.guard';
import {
  AtualizarAulaDto,
  AtualizarAvaliacaoDto,
  AtualizarObservacaoDto,
  CriarAulaDto,
  CriarAvaliacaoDto,
  CriarObservacaoDto,
  ListarAulasDto,
  ListarAvaliacoesDto,
  ListarDiarioTurmasDto,
  ListarFrequenciasDto,
  ListarNotasDto,
  ListarObservacoesDto,
  SalvarFrequenciasDto,
  SalvarNotasDto,
} from './diario-classe.dto';
import { DiarioClasseService } from './diario-classe.service';

@Controller('diario-classe')
@UseGuards(TokenAcessoGuard, PermissaoGuard)
export class DiarioClasseController {
  constructor(private readonly diarioClasseService: DiarioClasseService) {}

  @Get('turmas')
  @NivelMinimo(10)
  listarTurmas(
    @Query() filtros: ListarDiarioTurmasDto,
    @Req() req: RequisicaoAutenticada,
  ) {
    return this.diarioClasseService.listarTurmas(req.usuario.id, filtros);
  }

  @Get('turmas/:turmaId/resumo')
  @NivelMinimo(10)
  obterResumoTurma(
    @Param('turmaId') turmaId: string,
    @Req() req: RequisicaoAutenticada,
  ) {
    return this.diarioClasseService.obterResumoTurma(turmaId, req.usuario.id);
  }

  @Get('turmas/:turmaId/frequencias')
  @NivelMinimo(10)
  listarFrequencias(
    @Param('turmaId') turmaId: string,
    @Query() filtros: ListarFrequenciasDto,
    @Req() req: RequisicaoAutenticada,
  ) {
    return this.diarioClasseService.listarFrequencias(
      turmaId,
      filtros,
      req.usuario.id,
    );
  }

  @Put('turmas/:turmaId/frequencias')
  @NivelMinimo(10)
  salvarFrequencias(
    @Param('turmaId') turmaId: string,
    @Body() dados: SalvarFrequenciasDto,
    @Req() req: RequisicaoAutenticada,
  ) {
    return this.diarioClasseService.salvarFrequencias(
      turmaId,
      dados,
      req.usuario.id,
    );
  }

  @Get('turmas/:turmaId/aulas')
  @NivelMinimo(10)
  listarAulas(
    @Param('turmaId') turmaId: string,
    @Query() filtros: ListarAulasDto,
    @Req() req: RequisicaoAutenticada,
  ) {
    return this.diarioClasseService.listarAulas(
      turmaId,
      req.usuario.id,
      filtros,
    );
  }

  @Post('turmas/:turmaId/aulas')
  @NivelMinimo(10)
  criarAula(
    @Param('turmaId') turmaId: string,
    @Body() dados: CriarAulaDto,
    @Req() req: RequisicaoAutenticada,
  ) {
    return this.diarioClasseService.criarAula(turmaId, dados, req.usuario.id);
  }

  @Patch('aulas/:id')
  @NivelMinimo(10)
  atualizarAula(
    @Param('id') id: string,
    @Body() dados: AtualizarAulaDto,
    @Req() req: RequisicaoAutenticada,
  ) {
    return this.diarioClasseService.atualizarAula(id, dados, req.usuario.id);
  }

  @Patch('aulas/:id/inativar')
  @NivelMinimo(10)
  inativarAula(@Param('id') id: string, @Req() req: RequisicaoAutenticada) {
    return this.diarioClasseService.inativarAula(id, req.usuario.id);
  }

  @Get('turmas/:turmaId/avaliacoes')
  @NivelMinimo(10)
  listarAvaliacoes(
    @Param('turmaId') turmaId: string,
    @Query() filtros: ListarAvaliacoesDto,
    @Req() req: RequisicaoAutenticada,
  ) {
    return this.diarioClasseService.listarAvaliacoes(
      turmaId,
      req.usuario.id,
      filtros,
    );
  }

  @Post('turmas/:turmaId/avaliacoes')
  @NivelMinimo(10)
  criarAvaliacao(
    @Param('turmaId') turmaId: string,
    @Body() dados: CriarAvaliacaoDto,
    @Req() req: RequisicaoAutenticada,
  ) {
    return this.diarioClasseService.criarAvaliacao(
      turmaId,
      dados,
      req.usuario.id,
    );
  }

  @Patch('avaliacoes/:id')
  @NivelMinimo(10)
  atualizarAvaliacao(
    @Param('id') id: string,
    @Body() dados: AtualizarAvaliacaoDto,
    @Req() req: RequisicaoAutenticada,
  ) {
    return this.diarioClasseService.atualizarAvaliacao(
      id,
      dados,
      req.usuario.id,
    );
  }

  @Patch('avaliacoes/:id/inativar')
  @NivelMinimo(10)
  inativarAvaliacao(@Param('id') id: string, @Req() req: RequisicaoAutenticada) {
    return this.diarioClasseService.inativarAvaliacao(id, req.usuario.id);
  }

  @Get('turmas/:turmaId/notas')
  @NivelMinimo(10)
  listarNotas(
    @Param('turmaId') turmaId: string,
    @Query() filtros: ListarNotasDto,
    @Req() req: RequisicaoAutenticada,
  ) {
    return this.diarioClasseService.listarNotas(
      turmaId,
      req.usuario.id,
      filtros,
    );
  }

  @Put('avaliacoes/:avaliacaoId/notas')
  @NivelMinimo(10)
  salvarNotas(
    @Param('avaliacaoId') avaliacaoId: string,
    @Body() dados: SalvarNotasDto,
    @Req() req: RequisicaoAutenticada,
  ) {
    return this.diarioClasseService.salvarNotas(
      avaliacaoId,
      dados,
      req.usuario.id,
    );
  }

  @Get('turmas/:turmaId/observacoes')
  @NivelMinimo(10)
  listarObservacoes(
    @Param('turmaId') turmaId: string,
    @Query() filtros: ListarObservacoesDto,
    @Req() req: RequisicaoAutenticada,
  ) {
    return this.diarioClasseService.listarObservacoes(
      turmaId,
      req.usuario.id,
      filtros,
    );
  }

  @Post('turmas/:turmaId/observacoes')
  @NivelMinimo(10)
  criarObservacao(
    @Param('turmaId') turmaId: string,
    @Body() dados: CriarObservacaoDto,
    @Req() req: RequisicaoAutenticada,
  ) {
    return this.diarioClasseService.criarObservacao(
      turmaId,
      dados,
      req.usuario.id,
    );
  }

  @Patch('observacoes/:id')
  @NivelMinimo(10)
  atualizarObservacao(
    @Param('id') id: string,
    @Body() dados: AtualizarObservacaoDto,
    @Req() req: RequisicaoAutenticada,
  ) {
    return this.diarioClasseService.atualizarObservacao(
      id,
      dados,
      req.usuario.id,
    );
  }

  @Patch('observacoes/:id/inativar')
  @NivelMinimo(10)
  inativarObservacao(@Param('id') id: string, @Req() req: RequisicaoAutenticada) {
    return this.diarioClasseService.inativarObservacao(id, req.usuario.id);
  }
}
