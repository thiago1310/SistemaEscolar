# Plano Pedagógico - Módulo Planejamento Pedagógico

## Resumo
Este documento orienta a criação do módulo `planejamento-pedagogico` no backend NestJS do Sistema Escolar. O PDF original propõe um módulo curricular com Prisma, PostgreSQL e Swagger; neste projeto a implementação deve ser ajustada para TypeScript, NestJS, TypeORM, MySQL, JWT, DTOs com `class-validator` e coleções Postman por módulo.

O objetivo é armazenar e consultar a estrutura curricular/pedagógica: documento curricular, ano/série, área do conhecimento, componente curricular, períodos, unidade temática, objeto de conhecimento e habilidades.

## Ajustes Em Relação Ao PDF
- Usar TypeORM/MySQL em vez de Prisma/PostgreSQL.
- Não criar `schema.prisma`, migrations Prisma ou `PrismaService`.
- Usar entidades TypeORM com `autoLoadEntities` e `synchronize: true`.
- Atualizar `sistema_educacional_base.sql` como referência documental.
- Criar `src/modules/planejamento-pedagogico`, seguindo o padrão atual do projeto.
- Usar DTOs com `class-validator`.
- Usar nomes de classes, métodos e variáveis em português.
- Criar `postman_planejamento_pedagogico.json`.
- Não depender de Swagger/Insomnia; o padrão do projeto é Postman.

## Modelagem Recomendada
Criar entidades em português:

- `DocumentoCurricular`: documento fonte do currículo, com `secretariaId`, título, município, UF, URL fonte, versão, ativo.
- `AnoSerieCurricular`: representa ano/série curricular, com código, etapa de ensino, número e rótulo.
- `AreaConhecimento`: área do conhecimento, com nome e slug.
- `ComponenteCurricular`: componente curricular, com área, nome, slug e `disciplinaId` opcional para vínculo com o módulo existente de disciplinas.
- `PlanoPedagogico`: combina documento, ano/série e componente curricular.
- `PeriodoPlanejamento`: representa trimestre, bimestre ou outro período, com tipo, número e rótulo.
- `UnidadeTematica`: unidade temática dentro de um plano.
- `ObjetoConhecimento`: objeto/conteúdo dentro de uma unidade temática.
- `HabilidadeCurricular`: habilidade curricular/BNCC, com código único e texto.
- `ItemPlanejamentoPedagogico`: item central de consulta, ligando plano, unidade, objeto, página fonte e ordem.
- `ItemPlanejamentoPeriodo`: relação N:N entre item e período.
- `ItemPlanejamentoHabilidade`: relação N:N entre item e habilidade.

## APIs Do Módulo
Usar o prefixo `/planejamento-pedagogico`.

- `GET /planejamento-pedagogico`: lista itens pedagógicos com filtros.
- `GET /planejamento-pedagogico/:id`: busca um item específico.
- `GET /planejamento-pedagogico/habilidades/:codigo`: busca itens por código de habilidade.
- `GET /planejamento-pedagogico/planos`: lista planos por documento, ano/série, área e componente.
- `GET /planejamento-pedagogico/opcoes`: retorna opções para filtros da tela, como anos/séries, áreas, componentes e períodos.
- `POST /planejamento-pedagogico/importar`: importa JSON revisado do currículo; permitido apenas para `ADMIN_GERAL` e `SECRETARIA_MUNICIPAL`.

Filtros principais de `GET /planejamento-pedagogico`:
- `secretariaId`
- `anoSerie`
- `etapaEnsino`
- `area`
- `componente`
- `disciplinaId`
- `periodo`
- `habilidade`
- `q`
- `pagina`
- `limite`

## Regras De Permissão
- Leitura com `@NivelMinimo(10)`, sempre respeitando escopo no backend.
- `ADMIN_GERAL` visualiza todos os documentos.
- Usuário com secretaria visualiza documentos daquela secretaria.
- Usuário com escola visualiza documentos da secretaria da escola, mantendo a regra do escopo mais específico.
- Importação e manutenção permitidas apenas para `ADMIN_GERAL` e `SECRETARIA_MUNICIPAL`.

## Métodos Sugeridos
No service, usar nomes em português:

- `listarItens(filtros, usuarioId)`
- `buscarPorId(id, usuarioId)`
- `buscarPorHabilidade(codigo, usuarioId)`
- `listarPlanos(filtros, usuarioId)`
- `listarOpcoes(usuarioId)`
- `importarPlanejamento(dados, usuarioId)`
- `normalizarItemImportado(item)`
- `gerarSlug(texto)`
- `garantirDocumentoPermitido(documento, usuarioId)`
- `obterSecretariasPermitidas(usuarioId)`
- `serializarItem(item)`

## Importação Dos Dados
A importação não deve ler o PDF diretamente para o banco. O fluxo correto é:

1. Extrair a tabela do PDF para um JSON intermediário.
2. Revisar manualmente uma amostra.
3. Normalizar células mescladas, repetindo unidade temática e objeto quando necessário.
4. Validar campos obrigatórios.
5. Importar via serviço TypeORM usando upsert lógico.
6. Conferir a resposta da API contra o documento original.

Formato base do JSON:

```json
[
  {
    "anoSerie": 1,
    "etapaEnsino": "Ensino Fundamental - Anos Iniciais",
    "area": "Linguagens",
    "componente": "Língua Portuguesa",
    "periodos": [1, 2, 3],
    "tipoPeriodo": "TRIMESTRE",
    "unidadeTematica": "Leitura/escuta compartilhada e autônoma",
    "objetoConhecimento": "Estratégia de leitura",
    "habilidades": [
      {
        "codigo": "EF15LP01",
        "texto": "Texto integral da habilidade."
      }
    ],
    "paginaFonte": 321,
    "ordem": 1
  }
]
```

## Integração Com Outros Módulos
- Reaproveitar `disciplinas` por meio de `disciplinaId` opcional em `ComponenteCurricular`.
- Não recriar APIs de disciplinas, turmas, professores ou alunos.
- O módulo de diário de classe poderá futuramente vincular aulas/conteúdos a `habilidadeCurricularId` ou `itemPlanejamentoPedagogicoId`.
- O planejamento pedagógico deve ser uma base curricular consultiva e reutilizável, não um cadastro duplicado de turmas ou anos letivos.

## Arquivos A Criar Ou Atualizar
- `src/modules/planejamento-pedagogico/planejamento-pedagogico.module.ts`
- `src/modules/planejamento-pedagogico/planejamento-pedagogico.controller.ts`
- `src/modules/planejamento-pedagogico/planejamento-pedagogico.service.ts`
- `src/modules/planejamento-pedagogico/planejamento-pedagogico.dto.ts`
- `src/modules/planejamento-pedagogico/planejamento-pedagogico.entities.ts`
- `src/modules/planejamento-pedagogico/postman_planejamento_pedagogico.json`
- `src/app.module.ts`
- `sistema_educacional_base.sql`

## Critérios De Aceite
- `npm.cmd run build` passa sem erro.
- `GET /planejamento-pedagogico/opcoes` retorna filtros reais.
- `GET /planejamento-pedagogico` retorna itens importados com unidade, objeto, períodos, habilidades e página fonte.
- Filtros por ano/série, área, componente, período e habilidade funcionam combinados.
- Busca por habilidade retorna todos os itens relacionados.
- Importação não duplica áreas, componentes, períodos ou habilidades.
- Todas as rotas respeitam escopo de secretaria/escola no backend.
