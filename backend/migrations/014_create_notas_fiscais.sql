-- Certificado digital passa a ser guardado como base64 (funciona em
-- hospedagem sem disco persistente, como Render), nao mais como caminho
-- de arquivo em disco.
ALTER TABLE empresas_config_fiscal
  CHANGE COLUMN certificado_arquivo certificado_base64 LONGTEXT NULL,
  ADD COLUMN certificado_nome_arquivo VARCHAR(255) NULL AFTER certificado_base64,
  ADD COLUMN razao_social_emitente VARCHAR(255) NULL AFTER empresa_id,
  ADD COLUMN regime_tributario_emitente VARCHAR(50) NULL AFTER razao_social_emitente;

CREATE TABLE notas_fiscais (
  id INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id INT NOT NULL,
  origem ENUM('venda', 'os') NOT NULL,
  origem_id INT NOT NULL,
  tipo ENUM('nfce', 'nfe55') NOT NULL,
  status ENUM('pendente', 'autorizada', 'rejeitada', 'cancelada', 'erro') NOT NULL DEFAULT 'pendente',
  provider ENUM('focus_nfe', 'plugnotas') NOT NULL,
  provider_referencia VARCHAR(100) NULL,
  numero VARCHAR(20) NULL,
  serie VARCHAR(10) NULL,
  chave_acesso VARCHAR(44) NULL,
  motivo VARCHAR(500) NULL,
  ambiente ENUM('homologacao', 'producao') NOT NULL DEFAULT 'homologacao',
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_notas_fiscais_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_notas_fiscais_origem ON notas_fiscais (origem, origem_id);
CREATE INDEX idx_notas_fiscais_empresa_status ON notas_fiscais (empresa_id, status);
