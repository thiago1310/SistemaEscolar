# Sistema Educacional Municipal — Orientações para desenvolvimento com Codex

Este documento consolida as decisões iniciais discutidas para orientar o desenvolvimento de um **Sistema de Gestão de Informações da Secretaria Municipal de Educação** com **módulo de Diário de Classe Online**.

A ideia é usar este README como referência para abrir tarefas no Codex, mantendo coerência entre banco de dados, arquitetura, perfis de acesso, módulos e prioridades de desenvolvimento.

---

## 1. Contexto do edital

O edital descreve a necessidade de uma solução no âmbito da Educação, contemplando uma ferramenta completa para gerenciamento das informações escolares, permitindo no mínimo:

- controle de matrículas;
- cadastro de alunos;
- cadastro de servidores;
- gestão de turmas;
- lançamento de notas;
- frequência escolar;
- pareceres descritivos;
- planejamento pedagógico;
- diário de classe eletrônico;
- relatórios educacionais;
- emissão de documentos escolares;
- acesso remoto por profissionais autorizados;
- registro integrado e seguro das atividades pedagógicas.

A proposta do sistema deve atender esses requisitos mínimos, mas a arquitetura deve ser preparada para crescer com módulos complementares no futuro.

---

## 2. Escopo inicial recomendado

O desenvolvimento deve começar pela base do sistema, antes do Diário de Classe.

Ordem recomendada:

```text
1. Autenticação, usuários, perfis e permissões
2. Cadastro da Secretaria Municipal
3. Cadastro de escolas
4. Cadastro de ano letivo
5. Cadastro de disciplinas/componentes curriculares
6. Gestão de turmas
7. Cadastro de alunos e matrículas
8. Diário de Classe Online
9. Relatórios e documentos
10. Dashboards e indicadores
```

O primeiro módulo técnico deve ser **usuários, perfis e escopos**, pois todos os outros módulos dependem de saber:

```text
Quem acessa?
O que pode fazer?
Em qual secretaria?
Em qual escola?
Em qual ano letivo?
Em qual turma?
Em qual disciplina?
```

---

## 3. Módulos principais do sistema

### 3.1. Administração Educacional

Responsável pela estrutura geral da rede municipal.

Funcionalidades previstas:

- cadastro da Secretaria Municipal de Educação;
- cadastro de escolas;
- cadastro de ano letivo;
- cadastro de disciplinas;
- cadastro de etapas/modalidades de ensino;
- cadastro de séries/anos;
- matriz curricular;
- calendário escolar;
- servidores;
- parâmetros gerais do sistema.

### 3.2. Alunos e Matrículas

Responsável pela vida escolar do aluno.

Funcionalidades previstas:

- cadastro de alunos;
- cadastro de responsáveis;
- matrícula;
- rematrícula;
- transferência;
- enturmação;
- histórico de movimentações;
- situação do aluno;
- documentos escolares vinculados.

### 3.3. Turmas

Responsável por organizar o vínculo entre escola, ano letivo, alunos, professores e disciplinas.

Funcionalidades previstas:

- cadastro de turmas;
- série/ano;
- turno;
- escola;
- ano letivo;
- professores da turma;
- disciplinas da turma;
- horários de aula;
- lista de alunos.

### 3.4. Diário de Classe Online

Módulo central para o professor.

Funcionalidades previstas:

- lançamento de frequência;
- lançamento de conteúdo ministrado;
- lançamento de avaliações;
- lançamento de notas;
- pareceres descritivos;
- planejamento pedagógico;
- ocorrências e observações;
- fechamento de período;
- bloqueio de edição após fechamento;
- reabertura mediante autorização;
- auditoria de alterações.

### 3.5. Relatórios e Documentos

Responsável pela emissão de documentos oficiais e gerenciais.

Funcionalidades previstas:

- boletim escolar;
- declaração de matrícula;
- declaração de frequência;
- histórico escolar;
- ata de resultado final;
- relatório de frequência;
- relatório de notas;
- relatório de matrículas;
- relatório por escola;
- exportações em PDF, CSV ou Excel.

