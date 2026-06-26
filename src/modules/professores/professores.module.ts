import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from '../autenticacao/autenticacao.entities';
import { AutenticacaoModule } from '../autenticacao/autenticacao.module';
import { TokenAcessoGuard } from '../autenticacao/autenticacao.guard';
import { AutorizacaoModule } from '../autorizacao/autorizacao.module';
import { EmailModule } from '../email/email.module';
import { Escola } from '../escolas/escolas.entities';
import { Perfil } from '../perfis-permissoes/perfis-permissoes.entities';
import { Secretaria } from '../secretarias/secretarias.entities';
import { UsuarioAcesso } from '../usuario-acessos/usuario-acessos.entities';
import { ProfessoresController } from './professores.controller';
import { Professor } from './professores.entities';
import { ProfessoresService } from './professores.service';

@Module({
  imports: [
    AutenticacaoModule,
    AutorizacaoModule,
    EmailModule,
    TypeOrmModule.forFeature([
      Professor,
      Usuario,
      UsuarioAcesso,
      Perfil,
      Secretaria,
      Escola,
    ]),
  ],
  controllers: [ProfessoresController],
  providers: [ProfessoresService, TokenAcessoGuard],
  exports: [ProfessoresService],
})
export class ProfessoresModule {}
