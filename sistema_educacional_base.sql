-- =========================================================
-- Sistema Educacional - Base inicial
-- Módulos:
-- 1. Secretaria Municipal
-- 2. Escolas
-- 3. Ano Letivo
-- 4. Usuários
-- 5. Perfis e Permissões
-- 6. Escopos de acesso por usuário
-- 7. Disciplinas
-- 8. Sessões
-- 9. Auditoria
-- Banco sugerido: PostgreSQL
-- =========================================================

BEGIN;

-- Extensões úteis
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================
-- Tipos ENUM
-- =========================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ano_letivo_status') THEN
        CREATE TYPE ano_letivo_status AS ENUM (
            'PLANEJAMENTO',
            'ABERTO',
            'FECHADO',
            'ARQUIVADO'
        );
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'origem_auth_tipo') THEN
        CREATE TYPE origem_auth_tipo AS ENUM (
            'LOCAL',
            'LDAP',
            'ACTIVE_DIRECTORY',
            'OIDC',
            'GOOGLE',
            'MICROSOFT'
        );
    END IF;
END$$;

-- =========================================================
-- Função para atualizar updated_at automaticamente
-- =========================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- Secretaria Municipal
-- =========================================================

CREATE TABLE IF NOT EXISTS secretarias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    municipio VARCHAR(150) NOT NULL,
    uf CHAR(2) NOT NULL,
    cnpj VARCHAR(20),
    telefone VARCHAR(30),
    email VARCHAR(150),
    ativa BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_secretarias_updated_at
BEFORE UPDATE ON secretarias
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- Escolas
-- =========================================================

CREATE TABLE IF NOT EXISTS escolas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    secretaria_id UUID NOT NULL REFERENCES secretarias(id) ON DELETE RESTRICT,
    nome VARCHAR(255) NOT NULL,
    codigo_inep VARCHAR(30),
    cnpj VARCHAR(20),
    telefone VARCHAR(30),
    email VARCHAR(150),
    cep VARCHAR(20),
    endereco VARCHAR(255),
    numero VARCHAR(20),
    complemento VARCHAR(100),
    bairro VARCHAR(150),
    municipio VARCHAR(150),
    uf CHAR(2),
    ativa BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_escolas_secretaria_nome UNIQUE (secretaria_id, nome),
    CONSTRAINT uq_escolas_codigo_inep UNIQUE (codigo_inep)
);

CREATE INDEX IF NOT EXISTS idx_escolas_secretaria_id ON escolas(secretaria_id);

CREATE TRIGGER trg_escolas_updated_at
BEFORE UPDATE ON escolas
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- Anos Letivos
-- =========================================================

CREATE TABLE IF NOT EXISTS anos_letivos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    secretaria_id UUID NOT NULL REFERENCES secretarias(id) ON DELETE RESTRICT,
    ano INTEGER NOT NULL,
    descricao VARCHAR(100),
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    status ano_letivo_status NOT NULL DEFAULT 'PLANEJAMENTO',
    ativo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_anos_letivos_secretaria_ano UNIQUE (secretaria_id, ano),
    CONSTRAINT ck_anos_letivos_periodo CHECK (data_fim >= data_inicio)
);

CREATE INDEX IF NOT EXISTS idx_anos_letivos_secretaria_id ON anos_letivos(secretaria_id);
CREATE INDEX IF NOT EXISTS idx_anos_letivos_status ON anos_letivos(status);

CREATE TRIGGER trg_anos_letivos_updated_at
BEFORE UPDATE ON anos_letivos
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Garante somente um ano letivo ativo por secretaria
CREATE UNIQUE INDEX IF NOT EXISTS uq_ano_letivo_ativo_por_secretaria
ON anos_letivos(secretaria_id)
WHERE ativo = TRUE;

-- =========================================================
-- Usuários
-- =========================================================

CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(20),
    email VARCHAR(150),
    telefone VARCHAR(30),
    data_nascimento DATE,
    cargo VARCHAR(100),
    observacoes TEXT,
    username VARCHAR(100),
    senha_hash TEXT,
    origem_auth origem_auth_tipo NOT NULL DEFAULT 'LOCAL',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    primeiro_acesso BOOLEAN NOT NULL DEFAULT TRUE,
    ultimo_login_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,
    CONSTRAINT uq_usuarios_cpf UNIQUE (cpf),
    CONSTRAINT uq_usuarios_email UNIQUE (email),
    CONSTRAINT uq_usuarios_username UNIQUE (username),
    CONSTRAINT ck_usuario_login CHECK (
        email IS NOT NULL OR username IS NOT NULL OR cpf IS NOT NULL
    )
);

