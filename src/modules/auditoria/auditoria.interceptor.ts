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
  private readonly camposSensiveis = new Set([
    'authorization',
    'accesstoken',
    'access_token',
    'refreshtoken',
    'refresh_token',
    'token',
    'senha',
    'senhahash',
    'senha_hash',
    'senhatemporaria',
    'senha_temporaria',
    'senhapadrao',
    'senha_padrao',
    'senhaatual',
    'senha_atual',
    'novasenha',
    'nova_senha',
  ]);

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
    const metodosAuditaveis = ['POST', 'PUT', 'PATCH', 'DELETE'];
    return (
      metodosAuditaveis.includes(requisicao.method) &&
      !requisicao.path.startsWith('/auditoria') &&
      !this.ehFluxoOperacionalDeAutenticacao(requisicao)
    );
  }

  private ehFluxoOperacionalDeAutenticacao(requisicao: Request) {
    const caminhosIgnorados = [
      '/autenticacao/entrar',
      '/autenticacao/renovar-token',
      '/autenticacao/sair',
    ];

    return caminhosIgnorados.includes(requisicao.path);
  }

  private extrairEntidade(caminho: string) {
    return caminho.split('/').filter(Boolean)[0] ?? 'desconhecido';
  }

  private extrairAcao(metodo: string) {
    const acoes: Record<string, string> = {
      POST: 'criar',
      PUT: 'atualizar',
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

    return this.sanitizarDados(dados) as Record<string, unknown>;
  }

  private sanitizarDados(dados: unknown): unknown {
    if (Array.isArray(dados)) {
      return dados.map((item) => this.sanitizarDados(item));
    }

    if (!dados || typeof dados !== 'object') {
      return dados;
    }

    const dadosSanitizados: Record<string, unknown> = {};

    for (const [chave, valor] of Object.entries(dados)) {
      if (this.camposSensiveis.has(this.normalizarChave(chave))) {
        dadosSanitizados[chave] = '[REMOVIDO]';
        continue;
      }

      dadosSanitizados[chave] = this.sanitizarDados(valor);
    }

    return dadosSanitizados;
  }

  private normalizarChave(chave: string) {
    return chave.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
  }
}
