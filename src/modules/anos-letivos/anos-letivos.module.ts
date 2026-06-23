import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutenticacaoModule } from '../autenticacao/autenticacao.module';
import { TokenAcessoGuard } from '../autenticacao/autenticacao.guard';
import { AutorizacaoModule } from '../autorizacao/autorizacao.module';
import { Secretaria } from '../secretarias/secretarias.entities';
import { UsuarioAcesso } from '../usuario-acessos/usuario-acessos.entities';
import { AnosLetivosController } from './anos-letivos.controller';
import { AnoLetivo } from './anos-letivos.entities';
import { AnosLetivosService } from './anos-letivos.service';

@Module({
  imports: [
    AutenticacaoModule,
    AutorizacaoModule,
    TypeOrmModule.forFeature([AnoLetivo, Secretaria, UsuarioAcesso]),
  ],
  controllers: [AnosLetivosController],
  providers: [AnosLetivosService, TokenAcessoGuard],
})
export class AnosLetivosModule {}
