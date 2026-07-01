# Perfis e regras de acesso do Sistema Escolar

Este documento descreve a regra esperada para cada perfil do sistema. Ele deve ser usado como referencia ao criar ou alterar APIs, guards, services, DTOs, filtros de listagem e regras de seguranca.

## Regras gerais

- O sistema usa perfis com nivel numerico. Quanto maior o nivel, maior o privilegio.
- Um usuario pode ter mais de um acesso ativo em `usuario_acessos`.
- Apenas acessos ativos e perfis ativos contam para permissao.
- `maiorNivel` e o maior nivel entre os perfis ativos do usuario.
- `ADMIN_GERAL` ou nivel `100` tem escopo global.
- Usuarios sem escopo global devem enxergar e alterar somente dados dentro dos seus vinculos de secretaria ou escola.
- O backend deve aplicar escopo. O frontend pode enviar filtros, mas nunca deve ser a fonte da permissao.
- Quando o usuario tiver vinculo de escola, o filtro de escola e mais especifico e deve prevalecer sobre o filtro amplo de secretaria para consultas escolares.
- O usuario nao pode criar, atribuir ou alterar outro usuario para um perfil maior que o proprio `maiorNivel`.
- A listagem de perfis deve retornar apenas perfis com nivel menor ou igual ao `maiorNivel` do usuario autenticado.
- Delete fisico deve ser excecao. Por padrao, usar inativacao. Delete fisico fica reservado para `ADMIN_GERAL`, salvo regra explicita em contrario.
- Criacao e alteracao devem validar tanto nivel minimo quanto escopo do recurso de destino.
- Leitura ampla deve respeitar escopo. Exemplo: secretaria municipal ve dados da secretaria; diretor ve dados da escola; professor ve dados das turmas/vinculos dele.

## Hierarquia dos perfis

| Nivel | Codigo esperado | Nome |
| --- | --- | --- |
| 100 | ADMIN_GERAL | Administrador Geral |
| 80 | SECRETARIA_MUNICIPAL | Secretaria Municipal |
| 60 | GESTOR_ESCOLAR | Gestor Escolar |
| 50 | SECRETARIO_ESCOLAR | Secretario Escolar |
| 45 | COORDENADOR_PEDAGOGICO | Coordenador Pedagogico |
| 30 | PROFESSOR | Professor |
| 20 | AUDITOR | Auditor |
| 10 | SUPORTE_TECNICO | Suporte Tecnico |

## ADMIN_GERAL - nivel 100

Administrador global do sistema.

Regras:
- Tem acesso global, sem filtro por secretaria ou escola.
- Pode criar, editar, inativar e excluir registros administrativos quando a API permitir delete fisico.
- Pode gerenciar secretarias, escolas, usuarios, acessos, perfis e permissoes.
- Pode atribuir qualquer perfil ate nivel 100.
- Pode consultar auditoria.
- Pode acessar dados pedagogicos e operacionais de qualquer tenant/secretaria/escola.

Cuidados:
- Mesmo para este perfil, nunca retornar senha ou dados sensiveis indevidos.
- Operacoes destrutivas devem continuar explicitas e auditaveis.

## SECRETARIA_MUNICIPAL - nivel 80

Perfil administrativo da secretaria municipal.

Regras:
- Atua no escopo de uma ou mais secretarias vinculadas em `usuario_acessos`.
- Pode gerenciar escolas da secretaria.
- Pode gerenciar usuarios e acessos dentro da secretaria, respeitando o limite de nivel igual ou menor que 80.
- Pode cadastrar e editar professores, alunos, turmas, matriculas, disciplinas e vinculos docentes dentro da secretaria.
- Pode vincular professor, disciplina, turma e carga horaria.
- Pode importar/gerenciar planejamento pedagogico quando a API permitir perfil de secretaria.
- Pode remover/desvincular acessos de usuarios dentro do seu escopo, respeitando nivel e regras do modulo.

Cuidados:
- Nao pode ver ou alterar dados de outra secretaria.
- Nao pode atribuir `ADMIN_GERAL`.
- Delete fisico continua reservado ao `ADMIN_GERAL`, salvo excecao documentada.

## GESTOR_ESCOLAR - nivel 60

Diretor ou gestor de uma escola.

Regras:
- Atua no escopo de uma ou mais escolas vinculadas.
- Deve visualizar apenas dados das escolas vinculadas.
- Pode consultar dados escolares, turmas, alunos, professores, matriculas, disciplinas, diario e planejamento dentro da escola.
- Pode criar e editar turmas quando o endpoint exigir nivel 60.
- Pode vincular professor, disciplina, turma e carga horaria dentro da escola.
- Pode editar dados da escola quando a API permitir nivel 60.
- Quando um usuario recebe acesso `GESTOR_ESCOLAR` com `escolaId`, ele pode ser sincronizado como diretor da escola conforme regra do modulo de escolas/usuario-acessos.

Cuidados:
- Nao deve gerenciar usuarios de nivel maior que 60.
- Nao deve visualizar dados de toda a secretaria se possui escola especifica. Usar o escopo mais baixo/especifico.
- Ao remover ou trocar o acesso `GESTOR_ESCOLAR`, limpar o diretor da escola quando a escola ainda apontar para esse usuario.

## SECRETARIO_ESCOLAR - nivel 50

Perfil operacional da secretaria da escola.

