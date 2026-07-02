import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutenticacaoModule } from '../autenticacao/autenticacao.module';
import { AutorizacaoModule } from '../autorizacao/autorizacao.module';
import { CodigoBncc } from '../planejamento-pedagogico/planejamento-pedagogico.entities';
import { UsuarioAcesso } from '../usuario-acessos/usuario-acessos.entities';
import { BnccCodigosController } from './bncc-codigos.controller';
import { BnccCodigosService } from './bncc-codigos.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CodigoBncc, UsuarioAcesso]),
    AutenticacaoModule,
    AutorizacaoModule,
  ],
  controllers: [BnccCodigosController],
  providers: [BnccCodigosService],
})
export class BnccCodigosModule {}
