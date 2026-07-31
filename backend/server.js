import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { query } from './db.js';

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'katzweiler_secret_key_123';

app.use(cors());
app.use(express.json());

// Auth Middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Kein Token bereitgestellt' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Ungültiges Token' });
  }
};

// ----------------------------------------------------
// AUTH ROUTEN
// ----------------------------------------------------

// Login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Benutzername und Passwort erforderlich' });
  }

  try {
    const result = await query('SELECT * FROM users WHERE username = $1', [username.toLowerCase().trim()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Falscher Benutzername oder Passwort' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Falscher Benutzername oder Passwort' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        balance: parseFloat(user.balance)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler beim Login' });
  }
});

// Profil abrufen
app.get('/api/auth/me', authenticate, async (req, res) => {
  try {
    const result = await query('SELECT id, name, username, role, balance, parent_id FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }
    const user = result.rows[0];
    user.balance = parseFloat(user.balance);
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler beim Abrufen des Profils' });
  }
});

// ----------------------------------------------------
// NUTZER VERWALTUNG
// ----------------------------------------------------

// Alle Benutzer (für Admin/POS) oder eigene Kinder (für User)
app.get('/api/users', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'admin' || req.user.role === 'pos') {
      // Admins & Kassen sehen alle Benutzer (und Verknüpfungen)
      const result = await query(`
        SELECT u.id, u.name, u.username, u.role, u.balance, u.nfc_id, u.fingerprint_id, u.parent_id,
               p.name as parent_name, u.created_at
        FROM users u
        LEFT JOIN users p ON u.parent_id = p.id
        ORDER BY u.name ASC
      `);
      const users = result.rows.map(u => ({ ...u, balance: parseFloat(u.balance) }));
      res.json(users);
    } else {
      // Normale Nutzer sehen sich selbst und ihre Kinder
      const result = await query(`
        SELECT id, name, username, role, balance, nfc_id, fingerprint_id, parent_id
        FROM users
        WHERE id = $1 OR parent_id = $1
        ORDER BY id ASC
      `, [req.user.id]);
      const users = result.rows.map(u => ({ ...u, balance: parseFloat(u.balance) }));
      res.json(users);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler beim Abrufen der Benutzer' });
  }
});

// Nutzersuche (für POS per Name, NFC oder Fingerabdruck)
app.get('/api/users/find', authenticate, async (req, res) => {
  const { nfc, fingerprint, q } = req.query;

  try {
    let result;
    if (nfc) {
      result = await query('SELECT * FROM users WHERE nfc_id = $1', [nfc.trim()]);
    } else if (fingerprint) {
      result = await query('SELECT * FROM users WHERE fingerprint_id = $1', [fingerprint.trim()]);
    } else if (q) {
      result = await query('SELECT * FROM users WHERE name ILIKE $1 OR username ILIKE $1 ORDER BY name LIMIT 10', [`%${q.trim()}%`]);
      const users = result.rows.map(u => ({ ...u, balance: parseFloat(u.balance) }));
      return res.json(users);
    } else {
      return res.status(400).json({ error: 'Suchparameter fehlt' });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Kein Benutzer gefunden' });
    }

    const user = result.rows[0];
    user.balance = parseFloat(user.balance);
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler bei der Nutzersuche' });
  }
});