Regras:
- Atua no escopo de uma ou mais escolas vinculadas.
- Pode consultar dados da escola, alunos, professores, turmas, matriculas e disciplinas dentro da escola.
- Pode operar matriculas quando o endpoint exigir nivel 50.
- Pode vincular professor, disciplina, turma e carga horaria quando explicitamente permitido.
- Pode apoiar rotinas administrativas escolares sem ter permissao ampla de secretaria municipal.

Cuidados:
- Nao deve criar perfil, acesso ou usuario com privilegio maior que 50.
- Nao deve alterar dados de escolas fora do seu vinculo.
- Nao deve fazer operacoes reservadas a secretaria municipal ou admin geral.

## COORDENADOR_PEDAGOGICO - nivel 45

Perfil pedagogico da escola ou rede.

Regras:
- Atua no escopo vinculado, normalmente escola ou secretaria.
- Pode consultar turmas, alunos, professores, disciplinas, diario de classe e planejamento pedagogico dentro do escopo.
- Pode acompanhar conteudos, observacoes, desempenho e planejamento.
- Pode acessar funcionalidades pedagogicas de leitura e acompanhamento.

Cuidados:
- Nao deve gerenciar usuarios, acessos ou perfis.
- Nao deve executar rotinas administrativas de secretaria se o endpoint exigir nivel maior.
- Escrita no diario de classe deve continuar restrita ao professor com vinculo docente ativo, salvo regra explicita para coordenacao.

## PROFESSOR - nivel 30

Perfil docente.

Regras:
- Atua nas turmas e disciplinas em que possui vinculo docente ativo.
- Pode visualizar suas turmas, alunos vinculados, disciplinas, diario de classe e planejamento necessario para as aulas.
- Pode registrar frequencia, aulas/conteudos, avaliacoes, notas e observacoes no diario quando possuir vinculo docente ativo com a turma/disciplina.
- Se tiver mais de uma disciplina na mesma turma, a listagem do diario deve agrupar em um unico card com multiplas disciplinas.
- O cadastro de professor depende de usuario. Usuario com perfil `PROFESSOR` ativo deve ter registro em `professores`.

Cuidados:
- Nao deve ver diario ou alunos de turmas sem vinculo, exceto se tiver outro perfil ativo que permita.
- Remover ou inativar o ultimo acesso `PROFESSOR` ativo deve inativar o cadastro de professor, preservando historico.
- Reativar professor deve depender de acesso `PROFESSOR` ativo, nao apenas de usuario ativo.

## AUDITOR - nivel 20

Perfil de auditoria.

Regras:
- Pode consultar logs de auditoria.
- Pode consultar dados necessarios para fiscalizacao quando o endpoint permitir leitura por escopo/nivel.
- Deve ter acesso preferencialmente somente leitura.

Cuidados:
- Nao deve criar, editar, remover ou inativar dados operacionais.
- Nao deve receber permissao administrativa indireta por estar acima do suporte tecnico.
- Auditoria deve esconder ou evitar expor dados sensiveis quando necessario.

## SUPORTE_TECNICO - nivel 10

Perfil minimo autenticado para suporte.

Regras:
- Pode autenticar e acessar rotas basicas liberadas para usuario com perfil ativo.
- Pode consultar informacoes de suporte quando o endpoint permitir nivel 10.
- Pode ajudar em diagnostico sem alterar dados de negocio.

Cuidados:
- Nao deve criar, editar ou excluir dados pedagogicos/administrativos.
- Nao deve acessar auditoria, perfis sensiveis ou dados fora do escopo.
- Endpoints com `NivelMinimo(10)` ainda devem aplicar filtro de escopo quando retornam dados reais.

## Regra de escopo para APIs

Ao criar endpoint novo:

1. Definir se a rota e leitura, escrita, inativacao ou delete fisico.
2. Definir nivel minimo ou perfis especificos.
3. Buscar o escopo do usuario autenticado no backend.
4. Se `escopo.global`, permitir conforme permissao.
5. Se houver `escolaIds`, filtrar por essas escolas.
6. Se nao houver escola e houver `secretariaIds`, filtrar pela secretaria.
7. Se nao houver escopo compativel, retornar 403.
8. Em escrita, validar se o recurso de destino pertence ao escopo antes de salvar.
9. Em atribuicao de perfil, bloquear perfil com nivel maior que `maiorNivel`.
10. Em listagens, nunca depender apenas do filtro enviado pelo frontend.

## Regra para Codex/agente

Antes de criar ou alterar APIs, permissoes ou regras de seguranca neste projeto, o agente deve consultar este arquivo e manter as regras acima como base.

Se uma nova regra do produto contrariar este documento, atualizar este arquivo junto com a implementacao.

Quando uma nova regra divergir de uma regra ja escrita neste documento ou em outro documento de regra do sistema, registrar a divergencia em um arquivo dentro da pasta versionada `changelog`.

O nome do arquivo deve seguir o padrao:

`dd-mm-yyyy-hh-mm--titulo-da-mudanca.md`

Cada arquivo de changelog deve explicar:

- regra antiga;
- regra nova;
- o que divergiu;
- motivo da mudanca;
- impacto esperado nas APIs, permissoes, escopos ou telas.

Sempre que o usuario pedir para o agente fazer commit, o agente tambem deve criar um resumo do commit em um arquivo dentro da pasta versionada `commits`.

O nome do arquivo deve seguir o mesmo padrao:

`dd-mm-yyyy-hh-mm--titulo-da-mudanca.md`

Cada arquivo de resumo de commit deve explicar:

- objetivo do commit;
- principais arquivos alterados;
- regras de negocio ou seguranca impactadas;
- validacoes executadas;
- observacoes importantes para continuidade.
