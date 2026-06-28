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
import { NivelMinimo } from '../autorizacao/permissao.decorator';
import { PermissaoGuard } from '../autorizacao/permissao.guard';
import {
  AtualizarUsuarioAcessoDto,
  CriarUsuarioAcessoDto,
} from './usuario-acessos.dto';
import { UsuarioAcessosService } from './usuario-acessos.service';

@Controller('usuario-acessos')
@UseGuards(TokenAcessoGuard, PermissaoGuard)
export class UsuarioAcessosController {
  constructor(private readonly usuarioAcessosService: UsuarioAcessosService) {}

  @Post()
  @NivelMinimo(80)
  criar(
    @Body() dados: CriarUsuarioAcessoDto,
    @Req() req: RequisicaoAutenticada,
  ) {
    return this.usuarioAcessosService.criar(dados, req.usuario.id);
  }

  @Get()
  @NivelMinimo(10)
  listar(@Req() req: RequisicaoAutenticada) {
    return this.usuarioAcessosService.listar(req.usuario.id);
  }

  @Get(':id')
  @NivelMinimo(10)
  buscarPorId(@Param('id') id: string, @Req() req: RequisicaoAutenticada) {
    return this.usuarioAcessosService.buscarPorId(id, req.usuario.id);
  }

  @Patch(':id')
  @NivelMinimo(80)
  atualizar(
    @Param('id') id: string,
    @Body() dados: AtualizarUsuarioAcessoDto,
    @Req() req: RequisicaoAutenticada,
  ) {
    return this.usuarioAcessosService.atualizar(id, dados, req.usuario.id);
  }

  @Patch(':id/inativar')
  @NivelMinimo(80)
  inativar(@Param('id') id: string, @Req() req: RequisicaoAutenticada) {
    return this.usuarioAcessosService.inativar(id, req.usuario.id);
  }

  @Delete(':id')
  @NivelMinimo(80)
  remover(@Param('id') id: string, @Req() req: RequisicaoAutenticada) {
    return this.usuarioAcessosService.remover(id, req.usuario.id);
  }
}
