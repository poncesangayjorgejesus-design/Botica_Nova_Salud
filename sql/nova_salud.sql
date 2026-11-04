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