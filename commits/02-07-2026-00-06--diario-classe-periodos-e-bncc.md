# Commit: Diario de classe por periodo e codigos BNCC

## Objetivo
Registrar a implementacao do controle de diario de classe por periodo letivo e incluir a base organizada de codigos BNCC no seed administrativo.

## Principais arquivos alterados
- `src/modules/diario-classe/diario-classe.entities.ts`
- `src/modules/diario-classe/diario-classe.service.ts`
- `src/modules/diario-classe/diario-classe.controller.ts`
- `src/modules/diario-classe/diario-classe.dto.ts`
- `src/modules/diario-classe/postman_diario_classe.json`
- `src/modules/turmas/turmas.entities.ts`
- `src/modules/turmas/turmas.service.ts`
- `src/modules/planejamento-pedagogico/planejamento-pedagogico.entities.ts`
- `src/seeds/admin.seed.ts`
- `bncc_codigos.json`
- `plano_front_diario_classe_fechamento.md`
- `sistema_educacional_base.sql`

## Regras de negocio ou seguranca impactadas
- Diario de classe passa a ter controle por turma, professor, disciplina, vinculo docente e periodo letivo.
- Professor pode fechar seu proprio diario com parecer final.
- Diretor/gestao pode reabrir diario fechado informando motivo.
- Escritas de frequencia, aulas, avaliacoes, notas e observacoes respeitam o status do diario do periodo.
- Diario fechado ou substituido bloqueia novas alteracoes.
- Troca de professor ou disciplina no vinculo docente preserva historico, encerrando o vinculo anterior e marcando seus diarios como substituidos.
- Codigos BNCC passam a ter entidade e carga idempotente pelo `seed:admin`, sem duplicar registros.

## Validacoes executadas
- `npm.cmd run build`
- Validacao JSON de `src/modules/diario-classe/postman_diario_classe.json`
- Smoke test do backend compilado em porta alternativa, confirmando rota protegida com `HTTP 401`
- Seed BNCC executado em testes anteriores com comportamento idempotente e carga final de 1580 registros

## Observacoes importantes para continuidade
- O frontend deve consumir `GET /diario-classe/turmas/:turmaId/diarios` para controlar periodo, status e bloqueio de edicao.
- O plano de integracao do frontend esta em `plano_front_diario_classe_fechamento.md`.
- Como o projeto usa `synchronize: true`, as novas tabelas e colunas serao refletidas pelo TypeORM ao reiniciar a API.
