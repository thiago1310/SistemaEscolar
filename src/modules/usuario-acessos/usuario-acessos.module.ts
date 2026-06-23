import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnoLetivo } from '../anos-letivos/anos-letivos.entities';
import { AutenticacaoModule } from '../autenticacao/autenticacao.module';
import { TokenAcessoGuard } from '../autenticacao/autenticacao.guard';
import { Usuario } from '../autenticacao/autenticacao.entities';
import { Escola } from '../escolas/escolas.entities';
import { Perfil } from '../perfis-permissoes/perfis-permissoes.entities';
import { Secretaria } from '../secretarias/secretarias.entities';
import { UsuarioAcessosController } from './usuario-acessos.controller';
import { UsuarioAcesso } from './usuario-acessos.entities';
import { UsuarioAcessosService } from './usuario-acessos.service';

@Module({
  imports: [
    AutenticacaoModule,
    TypeOrmModule.forFeature([
      UsuarioAcesso,
      Usuario,
      Perfil,
      Secretaria,
      Escola,
      AnoLetivo,
    ]),
  ],
  controllers: [UsuarioAcessosController],
  providers: [UsuarioAcessosService, TokenAcessoGuard],
})
export class UsuarioAcessosModule {}
