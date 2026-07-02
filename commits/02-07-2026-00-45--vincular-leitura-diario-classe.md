# Commit: Vincular leitura ao diario de classe

## Objetivo
Garantir que, ao trocar o diario/periodo no frontend, os dados carregados sejam exatamente os vinculados ao `diarioClasseId` selecionado.

## Principais arquivos alterados
- `src/modules/diario-classe/diario-classe.controller.ts`
- `src/modules/diario-classe/diario-classe.dto.ts`
- `src/modules/diario-classe/diario-classe.service.ts`
- `src/modules/diario-classe/postman_diario_classe.json`
- `plano_front_diario_classe_fechamento.md`
- `sistema_educacional_base.sql`

## Regras de negocio ou seguranca impactadas
- Listagens de frequencias, aulas, avaliacoes, notas e observacoes passam a aceitar `diarioClasseId`.
- O backend valida se o diario informado pertence a turma e ao escopo do usuario autenticado.
- Novo endpoint `GET /diario-classe/diarios/:diarioId/dados` retorna o pacote completo do diario selecionado.
- O frontend deve preferir `diarioClasseId` ao texto de periodo para evitar mistura de dados entre periodos, disciplinas ou vinculos docentes.

## Validacoes executadas
- `npm.cmd run build`
- Validacao JSON de `src/modules/diario-classe/postman_diario_classe.json`
- Smoke test do endpoint protegido `GET /diario-classe/diarios/:diarioId/dados`, retornando `HTTP 401` sem erro de bootstrap.

## Observacoes importantes para continuidade
- A constraint unica de frequencia foi mantida como esta para evitar quebra no boot com `synchronize: true` em MySQL.
- Se futuramente for necessario ter frequencia separada por diario/disciplina no mesmo dia, criar uma migracao controlada para trocar a constraint antiga.
