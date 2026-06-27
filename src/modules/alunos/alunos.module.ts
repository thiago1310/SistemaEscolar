import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutenticacaoModule } from '../autenticacao/autenticacao.module';
import { TokenAcessoGuard } from '../autenticacao/autenticacao.guard';
import { AutorizacaoModule } from '../autorizacao/autorizacao.module';
import { Escola } from '../escolas/escolas.entities';
import { Turma } from '../turmas/turmas.entities';
import { UsuarioAcesso } from '../usuario-acessos/usuario-acessos.entities';
import { AlunosController } from './alunos.controller';
import { Aluno } from './alunos.entities';
import { AlunosService } from './alunos.service';

@Module({
  imports: [
    AutenticacaoModule,
    AutorizacaoModule,
    TypeOrmModule.forFeature([Aluno, Escola, Turma, UsuarioAcesso]),
  ],
  controllers: [AlunosController],
  providers: [AlunosService, TokenAcessoGuard],
})
export class AlunosModule {}
