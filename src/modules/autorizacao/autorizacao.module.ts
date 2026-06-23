import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuarioAcesso } from '../usuario-acessos/usuario-acessos.entities';
import { PermissaoGuard } from './permissao.guard';

@Module({
  imports: [TypeOrmModule.forFeature([UsuarioAcesso])],
  providers: [PermissaoGuard],
  exports: [PermissaoGuard],
})
export class AutorizacaoModule {}
