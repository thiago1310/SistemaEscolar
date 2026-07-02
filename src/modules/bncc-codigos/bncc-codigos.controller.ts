import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { TokenAcessoGuard } from '../autenticacao/autenticacao.guard';
import { NivelMinimo } from '../autorizacao/permissao.decorator';
import { PermissaoGuard } from '../autorizacao/permissao.guard';
import { ListarCodigosBnccDto } from './bncc-codigos.dto';
import { BnccCodigosService } from './bncc-codigos.service';

@Controller('bncc-codigos')
@UseGuards(TokenAcessoGuard, PermissaoGuard)
export class BnccCodigosController {
  constructor(private readonly bnccCodigosService: BnccCodigosService) {}

  @Get()
  @NivelMinimo(10)
  listar(@Query() filtros: ListarCodigosBnccDto) {
    return this.bnccCodigosService.listar(filtros);
  }

  @Get('opcoes')
  @NivelMinimo(10)
  listarOpcoes() {
    return this.bnccCodigosService.listarOpcoes();
  }

  @Get(':codigo')
  @NivelMinimo(10)
  buscarPorCodigo(@Param('codigo') codigo: string) {
    return this.bnccCodigosService.buscarPorCodigo(codigo);
  }
}