// Benutzer anlegen (Admin kann jeden anlegen, User kann Kinder anlegen)
app.post('/api/users', authenticate, async (req, res) => {
  const { name, username, password, role, nfc_id, fingerprint_id, parent_id } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name ist erforderlich' });
  }

  try {
    // Falls normaler User versucht anzulegen, darf er NUR Kinder für sich selbst anlegen
    let finalParentId = parent_id;
    let finalRole = role || 'user';

    if (req.user.role !== 'admin') {
      finalParentId = req.user.id; // Immer der angemeldete Nutzer ist Parent
      finalRole = 'user'; // Keine Admin-Rechte für Kinder
      if (username || password) {
        return res.status(400).json({ error: 'Kinder-Accounts haben keinen direkten Login' });
      }
    }

    let passwordHash = null;
    if (username && password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const result = await query(
      `INSERT INTO users (name, username, password_hash, role, nfc_id, fingerprint_id, parent_id, balance)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 0.00) RETURNING *`,
      [
        name.trim(),
        username ? username.toLowerCase().trim() : null,
        passwordHash,
        finalRole,
        nfc_id ? nfc_id.trim() : null,
        fingerprint_id ? fingerprint_id.trim() : null,
        finalParentId
      ]
    );

    const newUser = result.rows[0];
    newUser.balance = parseFloat(newUser.balance);
    res.status(201).json(newUser);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'Benutzername, NFC-ID oder Fingerabdruck-ID wird bereits verwendet' });
    }
    res.status(500).json({ error: 'Serverfehler beim Erstellen des Benutzers' });
  }
});

// Benutzer aktualisieren (Admin-Rechte, oder begrenzte Änderungen durch User an seinen Kindern)
app.put('/api/users/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { name, username, password, role, nfc_id, fingerprint_id } = req.body;

  try {
    // Prüfen ob berechtigt
    const checkUser = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (checkUser.rows.length === 0) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    const targetUser = checkUser.rows[0];

    if (req.user.role !== 'admin') {
      // Wenn nicht admin, darf es nur ein eigenes Kind sein
      if (targetUser.parent_id !== req.user.id) {
        return res.status(403).json({ error: 'Nicht autorisiert' });
      }
      // User darf bei Kindern nur Name, NFC und Fingerprint ändern (keine Rollen oder Passwörter)
      await query(
        `UPDATE users SET name = $1, nfc_id = $2, fingerprint_id = $3 WHERE id = $4`,
        [name || targetUser.name, nfc_id || null, fingerprint_id || null, id]
      );
    } else {
      // Admin darf alles ändern
      let passwordHash = targetUser.password_hash;
      if (password) {
        passwordHash = await bcrypt.hash(password, 10);
      }

      await query(
        `UPDATE users SET name = $1, username = $2, password_hash = $3, role = $4, nfc_id = $5, fingerprint_id = $6
         WHERE id = $7`,
        [
          name || targetUser.name,
          username ? username.toLowerCase().trim() : targetUser.username,
          passwordHash,
          role || targetUser.role,
          nfc_id || null,
          fingerprint_id || null,
          id
        ]
      );
    }

    const updatedResult = await query('SELECT * FROM users WHERE id = $1', [id]);
    const updatedUser = updatedResult.rows[0];
    updatedUser.balance = parseFloat(updatedUser.balance);
    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Benutzername, NFC-ID oder Fingerabdruck-ID wird bereits verwendet' });
    }
    res.status(500).json({ error: 'Serverfehler beim Aktualisieren des Benutzers' });
  }
});

// Guthaben aufladen (Admin/POS)
app.post('/api/users/:id/charge', authenticate, async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body; // Positiver Wert

  if (req.user.role !== 'admin' && req.user.role !== 'pos') {
    return res.status(403).json({ error: 'Nicht autorisiert für Aufladungen' });
  }

  const chargeAmount = parseFloat(amount);
  if (isNaN(chargeAmount) || chargeAmount <= 0) {
    return res.status(400).json({ error: 'Ungültiger Betrag. Muss größer als 0 sein.' });
  }

  try {
    // DB Transaktion
    await query('BEGIN');

    // Benutzer prüfen
    const checkUser = await query('SELECT * FROM users WHERE id = $1 FOR UPDATE', [id]);
    if (checkUser.rows.length === 0) {
      await query('ROLLBACK');
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    // Guthaben aktualisieren
    await query('UPDATE users SET balance = balance + $1 WHERE id = $2', [chargeAmount, id]);

    // Transaktion protokollieren
    await query(
      `INSERT INTO transactions (user_id, amount, type, created_by)
       VALUES ($1, $2, 'aufladung', $3)`,
      [id, chargeAmount, req.user.id]
    );

    await query('COMMIT');

    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    const user = result.rows[0];
    user.balance = parseFloat(user.balance);

    res.json({ message: 'Erfolgreich aufgeladen', user });
  } catch (err) {
    await query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Serverfehler beim Aufladen' });
  }
});

