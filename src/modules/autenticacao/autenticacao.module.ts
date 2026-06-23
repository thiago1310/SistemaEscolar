import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutenticacaoController } from './autenticacao.controller';
import { SessaoUsuario, Usuario } from './autenticacao.entities';
import { TokenAcessoGuard } from './autenticacao.guard';
import { AutenticacaoService } from './autenticacao.service';

@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([Usuario, SessaoUsuario]),
  ],
  controllers: [AutenticacaoController],
  providers: [AutenticacaoService, TokenAcessoGuard],
  exports: [AutenticacaoService],
})
export class AutenticacaoModule {}
