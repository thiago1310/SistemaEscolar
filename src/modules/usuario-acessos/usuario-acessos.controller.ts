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
  criar(@Body() dados: CriarUsuarioAcessoDto) {
    return this.usuarioAcessosService.criar(dados);
  }

  @Get()
  @NivelMinimo(80)
  listar() {
    return this.usuarioAcessosService.listar();
  }

  @Get(':id')
  @NivelMinimo(80)
  buscarPorId(@Param('id') id: string) {
    return this.usuarioAcessosService.buscarPorId(id);
  }

  @Patch(':id')
  @NivelMinimo(80)
  atualizar(
    @Param('id') id: string,
    @Body() dados: AtualizarUsuarioAcessoDto,
  ) {
    return this.usuarioAcessosService.atualizar(id, dados);
  }

  @Patch(':id/inativar')
  @NivelMinimo(80)
  inativar(@Param('id') id: string) {
    return this.usuarioAcessosService.inativar(id);
  }

  @Delete(':id')
  @Perfis('ADMIN_GERAL')
  remover(@Param('id') id: string) {
    return this.usuarioAcessosService.remover(id);
  }
}
