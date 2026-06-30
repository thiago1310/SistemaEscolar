import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutenticacaoModule } from '../autenticacao/autenticacao.module';
import { AutorizacaoModule } from '../autorizacao/autorizacao.module';
import { Disciplina } from '../disciplinas/disciplinas.entities';
import { Escola } from '../escolas/escolas.entities';
import { Secretaria } from '../secretarias/secretarias.entities';
import { UsuarioAcesso } from '../usuario-acessos/usuario-acessos.entities';
import {
  AnoSerieCurricular,
  AreaConhecimento,
  ComponenteCurricular,
  DocumentoCurricular,
  HabilidadeCurricular,
  ItemPlanejamentoHabilidade,
  ItemPlanejamentoPedagogico,
  ItemPlanejamentoPeriodo,
  ObjetoConhecimento,
  PeriodoPlanejamento,
  PlanoPedagogico,
  UnidadeTematica,
} from './planejamento-pedagogico.entities';
import { PlanejamentoPedagogicoController } from './planejamento-pedagogico.controller';
import { PlanejamentoPedagogicoService } from './planejamento-pedagogico.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DocumentoCurricular,
      AnoSerieCurricular,
      AreaConhecimento,
      ComponenteCurricular,
      PlanoPedagogico,
      PeriodoPlanejamento,
      UnidadeTematica,
      ObjetoConhecimento,
      HabilidadeCurricular,
      ItemPlanejamentoPedagogico,
      ItemPlanejamentoPeriodo,
      ItemPlanejamentoHabilidade,
      Secretaria,
      Escola,
      Disciplina,
      UsuarioAcesso,
    ]),
    AutenticacaoModule,
    AutorizacaoModule,
  ],
  controllers: [PlanejamentoPedagogicoController],
  providers: [PlanejamentoPedagogicoService],
})
export class PlanejamentoPedagogicoModule {}
