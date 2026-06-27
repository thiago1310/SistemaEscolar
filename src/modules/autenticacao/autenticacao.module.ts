import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Secretaria } from '../secretarias/secretarias.entities';
import { UsuarioAcesso } from '../usuario-acessos/usuario-acessos.entities';
import { AutenticacaoController } from './autenticacao.controller';
import { SessaoUsuario, Usuario } from './autenticacao.entities';
import { TokenAcessoGuard } from './autenticacao.guard';
import { AutenticacaoService } from './autenticacao.service';

@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([Usuario, SessaoUsuario, UsuarioAcesso, Secretaria]),
  ],
  controllers: [AutenticacaoController],
  providers: [AutenticacaoService, TokenAcessoGuard],
  exports: [AutenticacaoService],
})
export class AutenticacaoModule {}
