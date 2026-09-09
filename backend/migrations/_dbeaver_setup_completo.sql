-- Script completo para criar o banco "eletrotok" no DBeaver.
-- Gerado a partir de todas as migrations (001 a 016), na ordem correta.
-- Basta abrir uma nova conexao no DBeaver e rodar este script inteiro (Executar Script SQL).

CREATE DATABASE IF NOT EXISTS `eletrotok` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `eletrotok`;

-- ============================================================
-- 001_create_empresas.sql
-- ============================================================
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

-- ============================================================
-- 002_create_usuarios.sql
-- ============================================================
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  login VARCHAR(100) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  perfil ENUM('admin', 'caixa', 'tecnico') NOT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE usuario_empresas (
  usuario_id INT NOT NULL,
  empresa_id INT NOT NULL,
  PRIMARY KEY (usuario_id, empresa_id),
  CONSTRAINT fk_usuario_empresas_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  CONSTRAINT fk_usuario_empresas_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 003_create_fornecedores.sql
-- ============================================================
CREATE TABLE fornecedores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  razao_social VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18),
  contato_nome VARCHAR(150),
  contato_telefone VARCHAR(20),
  contato_email VARCHAR(150),
  condicoes_pagamento VARCHAR(255),
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 004_create_produtos.sql
-- ============================================================
CREATE TABLE produtos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  categoria VARCHAR(100),
  marca VARCHAR(100),
  tipo ENUM('celular', 'acessorio', 'eletronico') NOT NULL,
  descricao VARCHAR(500),
  estoque_minimo INT NOT NULL DEFAULT 0,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 005_create_produto_itens.sql
-- ============================================================
CREATE TABLE produto_itens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  produto_id INT NOT NULL,
  empresa_id INT NOT NULL,
  imei VARCHAR(30) NOT NULL UNIQUE,
  condicao ENUM('novo', 'seminovo', 'vitrine') NOT NULL,
  status ENUM('em_estoque', 'reservado', 'vendido', 'em_os', 'transferido') NOT NULL DEFAULT 'em_estoque',
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_produto_itens_produto FOREIGN KEY (produto_id) REFERENCES produtos(id),
  CONSTRAINT fk_produto_itens_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_produto_itens_produto_empresa ON produto_itens (produto_id, empresa_id, status);

