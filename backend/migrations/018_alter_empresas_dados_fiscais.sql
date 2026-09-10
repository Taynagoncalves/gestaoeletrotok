-- Endereco estruturado e dados fiscais do emitente, exigidos pela Focus NFe
-- para NF-e/NFC-e (a coluna "endereco" livre e antiga fica mantida como
-- referencia/legado).
ALTER TABLE empresas
  ADD COLUMN logradouro VARCHAR(255) NULL AFTER endereco,
  ADD COLUMN numero VARCHAR(20) NULL AFTER logradouro,
  ADD COLUMN complemento VARCHAR(100) NULL AFTER numero,
  ADD COLUMN bairro VARCHAR(100) NULL AFTER complemento,
  ADD COLUMN municipio VARCHAR(100) NULL AFTER bairro,
  ADD COLUMN codigo_municipio_ibge VARCHAR(10) NULL AFTER municipio,
  ADD COLUMN uf VARCHAR(2) NULL AFTER codigo_municipio_ibge,
  ADD COLUMN cep VARCHAR(9) NULL AFTER uf,
  ADD COLUMN cnae VARCHAR(10) NULL AFTER cep,
  ADD COLUMN inscricao_municipal VARCHAR(30) NULL AFTER cnae;
