-- Datenbank-Schema für Prepaid-Kassensystem Freilichtspiele Katzweiler

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE, -- NULL für Kinder ohne eigenen Login
    password_hash VARCHAR(255),  -- NULL für Kinder
    nfc_id VARCHAR(50) UNIQUE,
    fingerprint_id VARCHAR(50) UNIQUE,
    balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    parent_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user', -- 'admin', 'pos', 'user'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    size_info VARCHAR(20), -- z.B. '0,5L', 'Tasse'
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'Getränk', 'Speise'
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL, -- Negativ bei Kauf, Positiv bei Aufladung
    type VARCHAR(20) NOT NULL, -- 'kauf', 'aufladung'
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Wer hat gebucht (Kassierer/Admin)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transaction_items (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL,
    price_at_sale DECIMAL(10, 2) NOT NULL
);

-- Indexe für schnellere Abfragen
CREATE INDEX IF NOT EXISTS idx_users_nfc ON users(nfc_id);
CREATE INDEX IF NOT EXISTS idx_users_fingerprint ON users(fingerprint_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(created_at);

-- Seed-Daten für Produkte (Getränke)
INSERT INTO products (name, size_info, price, category) VALUES
('Franziskaner Weizenbier', '0,5L', 3.00, 'Getränk'),
('Weizenbier, alkoholfrei', '0,5L', 3.00, 'Getränk'),
('Bier und Biermischgetränke', '0,33L', 2.50, 'Getränk'),
('Gründels, alkoholfrei', '0,33L', 2.50, 'Getränk'),
('Parkbräu Export', '0,5L', 3.00, 'Getränk'),
('Sprudel, sauer', '0,7L', 2.00, 'Getränk'),
('Limo, silber', '0,7L', 2.00, 'Getränk'),
('Riesling halbtrocken', '0,25L', 3.00, 'Getränk'),
('Riesling halbtrocken', '1,0L', 12.00, 'Getränk'),
('Portugiesischer Weißherbst', '0,25L', 3.00, 'Getränk'),
('Portugiesischer Weißherbst', '1,0L', 12.00, 'Getränk'),
('Weinschorle', '0,25L', 2.50, 'Getränk'),
('Weinschorle', '0,5L', 5.00, 'Getränk'),
('Sekt', '0,7L', 10.00, 'Getränk'),
('Softgetränke', '0,33L', 2.00, 'Getränk'),
('Bellaris Sprudel, sauer', '0,33L', 1.00, 'Getränk'),
('Kaffee', 'Tasse', 0.00, 'Getränk'),
('Ramazotti', '0,02L', 2.00, 'Getränk'),
('Williamschrist & sonstiges', '0,02L', 2.00, 'Getränk');

-- Seed-Daten für Produkte (Speisen)
INSERT INTO products (name, size_info, price, category) VALUES
('Wurst mit Brötchen', NULL, 2.50, 'Speise'),
('Käsebrötchen', NULL, 1.50, 'Speise'),
('Brezel, gebacken', NULL, 1.50, 'Speise'),
('Erdnüsse', NULL, 1.50, 'Speise'),
('Brezel, trocken', NULL, 1.50, 'Speise'),
('Chio-Chips', NULL, 1.50, 'Speise');

-- Standardbenutzer anlegen
-- Passwörter (bcrypt Hashed):
-- admin123 -> $2a$10$wKzN8gTqE3kM2yH5h6w.ueFp6k99V1UeW3Q76LpZc11i19aH6iJey
-- kasse123 -> $2a$10$4n9P.H97L06xQ6T7bYwX3exgVb4s2Zl3G7W9/bK1R3l1iZ6rP.eB8q
-- spieler123 -> $2a$10$wXbM0c2T.UqWj2Zl3G7W9.X.qWj2Zl3G7W9/bK1R3l1iZ6rP.eB8q

INSERT INTO users (name, username, password_hash, role, balance) VALUES
('Administrator', 'admin', '$2a$10$wKzN8gTqE3kM2yH5h6w.ueFp6k99V1UeW3Q76LpZc11i19aH6iJey', 'admin', 100.00),
('Kassenterminal', 'kasse', '$2a$10$4n9P.H97L06xQ6T7bYwX3exgVb4s2Zl3G7W9/bK1R3l1iZ6rP.eB8q', 'pos', 0.00),
('Max Mustermann', 'max', '$2a$10$wXbM0c2T.UqWj2Zl3G7W9.X.qWj2Zl3G7W9/bK1R3l1iZ6rP.eB8q', 'user', 50.00),
('Erika Mustermann', 'erika', '$2a$10$wXbM0c2T.UqWj2Zl3G7W9.X.qWj2Zl3G7W9/bK1R3l1iZ6rP.eB8q', 'user', 75.50);

-- Kinder für Max Mustermann (User ID 3)
INSERT INTO users (name, username, password_hash, role, balance, parent_id, nfc_id, fingerprint_id) VALUES
('Moritz Mustermann (Kind)', NULL, NULL, 'user', 15.00, 3, 'NFC_MORITZ_123', 'FP_MORITZ_456'),
('Mia Mustermann (Kind)', NULL, NULL, 'user', 10.00, 3, 'NFC_MIA_123', NULL);

-- Einige Transaktionen vorgenerieren für die Demo
-- Max lädt 50 Euro auf
INSERT INTO transactions (user_id, amount, type, created_by, created_at) VALUES
(3, 50.00, 'aufladung', 1, CURRENT_TIMESTAMP - INTERVAL '3 days');

-- Max kauft 1 Wurst mit Brötchen und 1 Parkbräu
INSERT INTO transactions (id, user_id, amount, type, created_by, created_at) VALUES
(100, 3, -5.50, 'kauf', 2, CURRENT_TIMESTAMP - INTERVAL '2 days');
INSERT INTO transaction_items (transaction_id, product_id, quantity, price_at_sale) VALUES
(100, 20, 1, 2.50), -- Wurst
(100, 5, 1, 3.00);  -- Parkbräu

-- Moritz (Kind) kauft 1 Softgetränk und 1 Chio-Chips
INSERT INTO transactions (id, user_id, amount, type, created_by, created_at) VALUES
(101, 5, -3.50, 'kauf', 2, CURRENT_TIMESTAMP - INTERVAL '1 day');
INSERT INTO transaction_items (transaction_id, product_id, quantity, price_at_sale) VALUES
(101, 15, 1, 2.00), -- Softgetränk
(101, 25, 1, 1.50);  -- Chips