// ----------------------------------------------------
// PRODUKTE VERWALTUNG
// ----------------------------------------------------

// Alle aktiven Produkte
app.get('/api/products', async (req, res) => {
  try {
    const result = await query('SELECT * FROM products WHERE active = true ORDER BY category DESC, name ASC');
    const products = result.rows.map(p => ({ ...p, price: parseFloat(p.price) }));
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler beim Laden der Produkte' });
  }
});

// Produkt anlegen (Admin)
app.post('/api/products', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Nicht autorisiert' });
  }

  const { name, size_info, price, category } = req.body;
  if (!name || isNaN(parseFloat(price)) || !category) {
    return res.status(400).json({ error: 'Ungültige Produktdaten' });
  }

  try {
    const result = await query(
      `INSERT INTO products (name, size_info, price, category)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name.trim(), size_info ? size_info.trim() : null, parseFloat(price), category.trim()]
    );
    const product = result.rows[0];
    product.price = parseFloat(product.price);
    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler beim Erstellen des Produkts' });
  }
});

// Produkt aktualisieren (Admin)
app.put('/api/products/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Nicht autorisiert' });
  }

  const { id } = req.params;
  const { name, size_info, price, category, active } = req.body;

  try {
    const checkProduct = await query('SELECT * FROM products WHERE id = $1', [id]);
    if (checkProduct.rows.length === 0) {
      return res.status(404).json({ error: 'Produkt nicht gefunden' });
    }

    const prod = checkProduct.rows[0];

    await query(
      `UPDATE products SET name = $1, size_info = $2, price = $3, category = $4, active = $5
       WHERE id = $6`,
      [
        name || prod.name,
        size_info !== undefined ? size_info : prod.size_info,
        price !== undefined ? parseFloat(price) : prod.price,
        category || prod.category,
        active !== undefined ? active : prod.active,
        id
      ]
    );

    const result = await query('SELECT * FROM products WHERE id = $1', [id]);
    const product = result.rows[0];
    product.price = parseFloat(product.price);
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler beim Aktualisieren des Produkts' });
  }
});

// ----------------------------------------------------
// TRANSAKTIONEN & CHEKOUT
// ----------------------------------------------------

// Kauf tätigen (POS/Admin)
app.post('/api/transactions/checkout', authenticate, async (req, res) => {
  if (req.user.role !== 'pos' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Nicht autorisiert für Verkäufe' });
  }

  const { userId, items } = req.body; // items: [{ productId, quantity }]
  if (!userId || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Ungültige Kaufdaten' });
  }

  try {
    await query('BEGIN');

    // Benutzer laden und sperren
    const checkUser = await query('SELECT * FROM users WHERE id = $1 FOR UPDATE', [userId]);
    if (checkUser.rows.length === 0) {
      await query('ROLLBACK');
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    const user = checkUser.rows[0];
    let totalPrice = 0;
    const itemsToInsert = [];

    // Preise prüfen und Summe berechnen
    for (const item of items) {
      const prodResult = await query('SELECT * FROM products WHERE id = $1 AND active = true', [item.productId]);
      if (prodResult.rows.length === 0) {
        await query('ROLLBACK');
        return res.status(404).json({ error: `Produkt ID ${item.productId} nicht gefunden oder inaktiv` });
      }
      const product = prodResult.rows[0];
      const price = parseFloat(product.price);
      totalPrice += price * item.quantity;

      itemsToInsert.push({
        productId: product.id,
        quantity: item.quantity,
        priceAtSale: price
      });
    }

    // Guthaben prüfen
    const userBalance = parseFloat(user.balance);
    if (userBalance < totalPrice) {
      await query('ROLLBACK');
      return res.status(400).json({
        error: `Nicht genügend Guthaben. Benötigt: ${totalPrice.toFixed(2)} €, Vorhanden: ${userBalance.toFixed(2)} €`
      });
    }

    // Guthaben abziehen
    await query('UPDATE users SET balance = balance - $1 WHERE id = $2', [totalPrice, userId]);

    // Transaktion einfügen (negativer Betrag für Kauf)
    const txResult = await query(
      `INSERT INTO transactions (user_id, amount, type, created_by)
       VALUES ($1, $2, 'kauf', $3) RETURNING id`,
      [userId, -totalPrice, req.user.id]
    );
    const transactionId = txResult.rows[0].id;

    // Kassenbeleg-Posten einfügen
    for (const item of itemsToInsert) {
      await query(
        `INSERT INTO transaction_items (transaction_id, product_id, quantity, price_at_sale)
         VALUES ($1, $2, $3, $4)`,
        [transactionId, item.productId, item.quantity, item.priceAtSale]
      );
    }

    await query('COMMIT');

    const updatedUserResult = await query('SELECT * FROM users WHERE id = $1', [userId]);
    const updatedUser = updatedUserResult.rows[0];
    updatedUser.balance = parseFloat(updatedUser.balance);

    res.status(201).json({
      message: 'Kauf erfolgreich gebucht',
      newBalance: updatedUser.balance,
      transactionId
    });
  } catch (err) {
    await query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Serverfehler beim Checkout' });
  }
});

// Transaktionshistorie abrufen
app.get('/api/transactions', authenticate, async (req, res) => {
  const { userId } = req.query;

  try {
    let sql;
    let params = [];

    if (req.user.role === 'admin' || req.user.role === 'pos') {
      if (userId) {
        // Verlauf für bestimmten User
        sql = `
          SELECT t.id, t.user_id, u.name as user_name, t.amount, t.type, t.created_at,
                 json_agg(json_build_object(
                   'productName', p.name,
                   'sizeInfo', p.size_info,
                   'quantity', ti.quantity,
                   'priceAtSale', ti.price_at_sale
                 )) filter (where p.id is not null) as items
          FROM transactions t
          JOIN users u ON t.user_id = u.id
          LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
          LEFT JOIN products p ON ti.product_id = p.id
          WHERE t.user_id = $1
          GROUP BY t.id, u.name
          ORDER BY t.created_at DESC
        `;
        params = [userId];
      } else {
        // Alle Transaktionen
        sql = `
          SELECT t.id, t.user_id, u.name as user_name, t.amount, t.type, t.created_at,
                 json_agg(json_build_object(
                   'productName', p.name,
                   'sizeInfo', p.size_info,
                   'quantity', ti.quantity,
                   'priceAtSale', ti.price_at_sale
                 )) filter (where p.id is not null) as items
          FROM transactions t
          JOIN users u ON t.user_id = u.id
          LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
          LEFT JOIN products p ON ti.product_id = p.id
          GROUP BY t.id, u.name
          ORDER BY t.created_at DESC
          LIMIT 100
        `;
      }
    } else {
      // Normale User sehen nur sich und ihre Kinder
      sql = `
        SELECT t.id, t.user_id, u.name as user_name, t.amount, t.type, t.created_at,
               json_agg(json_build_object(
                 'productName', p.name,
                 'sizeInfo', p.size_info,
                 'quantity', ti.quantity,
                 'priceAtSale', ti.price_at_sale
               )) filter (where p.id is not null) as items
        FROM transactions t
        JOIN users u ON t.user_id = u.id
        LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
        LEFT JOIN products p ON ti.product_id = p.id
        WHERE t.user_id = $1 OR u.parent_id = $1
        GROUP BY t.id, u.name
        ORDER BY t.created_at DESC
      `;
      params = [req.user.id];
    }

    const result = await query(sql, params);
    const txs = result.rows.map(tx => ({
      ...tx,
      amount: parseFloat(tx.amount),
      items: tx.items || []
    }));

    res.json(txs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler beim Laden der Transaktionen' });
  }
});

// ----------------------------------------------------
// EXPORT ABRECHNUNG
// ----------------------------------------------------

// Excel-kompatibler CSV-Export für Tagesabrechnung
app.get('/api/export/settlement', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Nicht autorisiert' });
  }

  const { date } = req.query; // Format 'YYYY-MM-DD'
  const filterDate = date ? date : new Date().toISOString().split('T')[0];

  try {
    // Lade alle Produkte (damit wir auch Produkte mit Menge 0 im Export anzeigen können, genau wie in der Excel)
    const productsResult = await query('SELECT * FROM products ORDER BY category DESC, id ASC');
    const dbProducts = productsResult.rows.map(p => ({ ...p, price: parseFloat(p.price) }));

    // Lade Verkaufszahlen für den Tag
    const salesResult = await query(`
      SELECT ti.product_id, SUM(ti.quantity) as sold_qty
      FROM transaction_items ti
      JOIN transactions t ON ti.transaction_id = t.id
      WHERE t.type = 'kauf' AND DATE(t.created_at) = $1
      GROUP BY ti.product_id
    `, [filterDate]);

    const salesMap = {};
    salesResult.rows.forEach(row => {
      salesMap[row.product_id] = parseInt(row.sold_qty, 10);
    });

    // Getränke und Speisen aufteilen
    const drinks = dbProducts.filter(p => p.category === 'Getränk');
    const food = dbProducts.filter(p => p.category === 'Speise');

    let csvContent = '\uFEFF'; // UTF-8 BOM für Excel
    csvContent += 'FREILICHTSPIELE KATZWEILER e.V.;;;\n';
    csvContent += `Abrechnung - Spielerkantine;;;Datum:;${filterDate}\n\n`;

    // Getränke Sektion
    csvContent += 'Getränk;Menge;Preis;Verkauft;Einnahmen gesamt\n';
    let totalDrinksRevenue = 0;
    drinks.forEach(p => {
      const sold = salesMap[p.id] || 0;
      const revenue = sold * p.price;
      totalDrinksRevenue += revenue;

      const size = p.size_info || '';
      csvContent += `${p.name};${size};${p.price.toFixed(2).replace('.', ',')} €;${sold};${revenue.toFixed(2).replace('.', ',')} €\n`;
    });
    csvContent += `Tageseinnahmen Getränke;;;;${totalDrinksRevenue.toFixed(2).replace('.', ',')} €\n\n\n`;

    // Speisen Sektion
    csvContent += 'Speise;;Preis;Verkauft;Einnahmen gesamt\n';
    let totalFoodRevenue = 0;
    food.forEach(p => {
      const sold = salesMap[p.id] || 0;
      const revenue = sold * p.price;
      totalFoodRevenue += revenue;

      csvContent += `${p.name};;${p.price.toFixed(2).replace('.', ',')} €;${sold};${revenue.toFixed(2).replace('.', ',')} €\n`;
    });
    csvContent += `Tageseinnahmen Essen;;;;${totalFoodRevenue.toFixed(2).replace('.', ',')} €\n`;
    csvContent += `Tageseinnahmen gesamt;;;;${(totalDrinksRevenue + totalFoodRevenue).toFixed(2).replace('.', ',')} €\n`;

    // Header setzen und senden
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="abrechnung_${filterDate}.csv"`);
    res.status(200).send(csvContent);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler beim Generieren des Exports' });
  }
});

// App starten
app.listen(PORT, () => {
  console.log(`Backend Server running on port ${PORT}`);
});