-- ============================================================
-- 006_create_estoque.sql
-- ============================================================
CREATE TABLE estoque_saldos (
  produto_id INT NOT NULL,
  empresa_id INT NOT NULL,
  quantidade INT NOT NULL DEFAULT 0,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (produto_id, empresa_id),
  CONSTRAINT fk_estoque_saldos_produto FOREIGN KEY (produto_id) REFERENCES produtos(id),
  CONSTRAINT fk_estoque_saldos_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE tabela_precos (
  produto_id INT NOT NULL,
  empresa_id INT NOT NULL,
  preco_venda DECIMAL(10, 2) NOT NULL,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (produto_id, empresa_id),
  CONSTRAINT fk_tabela_precos_produto FOREIGN KEY (produto_id) REFERENCES produtos(id),
  CONSTRAINT fk_tabela_precos_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE movimentacoes_estoque (
  id INT AUTO_INCREMENT PRIMARY KEY,
  produto_id INT NOT NULL,
  empresa_id INT NOT NULL,
  produto_item_id INT NULL,
  tipo ENUM('entrada', 'saida') NOT NULL,
  quantidade INT NOT NULL,
  valor_unitario DECIMAL(10, 2) NULL,
  fornecedor_id INT NULL,
  empresa_origem_id INT NULL,
  motivo ENUM('compra', 'transferencia', 'venda', 'os', 'ajuste') NOT NULL,
  observacao VARCHAR(255) NULL,
  usuario_id INT NULL,
  data DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_mov_produto FOREIGN KEY (produto_id) REFERENCES produtos(id),
  CONSTRAINT fk_mov_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  CONSTRAINT fk_mov_produto_item FOREIGN KEY (produto_item_id) REFERENCES produto_itens(id),
  CONSTRAINT fk_mov_fornecedor FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id),
  CONSTRAINT fk_mov_empresa_origem FOREIGN KEY (empresa_origem_id) REFERENCES empresas(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_mov_produto_empresa_data ON movimentacoes_estoque (produto_id, empresa_id, data);
CREATE INDEX idx_mov_fornecedor ON movimentacoes_estoque (fornecedor_id);

-- ============================================================
-- 007_create_clientes.sql
-- ============================================================
CREATE TABLE clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  cpf_cnpj VARCHAR(18),
  telefone VARCHAR(20),
  endereco VARCHAR(255),
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_clientes_cpf_cnpj ON clientes (cpf_cnpj);

-- ============================================================
-- 008_create_vendas.sql
-- ============================================================
CREATE TABLE vendas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id INT NOT NULL,
  cliente_id INT NULL,
  usuario_id INT NULL,
  total DECIMAL(10, 2) NOT NULL,
  status ENUM('concluida', 'cancelada') NOT NULL DEFAULT 'concluida',
  data DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_vendas_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  CONSTRAINT fk_vendas_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE venda_itens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  venda_id INT NOT NULL,
  produto_id INT NOT NULL,
  produto_item_id INT NULL,
  quantidade INT NOT NULL,
  preco_unitario DECIMAL(10, 2) NOT NULL,
  custo_unitario_snapshot DECIMAL(10, 2) NULL,
  CONSTRAINT fk_venda_itens_venda FOREIGN KEY (venda_id) REFERENCES vendas(id),
  CONSTRAINT fk_venda_itens_produto FOREIGN KEY (produto_id) REFERENCES produtos(id),
  CONSTRAINT fk_venda_itens_produto_item FOREIGN KEY (produto_item_id) REFERENCES produto_itens(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE venda_pagamentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  venda_id INT NOT NULL,
  forma ENUM('dinheiro', 'debito', 'credito', 'pix') NOT NULL,
  parcelas INT NOT NULL DEFAULT 1,
  valor DECIMAL(10, 2) NOT NULL,
  CONSTRAINT fk_venda_pagamentos_venda FOREIGN KEY (venda_id) REFERENCES vendas(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_vendas_empresa_data ON vendas (empresa_id, data);

-- ============================================================
-- 009_create_ordens_servico.sql
-- ============================================================
CREATE TABLE ordens_servico (
  id INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id INT NOT NULL,
  cliente_id INT NOT NULL,
  tecnico_id INT NULL,
  aparelho_modelo VARCHAR(150) NOT NULL,
  imei VARCHAR(30),
  senha_desbloqueio VARCHAR(100),
  condicao_entrada VARCHAR(255),
  defeito_relatado VARCHAR(500),
  status ENUM(
    'recebido', 'em_diagnostico', 'aguardando_aprovacao', 'aguardando_peca',
    'em_reparo', 'pronto', 'entregue', 'recusado', 'devolvido_sem_reparo'
  ) NOT NULL DEFAULT 'recebido',
  prazo_estimado DATE,
  data_abertura DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_os_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  CONSTRAINT fk_os_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  CONSTRAINT fk_os_tecnico FOREIGN KEY (tecnico_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE os_checklist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  os_id INT NOT NULL,
  item VARCHAR(150) NOT NULL,
  resultado VARCHAR(255),
  CONSTRAINT fk_os_checklist_os FOREIGN KEY (os_id) REFERENCES ordens_servico(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE os_termo_responsabilidade (
  os_id INT PRIMARY KEY,
  assinatura_base64 LONGTEXT NOT NULL,
  data_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_os_termo_os FOREIGN KEY (os_id) REFERENCES ordens_servico(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE os_orcamentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  os_id INT NOT NULL,
  valor_pecas DECIMAL(10, 2) NOT NULL DEFAULT 0,
  valor_mao_obra DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status ENUM('pendente', 'aprovado', 'recusado') NOT NULL DEFAULT 'pendente',
  data_criacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_resposta DATETIME NULL,
  CONSTRAINT fk_os_orcamentos_os FOREIGN KEY (os_id) REFERENCES ordens_servico(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE os_orcamento_itens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orcamento_id INT NOT NULL,
  produto_id INT NOT NULL,
  quantidade INT NOT NULL DEFAULT 1,
  valor DECIMAL(10, 2) NOT NULL,
  CONSTRAINT fk_os_orcamento_itens_orcamento FOREIGN KEY (orcamento_id) REFERENCES os_orcamentos(id),
  CONSTRAINT fk_os_orcamento_itens_produto FOREIGN KEY (produto_id) REFERENCES produtos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE os_historico_status (
  id INT AUTO_INCREMENT PRIMARY KEY,
  os_id INT NOT NULL,
  status ENUM(
    'recebido', 'em_diagnostico', 'aguardando_aprovacao', 'aguardando_peca',
    'em_reparo', 'pronto', 'entregue', 'recusado', 'devolvido_sem_reparo'
  ) NOT NULL,
  usuario_id INT NULL,
  data_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_os_historico_os FOREIGN KEY (os_id) REFERENCES ordens_servico(id),
  CONSTRAINT fk_os_historico_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE os_entrega (
  os_id INT PRIMARY KEY,
  retirado_por VARCHAR(150) NOT NULL,
  usuario_id INT NULL,
  data_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_os_entrega_os FOREIGN KEY (os_id) REFERENCES ordens_servico(id),
  CONSTRAINT fk_os_entrega_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE os_garantia (
  os_id INT PRIMARY KEY,
  prazo_dias INT NOT NULL,
  cobertura VARCHAR(500),
  CONSTRAINT fk_os_garantia_os FOREIGN KEY (os_id) REFERENCES ordens_servico(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_os_empresa_status ON ordens_servico (empresa_id, status);
CREATE INDEX idx_os_tecnico ON ordens_servico (tecnico_id);

-- ============================================================
-- 010_alter_produtos_campos_adicionais.sql
-- ============================================================
ALTER TABLE produtos
  ADD COLUMN subcategoria VARCHAR(100) NULL AFTER categoria,
  ADD COLUMN modelo VARCHAR(100) NULL AFTER marca,
  ADD COLUMN referencia_interna VARCHAR(50) NULL AFTER modelo,
  ADD COLUMN codigo_ean VARCHAR(20) NULL AFTER referencia_interna,
  ADD COLUMN peso_kg DECIMAL(6, 3) NULL AFTER estoque_minimo,
  ADD COLUMN unidade_medida VARCHAR(10) NOT NULL DEFAULT 'UN' AFTER peso_kg,
  ADD COLUMN imagem_base64 LONGTEXT NULL AFTER descricao,
  ADD COLUMN fornecedor_padrao_id INT NULL AFTER unidade_medida,
  ADD COLUMN codigo_fornecedor VARCHAR(50) NULL AFTER fornecedor_padrao_id,
  ADD CONSTRAINT fk_produtos_fornecedor_padrao FOREIGN KEY (fornecedor_padrao_id) REFERENCES fornecedores(id);

CREATE INDEX idx_produtos_codigo_ean ON produtos (codigo_ean);

-- ============================================================
-- 011_add_localizacao_estoque.sql
-- ============================================================
ALTER TABLE estoque_saldos
  ADD COLUMN localizacao VARCHAR(50) NULL AFTER quantidade;

ALTER TABLE produto_itens
  ADD COLUMN localizacao VARCHAR(50) NULL AFTER status;

-- ============================================================
-- 012_alter_vendas.sql
-- ============================================================
ALTER TABLE vendas
  MODIFY COLUMN status ENUM('concluida', 'cancelada', 'orcamento') NOT NULL DEFAULT 'concluida',
  ADD COLUMN canal ENUM('presencial', 'online') NOT NULL DEFAULT 'presencial' AFTER cliente_id,
  ADD COLUMN desconto DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER total;

-- ============================================================
-- 013_alter_os_fotos_checklist.sql
-- ============================================================
CREATE TABLE os_fotos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  os_id INT NOT NULL,
  imagem_base64 LONGTEXT NOT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_os_fotos_os FOREIGN KEY (os_id) REFERENCES ordens_servico(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE os_checklist
  ADD COLUMN tipo ENUM('acessorio', 'condicao_entrada', 'outro') NOT NULL DEFAULT 'outro' AFTER os_id,
  ADD COLUMN marcado TINYINT(1) NOT NULL DEFAULT 0 AFTER item;

-- ============================================================
-- 014_create_notas_fiscais.sql
-- ============================================================
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

-- ============================================================
-- 015_create_financeiro.sql
-- ============================================================
CREATE TABLE contas_pagar (
  id INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id INT NOT NULL,
  fornecedor_id INT NULL,
  descricao VARCHAR(255) NOT NULL,
  categoria VARCHAR(100) NULL,
  valor DECIMAL(10, 2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE NULL,
  forma_pagamento ENUM('dinheiro', 'debito', 'credito', 'pix', 'boleto', 'transferencia') NULL,
  status ENUM('pendente', 'pago', 'cancelado') NOT NULL DEFAULT 'pendente',
  observacao VARCHAR(500) NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_contas_pagar_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  CONSTRAINT fk_contas_pagar_fornecedor FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE contas_receber (
  id INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id INT NOT NULL,
  cliente_id INT NULL,
  origem ENUM('venda', 'os', 'manual') NOT NULL DEFAULT 'manual',
  origem_id INT NULL,
  descricao VARCHAR(255) NOT NULL,
  valor DECIMAL(10, 2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_recebimento DATE NULL,
  forma_recebimento ENUM('dinheiro', 'debito', 'credito', 'pix', 'boleto', 'transferencia') NULL,
  status ENUM('pendente', 'recebido', 'cancelado') NOT NULL DEFAULT 'pendente',
  observacao VARCHAR(500) NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_contas_receber_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  CONSTRAINT fk_contas_receber_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_contas_pagar_empresa_status ON contas_pagar (empresa_id, status, data_vencimento);
CREATE INDEX idx_contas_receber_empresa_status ON contas_receber (empresa_id, status, data_vencimento);

-- ============================================================
-- 016_alter_notas_fiscais_avulsa.sql
-- ============================================================
ALTER TABLE notas_fiscais
  MODIFY COLUMN origem ENUM('venda', 'os', 'avulsa') NOT NULL,
  MODIFY COLUMN origem_id INT NULL,
  ADD COLUMN cliente_id INT NULL AFTER origem_id,
  ADD COLUMN total DECIMAL(10, 2) NULL AFTER tipo,
  ADD COLUMN desconto DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER total,
  ADD COLUMN acrescimo DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER desconto,
  ADD COLUMN forma_pagamento ENUM('dinheiro', 'pix', 'credito', 'debito', 'outros') NULL,
  ADD COLUMN observacoes VARCHAR(500) NULL,
  ADD COLUMN vendedor_usuario_id INT NULL,
  ADD COLUMN natureza_operacao VARCHAR(100) NULL,
  ADD COLUMN enviar_email TINYINT(1) NOT NULL DEFAULT 0,
  ADD CONSTRAINT fk_notas_fiscais_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  ADD CONSTRAINT fk_notas_fiscais_vendedor FOREIGN KEY (vendedor_usuario_id) REFERENCES usuarios(id);

CREATE TABLE nota_fiscal_itens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nota_fiscal_id INT NOT NULL,
  produto_id INT NOT NULL,
  quantidade INT NOT NULL DEFAULT 1,
  valor_unitario DECIMAL(10, 2) NOT NULL,
  CONSTRAINT fk_nf_itens_nota FOREIGN KEY (nota_fiscal_id) REFERENCES notas_fiscais(id),
  CONSTRAINT fk_nf_itens_produto FOREIGN KEY (produto_id) REFERENCES produtos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de controle de migrations (usada pelo backend, opcional criar aqui,
-- mas fica registrado que ela existe e e criada automaticamente pelo run.js).
CREATE TABLE IF NOT EXISTS migrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL UNIQUE,
  aplicada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
