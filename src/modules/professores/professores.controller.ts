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
import { AtualizarProfessorDto, CriarProfessorDto } from './professores.dto';
import { ProfessoresService } from './professores.service';

@Controller('professores')
@UseGuards(TokenAcessoGuard, PermissaoGuard)
export class ProfessoresController {
  constructor(private readonly professoresService: ProfessoresService) {}

  @Post()
  @NivelMinimo(80)
  criar(@Body() dados: CriarProfessorDto, @Req() req: RequisicaoAutenticada) {
    return this.professoresService.criar(dados, req.usuario.id);
  }

  @Get()
  @NivelMinimo(80)
  listar(@Req() req: RequisicaoAutenticada) {
    return this.professoresService.listar(req.usuario.id);
  }

  @Get(':id')
  @NivelMinimo(80)
  buscarPorId(@Param('id') id: string, @Req() req: RequisicaoAutenticada) {
    return this.professoresService.buscarPorId(id, req.usuario.id);
  }

  @Patch(':id')
  @NivelMinimo(80)
  atualizar(
    @Param('id') id: string,
    @Body() dados: AtualizarProfessorDto,
    @Req() req: RequisicaoAutenticada,
  ) {
    return this.professoresService.atualizar(id, dados, req.usuario.id);
  }

  @Patch(':id/inativar')
  @NivelMinimo(80)
  inativar(@Param('id') id: string, @Req() req: RequisicaoAutenticada) {
    return this.professoresService.inativar(id, req.usuario.id);
  }

  @Delete(':id')
  @Perfis('ADMIN_GERAL')
  remover(@Param('id') id: string, @Req() req: RequisicaoAutenticada) {
    return this.professoresService.remover(id, req.usuario.id);
  }
}
