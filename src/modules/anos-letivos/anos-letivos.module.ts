import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutenticacaoModule } from '../autenticacao/autenticacao.module';
import { TokenAcessoGuard } from '../autenticacao/autenticacao.guard';
import { Secretaria } from '../secretarias/secretarias.entities';
import { AnosLetivosController } from './anos-letivos.controller';
import { AnoLetivo } from './anos-letivos.entities';
import { AnosLetivosService } from './anos-letivos.service';

@Module({
  imports: [AutenticacaoModule, TypeOrmModule.forFeature([AnoLetivo, Secretaria])],
  controllers: [AnosLetivosController],
  providers: [AnosLetivosService, TokenAcessoGuard],
})
export class AnosLetivosModule {}
