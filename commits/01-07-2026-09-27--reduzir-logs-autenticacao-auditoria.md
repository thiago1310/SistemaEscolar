# Reduzir logs de autenticacao na auditoria

## Resumo
- Ajustado o interceptor de auditoria para ignorar fluxos operacionais de autenticacao.
- Removido o log automatico de `entrar`, `renovar-token` e `sair`.
- Adicionada sanitizacao recursiva de campos sensiveis antes de salvar auditoria.
- Atualizada a collection Postman de auditoria com a nova regra.

## Arquivos principais
- `src/modules/auditoria/auditoria.interceptor.ts`
- `src/modules/auditoria/postman_auditoria.json`

## Validacoes
- `npm.cmd run build`
- Parse do `postman_auditoria.json` com `ConvertFrom-Json`.
- Teste direto no interceptor confirmando que login, refresh e logout nao auditam e tokens/senhas viram `[REMOVIDO]`.
