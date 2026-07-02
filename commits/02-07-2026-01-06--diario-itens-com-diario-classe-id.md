# Commit: Diario itens com diarioClasseId

## Objetivo
Garantir que todos os itens do diario de classe sejam identificados pelo `diarioClasseId`, evitando mistura de dados entre periodos, disciplinas ou vinculos docentes.

## Principais arquivos alterados
- `src/modules/diario-classe/diario-classe.dto.ts`
- `src/modules/diario-classe/diario-classe.entities.ts`
- `src/modules/diario-classe/diario-classe.service.ts`
- `src/modules/diario-classe/postman_diario_classe.json`
- `sistema_educacional_base.sql`

## Regras de negocio ou seguranca impactadas
- Frequencia, aula, avaliacao, notas e observacoes passam a exigir ou preservar `diarioClasseId` nos fluxos de escrita.
- `diario_notas` passa a ter `diario_classe_id` para identificar diretamente o diario relacionado ao lancamento da nota.
- Avaliacoes ficam unicas por `diarioClasseId` e nome, respeitando o diario/periodo selecionado.
- O backend valida se o diario informado pertence a turma, disciplina, data de lancamento e vinculo docente permitido.
- Dados antigos de avaliacao sem `diarioClasseId` podem ser preenchidos ao salvar notas com o diario correto.

## Validacoes executadas
- `npm.cmd run build`
- Validacao JSON de `src/modules/diario-classe/postman_diario_classe.json`
- `git diff --check`

## Observacoes importantes para continuidade
- Como o projeto usa `synchronize: true`, a coluna `diario_classe_id` em `diario_notas` deve ser criada pelo TypeORM ao reiniciar a API.
- O frontend deve enviar `diarioClasseId` tambem em `PUT /diario-classe/avaliacoes/:id/notas`.
