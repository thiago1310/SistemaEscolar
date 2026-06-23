import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { TokenAcessoGuard } from '../autenticacao/autenticacao.guard';
import { NivelMinimo, Perfis } from '../autorizacao/permissao.decorator';
import { PermissaoGuard } from '../autorizacao/permissao.guard';
import { AuditoriaService } from './auditoria.service';
import { FiltroAuditoriaDto } from './auditoria.dto';

@Controller('auditoria')
@UseGuards(TokenAcessoGuard, PermissaoGuard)
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @Get()
  @Perfis('ADMIN_GERAL', 'AUDITOR')
  @NivelMinimo(20)
  listar(@Query() filtro: FiltroAuditoriaDto) {
    return this.auditoriaService.listar(filtro);
  }

  @Get(':id')
  @Perfis('ADMIN_GERAL', 'AUDITOR')
  @NivelMinimo(20)
  buscarPorId(@Param('id') id: string) {
    return this.auditoriaService.buscarPorId(id);
  }
}
