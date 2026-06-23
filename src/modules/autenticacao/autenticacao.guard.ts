import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AutenticacaoService } from './autenticacao.service';

export interface UsuarioAutenticado {
  id: string;
  nome: string;
  email: string | null;
  username: string | null;
}

export interface RequisicaoAutenticada extends Request {
  usuario: UsuarioAutenticado;
}

@Injectable()
export class TokenAcessoGuard implements CanActivate {
  constructor(private readonly autenticacaoService: AutenticacaoService) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const requisicao = contexto
      .switchToHttp()
      .getRequest<RequisicaoAutenticada>();
    const token = this.extrairToken(requisicao);

    if (!token) {
      throw new UnauthorizedException('Token de acesso não informado.');
    }

    requisicao.usuario =
      await this.autenticacaoService.validarTokenAcesso(token);

    return true;
  }

  private extrairToken(requisicao: Request): string | null {
    const autorizacao = requisicao.headers.authorization;

    if (!autorizacao) {
      return null;
    }

    const [tipo, token] = autorizacao.split(' ');
    return tipo === 'Bearer' && token ? token : null;
  }
}
