CREATE TABLE IF NOT EXISTS usuarios (
  id CHAR(36) NOT NULL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  cpf VARCHAR(20) NULL,
  email VARCHAR(150) NULL,
  telefone VARCHAR(30) NULL,
  data_nascimento DATE NULL,
  cargo VARCHAR(100) NULL,
  observacoes TEXT NULL,
  username VARCHAR(100) NULL,
  senha_hash TEXT NULL,
  origem_auth ENUM('LOCAL', 'LDAP', 'ACTIVE_DIRECTORY', 'OIDC', 'GOOGLE', 'MICROSOFT') NOT NULL DEFAULT 'LOCAL',
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  primeiro_acesso TINYINT(1) NOT NULL DEFAULT 1,
  ultimo_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  UNIQUE KEY uq_usuarios_cpf (cpf),
  UNIQUE KEY uq_usuarios_email (email),
  UNIQUE KEY uq_usuarios_username (username),
  INDEX idx_usuarios_nome (nome),
  INDEX idx_usuarios_ativo (ativo),
  INDEX idx_usuarios_deleted_at (deleted_at)
);

CREATE TABLE IF NOT EXISTS usuario_sessoes (
  id CHAR(36) NOT NULL PRIMARY KEY,
  usuario_id CHAR(36) NOT NULL,
  refresh_token_hash TEXT NOT NULL,
  ip VARCHAR(100) NULL,
  user_agent TEXT NULL,
  expiracao DATETIME NOT NULL,
  revogada TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_usuario_sessoes_usuario
    FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id)
    ON DELETE CASCADE,
  INDEX idx_usuario_sessoes_usuario_id (usuario_id),
  INDEX idx_usuario_sessoes_expiracao (expiracao),
  INDEX idx_usuario_sessoes_revogada (revogada)
);

INSERT INTO usuarios (
  id,
  nome,
  email,
  username,
  senha_hash,
  origem_auth,
  ativo,
  primeiro_acesso
) VALUES (
  UUID(),
  'Administrador',
  'admin@sistema.local',
  'admin',
  '$2b$12$u5nVixcWHVgXTO2bKZqUjecDBN74UppCi6fEyB5vRCm0679ReaZsm',
  'LOCAL',
  1,
  0
)
ON DUPLICATE KEY UPDATE
  nome = VALUES(nome),
  senha_hash = VALUES(senha_hash),
  ativo = VALUES(ativo),
  primeiro_acesso = VALUES(primeiro_acesso);