CREATE INDEX IF NOT EXISTS idx_usuarios_nome ON usuarios(nome);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios(ativo);
CREATE INDEX IF NOT EXISTS idx_usuarios_deleted_at ON usuarios(deleted_at);

CREATE TRIGGER trg_usuarios_updated_at
BEFORE UPDATE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- Perfis
-- =========================================================

CREATE TABLE IF NOT EXISTS perfis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(150) NOT NULL,
    codigo VARCHAR(80) NOT NULL UNIQUE,
    descricao TEXT,
    nivel INTEGER NOT NULL DEFAULT 0,
    sistema BOOLEAN NOT NULL DEFAULT FALSE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_perfis_codigo ON perfis(codigo);
CREATE INDEX IF NOT EXISTS idx_perfis_ativo ON perfis(ativo);

CREATE TRIGGER trg_perfis_updated_at
BEFORE UPDATE ON perfis
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- Permissões
-- =========================================================

CREATE TABLE IF NOT EXISTS permissoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    modulo VARCHAR(100) NOT NULL,
    acao VARCHAR(100) NOT NULL,
    codigo VARCHAR(150) NOT NULL UNIQUE,
    descricao TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_permissoes_modulo_acao UNIQUE (modulo, acao)
);

CREATE INDEX IF NOT EXISTS idx_permissoes_codigo ON permissoes(codigo);
CREATE INDEX IF NOT EXISTS idx_permissoes_modulo ON permissoes(modulo);

-- =========================================================
-- Permissões dos Perfis
-- =========================================================

