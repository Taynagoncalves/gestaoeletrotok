CREATE TABLE empresas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cnpj VARCHAR(18) NOT NULL UNIQUE,
  razao_social VARCHAR(255) NOT NULL,
  nome_fantasia VARCHAR(255),
  tipo ENUM('atacado', 'varejo') NOT NULL,
  regime_tributario VARCHAR(50),
  inscricao_estadual VARCHAR(30),
  endereco VARCHAR(255),
  telefone VARCHAR(20),
  ativa TINYINT(1) NOT NULL DEFAULT 1,
  criada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Configuração fiscal (certificado digital, provider de NF-e) fica separada
-- da tabela de empresas para manter a camada fiscal isolada, como combinado.
CREATE TABLE empresas_config_fiscal (
  empresa_id INT PRIMARY KEY,
  provider ENUM('focus_nfe', 'plugnotas') NULL,
  provider_token VARCHAR(255) NULL,
  certificado_arquivo VARCHAR(255) NULL,
  certificado_senha VARCHAR(255) NULL,
  certificado_validade DATE NULL,
  serie_nfce VARCHAR(10) NULL,
  serie_nfe VARCHAR(10) NULL,
  ambiente ENUM('homologacao', 'producao') NOT NULL DEFAULT 'homologacao',
  atualizada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_config_fiscal_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
