import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable, tap } from 'rxjs';
import { RequisicaoAutenticada } from '../autenticacao/autenticacao.guard';
import { AuditoriaService } from './auditoria.service';

@Injectable()
export class AuditoriaInterceptor implements NestInterceptor {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  intercept(contexto: ExecutionContext, proximo: CallHandler): Observable<unknown> {
    const requisicao = contexto.switchToHttp().getRequest<RequisicaoAutenticada>();

    if (!this.deveAuditar(requisicao)) {
      return proximo.handle();
    }

    const entidade = this.extrairEntidade(requisicao.path);
    const acao = this.extrairAcao(requisicao.method);
    const entidadeId = this.extrairEntidadeId(requisicao);
    const dadosAntes = this.extrairDadosAntes(requisicao);
    const usuarioId = requisicao.usuario?.id ?? null;
    const ip = requisicao.ip ?? null;
    const userAgent = requisicao.headers['user-agent'] ?? null;

    return proximo.handle().pipe(
      tap((resposta) => {
        void this.auditoriaService.registrar({
          usuarioId,
          entidade,
          entidadeId,
          acao,
          dadosAntes,
          dadosDepois: this.normalizarDados(resposta),
          ip,
          userAgent: Array.isArray(userAgent) ? userAgent.join(' ') : userAgent,
        });
      }),
    );
  }

  private deveAuditar(requisicao: Request) {
    const metodosAuditaveis = ['POST', 'PATCH', 'DELETE'];
    return (
      metodosAuditaveis.includes(requisicao.method) &&
      !requisicao.path.startsWith('/auditoria')
    );
  }

  private extrairEntidade(caminho: string) {
    return caminho.split('/').filter(Boolean)[0] ?? 'desconhecido';
  }

  private extrairAcao(metodo: string) {
    const acoes: Record<string, string> = {
      POST: 'criar',
      PATCH: 'atualizar',
      DELETE: 'remover',
    };

    return acoes[metodo] ?? metodo.toLowerCase();
  }

  private extrairEntidadeId(requisicao: Request) {
    return typeof requisicao.params.id === 'string' ? requisicao.params.id : null;
  }

  private extrairDadosAntes(requisicao: Request) {
    return this.normalizarDados({
      params: requisicao.params,
      body: requisicao.body,
    });
  }

  private normalizarDados(dados: unknown): Record<string, unknown> | null {
    if (!dados || typeof dados !== 'object') {
      return null;
    }

    return dados as Record<string, unknown>;
  }
}
