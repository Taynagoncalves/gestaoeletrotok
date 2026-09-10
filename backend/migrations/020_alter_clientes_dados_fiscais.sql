-- E-mail e endereco estruturado do cliente/destinatario. Continuam
-- opcionais no cadastro: so viram obrigatorios na validacao de emissao de
-- NF-e completa (nfe55), nao na NFC-e nem no CRUD de clientes.
ALTER TABLE clientes
  ADD COLUMN email VARCHAR(255) NULL AFTER telefone,
  ADD COLUMN logradouro VARCHAR(255) NULL AFTER endereco,
  ADD COLUMN numero VARCHAR(20) NULL AFTER logradouro,
  ADD COLUMN complemento VARCHAR(100) NULL AFTER numero,
  ADD COLUMN bairro VARCHAR(100) NULL AFTER complemento,
  ADD COLUMN municipio VARCHAR(100) NULL AFTER bairro,
  ADD COLUMN codigo_municipio_ibge VARCHAR(10) NULL AFTER municipio,
  ADD COLUMN uf VARCHAR(2) NULL AFTER codigo_municipio_ibge,
  ADD COLUMN cep VARCHAR(9) NULL AFTER uf;
