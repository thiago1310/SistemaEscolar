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
  AtualizarSecretariaDto,
  CriarSecretariaDto,
} from './secretarias.dto';
import { SecretariasService } from './secretarias.service';

@Controller('secretarias')
@UseGuards(TokenAcessoGuard)
export class SecretariasController {
  constructor(private readonly secretariasService: SecretariasService) {}

  @Post()
  criar(@Body() dados: CriarSecretariaDto) {
    return this.secretariasService.criar(dados);
  }

  @Get()
  listar() {
    return this.secretariasService.listar();
  }

  @Get(':id')
  buscarPorId(@Param('id') id: string) {
    return this.secretariasService.buscarPorId(id);
  }

  @Patch(':id')
  atualizar(
    @Param('id') id: string,
    @Body() dados: AtualizarSecretariaDto,
  ) {
    return this.secretariasService.atualizar(id, dados);
  }

  @Patch(':id/inativar')
  inativar(@Param('id') id: string) {
    return this.secretariasService.inativar(id);
  }

  @Delete(':id')
  remover(@Param('id') id: string) {
    return this.secretariasService.remover(id);
  }
}
