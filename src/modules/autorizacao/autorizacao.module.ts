import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PerfilPermissao, Permissao } from '../perfis-permissoes/perfis-permissoes.entities';
import { UsuarioAcesso } from '../usuario-acessos/usuario-acessos.entities';
import { PermissaoGuard } from './permissao.guard';

@Module({
  imports: [TypeOrmModule.forFeature([UsuarioAcesso, PerfilPermissao, Permissao])],
  providers: [PermissaoGuard],
  exports: [PermissaoGuard],
})
export class AutorizacaoModule {}
