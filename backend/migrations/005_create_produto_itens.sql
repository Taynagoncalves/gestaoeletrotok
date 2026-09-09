-- Uma linha por unidade física (celulares), identificada por IMEI.
-- Produtos não-serializados (acessórios/eletrônicos) não usam esta tabela;
-- o saldo deles vive em estoque_saldos.
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
