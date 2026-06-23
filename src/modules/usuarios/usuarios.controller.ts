import {
  Body,
  Controller,
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
  AtualizarUsuarioDto,
  CriarUsuarioDto,
  RedefinirSenhaUsuarioDto,
} from './usuarios.dto';
import { UsuariosService } from './usuarios.service';

@Controller('usuarios')
@UseGuards(TokenAcessoGuard, PermissaoGuard)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  @NivelMinimo(80)
  criar(@Body() dados: CriarUsuarioDto) {
    return this.usuariosService.criar(dados);
  }

  @Get()
  @NivelMinimo(80)
  listar(@Req() req: RequisicaoAutenticada) {
    return this.usuariosService.listar(req.usuario.id);
  }

  @Get(':id')
  @NivelMinimo(80)
  buscarPorId(@Param('id') id: string, @Req() req: RequisicaoAutenticada) {
    return this.usuariosService.buscarPorId(id, req.usuario.id);
  }

  @Patch(':id')
  @NivelMinimo(80)
  atualizar(
    @Param('id') id: string,
    @Body() dados: AtualizarUsuarioDto,
    @Req() req: RequisicaoAutenticada,
  ) {
    return this.usuariosService.atualizar(id, dados, req.usuario.id);
  }

  @Patch(':id/inativar')
  @NivelMinimo(80)
  inativar(@Param('id') id: string, @Req() req: RequisicaoAutenticada) {
    return this.usuariosService.inativar(id, req.usuario.id);
  }

  @Patch(':id/senha')
  @NivelMinimo(80)
  redefinirSenha(
    @Param('id') id: string,
    @Body() dados: RedefinirSenhaUsuarioDto,
    @Req() req: RequisicaoAutenticada,
  ) {
    return this.usuariosService.redefinirSenha(id, dados, req.usuario.id);
  }
}
