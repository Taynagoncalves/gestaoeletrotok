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
