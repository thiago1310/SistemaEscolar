import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutenticacaoModule } from '../autenticacao/autenticacao.module';
import { TokenAcessoGuard } from '../autenticacao/autenticacao.guard';
import { Secretaria } from './secretarias.entities';
import { SecretariasController } from './secretarias.controller';
import { SecretariasService } from './secretarias.service';

@Module({
  imports: [AutenticacaoModule, TypeOrmModule.forFeature([Secretaria])],
  controllers: [SecretariasController],
  providers: [SecretariasService, TokenAcessoGuard],
})
export class SecretariasModule {}
