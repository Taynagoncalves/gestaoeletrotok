ALTER TABLE vendas
  MODIFY COLUMN status ENUM('concluida', 'cancelada', 'orcamento') NOT NULL DEFAULT 'concluida',
  ADD COLUMN canal ENUM('presencial', 'online') NOT NULL DEFAULT 'presencial' AFTER cliente_id,
  ADD COLUMN desconto DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER total;
