CREATE DATABASE IF NOT EXISTS `coffee_db`;
USE `coffee_db`;

CREATE TABLE IF NOT EXISTS `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `category` VARCHAR(20) NOT NULL,
  `price` DECIMAL(10, 2) NOT NULL,
  `description` TEXT,
  `image_url` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `items` LONGTEXT NOT NULL,
  `total` DECIMAL(10, 2) NOT NULL,
  `payment_method` VARCHAR(20) NOT NULL DEFAULT 'cash',
  `payment_status` VARCHAR(20) NOT NULL DEFAULT 'paid',
  `payment_reference` VARCHAR(120) NULL,
  `payment_session_id` VARCHAR(120) NULL,
  `gateway_order_id` VARCHAR(120) NULL,
  `gateway_payment_id` VARCHAR(120) NULL,
  `gateway_signature` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
