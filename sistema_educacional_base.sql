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
-- 10. Matrículas
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

-- =========================================================
-- Modulos adicionados: Diario de Classe e Planejamento Pedagogico
-- Observacao: o projeto atual usa NestJS + TypeORM + MySQL com synchronize=true.
-- Este bloco documenta as tabelas esperadas; a criacao em ambiente local ocorre
-- automaticamente pelas entities ao reiniciar a API.
-- =========================================================

-- Diario de classe:
-- diarios_classe: controle por turma, professor, disciplina, vinculo docente
-- e periodo letivo, com status, parecer final, fechamento e reabertura.
-- diario_frequencias: turma_id, disciplina_id, professor_id, vinculo_docente_id,
-- diario_classe_id, aluno_id, data, situacao e observacao. Unico por turma/data/aluno.
-- diario_aulas: turma_id, disciplina_id, professor_id, vinculo_docente_id,
-- diario_classe_id, data, horarios, titulo, conteudo, habilidades, recursos, periodo e ativo.
-- diario_avaliacoes: turma_id, disciplina_id, professor_id, diario_classe_id,
-- nome, periodo, peso, data, observacao e ativo.
-- diario_notas: avaliacao_id, aluno_id, valor e observacao. Unico por
-- avaliacao/aluno.
-- diario_observacoes: turma_id, aluno_id opcional, professor_id, data, tipo,
-- situacao, resumo, descricao, encaminhamentos, proxima_data e comunicacao.

-- Planejamento pedagogico:
-- documentos_curriculares: secretaria_id, titulo, municipio, uf, url_fonte,
-- versao e ativo.
-- anos_series_curriculares: codigo, etapa_ensino, numero e rotulo.
-- areas_conhecimento: nome e slug.
-- componentes_curriculares: area_id, disciplina_id opcional, nome e slug.
-- planos_pedagogicos: documento_id, ano_serie_id, componente_id, titulo e ativo.
-- periodos_planejamento: tipo, numero e rotulo.
-- unidades_tematicas: plano_id, nome, slug e ordem.
-- objetos_conhecimento: plano_id, unidade_id, nome, slug e ordem.
-- habilidades_curriculares: componente_id opcional, codigo unico e texto.
-- itens_planejamento_pedagogico: plano_id, unidade_id, objeto_id, ordem,
-- pagina_fonte e observacoes.
-- itens_planejamento_periodos: item_id e periodo_id.
-- itens_planejamento_habilidades: item_id, habilidade_id e ordem.
-- bncc_codigos: codigos oficiais da BNCC com etapa, series ou faixa etaria,
-- componente/area e fonte.

CREATE TABLE IF NOT EXISTS bncc_codigos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(40) NOT NULL,
    etapa_ensino VARCHAR(100) NOT NULL,
    series JSON,
    faixa_etaria JSON,
    componente_ou_area VARCHAR(180) NOT NULL,
    primeira_ocorrencia_texto INTEGER,
    fonte_url TEXT,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_bncc_codigos_codigo UNIQUE (codigo)
);

CREATE INDEX IF NOT EXISTS idx_bncc_codigos_etapa_ensino ON bncc_codigos(etapa_ensino);
CREATE INDEX IF NOT EXISTS idx_bncc_codigos_componente_ou_area ON bncc_codigos(componente_ou_area);
CREATE INDEX IF NOT EXISTS idx_bncc_codigos_ativo ON bncc_codigos(ativo);

CREATE TRIGGER trg_bncc_codigos_updated_at
BEFORE UPDATE ON bncc_codigos
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

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
    tipo_escola VARCHAR(30),
    modalidades_ensino JSON,
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
    observacoes TEXT,
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

CREATE TABLE IF NOT EXISTS escola_configuracoes_pedagogicas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escola_id UUID NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
    ano_letivo INTEGER NOT NULL,
    media_minima_aprovacao NUMERIC(4, 2),
    tipo_periodo_letivo VARCHAR(20),
    ativa BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_escola_configuracao_ano UNIQUE (escola_id, ano_letivo),
    CONSTRAINT ck_escola_configuracao_tipo_periodo CHECK (
        tipo_periodo_letivo IS NULL OR
        tipo_periodo_letivo IN ('BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL')
    )
);

CREATE INDEX IF NOT EXISTS idx_escola_configuracoes_escola_id
    ON escola_configuracoes_pedagogicas(escola_id);
CREATE INDEX IF NOT EXISTS idx_escola_configuracoes_ano_letivo
    ON escola_configuracoes_pedagogicas(ano_letivo);

