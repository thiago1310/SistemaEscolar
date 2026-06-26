import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutenticacaoModule } from './modules/autenticacao/autenticacao.module';
import { AuditoriaModule } from './modules/auditoria/auditoria.module';
import { AutorizacaoModule } from './modules/autorizacao/autorizacao.module';
import { EscolasModule } from './modules/escolas/escolas.module';
import { DisciplinasModule } from './modules/disciplinas/disciplinas.module';
import { PerfisPermissoesModule } from './modules/perfis-permissoes/perfis-permissoes.module';
import { ProfessoresModule } from './modules/professores/professores.module';
import { SecretariasModule } from './modules/secretarias/secretarias.module';
import { TurmasModule } from './modules/turmas/turmas.module';
import { UsuarioAcessosModule } from './modules/usuario-acessos/usuario-acessos.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configuracao: ConfigService) => ({
        type: 'mysql',
        host: configuracao.get<string>('DB_HOST', 'localhost'),
        port: configuracao.get<number>('DB_PORT', 3306),
        username: configuracao.get<string>('DB_USER', 'root'),
        password: configuracao.get<string>('DB_PASSWORD', ''),
        database: configuracao.get<string>('DB_NAME', 'sistema_escolar'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    AutenticacaoModule,
    AutorizacaoModule,
    AuditoriaModule,
    SecretariasModule,
    EscolasModule,
    PerfisPermissoesModule,
    ProfessoresModule,
    UsuariosModule,
    UsuarioAcessosModule,
    DisciplinasModule,
    TurmasModule,
  ],
})
export class AppModule {}
