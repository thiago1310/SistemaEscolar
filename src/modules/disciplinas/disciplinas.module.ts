import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutenticacaoModule } from '../autenticacao/autenticacao.module';
import { TokenAcessoGuard } from '../autenticacao/autenticacao.guard';
import { AutorizacaoModule } from '../autorizacao/autorizacao.module';
import { Secretaria } from '../secretarias/secretarias.entities';
import { UsuarioAcesso } from '../usuario-acessos/usuario-acessos.entities';
import { DisciplinasController } from './disciplinas.controller';
import { Disciplina } from './disciplinas.entities';
import { DisciplinasService } from './disciplinas.service';

@Module({
  imports: [
    AutenticacaoModule,
    AutorizacaoModule,
    TypeOrmModule.forFeature([Disciplina, Secretaria, UsuarioAcesso]),
  ],
  controllers: [DisciplinasController],
  providers: [DisciplinasService, TokenAcessoGuard],
})
export class DisciplinasModule {}
