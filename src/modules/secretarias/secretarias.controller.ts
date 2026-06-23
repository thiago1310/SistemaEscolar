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
  criar(@Body() dados: CriarSecretariaDto, @Req() req: RequisicaoAutenticada) {
    return this.secretariasService.criar(dados, req.usuario.id);
  }

  @Get()
  @NivelMinimo(10)
  listar(@Req() req: RequisicaoAutenticada) {
    return this.secretariasService.listar(req.usuario.id);
  }

  @Get(':id')
  @NivelMinimo(10)
  buscarPorId(@Param('id') id: string, @Req() req: RequisicaoAutenticada) {
    return this.secretariasService.buscarPorId(id, req.usuario.id);
  }

  @Patch(':id')
  @NivelMinimo(80)
  atualizar(
    @Param('id') id: string,
    @Body() dados: AtualizarSecretariaDto,
    @Req() req: RequisicaoAutenticada,
  ) {
    return this.secretariasService.atualizar(id, dados, req.usuario.id);
  }

  @Patch(':id/inativar')
  @NivelMinimo(80)
  inativar(@Param('id') id: string, @Req() req: RequisicaoAutenticada) {
    return this.secretariasService.inativar(id, req.usuario.id);
  }

  @Delete(':id')
  @Perfis('ADMIN_GERAL')
  remover(@Param('id') id: string, @Req() req: RequisicaoAutenticada) {
    return this.secretariasService.remover(id, req.usuario.id);
  }
}
