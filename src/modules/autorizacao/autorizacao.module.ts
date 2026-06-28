import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Escola } from '../escolas/escolas.entities';
import { UsuarioAcesso } from '../usuario-acessos/usuario-acessos.entities';
import { EscopoUsuarioService } from './escopo-usuario.service';
import { PermissaoGuard } from './permissao.guard';

@Module({
  imports: [TypeOrmModule.forFeature([UsuarioAcesso, Escola])],
  providers: [EscopoUsuarioService, PermissaoGuard],
  exports: [EscopoUsuarioService, PermissaoGuard],
})
export class AutorizacaoModule {}