---

## 4. Menu lateral sugerido

O menu deve ser dinâmico conforme o perfil do usuário.

Menu administrativo completo:

```text
Dashboard

Gestão da Rede
├── Secretaria Municipal
├── Escolas
├── Ano Letivo
├── Calendário Escolar
├── Etapas e Modalidades
├── Séries / Anos
├── Disciplinas
├── Matrizes Curriculares
└── Servidores

Alunos e Matrículas
├── Alunos
├── Matrículas
├── Rematrículas
├── Transferências
├── Enturmação
├── Responsáveis
└── Histórico Escolar

Turmas
├── Turmas
├── Professores da Turma
├── Horários de Aula
├── Componentes Curriculares
└── Lista de Alunos

Diário de Classe
├── Meus Diários
├── Frequência
├── Conteúdo Ministrado
├── Avaliações e Notas
├── Pareceres Descritivos
├── Planejamento Pedagógico
├── Ocorrências / Observações
└── Fechamento do Período

Relatórios e Documentos
├── Boletins
├── Declaração de Matrícula
├── Declaração de Frequência
├── Histórico Escolar
├── Ata de Resultado Final
├── Relatório de Frequência
├── Relatório de Notas
├── Relatório de Matrículas
├── Relatório por Escola
└── Exportações

Administração
├── Usuários
├── Perfis
├── Permissões
├── Vínculos de Acesso
├── Parâmetros do Sistema
├── Logs e Auditoria
├── Integrações
└── Backup / Importação
```

---

## 5. Perfis de usuário recomendados

### 5.1. ADMIN_GERAL

Perfil máximo do sistema.

Permissões:

- gerenciar secretarias;
- gerenciar escolas;
- gerenciar anos letivos;
- gerenciar usuários;
- gerenciar perfis;
- gerenciar permissões;
- configurar sistema;
- acessar auditoria;
- realizar suporte técnico.

Uso restrito.

---

### 5.2. SECRETARIA_MUNICIPAL

Perfil da equipe da Secretaria Municipal de Educação.

Permissões:

- visualizar a rede municipal;
- gerenciar escolas;
- gerenciar calendário;
- gerenciar ano letivo;
- acompanhar matrículas;
- acompanhar frequência e rendimento;
- visualizar relatórios consolidados;
- acompanhar pendências de diário.

Escopo típico:

```text
Secretaria Municipal inteira
```

---

### 5.3. GESTOR_ESCOLAR

Perfil de diretor ou gestor da unidade escolar.

Permissões:

- visualizar dados da escola;
- acompanhar alunos;
- acompanhar turmas;
- acompanhar professores;
- acompanhar frequência;
- acompanhar notas;
- acompanhar fechamento dos diários;
- emitir relatórios da escola.

Escopo típico:

```text
Uma escola específica
```

---

### 5.4. SECRETARIO_ESCOLAR

Perfil operacional da secretaria da escola.

Permissões:

- cadastrar aluno;
- atualizar dados cadastrais;
- realizar matrícula;
- realizar rematrícula;
- realizar transferência;
- emitir declarações;
- emitir histórico escolar;
- emitir boletins.

Não deve alterar notas e frequência sem permissão especial e auditoria.

---

### 5.5. COORDENADOR_PEDAGOGICO

Perfil de acompanhamento pedagógico.

Permissões:

- visualizar turmas;
- acompanhar planejamentos;
- acompanhar conteúdos ministrados;
- acompanhar pareceres;
- visualizar desempenho;
- acompanhar alunos com baixa frequência ou baixo rendimento;
- validar planejamento, se necessário.

---

### 5.6. PROFESSOR

Perfil de lançamento do diário.

Permissões:

- visualizar apenas suas turmas e disciplinas;
- lançar frequência;
- lançar conteúdo ministrado;
- lançar notas;
- lançar pareceres;
- registrar planejamento;
- fechar diário do período;
- emitir relatórios das próprias turmas.

Escopo típico:

```text
Escola + ano letivo + turma + disciplina
```

