import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutenticacaoModule } from '../autenticacao/autenticacao.module';
import { TokenAcessoGuard } from '../autenticacao/autenticacao.guard';
import { AutorizacaoModule } from '../autorizacao/autorizacao.module';
import { Secretaria } from '../secretarias/secretarias.entities';
import { UsuarioAcesso } from '../usuario-acessos/usuario-acessos.entities';
import { EscolasController } from './escolas.controller';
import { Escola } from './escolas.entities';
import { EscolasService } from './escolas.service';

@Module({
  imports: [
    AutenticacaoModule,
    AutorizacaoModule,
    TypeOrmModule.forFeature([Escola, Secretaria, UsuarioAcesso]),
  ],
  controllers: [EscolasController],
  providers: [EscolasService, TokenAcessoGuard],
})
export class EscolasModule {}
