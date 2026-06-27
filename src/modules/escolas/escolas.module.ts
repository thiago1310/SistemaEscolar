import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutenticacaoModule } from '../autenticacao/autenticacao.module';
import { TokenAcessoGuard } from '../autenticacao/autenticacao.guard';
import { Usuario } from '../autenticacao/autenticacao.entities';
import { AutorizacaoModule } from '../autorizacao/autorizacao.module';
import { Perfil } from '../perfis-permissoes/perfis-permissoes.entities';
import { Secretaria } from '../secretarias/secretarias.entities';
import { UsuarioAcesso } from '../usuario-acessos/usuario-acessos.entities';
import { EscolasController } from './escolas.controller';
import { Escola } from './escolas.entities';
import { EscolasService } from './escolas.service';

@Module({
  imports: [
    AutenticacaoModule,
    AutorizacaoModule,
    TypeOrmModule.forFeature([Escola, Secretaria, Usuario, Perfil, UsuarioAcesso]),
  ],
  controllers: [EscolasController],
  providers: [EscolasService, TokenAcessoGuard],
})
export class EscolasModule {}