O professor não deve acessar turmas ou disciplinas que não estejam vinculadas a ele.

---

### 5.7. AUDITOR

Perfil somente leitura.

Permissões:

- consultar dados;
- emitir relatórios;
- visualizar logs;
- não alterar cadastros;
- não lançar diário;
- não excluir registros.

---

### 5.8. SUPORTE_TECNICO

Perfil técnico da prefeitura ou da empresa.

Permissões:

- criar usuários;
- resetar senha;
- verificar logs técnicos;
- configurar integrações;
- auxiliar no suporte.

Preferencialmente, não deve ter acesso amplo a dados pedagógicos sensíveis sem necessidade.

---

## 6. Regra central de autorização

O sistema deve usar o conceito:

```text
Perfil + Escopo
```

Onde:

```text
Perfil = o que o usuário pode fazer
Escopo = onde o usuário pode fazer
```

Exemplo:

```text
Usuário: Ana
Perfil: GESTOR_ESCOLAR
Escopo: Escola Municipal Centro / Ano Letivo 2026
```

Resultado:

```text
Ana pode executar ações de gestor apenas na Escola Municipal Centro, no ano letivo 2026.
```

Exemplo professor:

```text
Usuário: Carlos
Perfil: PROFESSOR
Escopo: Escola Municipal Centro / 5º Ano A / Matemática / 2026
```

Resultado:

```text
Carlos pode lançar diário apenas em Matemática do 5º Ano A em 2026.
```

---

## 7. Modelagem inicial do banco

O arquivo SQL inicial deste projeto deve conter a base para:

- secretarias;
- escolas;
- anos letivos;
- usuários;
- perfis;
- permissões;
- perfil_permissoes;
- usuario_acessos;
- disciplinas;
- sessões;
- auditoria.

Nome sugerido do arquivo:

```text
sistema_educacional_base.sql
```

---

## 8. Tabelas principais

### 8.1. `secretarias`

Representa a Secretaria Municipal de Educação.

Campos principais:

- id;
- nome;
- municipio;
- uf;
- cnpj;
- telefone;
- email;
- ativa;
- created_at;
- updated_at.

Relacionamento:

```text
secretarias 1:N escolas
secretarias 1:N anos_letivos
```

---

### 8.2. `escolas`

Representa as unidades escolares.

Campos principais:

- id;
- secretaria_id;
- nome;
- codigo_inep;
- cnpj;
- telefone;
- email;
- endereço;
- municipio;
- uf;
- ativa;
- created_at;
- updated_at.

---

### 8.3. `anos_letivos`

Representa o ano letivo da rede.

Campos principais:

- id;
- secretaria_id;
- ano;
- descricao;
- data_inicio;
- data_fim;
- status;
- ativo;
- created_at;
- updated_at.

Status sugeridos:

```text
PLANEJAMENTO
ABERTO
FECHADO
ARQUIVADO
```

Regra:

```text
Uma secretaria pode ter vários anos letivos, mas normalmente apenas um ativo como padrão.
```

---

### 8.4. `usuarios`

Representa os usuários do sistema.

Campos principais:

- id;
- nome;
- cpf;
- email;
- telefone;
- username;
- senha_hash;
- origem_auth;
- ativo;
- primeiro_acesso;
- ultimo_login_at;
- created_at;
- updated_at;
- deleted_at.

Origens de autenticação previstas:

```text
LOCAL
LDAP
ACTIVE_DIRECTORY
OIDC
GOOGLE
MICROSOFT
```

O sistema deve começar com autenticação local, mas a modelagem deve permitir integração futura.

---

### 8.5. `perfis`

Representa os papéis do sistema.

Campos principais:

- id;
- nome;
- codigo;
- descricao;
- nivel;
- sistema;
- ativo;
- created_at;
- updated_at.

Perfis iniciais:

```text
ADMIN_GERAL
SECRETARIA_MUNICIPAL
GESTOR_ESCOLAR
SECRETARIO_ESCOLAR
COORDENADOR_PEDAGOGICO
PROFESSOR
AUDITOR
SUPORTE_TECNICO
```

