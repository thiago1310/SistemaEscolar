# Configuracao pedagogica de escolas

## Resumo
- Adicionada configuracao pedagogica por escola e ano letivo.
- Criados endpoints para salvar configuracao, consultar periodos letivos e identificar o periodo letivo atual.
- Adicionada validacao no diario de classe para bloquear avaliacoes e observacoes fora do periodo atual quando o calendario estiver completo.

## Arquivos principais
- `src/modules/escolas/escolas.entities.ts`
- `src/modules/escolas/escolas.dto.ts`
- `src/modules/escolas/escolas.service.ts`
- `src/modules/escolas/escolas.controller.ts`
- `src/modules/diario-classe/diario-classe.service.ts`
- `src/modules/escolas/postman_escolas.json`
- `sistema_educacional_base.sql`

## Validacoes
- `npm.cmd run build`
- Smoke boot com `node dist/main.js` na porta `3017`, confirmando rotas mapeadas e resposta `401` sem token.
- Validacao dos JSONs Postman com `ConvertFrom-Json`.
