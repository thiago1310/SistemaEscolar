import {
  Body,
  Controller,
  Get,
  Headers,
  Ip,
  Post,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  AlterarSenhaDto,
  EntrarDto,
  RenovarTokenDto,
  SairDto,
} from './autenticacao.dto';
import { RequisicaoAutenticada, TokenAcessoGuard } from './autenticacao.guard';
import { AutenticacaoService } from './autenticacao.service';

@Controller('autenticacao')
export class AutenticacaoController {
  constructor(private readonly autenticacaoService: AutenticacaoService) {}

  @Post('entrar')
  entrar(
    @Body() dados: EntrarDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.autenticacaoService.entrar(dados, ip, userAgent ?? null);
  }

  @Post('renovar-token')
  renovarToken(
    @Body() dados: RenovarTokenDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.autenticacaoService.renovarToken(
      dados,
      ip,
      userAgent ?? null,
    );
  }

  @Post('sair')
  sair(@Body() dados: SairDto) {
    return this.autenticacaoService.sair(dados);
  }

  @Get('perfil')
  @UseGuards(TokenAcessoGuard)
  perfil(@Req() requisicao: RequisicaoAutenticada) {
    return this.autenticacaoService.obterPerfil(requisicao.usuario.id);
  }

  @Patch('senha')
  @UseGuards(TokenAcessoGuard)
  alterarSenha(
    @Req() requisicao: RequisicaoAutenticada,
    @Body() dados: AlterarSenhaDto,
  ) {
    return this.autenticacaoService.alterarSenha(requisicao.usuario.id, dados);
  }
}
