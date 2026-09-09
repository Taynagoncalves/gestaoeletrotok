-- Saldo agregado por empresa, só para produtos não-serializados.
CREATE TABLE estoque_saldos (
  produto_id INT NOT NULL,
  empresa_id INT NOT NULL,
  quantidade INT NOT NULL DEFAULT 0,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (produto_id, empresa_id),
  CONSTRAINT fk_estoque_saldos_produto FOREIGN KEY (produto_id) REFERENCES produtos(id),
  CONSTRAINT fk_estoque_saldos_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Preço de venda por empresa (atacado x varejo para o mesmo produto).
CREATE TABLE tabela_precos (
  produto_id INT NOT NULL,
  empresa_id INT NOT NULL,
  preco_venda DECIMAL(10, 2) NOT NULL,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (produto_id, empresa_id),
  CONSTRAINT fk_tabela_precos_produto FOREIGN KEY (produto_id) REFERENCES produtos(id),
  CONSTRAINT fk_tabela_precos_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Toda movimentação de estoque (entrada ou saída). O custo "atual" de um
-- produto numa empresa é derivado da entrada mais recente aqui, nunca de
-- um campo fixo no cadastro do produto.
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
