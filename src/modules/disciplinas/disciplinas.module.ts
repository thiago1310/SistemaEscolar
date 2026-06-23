import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutenticacaoModule } from '../autenticacao/autenticacao.module';
import { TokenAcessoGuard } from '../autenticacao/autenticacao.guard';
import { Secretaria } from '../secretarias/secretarias.entities';
import { DisciplinasController } from './disciplinas.controller';
import { Disciplina } from './disciplinas.entities';
import { DisciplinasService } from './disciplinas.service';

@Module({
  imports: [AutenticacaoModule, TypeOrmModule.forFeature([Disciplina, Secretaria])],
  controllers: [DisciplinasController],
  providers: [DisciplinasService, TokenAcessoGuard],
})
export class DisciplinasModule {}
