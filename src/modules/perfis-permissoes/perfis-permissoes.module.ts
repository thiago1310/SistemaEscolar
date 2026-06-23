import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutenticacaoModule } from '../autenticacao/autenticacao.module';
import { TokenAcessoGuard } from '../autenticacao/autenticacao.guard';
import { AutorizacaoModule } from '../autorizacao/autorizacao.module';
import { UsuarioAcesso } from '../usuario-acessos/usuario-acessos.entities';
import { Perfil, PerfilPermissao, Permissao } from './perfis-permissoes.entities';
import { PerfisPermissoesController } from './perfis-permissoes.controller';
import { PerfisPermissoesService } from './perfis-permissoes.service';

@Module({
  imports: [
    AutenticacaoModule,
    AutorizacaoModule,
    TypeOrmModule.forFeature([Perfil, Permissao, PerfilPermissao, UsuarioAcesso]),
  ],
  controllers: [PerfisPermissoesController],
  providers: [PerfisPermissoesService, TokenAcessoGuard],
  exports: [PerfisPermissoesService],
})
export class PerfisPermissoesModule {}
