import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuarioAcesso } from '../usuario-acessos/usuario-acessos.entities';
import { EscopoUsuarioService } from './escopo-usuario.service';
import { PermissaoGuard } from './permissao.guard';

@Module({
  imports: [TypeOrmModule.forFeature([UsuarioAcesso])],
  providers: [EscopoUsuarioService, PermissaoGuard],
  exports: [EscopoUsuarioService, PermissaoGuard],
})
export class AutorizacaoModule {}
