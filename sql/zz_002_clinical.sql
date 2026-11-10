-- Additive migration. Preserves all existing products, lots and orders.
CREATE TABLE IF NOT EXISTS producto_clinica (
 producto_id INT UNSIGNED PRIMARY KEY,
 datos JSON NOT NULL,
 CONSTRAINT fk_clinica_producto FOREIGN KEY (producto_id) REFERENCES productos(id)
) ENGINE=InnoDB;