---

### 8.6. `permissoes`

Representa ações específicas que podem ser liberadas.

Campos principais:

- id;
- modulo;
- acao;
- codigo;
- descricao;
- created_at.

Exemplos:

```text
usuarios.visualizar
usuarios.criar
usuarios.editar
usuarios.bloquear
usuarios.resetar_senha

escolas.visualizar
escolas.criar
escolas.editar
escolas.inativar

anos_letivos.visualizar
anos_letivos.criar
anos_letivos.editar
anos_letivos.abrir
anos_letivos.fechar

diario.visualizar
diario.lancar_frequencia
diario.lancar_notas
diario.lancar_conteudo
diario.fechar
diario.reabrir
```

---

### 8.7. `perfil_permissoes`

Relacionamento N:N entre perfis e permissões.

Regra:

```text
Um perfil pode ter várias permissões.
Uma permissão pode estar em vários perfis.
```

---

### 8.8. `usuario_acessos`

Tabela central de autorização.

Ela substitui tabelas separadas como `usuario_secretarias` e `usuario_escolas`.

A tabela representa:

```text
Usuário X possui Perfil Y no Escopo Z
```

Campos principais:

- id;
- usuario_id;
- perfil_id;
- secretaria_id;
- escola_id;
- ano_letivo_id;
- ativo;
- created_at;
- updated_at.

Exemplos:

Admin geral:

```text
usuario_id: admin
perfil_id: ADMIN_GERAL
secretaria_id: null
escola_id: null
ano_letivo_id: null
```

Secretaria Municipal:

```text
usuario_id: maria
perfil_id: SECRETARIA_MUNICIPAL
secretaria_id: Secretaria Municipal
escola_id: null
ano_letivo_id: 2026
```

Diretor:

```text
usuario_id: ana
perfil_id: GESTOR_ESCOLAR
secretaria_id: Secretaria Municipal
escola_id: Escola Municipal Centro
ano_letivo_id: 2026
```

Professor:

```text
usuario_id: carlos
perfil_id: PROFESSOR
secretaria_id: Secretaria Municipal
escola_id: Escola Municipal Centro
ano_letivo_id: 2026
```

A vinculação específica do professor com turma e disciplina deve ser feita em tabela própria no módulo de turmas/diário.

---

### 8.9. `disciplinas`

Representa componentes curriculares.

Campos principais:

- id;
- secretaria_id;
- nome;
- codigo;
- ativa;
- created_at;
- updated_at.

---

### 8.10. `usuario_sessoes`

Representa sessões ou refresh tokens ativos.

Campos principais:

- id;
- usuario_id;
- refresh_token_hash;
- ip;
- user_agent;
- expiracao;
- revogada;
- created_at.

Útil para:

- logout;
- revogação de sessão;
- auditoria de acesso;
- segurança.

---

### 8.11. `auditoria_logs`

Registra alterações importantes.

Campos principais:

- id;
- usuario_id;
- entidade;
- entidade_id;
- acao;
- dados_antes;
- dados_depois;
- ip;
- user_agent;
- created_at.

Deve responder:

```text
Quem alterou?
Quando alterou?
O que alterou?
Qual era o valor anterior?
Qual é o valor novo?
```

---

## 9. Primeiro administrador do sistema

Não é recomendado cadastrar o administrador diretamente no banco em produção.

### Forma recomendada

Criar um comando de bootstrap/seed:

```bash
npm run seed:admin
```

Ou:

```bash
npm run setup
```

Esse comando deve criar:

```text
1. Permissões padrão
2. Perfis padrão
3. Usuário administrador inicial
4. Vínculo do administrador ao perfil ADMIN_GERAL
```

Variáveis sugeridas no `.env`:

```env
ADMIN_NAME=Administrador
ADMIN_EMAIL=admin@sistema.com
ADMIN_PASSWORD=Trocar@123
```

O usuário inicial deve ser criado com:

```text
primeiro_acesso = true
```

Assim, o sistema obriga a troca de senha no primeiro login.

