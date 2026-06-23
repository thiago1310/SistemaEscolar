import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutenticacaoModule } from '../autenticacao/autenticacao.module';
import { AutorizacaoModule } from '../autorizacao/autorizacao.module';
import { UsuarioAcesso } from '../usuario-acessos/usuario-acessos.entities';
import { AuditoriaController } from './auditoria.controller';
import { AuditoriaLog } from './auditoria.entities';
import { AuditoriaInterceptor } from './auditoria.interceptor';
import { AuditoriaService } from './auditoria.service';

@Module({
  imports: [
    AutenticacaoModule,
    AutorizacaoModule,
    TypeOrmModule.forFeature([
      AuditoriaLog,
      UsuarioAcesso,
    ]),
  ],
  controllers: [AuditoriaController],
  providers: [
    AuditoriaService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditoriaInterceptor,
    },
  ],
  exports: [AuditoriaService],
})
export class AuditoriaModule {}