CREATE TRIGGER trg_escola_configuracoes_pedagogicas_updated_at
BEFORE UPDATE ON escola_configuracoes_pedagogicas
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS escola_periodos_letivos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    configuracao_pedagogica_id UUID NOT NULL
        REFERENCES escola_configuracoes_pedagogicas(id) ON DELETE CASCADE,
    numero INTEGER NOT NULL,
    label VARCHAR(50) NOT NULL,
    data_inicio DATE,
    data_fim DATE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_escola_periodo_configuracao_numero UNIQUE (
        configuracao_pedagogica_id,
        numero
    ),
    CONSTRAINT ck_escola_periodo_numero CHECK (numero BETWEEN 1 AND 4),
    CONSTRAINT ck_escola_periodo_datas CHECK (
        data_inicio IS NULL OR data_fim IS NULL OR data_inicio <= data_fim
    )
);

CREATE INDEX IF NOT EXISTS idx_escola_periodos_configuracao_id
    ON escola_periodos_letivos(configuracao_pedagogica_id);

CREATE TRIGGER trg_escola_periodos_letivos_updated_at
BEFORE UPDATE ON escola_periodos_letivos
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- Turmas
-- =========================================================

CREATE TABLE IF NOT EXISTS turmas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escola_id UUID NOT NULL REFERENCES escolas(id) ON DELETE RESTRICT,
    nome VARCHAR(120) NOT NULL,
    sala_referencia VARCHAR(120),
    ano_letivo INTEGER NOT NULL,
    etapa_ensino VARCHAR(80) NOT NULL,
    ano_serie VARCHAR(80) NOT NULL,
    turno VARCHAR(30) NOT NULL,
    capacidade INTEGER NOT NULL,
    professor_regente_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    ativa BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_turmas_escola_ano_nome UNIQUE (escola_id, ano_letivo, nome)
);

CREATE INDEX IF NOT EXISTS idx_turmas_escola_id ON turmas(escola_id);
CREATE INDEX IF NOT EXISTS idx_turmas_ano_letivo ON turmas(ano_letivo);
CREATE INDEX IF NOT EXISTS idx_turmas_professor_regente_id ON turmas(professor_regente_id);
CREATE INDEX IF NOT EXISTS idx_turmas_ativa ON turmas(ativa);

CREATE TRIGGER trg_turmas_updated_at
BEFORE UPDATE ON turmas
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- Alunos
-- =========================================================

CREATE TABLE IF NOT EXISTS alunos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escola_id UUID REFERENCES escolas(id) ON DELETE SET NULL,
    turma_id UUID REFERENCES turmas(id) ON DELETE SET NULL,
    nome_completo VARCHAR(255) NOT NULL,
    cpf_ou_certidao VARCHAR(50),
    data_nascimento DATE,
    sexo VARCHAR(20),
    responsavel_nome VARCHAR(255),
    responsavel_telefone VARCHAR(30),
    responsaveis JSON,
    situacao VARCHAR(20) NOT NULL DEFAULT 'pending',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alunos_escola_id ON alunos(escola_id);
CREATE INDEX IF NOT EXISTS idx_alunos_turma_id ON alunos(turma_id);
CREATE INDEX IF NOT EXISTS idx_alunos_nome_completo ON alunos(nome_completo);
CREATE INDEX IF NOT EXISTS idx_alunos_situacao ON alunos(situacao);
CREATE INDEX IF NOT EXISTS idx_alunos_ativo ON alunos(ativo);

CREATE TRIGGER trg_alunos_updated_at
BEFORE UPDATE ON alunos
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- Matrículas
-- =========================================================

CREATE TABLE IF NOT EXISTS matriculas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE RESTRICT,
    escola_id UUID NOT NULL REFERENCES escolas(id) ON DELETE RESTRICT,
    turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE RESTRICT,
    escola_origem_id UUID REFERENCES escolas(id) ON DELETE SET NULL,
    turma_origem_id UUID REFERENCES turmas(id) ON DELETE SET NULL,
    numero_matricula VARCHAR(30) NOT NULL,
    ano_letivo INTEGER NOT NULL,
    tipo VARCHAR(30) NOT NULL DEFAULT 'Matrícula',
    situacao VARCHAR(30) NOT NULL DEFAULT 'active',
    data_matricula DATE NOT NULL DEFAULT CURRENT_DATE,
    motivo VARCHAR(120),
    observacoes TEXT,
    ano_origem INTEGER,
    ano_destino INTEGER,
    criterio_rematricula VARCHAR(80),
    ativa BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_matriculas_numero_matricula UNIQUE (numero_matricula)
);

CREATE INDEX IF NOT EXISTS idx_matriculas_aluno_id ON matriculas(aluno_id);
CREATE INDEX IF NOT EXISTS idx_matriculas_escola_id ON matriculas(escola_id);
CREATE INDEX IF NOT EXISTS idx_matriculas_turma_id ON matriculas(turma_id);
CREATE INDEX IF NOT EXISTS idx_matriculas_ano_letivo ON matriculas(ano_letivo);
CREATE INDEX IF NOT EXISTS idx_matriculas_tipo ON matriculas(tipo);
CREATE INDEX IF NOT EXISTS idx_matriculas_situacao ON matriculas(situacao);
CREATE INDEX IF NOT EXISTS idx_matriculas_ativa ON matriculas(ativa);

