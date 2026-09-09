CREATE TABLE ordens_servico (
  id INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id INT NOT NULL,
  cliente_id INT NOT NULL,
  tecnico_id INT NULL,
  aparelho_modelo VARCHAR(150) NOT NULL,
  imei VARCHAR(30),
  senha_desbloqueio VARCHAR(100),
  condicao_entrada VARCHAR(255),
  defeito_relatado VARCHAR(500),
  status ENUM(
    'recebido', 'em_diagnostico', 'aguardando_aprovacao', 'aguardando_peca',
    'em_reparo', 'pronto', 'entregue', 'recusado', 'devolvido_sem_reparo'
  ) NOT NULL DEFAULT 'recebido',
  prazo_estimado DATE,
  data_abertura DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_os_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  CONSTRAINT fk_os_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  CONSTRAINT fk_os_tecnico FOREIGN KEY (tecnico_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE os_checklist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  os_id INT NOT NULL,
  item VARCHAR(150) NOT NULL,
  resultado VARCHAR(255),
  CONSTRAINT fk_os_checklist_os FOREIGN KEY (os_id) REFERENCES ordens_servico(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE os_termo_responsabilidade (
  os_id INT PRIMARY KEY,
  assinatura_base64 LONGTEXT NOT NULL,
  data_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_os_termo_os FOREIGN KEY (os_id) REFERENCES ordens_servico(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE os_orcamentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  os_id INT NOT NULL,
  valor_pecas DECIMAL(10, 2) NOT NULL DEFAULT 0,
  valor_mao_obra DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status ENUM('pendente', 'aprovado', 'recusado') NOT NULL DEFAULT 'pendente',
  data_criacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_resposta DATETIME NULL,
  CONSTRAINT fk_os_orcamentos_os FOREIGN KEY (os_id) REFERENCES ordens_servico(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE os_orcamento_itens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orcamento_id INT NOT NULL,
  produto_id INT NOT NULL,
  quantidade INT NOT NULL DEFAULT 1,
  valor DECIMAL(10, 2) NOT NULL,
  CONSTRAINT fk_os_orcamento_itens_orcamento FOREIGN KEY (orcamento_id) REFERENCES os_orcamentos(id),
  CONSTRAINT fk_os_orcamento_itens_produto FOREIGN KEY (produto_id) REFERENCES produtos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Historico completo de mudanca de status: quem mudou e quando.
CREATE TABLE os_historico_status (
  id INT AUTO_INCREMENT PRIMARY KEY,
  os_id INT NOT NULL,
  status ENUM(
    'recebido', 'em_diagnostico', 'aguardando_aprovacao', 'aguardando_peca',
    'em_reparo', 'pronto', 'entregue', 'recusado', 'devolvido_sem_reparo'
  ) NOT NULL,
  usuario_id INT NULL,
  data_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_os_historico_os FOREIGN KEY (os_id) REFERENCES ordens_servico(id),
  CONSTRAINT fk_os_historico_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE os_entrega (
  os_id INT PRIMARY KEY,
  retirado_por VARCHAR(150) NOT NULL,
  usuario_id INT NULL,
  data_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_os_entrega_os FOREIGN KEY (os_id) REFERENCES ordens_servico(id),
  CONSTRAINT fk_os_entrega_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE os_garantia (
  os_id INT PRIMARY KEY,
  prazo_dias INT NOT NULL,
  cobertura VARCHAR(500),
  CONSTRAINT fk_os_garantia_os FOREIGN KEY (os_id) REFERENCES ordens_servico(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_os_empresa_status ON ordens_servico (empresa_id, status);
CREATE INDEX idx_os_tecnico ON ordens_servico (tecnico_id);
