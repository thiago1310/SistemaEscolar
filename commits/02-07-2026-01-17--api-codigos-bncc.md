# Commit: API de codigos BNCC

## Objetivo
Criar endpoints proprios para consulta dos codigos oficiais da BNCC carregados no banco pelo `seed:admin`.

## Principais arquivos alterados
- `src/modules/bncc-codigos/bncc-codigos.controller.ts`
- `src/modules/bncc-codigos/bncc-codigos.dto.ts`
- `src/modules/bncc-codigos/bncc-codigos.module.ts`
- `src/modules/bncc-codigos/bncc-codigos.service.ts`
- `src/modules/bncc-codigos/postman_bncc_codigos.json`
- `src/app.module.ts`
- `src/modules/planejamento-pedagogico/planejamento-pedagogico.entities.ts`
- `src/modules/diario-classe/diario-classe.entities.ts`
- `sistema_educacional_base.sql`

## Regras de negocio ou seguranca impactadas
- A consulta de BNCC fica disponivel para usuarios autenticados com nivel minimo 10.
- `GET /bncc-codigos` lista com filtros por etapa, componente/area, serie, idade, codigo, busca, ativo, pagina e limite.
- `GET /bncc-codigos/opcoes` retorna dados para montar filtros no frontend.
- `GET /bncc-codigos/:codigo` busca um codigo BNCC especifico.
- O modulo reaproveita a entity `CodigoBncc` ja usada pelo planejamento pedagogico.

## Ajustes tecnicos adicionais
- `FaixaEtariaBncc` foi exportada para evitar erro de tipo em metodos publicos.
- As constraints legadas de frequencia e avaliacao do diario foram mantidas nas entities junto das novas constraints, evitando que o TypeORM tente remover indices usados por FK no MySQL com `synchronize: true`.

## Validacoes executadas
- `npm.cmd run build`
- Validacao JSON de `src/modules/bncc-codigos/postman_bncc_codigos.json`
- Smoke test em porta alternativa confirmando `GET /bncc-codigos` protegido com `401` sem token.
- `git diff --check`
