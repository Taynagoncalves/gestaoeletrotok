CREATE TABLE os_fotos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  os_id INT NOT NULL,
  imagem_base64 LONGTEXT NOT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_os_fotos_os FOREIGN KEY (os_id) REFERENCES ordens_servico(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE os_checklist
  ADD COLUMN tipo ENUM('acessorio', 'condicao_entrada', 'outro') NOT NULL DEFAULT 'outro' AFTER os_id,
  ADD COLUMN marcado TINYINT(1) NOT NULL DEFAULT 0 AFTER item;
