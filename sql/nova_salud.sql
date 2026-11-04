CREATE DATABASE IF NOT EXISTS nova_salud CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nova_salud;

CREATE TABLE IF NOT EXISTS productos (
 id INT UNSIGNED PRIMARY KEY,
 nombre VARCHAR(100) NOT NULL,
 principio VARCHAR(100) NOT NULL,
 concentracion VARCHAR(100) NOT NULL,
 forma VARCHAR(100) NOT NULL,
 categoria VARCHAR(100) NOT NULL,
 descripcion TEXT NULL,
 imagen LONGTEXT NULL,
 precio DECIMAL(11,2) NOT NULL DEFAULT 0,
 minimo INT UNSIGNED NOT NULL DEFAULT 0,
 receta VARCHAR(150) NOT NULL DEFAULT 'Por verificar',
 origen VARCHAR(150) NOT NULL DEFAULT 'Datos académicos de prueba',
 visible BOOLEAN NOT NULL DEFAULT TRUE,
 INDEX idx_producto_nombre (nombre),
 INDEX idx_producto_categoria (categoria)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS lotes (
 id VARCHAR(64) PRIMARY KEY,
 producto_id INT UNSIGNED NOT NULL,
 codigo VARCHAR(50) NOT NULL,
 cantidad INT UNSIGNED NOT NULL,
 vencimiento DATE NOT NULL,
 INDEX idx_lotes_producto (producto_id),
 INDEX idx_lotes_vencimiento (vencimiento),
 CONSTRAINT fk_lotes_productos FOREIGN KEY (producto_id) REFERENCES productos(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pedidos (
 id VARCHAR(64) PRIMARY KEY,
 fecha VARCHAR(35) NOT NULL,
 cliente VARCHAR(100) NOT NULL,
 dni CHAR(8) NOT NULL,
 total DECIMAL(12,2) NOT NULL,
 estado VARCHAR(50) NOT NULL,
 procesado VARCHAR(35) NULL,
 revisionConfirmada BOOLEAN NOT NULL DEFAULT FALSE,
 nota VARCHAR(255) NOT NULL DEFAULT '',
 INDEX idx_pedidos_estado (estado)
) ENGINE=InnoDB;