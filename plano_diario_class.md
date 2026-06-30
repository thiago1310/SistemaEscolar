# Plano: Módulo Diário de Classe

## Resumo
- Criar `src/modules/diario-classe` em NestJS/TypeScript, com controller, service, module, DTOs, entities e `postman_diario_classe.json`.
- Reaproveitar cadastros já existentes: turmas, alunos/matrículas, disciplinas, professores e vínculos docentes.
- Criar somente APIs para dados próprios do diário: frequência, aulas/conteúdos, avaliações/notas, observações e resumos.
- Decisões do planejamento: frequência diária por turma, escrita somente pelo professor vinculado, períodos livres como texto, e progresso do conteúdo como indicador simples sem criar módulo de planejamento curricular.

## APIs e Reuso
- Não criar novas APIs para listar escola, turma, aluno, disciplina ou professor; usar os endpoints atuais quando a tela precisar desses dados isolados.
- Criar `GET /diario-classe/turmas` como rota agregadora da tela inicial, retornando turmas acessíveis, disciplinas/vínculos, carga horária, total de alunos, progresso e estatísticas.
- Criar `GET /diario-classe/turmas/:turmaId/resumo` para os cards da turma: frequência do dia, último conteúdo, última avaliação e observações recentes.
- Frequência:
  - `GET /diario-classe/turmas/:turmaId/frequencias?data=YYYY-MM-DD`
  - `PUT /diario-classe/turmas/:turmaId/frequencias`
  - status: `PRESENTE`, `AUSENTE`, `ATRASO`, `JUSTIFICADA`.
- Conteúdo ministrado:
  - `GET /diario-classe/turmas/:turmaId/aulas`
  - `POST /diario-classe/turmas/:turmaId/aulas`
  - `PATCH /diario-classe/aulas/:id`
  - `PATCH /diario-classe/aulas/:id/inativar`
- Notas:
  - `GET /diario-classe/turmas/:turmaId/notas`
  - `GET /diario-classe/turmas/:turmaId/avaliacoes`
  - `POST /diario-classe/turmas/:turmaId/avaliacoes`
  - `PATCH /diario-classe/avaliacoes/:id`
  - `PATCH /diario-classe/avaliacoes/:id/inativar`
  - `PUT /diario-classe/avaliacoes/:avaliacaoId/notas`
- Observações:
  - `GET /diario-classe/turmas/:turmaId/observacoes`
  - `POST /diario-classe/turmas/:turmaId/observacoes`
  - `PATCH /diario-classe/observacoes/:id`
  - `PATCH /diario-classe/observacoes/:id/inativar`

## Dados e Regras
- Criar entidades: `DiarioFrequencia`, `DiarioAula`, `DiarioAvaliacao`, `DiarioNota` e `DiarioObservacao`.
- Frequência terá unicidade por `turmaId + data + alunoId`; salvar de novo atualiza o registro do dia.
- Aulas, avaliações e notas devem guardar `turmaId`, `disciplinaId`, `professorId` e, quando houver, `vinculoDocenteId`, preservando histórico mesmo se o vínculo for inativado depois.
- Avaliações usam `periodo` livre como texto, `peso` numérico e notas por aluno; médias e situação são calculadas no backend.
- Observações aceitam `alunoId` opcional para permitir observação da turma inteira ou de um aluno específico.
- Não expor delete físico no v1; usar inativação para preservar histórico.

## Permissões
- Leitura sempre validada no backend pelo escopo atual, mantendo a regra do filtro mais específico: escola prevalece sobre secretaria.
- Professor visualiza apenas turmas onde tem vínculo docente ativo.
- Gestão/admin pode visualizar dentro do escopo, mas não lança nem altera diário nesta versão.
- Escrita exige que o usuário autenticado seja professor ativo e tenha vínculo docente ativo com a turma; para conteúdo/notas, também precisa estar vinculado à disciplina/componente informado.

## Testes e Aceitação
- Rodar `npm.cmd run build`.
- Testar no Postman:
  - listar `GET /diario-classe/turmas` como professor e ver apenas turmas vinculadas;
  - lançar frequência diária e confirmar que novo envio atualiza, sem duplicar;
  - registrar aula/conteúdo e confirmar resumo/último conteúdo;
  - cadastrar avaliação com período livre, lançar notas e conferir média/situação;
  - criar observação de aluno e de turma;
  - tentar lançar diário com usuário sem vínculo docente e receber `403`;
  - confirmar que gestão consegue consultar dentro do escopo, mas não alterar.
- Atualizar `sistema_educacional_base.sql` e criar `postman_diario_classe.json`.
