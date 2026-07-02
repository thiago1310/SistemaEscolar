# Plano Frontend - Diario de Classe por Periodo

## Objetivo
Adaptar o frontend para consumir os diarios de classe gerados por periodo letivo e controlar fechamento/reabertura sem criar endpoints duplicados.

## Endpoints do backend
- `GET /diario-classe/turmas`
  - Continua alimentando a tela "Minhas turmas".
  - Cada card pode manter as disciplinas agrupadas em `disciplinas`/`subjects`.
- `GET /diario-classe/turmas/:turmaId/diarios`
  - Nova chamada ao abrir uma turma.
  - Filtros opcionais: `disciplinaId`, `professorId`, `periodoLetivoId`.
  - Retorna diario por professor, disciplina e periodo letivo, com `status`, `bloqueadoParaEdicao`, `periodo`, `parecerFinal` e dados de fechamento/reabertura.
- `GET /diario-classe/diarios/:diarioId/dados`
  - Chamada principal ao selecionar/trocar periodo no diario.
  - Retorna o diario selecionado e os dados vinculados a ele: frequencia do dia, aulas/conteudos, avaliacoes, notas e observacoes.
  - Deve ser preferido no frontend para evitar misturar dados por texto de periodo.
- `POST /diario-classe/diarios/:diarioId/fechar`
  - Usado pelo professor para fechar o diario do periodo selecionado com `parecerFinal`.
- `PATCH /diario-classe/diarios/:diarioId/reabrir`
  - Usado por diretor/gestao para reabrir diario fechado com `motivoReabertura`.
- Endpoints existentes de frequencia, aulas, avaliacoes, notas e observacoes continuam os mesmos.
  - O backend bloqueia escrita quando o diario do periodo estiver `FECHADO` ou `SUBSTITUIDO`.

## Mudancas de UI
- Ao entrar no diario da turma, carregar `GET /diario-classe/turmas/:turmaId/diarios`.
- Exibir seletor de periodo usando os diarios retornados, nao uma lista fixa no frontend.
- Ao trocar o periodo/componente, chamar `GET /diario-classe/diarios/:diarioId/dados` e atualizar as abas com o retorno desse diario.
- Mostrar chip de status do diario selecionado:
  - `NAO_INICIADO`: periodo ainda nao iniciou.
  - `ABERTO`: lancamentos permitidos.
  - `PENDENTE_FECHAMENTO`: periodo terminou e ainda falta fechar.
  - `FECHADO`: somente leitura.
  - `REABERTO`: lancamentos liberados por autorizacao.
  - `SUBSTITUIDO`: historico de professor/disciplina substituidos, somente leitura.
- Desabilitar botoes de salvar/criar/importar quando `bloqueadoParaEdicao = true`.
- Manter visualizacao de frequencia, conteudo, notas e observacoes mesmo em diario fechado.
- Adicionar modal "Fechar diario" com campo obrigatorio `parecerFinal`.
- Para perfis de direcao/gestao, adicionar acao "Reabrir diario" quando status for `FECHADO`, pedindo `motivoReabertura`.

## Comportamento por fluxo
- Professor com mais de uma disciplina na mesma turma:
  - A tela de turmas continua mostrando um card por turma/professor, com chips de disciplinas.
  - Dentro do diario, o seletor de componente curricular filtra os diarios e os lancamentos.
- Diario do primeiro e segundo bimestre ao mesmo tempo:
  - O frontend deve listar todos os diarios retornados.
  - Periodos futuros aparecem como `NAO_INICIADO` e ficam visiveis, mas sem escrita.
- Troca de professor no meio do ano:
  - Diarios antigos aparecem como `SUBSTITUIDO` para historico.
  - O novo professor recebe novos diarios por periodo a partir do novo vinculo.
- Periodo sem configuracao pedagogica:
  - O backend permite lancamentos sem `diarioClasseId`.
  - O frontend deve tratar ausencia de diarios como modo legado/sem fechamento por periodo.

## Servicos sugeridos
- Criar/atualizar no service do diario:
  - `listarDiariosDaTurma(turmaId, filtros)`
  - `fecharDiario(diarioId, parecerFinal)`
  - `reabrirDiario(diarioId, motivoReabertura)`
- Incluir `diarioClasseId` nos tipos de frequencia, aula, avaliacao e observacao.
- Incluir `status` e `bloqueadoParaEdicao` no estado da tela para controlar botao e leitura.

## Validacao manual
1. Abrir "Minhas turmas" e confirmar card agrupado por turma com chips de disciplinas.
2. Acessar uma turma e confirmar que os diarios dos periodos aparecem.
3. Criar aula/frequencia/avaliacao/observacao no periodo aberto.
4. Fechar diario e confirmar que novas alteracoes ficam bloqueadas.
5. Reabrir com perfil autorizado e confirmar que salvar volta a funcionar.
6. Trocar professor/disciplina no vinculo da turma e confirmar que o diario antigo fica como historico substituido.
