CREATE DATABASE IF NOT EXISTS coffee_db;

USE coffee_db;

CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category ENUM('coffee', 'snack') NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  image_url VARCHAR(255)
);

CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  items JSON NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO products (name, category, price, description, image_url) VALUES
('Espresso', 'coffee', 2.50, 'Strong black coffee', 'espresso.jpg'),
('Latte', 'coffee', 4.00, 'Milky coffee', 'latte.jpg'),
('Chocolate Chip Cookies', 'snack', 1.50, 'Fresh baked cookies', 'cookies.jpg'),
('Blueberry Muffin', 'snack', 2.75, 'Soft muffin with blueberries', 'muffin.jpg');
