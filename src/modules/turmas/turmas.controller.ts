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
  AtualizarTurmaDto,
  AtualizarVinculoDocenteTurmaDto,
  CriarTurmaDto,
  CriarVinculoDocenteTurmaDto,
} from './turmas.dto';
import { TurmasService } from './turmas.service';

@Controller('turmas')
@UseGuards(TokenAcessoGuard, PermissaoGuard)
export class TurmasController {
  constructor(private readonly turmasService: TurmasService) {}

  @Post()
  @NivelMinimo(60)
  criar(@Body() dados: CriarTurmaDto, @Req() req: RequisicaoAutenticada) {
    return this.turmasService.criar(dados, req.usuario.id);
  }

  @Get()
  @NivelMinimo(10)
  listar(@Req() req: RequisicaoAutenticada) {
    return this.turmasService.listar(req.usuario.id);
  }

  @Get(':id')
  @NivelMinimo(10)
  buscarPorId(@Param('id') id: string, @Req() req: RequisicaoAutenticada) {
    return this.turmasService.buscarPorId(id, req.usuario.id);
  }

  @Get(':turmaId/vinculos-docentes')
  @NivelMinimo(10)
  listarVinculosDocentes(
    @Param('turmaId') turmaId: string,
    @Req() req: RequisicaoAutenticada,
  ) {
    return this.turmasService.listarVinculosDocentes(turmaId, req.usuario.id);
  }

  @Post(':turmaId/vinculos-docentes')
  @Perfis(
    'ADMIN_GERAL',
    'SECRETARIA_MUNICIPAL',
    'GESTOR_ESCOLAR',
    'SECRETARIO_ESCOLAR',
  )
  criarVinculoDocente(
    @Param('turmaId') turmaId: string,
    @Body() dados: CriarVinculoDocenteTurmaDto,
    @Req() req: RequisicaoAutenticada,
  ) {
    return this.turmasService.criarVinculoDocente(
      turmaId,
      dados,
      req.usuario.id,
    );
  }

  @Patch(':turmaId/vinculos-docentes/:vinculoId')
  @Perfis(
    'ADMIN_GERAL',
    'SECRETARIA_MUNICIPAL',
    'GESTOR_ESCOLAR',
    'SECRETARIO_ESCOLAR',
  )
  atualizarVinculoDocente(
    @Param('turmaId') turmaId: string,
    @Param('vinculoId') vinculoId: string,
    @Body() dados: AtualizarVinculoDocenteTurmaDto,
    @Req() req: RequisicaoAutenticada,
  ) {
    return this.turmasService.atualizarVinculoDocente(
      turmaId,
      vinculoId,
      dados,
      req.usuario.id,
    );
  }

  @Delete(':turmaId/vinculos-docentes/:vinculoId')
  @Perfis(
    'ADMIN_GERAL',
    'SECRETARIA_MUNICIPAL',
    'GESTOR_ESCOLAR',
    'SECRETARIO_ESCOLAR',
  )
  removerVinculoDocente(
    @Param('turmaId') turmaId: string,
    @Param('vinculoId') vinculoId: string,
    @Req() req: RequisicaoAutenticada,
  ) {
    return this.turmasService.removerVinculoDocente(
      turmaId,
      vinculoId,
      req.usuario.id,
    );
  }

  @Patch(':id')
  @NivelMinimo(60)
  atualizar(
    @Param('id') id: string,
    @Body() dados: AtualizarTurmaDto,
    @Req() req: RequisicaoAutenticada,
  ) {
    return this.turmasService.atualizar(id, dados, req.usuario.id);
  }

  @Patch(':id/inativar')
  @NivelMinimo(60)
  inativar(@Param('id') id: string, @Req() req: RequisicaoAutenticada) {
    return this.turmasService.inativar(id, req.usuario.id);
  }

  @Delete(':id')
  @Perfis('ADMIN_GERAL')
  remover(@Param('id') id: string, @Req() req: RequisicaoAutenticada) {
    return this.turmasService.remover(id, req.usuario.id);
  }
}
