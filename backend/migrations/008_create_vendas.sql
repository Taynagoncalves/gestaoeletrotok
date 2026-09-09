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

-- custo_unitario_snapshot congela o custo no momento da venda, para o
-- relatorio de margem nao mudar retroativamente se uma entrada nova
-- for lancada depois.
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
