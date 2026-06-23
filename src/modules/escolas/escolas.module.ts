import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutenticacaoModule } from '../autenticacao/autenticacao.module';
import { TokenAcessoGuard } from '../autenticacao/autenticacao.guard';
import { Secretaria } from '../secretarias/secretarias.entities';
import { EscolasController } from './escolas.controller';
import { Escola } from './escolas.entities';
import { EscolasService } from './escolas.service';

@Module({
  imports: [AutenticacaoModule, TypeOrmModule.forFeature([Escola, Secretaria])],
  controllers: [EscolasController],
  providers: [EscolasService, TokenAcessoGuard],
})
export class EscolasModule {}
