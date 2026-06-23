import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutenticacaoModule } from '../autenticacao/autenticacao.module';
import { TokenAcessoGuard } from '../autenticacao/autenticacao.guard';
import { AutorizacaoModule } from '../autorizacao/autorizacao.module';
import { UsuarioAcesso } from '../usuario-acessos/usuario-acessos.entities';
import { Secretaria } from './secretarias.entities';
import { SecretariasController } from './secretarias.controller';
import { SecretariasService } from './secretarias.service';

@Module({
  imports: [
    AutenticacaoModule,
    AutorizacaoModule,
    TypeOrmModule.forFeature([Secretaria, UsuarioAcesso]),
  ],
  controllers: [SecretariasController],
  providers: [SecretariasService, TokenAcessoGuard],
})
export class SecretariasModule {}
