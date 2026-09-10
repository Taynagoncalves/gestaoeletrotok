-- Campos especificos do Focus NFe: CSC (codigo de seguranca do contribuinte,
-- exigido no QR Code da NFC-e) e o id da empresa apos registrada na
-- plataforma deles (CNPJ + certificado), com flags de habilitacao.
ALTER TABLE empresas_config_fiscal
  ADD COLUMN csc_id VARCHAR(10) NULL AFTER serie_nfe,
  ADD COLUMN csc_token VARCHAR(255) NULL AFTER csc_id,
  ADD COLUMN provider_empresa_id VARCHAR(50) NULL AFTER csc_token,
  ADD COLUMN habilitado_nfce TINYINT(1) NOT NULL DEFAULT 0 AFTER provider_empresa_id,
  ADD COLUMN habilitado_nfe TINYINT(1) NOT NULL DEFAULT 0 AFTER habilitado_nfce;
