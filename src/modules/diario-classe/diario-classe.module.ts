import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Aluno } from '../alunos/alunos.entities';
import { AutenticacaoModule } from '../autenticacao/autenticacao.module';
import { AutorizacaoModule } from '../autorizacao/autorizacao.module';
import { Disciplina } from '../disciplinas/disciplinas.entities';
import {
  Escola,
  EscolaConfiguracaoPedagogica,
  EscolaPeriodoLetivo,
} from '../escolas/escolas.entities';
import { Matricula } from '../matriculas/matriculas.entities';
import { Professor } from '../professores/professores.entities';
import { Turma, TurmaVinculoDocente } from '../turmas/turmas.entities';
import { UsuarioAcesso } from '../usuario-acessos/usuario-acessos.entities';
import { DiarioClasseController } from './diario-classe.controller';
import {
  DiarioAula,
  DiarioAvaliacao,
  DiarioClasse,
  DiarioFrequencia,
  DiarioNota,
  DiarioObservacao,
} from './diario-classe.entities';
import { DiarioClasseService } from './diario-classe.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Turma,
      TurmaVinculoDocente,
      Professor,
      Aluno,
      Matricula,
      Disciplina,
      Escola,
      EscolaConfiguracaoPedagogica,
      EscolaPeriodoLetivo,
      DiarioClasse,
      DiarioFrequencia,
      DiarioAula,
      DiarioAvaliacao,
      DiarioNota,
      DiarioObservacao,
      UsuarioAcesso,
    ]),
    AutenticacaoModule,
    AutorizacaoModule,
  ],
  controllers: [DiarioClasseController],
  providers: [DiarioClasseService],
})
export class DiarioClasseModule {}
