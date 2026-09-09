-- Ate aqui, toda nota fiscal so podia ser emitida em cima de uma venda ou
-- OS ja existente. Agora tambem e possivel emitir uma nota "avulsa", com
-- seu proprio carrinho de produtos (ex: importado do PDV ou digitado na
-- hora), sem depender de uma venda registrada antes.
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