### Alternativa elegante

Tela de primeira configuração:

```text
Se não existir nenhum ADMIN_GERAL no banco:
    exibir tela para criar primeiro administrador
Senão:
    bloquear essa tela
```

Essa alternativa é boa, mas exige cuidado extra de segurança.

---

## 10. Regras de segurança

O sistema deve possuir:

- senhas com hash seguro;
- nunca salvar senha em texto puro;
- controle de acesso por perfil e escopo;
- logs de auditoria;
- soft delete em usuários;
- bloqueio de usuário;
- controle de primeiro acesso;
- expiração/revogação de sessão;
- proteção contra acesso indevido;
- HTTPS em produção;
- preparação para LGPD.

Sugestão de hash:

```text
bcrypt
argon2
```

Preferir `argon2` se estiver disponível no stack.

---

## 11. Regras para o Codex implementar

Ao pedir tarefas para o Codex, seguir este padrão:

```text
Implemente apenas o módulo solicitado.
Não misture com módulos futuros.
Mantenha compatibilidade com a modelagem do banco.
Use Perfil + Escopo para autorização.
Inclua validações.
Inclua tratamento de erros.
Inclua auditoria nas alterações sensíveis.
Não exponha dados de outras escolas fora do escopo do usuário.
```

---

## 12. Sugestão de stack

Caso o projeto seja feito com NestJS:

Backend:

```text
NestJS
TypeScript
PostgreSQL
Prisma ou TypeORM
JWT
Refresh Token
bcrypt ou argon2
class-validator
Swagger/OpenAPI
```

Frontend:

```text
React ou Next.js
TypeScript
shadcn/ui ou Material UI
React Hook Form
Zod
TanStack Query
```

Banco:

```text
PostgreSQL
UUID como chave primária
JSONB para auditoria
timestamps em todas as tabelas principais
soft delete onde fizer sentido
```

---

## 13. Próximos pedidos recomendados para o Codex

### Pedido 1 — Criar estrutura inicial do backend

```text
Crie a estrutura inicial de um backend NestJS para o Sistema Educacional Municipal, usando PostgreSQL e Prisma, com módulos de autenticação, usuários, perfis, permissões, secretaria, escolas e anos letivos. Siga a modelagem descrita no README.md.
```

### Pedido 2 — Criar migrations

```text
Crie as migrations do banco de dados PostgreSQL conforme a modelagem do README.md, incluindo as tabelas secretarias, escolas, anos_letivos, usuarios, perfis, permissoes, perfil_permissoes, usuario_acessos, disciplinas, usuario_sessoes e auditoria_logs.
```

### Pedido 3 — Criar seed inicial

```text
Crie um seed inicial que cadastre perfis, permissões padrão e um usuário ADMIN_GERAL inicial usando variáveis de ambiente ADMIN_NAME, ADMIN_EMAIL e ADMIN_PASSWORD. O usuário deve ser criado com primeiro_acesso = true.
```

### Pedido 4 — Criar autenticação

```text
Implemente autenticação local com login, senha, JWT access token e refresh token. Use hash seguro de senha e salve sessões na tabela usuario_sessoes.
```

### Pedido 5 — Criar autorização

```text
Implemente controle de autorização baseado em Perfil + Escopo. O usuário só pode acessar recursos compatíveis com seus registros em usuario_acessos e com as permissões associadas ao seu perfil.
```

### Pedido 6 — Criar CRUD inicial

```text
Implemente CRUD completo para Secretaria Municipal, Escolas e Anos Letivos, aplicando validações, permissões e registros de auditoria.
```

### Pedido 7 — Criar frontend administrativo

```text
Crie o frontend administrativo com menu lateral dinâmico por perfil, contendo Dashboard, Gestão da Rede, Administração, Usuários, Perfis, Permissões, Secretaria Municipal, Escolas e Ano Letivo.
```

---

## 14. Decisões importantes já tomadas

