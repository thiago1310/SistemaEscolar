import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutenticacaoModule } from '../autenticacao/autenticacao.module';
import { Usuario } from '../autenticacao/autenticacao.entities';
import { TokenAcessoGuard } from '../autenticacao/autenticacao.guard';
import { AutorizacaoModule } from '../autorizacao/autorizacao.module';
import { EmailModule } from '../email/email.module';
import { UsuarioAcesso } from '../usuario-acessos/usuario-acessos.entities';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';

@Module({
  imports: [
    AutenticacaoModule,
    AutorizacaoModule,
    EmailModule,
    TypeOrmModule.forFeature([Usuario, UsuarioAcesso]),
  ],
  controllers: [UsuariosController],
  providers: [UsuariosService, TokenAcessoGuard],
  exports: [UsuariosService],
})
export class UsuariosModule {}
