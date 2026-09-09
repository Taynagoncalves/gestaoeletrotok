ALTER TABLE estoque_saldos
  ADD COLUMN localizacao VARCHAR(50) NULL AFTER quantidade;

ALTER TABLE produto_itens
  ADD COLUMN localizacao VARCHAR(50) NULL AFTER status;
