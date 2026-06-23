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
  AtualizarUsuarioAcessoDto,
  CriarUsuarioAcessoDto,
} from './usuario-acessos.dto';
import { UsuarioAcessosService } from './usuario-acessos.service';

@Controller('usuario-acessos')
@UseGuards(TokenAcessoGuard)
export class UsuarioAcessosController {
  constructor(private readonly usuarioAcessosService: UsuarioAcessosService) {}

  @Post()
  criar(@Body() dados: CriarUsuarioAcessoDto) {
    return this.usuarioAcessosService.criar(dados);
  }

  @Get()
  listar() {
    return this.usuarioAcessosService.listar();
  }

  @Get(':id')
  buscarPorId(@Param('id') id: string) {
    return this.usuarioAcessosService.buscarPorId(id);
  }

  @Patch(':id')
  atualizar(
    @Param('id') id: string,
    @Body() dados: AtualizarUsuarioAcessoDto,
  ) {
    return this.usuarioAcessosService.atualizar(id, dados);
  }

  @Patch(':id/inativar')
  inativar(@Param('id') id: string) {
    return this.usuarioAcessosService.inativar(id);
  }

  @Delete(':id')
  remover(@Param('id') id: string) {
    return this.usuarioAcessosService.remover(id);
  }
}
