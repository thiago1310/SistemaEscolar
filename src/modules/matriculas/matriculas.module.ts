import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Aluno } from '../alunos/alunos.entities';
import { AutenticacaoModule } from '../autenticacao/autenticacao.module';
import { TokenAcessoGuard } from '../autenticacao/autenticacao.guard';
import { AutorizacaoModule } from '../autorizacao/autorizacao.module';
import { Escola } from '../escolas/escolas.entities';
import { Turma } from '../turmas/turmas.entities';
import { UsuarioAcesso } from '../usuario-acessos/usuario-acessos.entities';
import { MatriculasController } from './matriculas.controller';
import { Matricula } from './matriculas.entities';
import { MatriculasService } from './matriculas.service';

@Module({
  imports: [
    AutenticacaoModule,
    AutorizacaoModule,
    TypeOrmModule.forFeature([Matricula, Aluno, Escola, Turma, UsuarioAcesso]),
  ],
  controllers: [MatriculasController],
  providers: [MatriculasService, TokenAcessoGuard],
})
export class MatriculasModule {}