CREATE TRIGGER trg_matriculas_updated_at
BEFORE UPDATE ON matriculas
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- Anos Letivos
-- =========================================================

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
-- Professores
-- =========================================================

CREATE TABLE IF NOT EXISTS professores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    matricula VARCHAR(50),
    data_admissao DATE,
    formacao VARCHAR(255),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_professores_usuario_id UNIQUE (usuario_id),
    CONSTRAINT uq_professores_matricula UNIQUE (matricula)
);

CREATE INDEX IF NOT EXISTS idx_professores_usuario_id ON professores(usuario_id);
CREATE INDEX IF NOT EXISTS idx_professores_ativo ON professores(ativo);

CREATE TRIGGER trg_professores_updated_at
BEFORE UPDATE ON professores
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
    COALESCE(escola_id, '00000000-0000-0000-0000-000000000000'::uuid)
);

CREATE INDEX IF NOT EXISTS idx_usuario_acessos_usuario_id ON usuario_acessos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuario_acessos_perfil_id ON usuario_acessos(perfil_id);
CREATE INDEX IF NOT EXISTS idx_usuario_acessos_secretaria_id ON usuario_acessos(secretaria_id);
CREATE INDEX IF NOT EXISTS idx_usuario_acessos_escola_id ON usuario_acessos(escola_id);
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
    ativa BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_disciplinas_secretaria_nome UNIQUE (secretaria_id, nome)
);

CREATE INDEX IF NOT EXISTS idx_disciplinas_secretaria_id ON disciplinas(secretaria_id);
CREATE INDEX IF NOT EXISTS idx_disciplinas_ativa ON disciplinas(ativa);

CREATE TRIGGER trg_disciplinas_updated_at
BEFORE UPDATE ON disciplinas
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS turma_vinculos_docentes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
    professor_id UUID NOT NULL REFERENCES professores(id) ON DELETE RESTRICT,
    disciplina_id UUID NOT NULL REFERENCES disciplinas(id) ON DELETE RESTRICT,
    carga_horaria_semanal INTEGER NOT NULL,
    data_inicio_responsabilidade DATE NULL,
    data_fim_responsabilidade DATE NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_turma_vinculos_docentes_turma_professor_disciplina UNIQUE (
        turma_id,
        professor_id,
        disciplina_id
    )
);

CREATE INDEX IF NOT EXISTS idx_turma_vinculos_docentes_turma_id
ON turma_vinculos_docentes(turma_id);
CREATE INDEX IF NOT EXISTS idx_turma_vinculos_docentes_professor_id
ON turma_vinculos_docentes(professor_id);
CREATE INDEX IF NOT EXISTS idx_turma_vinculos_docentes_disciplina_id
ON turma_vinculos_docentes(disciplina_id);
CREATE INDEX IF NOT EXISTS idx_turma_vinculos_docentes_ativo
ON turma_vinculos_docentes(ativo);

CREATE TRIGGER trg_turma_vinculos_docentes_updated_at
BEFORE UPDATE ON turma_vinculos_docentes
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS diarios_classe (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
    disciplina_id UUID NOT NULL REFERENCES disciplinas(id) ON DELETE RESTRICT,
    professor_id UUID NOT NULL REFERENCES professores(id) ON DELETE RESTRICT,
    vinculo_docente_id UUID NOT NULL REFERENCES turma_vinculos_docentes(id) ON DELETE CASCADE,
    periodo_letivo_id UUID NOT NULL REFERENCES escola_periodos_letivos(id) ON DELETE RESTRICT,
    ano_letivo INTEGER NOT NULL,
    periodo_label VARCHAR(80) NOT NULL,
    data_inicio_responsabilidade DATE NULL,
    data_fim_responsabilidade DATE NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'NAO_INICIADO',
    parecer_final TEXT NULL,
    fechado_em TIMESTAMP NULL,
    fechado_por_usuario_id UUID NULL REFERENCES usuarios(id) ON DELETE SET NULL,
    reaberto_em TIMESTAMP NULL,
    reaberto_por_usuario_id UUID NULL REFERENCES usuarios(id) ON DELETE SET NULL,
    motivo_reabertura TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_diarios_classe_vinculo_periodo UNIQUE (
        vinculo_docente_id,
        periodo_letivo_id
    )
);

CREATE INDEX IF NOT EXISTS idx_diarios_classe_turma_id
ON diarios_classe(turma_id);
CREATE INDEX IF NOT EXISTS idx_diarios_classe_professor_id
ON diarios_classe(professor_id);
CREATE INDEX IF NOT EXISTS idx_diarios_classe_periodo_letivo_id
ON diarios_classe(periodo_letivo_id);
CREATE INDEX IF NOT EXISTS idx_diarios_classe_status
ON diarios_classe(status);

CREATE TRIGGER trg_diarios_classe_updated_at
BEFORE UPDATE ON diarios_classe
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
