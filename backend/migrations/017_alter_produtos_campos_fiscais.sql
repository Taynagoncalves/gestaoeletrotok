-- Campos fiscais necessarios para emissao real de NF-e/NFC-e (Focus NFe).
-- Todos opcionais/com default para nao quebrar produtos ja cadastrados;
-- a validacao de completude acontece na hora de emitir a nota, nao no
-- cadastro do produto.
ALTER TABLE produtos
  ADD COLUMN ncm VARCHAR(8) NULL AFTER codigo_ean,
  ADD COLUMN cfop_padrao VARCHAR(4) NULL AFTER ncm,
  ADD COLUMN cest VARCHAR(9) NULL AFTER cfop_padrao,
  ADD COLUMN origem_mercadoria TINYINT NOT NULL DEFAULT 0 AFTER cest,
  ADD COLUMN icms_situacao_tributaria VARCHAR(4) NULL AFTER origem_mercadoria,
  ADD COLUMN pis_situacao_tributaria VARCHAR(4) NOT NULL DEFAULT '07' AFTER icms_situacao_tributaria,
  ADD COLUMN cofins_situacao_tributaria VARCHAR(4) NOT NULL DEFAULT '07' AFTER pis_situacao_tributaria;
