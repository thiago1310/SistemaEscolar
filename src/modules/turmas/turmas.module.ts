import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from '../autenticacao/autenticacao.entities';
import { AutenticacaoModule } from '../autenticacao/autenticacao.module';
import { TokenAcessoGuard } from '../autenticacao/autenticacao.guard';
import { AutorizacaoModule } from '../autorizacao/autorizacao.module';
import { Disciplina } from '../disciplinas/disciplinas.entities';
import { Escola } from '../escolas/escolas.entities';
import { Professor } from '../professores/professores.entities';
import { UsuarioAcesso } from '../usuario-acessos/usuario-acessos.entities';
import { TurmasController } from './turmas.controller';
import { Turma, TurmaVinculoDocente } from './turmas.entities';
import { TurmasService } from './turmas.service';

@Module({
  imports: [
    AutenticacaoModule,
    AutorizacaoModule,
    TypeOrmModule.forFeature([
      Turma,
      TurmaVinculoDocente,
      Escola,
      Usuario,
      UsuarioAcesso,
      Disciplina,
      Professor,
    ]),
  ],
  controllers: [TurmasController],
  providers: [TurmasService, TokenAcessoGuard],
})
export class TurmasModule {}
