# Resumo do commit: orientacoes Codex e perfis

## Objetivo do commit

Documentar as regras de perfis, escopos e comportamento esperado do agente Codex ao alterar APIs, permissoes e seguranca do Sistema Escolar.

## Principais arquivos alterados

- `.codex/perfils.md`: descreve regras por perfil, hierarquia, escopo e orientacoes para novas APIs.
- `.codex/agents.md`: mantem as orientacoes gerais do projeto em TypeScript/NestJS/MySQL.
- `changelog/.gitkeep`: cria a pasta versionada para registrar divergencias de regras.
- `commits/.gitkeep`: cria a pasta versionada para resumos de commit.
- `commits/30-06-2026-22-11--orientacoes-codex-perfis.md`: registra este resumo.

## Regras de negocio ou seguranca impactadas

- Perfis passam a ter descricao operacional documentada.
- Regras de escopo por secretaria/escola ficam registradas para orientar novas APIs.
- Divergencias futuras entre regra antiga e nova devem ser registradas em `changelog`.
- Todo pedido de commit deve gerar resumo versionado em `commits`.

## Validacoes executadas

- Revisao manual do conteudo documentado.
- Conferencia do `git status` antes do commit.

## Observacoes importantes para continuidade

- Os arquivos de orientacao foram organizados dentro de `.codex`.
- Quando uma regra de produto contrariar a documentacao, atualizar a regra e criar changelog da divergencia.