CREATE TABLE IF NOT EXISTS perfil_permissoes (
    perfil_id UUID NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
    permissao_id UUID NOT NULL REFERENCES permissoes(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (perfil_id, permissao_id)
);

CREATE INDEX IF NOT EXISTS idx_perfil_permissoes_perfil_id ON perfil_permissoes(perfil_id);
CREATE INDEX IF NOT EXISTS idx_perfil_permissoes_permissao_id ON perfil_permissoes(permissao_id);

-- =========================================================
-- Acessos do Usuário
-- Perfil + Escopo
-- =========================================================

CREATE TABLE IF NOT EXISTS usuario_acessos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    perfil_id UUID NOT NULL REFERENCES perfis(id) ON DELETE RESTRICT,
    secretaria_id UUID REFERENCES secretarias(id) ON DELETE RESTRICT,
    escola_id UUID REFERENCES escolas(id) ON DELETE RESTRICT,
    ano_letivo_id UUID REFERENCES anos_letivos(id) ON DELETE RESTRICT,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Evita duplicidade do mesmo perfil no mesmo escopo.
    -- COALESCE é usado porque UNIQUE normal permite múltiplos NULL.
    CONSTRAINT ck_usuario_acessos_escopo_consistente CHECK (
        NOT (escola_id IS NOT NULL AND secretaria_id IS NULL)
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_usuario_acessos_escopo
ON usuario_acessos (
    usuario_id,
    perfil_id,
    COALESCE(secretaria_id, '00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE(escola_id, '00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE(ano_letivo_id, '00000000-0000-0000-0000-000000000000'::uuid)
);

CREATE INDEX IF NOT EXISTS idx_usuario_acessos_usuario_id ON usuario_acessos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuario_acessos_perfil_id ON usuario_acessos(perfil_id);
CREATE INDEX IF NOT EXISTS idx_usuario_acessos_secretaria_id ON usuario_acessos(secretaria_id);
CREATE INDEX IF NOT EXISTS idx_usuario_acessos_escola_id ON usuario_acessos(escola_id);
CREATE INDEX IF NOT EXISTS idx_usuario_acessos_ano_letivo_id ON usuario_acessos(ano_letivo_id);
CREATE INDEX IF NOT EXISTS idx_usuario_acessos_ativo ON usuario_acessos(ativo);

CREATE TRIGGER trg_usuario_acessos_updated_at
BEFORE UPDATE ON usuario_acessos
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- Disciplinas / Componentes Curriculares
-- =========================================================

CREATE TABLE IF NOT EXISTS disciplinas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    secretaria_id UUID NOT NULL REFERENCES secretarias(id) ON DELETE RESTRICT,
    nome VARCHAR(150) NOT NULL,
    codigo VARCHAR(50),
    ativa BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_disciplinas_secretaria_nome UNIQUE (secretaria_id, nome),
    CONSTRAINT uq_disciplinas_secretaria_codigo UNIQUE (secretaria_id, codigo)
);

CREATE INDEX IF NOT EXISTS idx_disciplinas_secretaria_id ON disciplinas(secretaria_id);
CREATE INDEX IF NOT EXISTS idx_disciplinas_ativa ON disciplinas(ativa);

CREATE TRIGGER trg_disciplinas_updated_at
BEFORE UPDATE ON disciplinas
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- Sessões / Refresh Tokens
-- =========================================================

CREATE TABLE IF NOT EXISTS usuario_sessoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    refresh_token_hash TEXT NOT NULL,
    ip VARCHAR(100),
    user_agent TEXT,
    expiracao TIMESTAMP NOT NULL,
    revogada BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuario_sessoes_usuario_id ON usuario_sessoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuario_sessoes_expiracao ON usuario_sessoes(expiracao);
CREATE INDEX IF NOT EXISTS idx_usuario_sessoes_revogada ON usuario_sessoes(revogada);

-- =========================================================
-- Auditoria
-- =========================================================

CREATE TABLE IF NOT EXISTS auditoria_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    entidade VARCHAR(100) NOT NULL,
    entidade_id UUID,
    acao VARCHAR(50) NOT NULL,
    dados_antes JSONB,
    dados_depois JSONB,
    ip VARCHAR(100),
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auditoria_logs_usuario_id ON auditoria_logs(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_logs_entidade ON auditoria_logs(entidade);
CREATE INDEX IF NOT EXISTS idx_auditoria_logs_entidade_id ON auditoria_logs(entidade_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_logs_created_at ON auditoria_logs(created_at);

-- =========================================================
-- Seeds de Perfis
-- =========================================================

INSERT INTO perfis (nome, codigo, descricao, nivel, sistema, ativo)
VALUES
    ('Administrador Geral', 'ADMIN_GERAL', 'Acesso administrativo global ao sistema.', 100, TRUE, TRUE),
    ('Secretaria Municipal', 'SECRETARIA_MUNICIPAL', 'Acesso gerencial à rede municipal de ensino.', 80, TRUE, TRUE),
    ('Gestor Escolar', 'GESTOR_ESCOLAR', 'Acesso de direção/gestão da escola.', 60, TRUE, TRUE),
    ('Secretário Escolar', 'SECRETARIO_ESCOLAR', 'Acesso administrativo escolar, matrículas e documentos.', 50, TRUE, TRUE),
    ('Coordenador Pedagógico', 'COORDENADOR_PEDAGOGICO', 'Acesso pedagógico para acompanhamento de turmas e diários.', 45, TRUE, TRUE),
    ('Professor', 'PROFESSOR', 'Acesso ao diário de classe das próprias turmas.', 30, TRUE, TRUE),
    ('Auditor/Consulta', 'AUDITOR', 'Acesso de consulta e auditoria.', 20, TRUE, TRUE),
    ('Suporte Técnico', 'SUPORTE_TECNICO', 'Acesso técnico restrito para suporte operacional.', 10, TRUE, TRUE)
ON CONFLICT (codigo) DO UPDATE SET
    nome = EXCLUDED.nome,
    descricao = EXCLUDED.descricao,
    nivel = EXCLUDED.nivel,
    sistema = EXCLUDED.sistema,
    ativo = EXCLUDED.ativo,
    updated_at = NOW();

-- =========================================================
-- Seeds de Permissões
-- =========================================================

INSERT INTO permissoes (modulo, acao, codigo, descricao)
VALUES
    ('usuarios', 'visualizar', 'usuarios.visualizar', 'Visualizar usuários.'),
    ('usuarios', 'criar', 'usuarios.criar', 'Criar usuários.'),
    ('usuarios', 'editar', 'usuarios.editar', 'Editar usuários.'),
    ('usuarios', 'bloquear', 'usuarios.bloquear', 'Bloquear usuários.'),
    ('usuarios', 'resetar_senha', 'usuarios.resetar_senha', 'Resetar senha de usuários.'),

    ('perfis', 'visualizar', 'perfis.visualizar', 'Visualizar perfis.'),
    ('perfis', 'criar', 'perfis.criar', 'Criar perfis.'),
    ('perfis', 'editar', 'perfis.editar', 'Editar perfis.'),
    ('perfis', 'atribuir', 'perfis.atribuir', 'Atribuir perfis a usuários.'),

    ('secretarias', 'visualizar', 'secretarias.visualizar', 'Visualizar secretarias.'),
    ('secretarias', 'criar', 'secretarias.criar', 'Criar secretarias.'),
    ('secretarias', 'editar', 'secretarias.editar', 'Editar secretarias.'),

    ('escolas', 'visualizar', 'escolas.visualizar', 'Visualizar escolas.'),
    ('escolas', 'criar', 'escolas.criar', 'Criar escolas.'),
    ('escolas', 'editar', 'escolas.editar', 'Editar escolas.'),
    ('escolas', 'inativar', 'escolas.inativar', 'Inativar escolas.'),

    ('anos_letivos', 'visualizar', 'anos_letivos.visualizar', 'Visualizar anos letivos.'),
    ('anos_letivos', 'criar', 'anos_letivos.criar', 'Criar anos letivos.'),
    ('anos_letivos', 'editar', 'anos_letivos.editar', 'Editar anos letivos.'),
    ('anos_letivos', 'abrir', 'anos_letivos.abrir', 'Abrir ano letivo.'),
    ('anos_letivos', 'fechar', 'anos_letivos.fechar', 'Fechar ano letivo.'),

    ('disciplinas', 'visualizar', 'disciplinas.visualizar', 'Visualizar disciplinas.'),
    ('disciplinas', 'criar', 'disciplinas.criar', 'Criar disciplinas.'),
    ('disciplinas', 'editar', 'disciplinas.editar', 'Editar disciplinas.'),

    ('auditoria', 'visualizar', 'auditoria.visualizar', 'Visualizar logs de auditoria.'),

    ('alunos', 'visualizar', 'alunos.visualizar', 'Visualizar alunos.'),
    ('alunos', 'criar', 'alunos.criar', 'Criar alunos.'),
    ('alunos', 'editar', 'alunos.editar', 'Editar alunos.'),

    ('matriculas', 'visualizar', 'matriculas.visualizar', 'Visualizar matrículas.'),
    ('matriculas', 'criar', 'matriculas.criar', 'Criar matrículas.'),
    ('matriculas', 'editar', 'matriculas.editar', 'Editar matrículas.'),
    ('matriculas', 'transferir', 'matriculas.transferir', 'Transferir alunos.'),
    ('matriculas', 'cancelar', 'matriculas.cancelar', 'Cancelar matrículas.'),

    ('diario', 'visualizar', 'diario.visualizar', 'Visualizar diário de classe.'),
    ('diario', 'lancar_frequencia', 'diario.lancar_frequencia', 'Lançar frequência.'),
    ('diario', 'lancar_notas', 'diario.lancar_notas', 'Lançar notas.'),
    ('diario', 'lancar_conteudo', 'diario.lancar_conteudo', 'Lançar conteúdo ministrado.'),
    ('diario', 'lancar_parecer', 'diario.lancar_parecer', 'Lançar parecer descritivo.'),
    ('diario', 'fechar', 'diario.fechar', 'Fechar diário/período.'),
    ('diario', 'reabrir', 'diario.reabrir', 'Reabrir diário/período.'),

    ('relatorios', 'visualizar', 'relatorios.visualizar', 'Visualizar relatórios.'),
    ('documentos', 'emitir', 'documentos.emitir', 'Emitir documentos escolares.')
ON CONFLICT (codigo) DO UPDATE SET
    modulo = EXCLUDED.modulo,
    acao = EXCLUDED.acao,
    descricao = EXCLUDED.descricao;

-- =========================================================
-- Associação de permissões aos perfis padrão
-- =========================================================

-- ADMIN_GERAL recebe todas as permissões
INSERT INTO perfil_permissoes (perfil_id, permissao_id)
SELECT p.id, pe.id
FROM perfis p
CROSS JOIN permissoes pe
WHERE p.codigo = 'ADMIN_GERAL'
ON CONFLICT DO NOTHING;

-- SECRETARIA_MUNICIPAL
INSERT INTO perfil_permissoes (perfil_id, permissao_id)
SELECT p.id, pe.id
FROM perfis p
JOIN permissoes pe ON pe.codigo IN (
    'usuarios.visualizar',
    'usuarios.criar',
    'usuarios.editar',
    'perfis.visualizar',
    'perfis.atribuir',
    'secretarias.visualizar',
    'secretarias.editar',
    'escolas.visualizar',
    'escolas.criar',
    'escolas.editar',
    'anos_letivos.visualizar',
    'anos_letivos.criar',
    'anos_letivos.editar',
    'anos_letivos.abrir',
    'anos_letivos.fechar',
    'disciplinas.visualizar',
    'disciplinas.criar',
    'disciplinas.editar',
    'alunos.visualizar',
    'matriculas.visualizar',
    'diario.visualizar',
    'relatorios.visualizar',
    'documentos.emitir',
    'auditoria.visualizar'
)
WHERE p.codigo = 'SECRETARIA_MUNICIPAL'
ON CONFLICT DO NOTHING;

-- GESTOR_ESCOLAR
INSERT INTO perfil_permissoes (perfil_id, permissao_id)
SELECT p.id, pe.id
FROM perfis p
JOIN permissoes pe ON pe.codigo IN (
    'usuarios.visualizar',
    'escolas.visualizar',
    'anos_letivos.visualizar',
    'disciplinas.visualizar',
    'alunos.visualizar',
    'matriculas.visualizar',
    'diario.visualizar',
    'relatorios.visualizar',
    'documentos.emitir'
)
WHERE p.codigo = 'GESTOR_ESCOLAR'
ON CONFLICT DO NOTHING;

-- SECRETARIO_ESCOLAR
INSERT INTO perfil_permissoes (perfil_id, permissao_id)
SELECT p.id, pe.id
FROM perfis p
JOIN permissoes pe ON pe.codigo IN (
    'escolas.visualizar',
    'anos_letivos.visualizar',
    'alunos.visualizar',
    'alunos.criar',
    'alunos.editar',
    'matriculas.visualizar',
    'matriculas.criar',
    'matriculas.editar',
    'matriculas.transferir',
    'matriculas.cancelar',
    'relatorios.visualizar',
    'documentos.emitir'
)
WHERE p.codigo = 'SECRETARIO_ESCOLAR'
ON CONFLICT DO NOTHING;

-- COORDENADOR_PEDAGOGICO
INSERT INTO perfil_permissoes (perfil_id, permissao_id)
SELECT p.id, pe.id
FROM perfis p
JOIN permissoes pe ON pe.codigo IN (
    'escolas.visualizar',
    'anos_letivos.visualizar',
    'disciplinas.visualizar',
    'alunos.visualizar',
    'matriculas.visualizar',
    'diario.visualizar',
    'relatorios.visualizar'
)
WHERE p.codigo = 'COORDENADOR_PEDAGOGICO'
ON CONFLICT DO NOTHING;

-- PROFESSOR
INSERT INTO perfil_permissoes (perfil_id, permissao_id)
SELECT p.id, pe.id
FROM perfis p
JOIN permissoes pe ON pe.codigo IN (
    'escolas.visualizar',
    'anos_letivos.visualizar',
    'disciplinas.visualizar',
    'alunos.visualizar',
    'diario.visualizar',
    'diario.lancar_frequencia',
    'diario.lancar_notas',
    'diario.lancar_conteudo',
    'diario.lancar_parecer',
    'diario.fechar',
    'relatorios.visualizar'
)
WHERE p.codigo = 'PROFESSOR'
ON CONFLICT DO NOTHING;

-- AUDITOR
INSERT INTO perfil_permissoes (perfil_id, permissao_id)
SELECT p.id, pe.id
FROM perfis p
JOIN permissoes pe ON pe.codigo IN (
    'usuarios.visualizar',
    'perfis.visualizar',
    'secretarias.visualizar',
    'escolas.visualizar',
    'anos_letivos.visualizar',
    'disciplinas.visualizar',
    'alunos.visualizar',
    'matriculas.visualizar',
    'diario.visualizar',
    'relatorios.visualizar',
    'auditoria.visualizar'
)
WHERE p.codigo = 'AUDITOR'
ON CONFLICT DO NOTHING;

-- SUPORTE_TECNICO
INSERT INTO perfil_permissoes (perfil_id, permissao_id)
SELECT p.id, pe.id
FROM perfis p
JOIN permissoes pe ON pe.codigo IN (
    'usuarios.visualizar',
    'usuarios.resetar_senha',
    'perfis.visualizar',
    'secretarias.visualizar',
    'escolas.visualizar',
    'anos_letivos.visualizar',
    'auditoria.visualizar'
)
WHERE p.codigo = 'SUPORTE_TECNICO'
ON CONFLICT DO NOTHING;

COMMIT;

-- =========================================================
-- Observação sobre o primeiro administrador
-- =========================================================
-- Recomendação:
-- Criar o primeiro usuário administrador via script de seed da aplicação,
-- não manualmente direto no banco em produção.
--
-- Exemplo de fluxo:
-- 1. Aplicação cria permissões e perfis padrão.
-- 2. Script seguro cria o primeiro usuário ADMIN_GERAL.
-- 3. Campo primeiro_acesso = TRUE obriga troca de senha.
-- 4. Depois disso, os próximos usuários são cadastrados pelo painel.
-- =========================================================
