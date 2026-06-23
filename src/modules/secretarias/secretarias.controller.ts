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
  AtualizarSecretariaDto,
  CriarSecretariaDto,
} from './secretarias.dto';
import { SecretariasService } from './secretarias.service';

@Controller('secretarias')
@UseGuards(TokenAcessoGuard, PermissaoGuard)
export class SecretariasController {
  constructor(private readonly secretariasService: SecretariasService) {}

  @Post()
  @NivelMinimo(80)
  criar(@Body() dados: CriarSecretariaDto) {
    return this.secretariasService.criar(dados);
  }

  @Get()
  @NivelMinimo(10)
  listar() {
    return this.secretariasService.listar();
  }

  @Get(':id')
  @NivelMinimo(10)
  buscarPorId(@Param('id') id: string) {
    return this.secretariasService.buscarPorId(id);
  }

  @Patch(':id')
  @NivelMinimo(80)
  atualizar(
    @Param('id') id: string,
    @Body() dados: AtualizarSecretariaDto,
  ) {
    return this.secretariasService.atualizar(id, dados);
  }

  @Patch(':id/inativar')
  @NivelMinimo(80)
  inativar(@Param('id') id: string) {
    return this.secretariasService.inativar(id);
  }

  @Delete(':id')
  @Perfis('ADMIN_GERAL')
  remover(@Param('id') id: string) {
    return this.secretariasService.remover(id);
  }
}
