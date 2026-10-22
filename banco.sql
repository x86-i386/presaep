create database almoxarifado;
use almoxarifado;

CREATE TABLE usuarios (
  id int(11) NOT NULL AUTO_INCREMENT,
  nome varchar(255) NOT NULL,
  email varchar(255) NOT NULL,
  senha varchar(255) NOT NULL,
  tipo enum('operador','administrador') NOT NULL,
  createdAt datetime NOT NULL,
  updatedAt datetime NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY email (email)
);

CREATE TABLE produtos (
  id int(11) NOT NULL AUTO_INCREMENT,
  nome varchar(255) NOT NULL,
  quantidade_estoque int(11) NOT NULL DEFAULT 0,
  createdAt datetime NOT NULL,
  updatedAt datetime NOT NULL,
  PRIMARY KEY (id)
);
drop table movimentacaos;
CREATE TABLE movimentacaos (
  id int(11) NOT NULL AUTO_INCREMENT,
  tipo enum('entrada','saida') NOT NULL,
  quantidade int(11) NOT NULL,
  data datetime DEFAULT NULL,
  createdAt datetime NOT NULL,
  updatedAt datetime NOT NULL,
  produtos_id int(11) NOT NULL,
  usuario_id int(11) NOT NULL,
  PRIMARY KEY (id),
  KEY produtos_id (produtos_id),
  KEY movimentacaos_usuario_id_idx (usuario_id),
  CONSTRAINT movimentacaos_produtos_fk FOREIGN KEY (produtos_id) REFERENCES produtos (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT movimentacaos_usuario_fk FOREIGN KEY (usuario_id) REFERENCES Usuarios (id) ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO usuarios (id, nome, email, senha, tipo, createdAt, updatedAt )
VALUES
  (1,'ADMINISTRADOR','adm@email.com','$2b$10$SeHxt/ONd059wbMkC4.kWu5h1dPi6q6Jvg7cTGNaUA1NUTI5ZNJN.','administrador','2026-10-22 09:40:44','2026-10-22 09:40:44'),
  (2,'OPERADOR','operador@email.com','$2b$10$SeHxt/ONd059wbMkC4.kWu5h1dPi6q6Jvg7cTGNaUA1NUTI5ZNJN.','operador','2026-10-22 09:41:45','2026-10-22 09:41:45');

INSERT INTO produtos (id, nome, quantidade_estoque, createdAt, updatedAt)
VALUES
  (1, 'Cimento CP II 50 kg', '2','2026-10-22 09:40:44','2026-10-22 09:40:44' ),
  (2, 'Argamassa AC II 20 kg', '1','2026-10-22 09:40:44','2026-10-22 09:40:44'),
  (3, 'Tinta Acrilica Branca 18 L','3','2026-10-22 09:40:44','2026-10-22 09:40:44');

SET FOREIGN_KEY_CHECKS = 1;