- Usar `usuario_acessos` em vez de tabelas separadas `usuario_secretarias` e `usuario_escolas`.
- Usar a lógica `Perfil + Escopo`.
- Começar pelo núcleo de segurança e cadastros institucionais.
- Não iniciar pelo Diário de Classe antes da base de escola, ano letivo, turmas, alunos e vínculos.
- Primeiro administrador deve ser criado por seed/bootstrap, não manualmente direto no banco em produção.
- LDAP/AD pode ser uma integração futura, mas o sistema deve funcionar com autenticação local própria.
- Professor só deve lançar diário onde houver vínculo específico com turma e disciplina.
- Auditoria deve existir desde o início para alterações sensíveis.

---

## 15. Observação sobre LDAP/AD

LDAP ou Active Directory é interessante como integração opcional, principalmente para servidores, professores, coordenadores e diretores.

Mas o sistema não deve depender obrigatoriamente de LDAP.

Arquitetura recomendada:

```text
Autenticação local própria
+ Integração opcional com LDAP/AD/OIDC no futuro
```

Mesmo com LDAP, o sistema precisa manter internamente:

```text
usuário
perfil
escopo
permissões
vínculos com escola/turma/disciplina
```

O LDAP pode autenticar, mas a autorização deve continuar sendo controlada pelo sistema.

---

## 16. Regra de ouro

Nunca confiar apenas no frontend para controlar acesso.

Toda regra de perfil e escopo deve ser validada no backend.

Exemplo:

```text
Mesmo que o menu do professor esconda outras escolas,
a API também deve bloquear qualquer tentativa de acessar dados fora do escopo dele.
```

---

## 17. MVP inicial sugerido

O MVP inicial deve entregar:

```text
Login
Logout
Refresh token
Primeiro acesso / troca de senha
CRUD de Secretaria
CRUD de Escolas
CRUD de Ano Letivo
CRUD de Usuários
CRUD de Perfis
CRUD de Permissões
Vínculo de usuário a perfil e escopo
Menu lateral dinâmico por perfil
Auditoria básica
```

Depois disso, avançar para:

```text
Turmas
Alunos
Matrículas
Diário de Classe
Relatórios
```

---

## 18. Convenções sugeridas

### Códigos de perfis

Usar caixa alta com underline:

```text
ADMIN_GERAL
SECRETARIA_MUNICIPAL
GESTOR_ESCOLAR
SECRETARIO_ESCOLAR
COORDENADOR_PEDAGOGICO
PROFESSOR
AUDITOR
SUPORTE_TECNICO
```

### Códigos de permissões

Usar padrão:

```text
modulo.acao
```

Exemplos:

```text
usuarios.criar
usuarios.editar
escolas.visualizar
anos_letivos.fechar
diario.lancar_notas
```

### Status de ano letivo

```text
PLANEJAMENTO
ABERTO
FECHADO
ARQUIVADO
```

### Origem de autenticação

```text
LOCAL
LDAP
ACTIVE_DIRECTORY
OIDC
GOOGLE
MICROSOFT
```

---

## 19. Cuidados de LGPD

O sistema manipula dados pessoais de alunos, responsáveis e servidores.

Desde o início, considerar:

- menor privilégio possível;
- acesso por escopo;
- logs de auditoria;
- justificativa para acesso técnico;
- proteção de dados sensíveis;
- backup seguro;
- exportação dos dados ao fim de contrato;
- rastreabilidade de alterações;
- política de retenção.

---

## 20. Resumo da arquitetura de acesso

```text
usuarios
    ↓
usuario_acessos
    ↓
perfis
    ↓
perfil_permissoes
    ↓
permissoes
```

Com escopo:

```text
secretaria_id
escola_id
ano_letivo_id
```

E, futuramente para professor:

```text
turma_id
disciplina_id
```

Preferencialmente, turma e disciplina devem entrar em tabela própria de vínculo docente, e não diretamente em `usuario_acessos`.

---

## 21. Frase guia para desenvolvimento

> O sistema deve garantir que cada usuário execute apenas as ações permitidas pelo seu perfil, dentro do escopo institucional autorizado, respeitando secretaria, escola, ano letivo, turma e disciplina quando aplicável.

