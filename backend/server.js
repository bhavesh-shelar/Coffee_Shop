const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

const seedProducts = [
  { name: 'Espresso', category: 'coffee', price: 2.5, description: 'Strong shot espresso with a rich crema finish.', image_url: '' },
  { name: 'Latte', category: 'coffee', price: 4, description: 'Smooth creamy latte with velvety steamed milk.', image_url: 'https://images.unsplash.com/photo-1572448895856-6e157307fc69?w=400&h=300&fit=crop' },
  { name: 'Cappuccino', category: 'coffee', price: 3.75, description: 'Balanced espresso, milk, and cloud-soft foam.', image_url: 'https://images.unsplash.com/photo-1509043759401-51ee732cec44?w=400&h=300&fit=crop' },
  { name: 'Americano', category: 'coffee', price: 2.75, description: 'Bold Americano brewed for a clean finish.', image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop' },
  { name: 'Mocha', category: 'coffee', price: 4.5, description: 'Rich chocolate mocha with espresso depth.', image_url: 'https://images.unsplash.com/photo-1534623084325-16e7e19ee3eb?w=400&h=300&fit=crop' },
  { name: 'Flat White', category: 'coffee', price: 4.25, description: 'Velvety flat white with silky microfoam.', image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=300&fit=crop' },
  { name: 'Chocolate Chip Cookies', category: 'snack', price: 1.5, description: 'Warm chocolate cookies with gooey centers.', image_url: 'https://images.unsplash.com/photo-1561843191-70c806aa6999?w=400&h=300&fit=crop' },
  { name: 'Blueberry Muffin', category: 'snack', price: 2.75, description: 'Fresh blueberry muffin baked every morning.', image_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop' },
  { name: 'Ham Sandwich', category: 'snack', price: 5, description: 'Toasted ham sandwich on artisan bread.', image_url: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=300&fit=crop' },
  { name: 'Croissant', category: 'snack', price: 3, description: 'Flaky golden croissant with buttery layers.', image_url: 'https://images.unsplash.com/photo-1507646225500-1c0a81f43554?w=400&h=300&fit=crop' },
  { name: 'Donut', category: 'snack', price: 2.25, description: 'Glazed sprinkle donut with a soft crumb.', image_url: 'https://images.unsplash.com/photo-1579898828006-1df72e47efa6?w=400&h=300&fit=crop' },
];

const fallbackProducts = seedProducts.map((product, index) => ({ id: index + 1, ...product }));
const fallbackOrders = [];
let nextFallbackProductId = fallbackProducts.length + 1;
let nextFallbackOrderId = 1;

let db = null;
let dbConnected = false;
let dbError = null;

app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'https://coffee-shop-2-rwiw.onrender.com',
    ],
  }),
);
app.use(express.json());

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'coffee_db',
};

const paymentConfig = {
  upiVpa: String(process.env.UPI_VPA || '').trim(),
  payeeName: process.env.UPI_PAYEE_NAME || 'Coffee Shop',
  note: process.env.UPI_NOTE || 'Coffee order payment',
};

const razorpayConfig = {
  keyId: process.env.RAZORPAY_KEY_ID || '',
  keySecret: process.env.RAZORPAY_KEY_SECRET || '',
};

const paymentSessions = new Map();
const PAYMENT_SESSION_TTL_MS = 15 * 60 * 1000;
const razorpaySessions = new Map();
const RAZORPAY_SESSION_TTL_MS = 30 * 60 * 1000;

const setDbDisconnected = (errorMessage) => {
  dbConnected = false;
  dbError = errorMessage;
};

const PLACEHOLDER_UPI_IDS = new Set([
  'coffeeshop@upi',
  'your-upi-id@bank',
  'example@upi',
  'test@upi',
]);

const isValidUpiVpa = (vpa) => /^[a-zA-Z0-9._-]{2,}@[a-zA-Z0-9.-]{2,}$/.test(String(vpa || '').trim());

const getUpiConfigError = () => {
  const vpa = String(paymentConfig.upiVpa || '').trim().toLowerCase();
  if (!vpa) {
    return 'UPI is not configured. Set UPI_VPA in backend/.env (example: yourname@okhdfcbank).';
  }

  if (PLACEHOLDER_UPI_IDS.has(vpa)) {
    return 'Configured UPI ID is a placeholder. Replace UPI_VPA in backend/.env with your real UPI ID.';
  }

  if (!isValidUpiVpa(vpa)) {
    return 'Configured UPI ID format is invalid. Use format: username@bankhandle (example: yourname@oksbi).';
  }

  return null;
};

const normalizeItems = (items) => (
  Array.isArray(items)
    ? items
      .filter((item) => item && item.name && Number.isFinite(Number(item.price)))
      .map((item) => ({
        id: item.id,
        name: String(item.name),
        category: item.category === 'snack' ? 'snack' : 'coffee',
        price: Number(item.price),
        description: item.description ? String(item.description) : '',
        image_url: item.image_url ? String(item.image_url) : '',
      }))
    : []
);

const normalizeProduct = (input) => {
  const name = String(input?.name || '').trim();
  const category = input?.category === 'snack' ? 'snack' : input?.category === 'coffee' ? 'coffee' : '';
  const price = Number(input?.price);
  const description = String(input?.description || '').trim();
  const image_url = String(input?.image_url || '').trim();

  if (!name || !category || !Number.isFinite(price) || price <= 0) {
    return null;
  }

  return {
    name,
    category,
    price: Number(price.toFixed(2)),
    description,
    image_url,
  };
};

const normalizePayment = (input) => {
  const methodRaw = String(input?.method || 'cash').toLowerCase();
  const method = methodRaw === 'upi' || methodRaw === 'razorpay' ? methodRaw : 'cash';
  const status = String(input?.status || 'paid').toLowerCase() === 'pending' ? 'pending' : 'paid';
  const reference = String(input?.upi_transaction_ref || input?.reference || '').trim();
  const sessionId = String(input?.payment_session_id || '').trim();
  const gatewayOrderId = String(input?.gateway_order_id || input?.razorpay_order_id || '').trim();
  const gatewayPaymentId = String(input?.gateway_payment_id || input?.razorpay_payment_id || '').trim();
  const gatewaySignature = String(input?.gateway_signature || input?.razorpay_signature || '').trim();

  return {
    method,
    status,
    reference,
    sessionId: sessionId || null,
    gatewayOrderId: gatewayOrderId || null,
    gatewayPaymentId: gatewayPaymentId || null,
    gatewaySignature: gatewaySignature || null,
  };
};

const buildUpiUrl = ({ amount, transactionRef }) => {
  const params = new URLSearchParams({
    pa: paymentConfig.upiVpa,
    pn: paymentConfig.payeeName,
    am: Number(amount).toFixed(2),
    cu: 'INR',
    tn: paymentConfig.note,
    tr: transactionRef,
  });

  return `upi://pay?${params.toString()}`;
};

const createPaymentSessionId = () => `upi_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

const toApiProduct = (row) => ({
  id: Number(row.id),
  name: String(row.name),
  category: row.category === 'snack' ? 'snack' : 'coffee',
  price: Number(row.price),
  description: String(row.description || ''),
  image_url: String(row.image_url || ''),
});

const toApiOrder = (row) => {
  let items = [];
  try {
    items = JSON.parse(row.items || '[]');
  } catch (error) {
    items = [];
  }

  return {
    id: Number(row.id),
    items,
    total: Number(row.total),
    created_at: row.created_at,
    payment_method: String(row.payment_method || 'cash'),
    payment_status: String(row.payment_status || 'paid'),
    payment_reference: String(row.payment_reference || ''),
    payment_session_id: row.payment_session_id ? String(row.payment_session_id) : null,
    gateway_order_id: row.gateway_order_id ? String(row.gateway_order_id) : null,
    gateway_payment_id: row.gateway_payment_id ? String(row.gateway_payment_id) : null,
  };
};

const getOrderTotal = (items) => Number(items.reduce((sum, item) => sum + Number(item.price), 0).toFixed(2));

const initializeDatabase = async () => {
  try {
    const bootstrapConnection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
    });

    await bootstrapConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
    await bootstrapConnection.end();

    db = await mysql.createConnection(dbConfig);

    db.on('error', (error) => {
      setDbDisconnected(error.message);
      console.error('Database connection error. Falling back to in-memory mode:', error.message);
    });

    await db.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(20) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        description TEXT,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        items LONGTEXT NOT NULL,
        total DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(20) NOT NULL DEFAULT 'cash',
        payment_status VARCHAR(20) NOT NULL DEFAULT 'paid',
        payment_reference VARCHAR(120) NULL,
        payment_session_id VARCHAR(120) NULL,
        gateway_order_id VARCHAR(120) NULL,
        gateway_payment_id VARCHAR(120) NULL,
        gateway_signature VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) NOT NULL DEFAULT 'cash'");
    await db.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) NOT NULL DEFAULT 'paid'");
    await db.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(120) NULL');
    await db.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_session_id VARCHAR(120) NULL');
    await db.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS gateway_order_id VARCHAR(120) NULL');
    await db.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS gateway_payment_id VARCHAR(120) NULL');
    await db.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS gateway_signature VARCHAR(255) NULL');

    const [countRows] = await db.query('SELECT COUNT(*) AS total FROM products');
    const currentProductCount = Number(countRows?.[0]?.total || 0);

    if (currentProductCount === 0) {
      const insertProductSql = 'INSERT INTO products (name, category, price, description, image_url) VALUES (?, ?, ?, ?, ?)';
      for (const product of seedProducts) {
        await db.query(insertProductSql, [product.name, product.category, product.price, product.description, product.image_url]);
      }
    }

    dbConnected = true;
    dbError = null;
    console.log(`MySQL connected to "${dbConfig.database}". API running on http://localhost:${PORT}`);
  } catch (error) {
    setDbDisconnected(error.message);
    console.error('DB connection failed, using fallback data:', error.message);
  }
};

initializeDatabase();

const cleanupPaymentSessions = () => {
  const now = Date.now();
  for (const [sessionId, session] of paymentSessions.entries()) {
    if (now - session.createdAt > PAYMENT_SESSION_TTL_MS) {
      paymentSessions.delete(sessionId);
    }
  }
};

const cleanupRazorpaySessions = () => {
  const now = Date.now();
  for (const [orderId, session] of razorpaySessions.entries()) {
    if (now - session.createdAt > RAZORPAY_SESSION_TTL_MS) {
      razorpaySessions.delete(orderId);
    }
  }
};

const isRazorpayConfigured = () => Boolean(razorpayConfig.keyId && razorpayConfig.keySecret);

const createRazorpayOrder = async ({ amountInPaise, notes }) => {
  const auth = Buffer.from(`${razorpayConfig.keyId}:${razorpayConfig.keySecret}`).toString('base64');
  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `coffee_${Date.now()}`,
      payment_capture: 1,
      notes: notes || {},
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    const message = data?.error?.description || data?.error?.reason || 'Unable to create Razorpay order';
    throw new Error(message);
  }

  return data;
};

const verifyRazorpaySignature = ({ orderId, paymentId, signature }) => {
  const payload = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac('sha256', razorpayConfig.keySecret).update(payload).digest('hex');
  return expected === signature;
};

const createOrderRecord = async ({ items, total, payment }) => {
  const paymentDetails = normalizePayment(payment);

  if (!dbConnected || !db) {
    const order = {
      id: nextFallbackOrderId++,
      items,
      total,
      created_at: new Date().toISOString(),
      payment_method: paymentDetails.method,
      payment_status: paymentDetails.status,
      payment_reference: paymentDetails.reference,
      payment_session_id: paymentDetails.sessionId,
      gateway_order_id: paymentDetails.gatewayOrderId,
      gateway_payment_id: paymentDetails.gatewayPaymentId,
      gateway_signature: paymentDetails.gatewaySignature,
      mode: 'fallback',
    };

    fallbackOrders.unshift(order);
    return { id: order.id, message: 'Order created in fallback mode', order };
  }

  try {
    const [result] = await db.query(
      `INSERT INTO orders
        (items, total, payment_method, payment_status, payment_reference, payment_session_id, gateway_order_id, gateway_payment_id, gateway_signature)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        JSON.stringify(items),
        total,
        paymentDetails.method,
        paymentDetails.status,
        paymentDetails.reference || null,
        paymentDetails.sessionId,
        paymentDetails.gatewayOrderId,
        paymentDetails.gatewayPaymentId,
        paymentDetails.gatewaySignature,
      ],
    );

    return {
      id: Number(result.insertId),
      message: 'Order created',
      payment_status: paymentDetails.status,
      payment_method: paymentDetails.method,
    };
  } catch (error) {
    setDbDisconnected(error.message);
    console.error('Order insert failed, saving order in fallback mode:', error.message);

    const order = {
      id: nextFallbackOrderId++,
      items,
      total,
      created_at: new Date().toISOString(),
      payment_method: paymentDetails.method,
      payment_status: paymentDetails.status,
      payment_reference: paymentDetails.reference,
      payment_session_id: paymentDetails.sessionId,
      gateway_order_id: paymentDetails.gatewayOrderId,
      gateway_payment_id: paymentDetails.gatewayPaymentId,
      gateway_signature: paymentDetails.gatewaySignature,
      mode: 'fallback',
    };

    fallbackOrders.unshift(order);
    return { id: order.id, message: 'Order created in fallback mode', order };
  }
};

app.get('/api/products', async (req, res) => {
  if (!dbConnected || !db) {
    return res.json(fallbackProducts);
  }

  try {
    const [rows] = await db.query('SELECT * FROM products ORDER BY category, name');
    return res.json(rows.map(toApiProduct));
  } catch (error) {
    setDbDisconnected(error.message);
    console.error('Product query failed, returning fallback products:', error.message);
    return res.json(fallbackProducts);
  }
});

app.get('/api/orders', async (req, res) => {
  if (!dbConnected || !db) {
    return res.json(fallbackOrders);
  }

  try {
    const [rows] = await db.query('SELECT * FROM orders ORDER BY created_at DESC');
    return res.json(rows.map(toApiOrder));
  } catch (error) {
    setDbDisconnected(error.message);
    console.error('Order query failed, returning fallback orders:', error.message);
    return res.json(fallbackOrders);
  }
});

app.post('/api/products', async (req, res) => {
  const product = normalizeProduct(req.body);
  if (!product) {
    return res.status(400).json({ error: 'Invalid product data. Name, category, and positive price are required.' });
  }

  if (!dbConnected || !db) {
    const newProduct = { id: nextFallbackProductId++, ...product };
    fallbackProducts.push(newProduct);
    return res.status(201).json(newProduct);
  }

  try {
    const insertSql = 'INSERT INTO products (name, category, price, description, image_url) VALUES (?, ?, ?, ?, ?)';
    const [result] = await db.query(insertSql, [product.name, product.category, product.price, product.description, product.image_url]);
    return res.status(201).json({ id: Number(result.insertId), ...product });
  } catch (error) {
    setDbDisconnected(error.message);
    console.error('Product insert failed, saving product in fallback mode:', error.message);

    const newProduct = { id: nextFallbackProductId++, ...product };
    fallbackProducts.push(newProduct);
    return res.status(201).json(newProduct);
  }
});

app.delete('/api/products/:id', async (req, res) => {
  const productId = Number(req.params.id);

  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ error: 'Invalid product id.' });
  }

  if (!dbConnected || !db) {
    const index = fallbackProducts.findIndex((product) => Number(product.id) === productId);
    if (index === -1) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    fallbackProducts.splice(index, 1);
    return res.json({ message: 'Product removed.', id: productId });
  }

  try {
    const [result] = await db.query('DELETE FROM products WHERE id = ?', [productId]);
    if (!result.affectedRows) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    return res.json({ message: 'Product removed.', id: productId });
  } catch (error) {
    setDbDisconnected(error.message);
    console.error('Product delete failed, switching to fallback mode:', error.message);

    const index = fallbackProducts.findIndex((product) => Number(product.id) === productId);
    if (index !== -1) {
      fallbackProducts.splice(index, 1);
      return res.json({ message: 'Product removed.', id: productId });
    }

    return res.status(500).json({ error: 'Unable to remove product.' });
  }
});

app.post('/api/payments/razorpay/order', async (req, res) => {
  cleanupRazorpaySessions();

  if (!isRazorpayConfigured()) {
    return res.status(503).json({ error: 'Razorpay is not configured on server. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.' });
  }

  const items = normalizeItems(req.body?.items);
  const total = getOrderTotal(items);
  if (items.length === 0) {
    return res.status(400).json({ error: 'Please add at least one item to continue.' });
  }

  if (!Number.isFinite(total) || total <= 0) {
    return res.status(400).json({ error: 'Invalid order total.' });
  }

  try {
    const amountInPaise = Math.round(total * 100);
    const razorpayOrder = await createRazorpayOrder({
      amountInPaise,
      notes: { source: 'coffee_shop', item_count: String(items.length) },
    });

    razorpaySessions.set(razorpayOrder.id, {
      createdAt: Date.now(),
      items,
      total,
    });

    return res.status(201).json({
      key_id: razorpayConfig.keyId,
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      name: paymentConfig.payeeName,
      description: 'Coffee Shop Order',
    });
  } catch (error) {
    console.error('Razorpay order creation failed:', error.message);
    return res.status(502).json({ error: error.message || 'Unable to initialize Razorpay payment.' });
  }
});

app.post('/api/payments/razorpay/verify', async (req, res) => {
  cleanupRazorpaySessions();

  if (!isRazorpayConfigured()) {
    return res.status(503).json({ error: 'Razorpay is not configured on server.' });
  }

  const orderId = String(req.body?.razorpay_order_id || '').trim();
  const paymentId = String(req.body?.razorpay_payment_id || '').trim();
  const signature = String(req.body?.razorpay_signature || '').trim();

  if (!orderId || !paymentId || !signature) {
    return res.status(400).json({ error: 'Missing Razorpay verification payload.' });
  }

  const session = razorpaySessions.get(orderId);
  if (!session) {
    return res.status(404).json({ error: 'Payment session expired or invalid. Please retry checkout.' });
  }

  const isValid = verifyRazorpaySignature({ orderId, paymentId, signature });
  if (!isValid) {
    return res.status(400).json({ error: 'Payment verification failed. Signature mismatch.' });
  }

  const order = await createOrderRecord({
    items: session.items,
    total: session.total,
    payment: {
      method: 'razorpay',
      status: 'paid',
      reference: paymentId,
      payment_session_id: orderId,
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    },
  });

  razorpaySessions.delete(orderId);
  return res.status(201).json({
    id: order.id,
    message: 'Payment verified. Order created successfully.',
    payment_status: 'paid',
    payment_method: 'razorpay',
    razorpay_payment_id: paymentId,
  });
});

app.post('/api/payments/upi/init', async (req, res) => {
  cleanupPaymentSessions();

  const upiConfigError = getUpiConfigError();
  if (upiConfigError) {
    return res.status(503).json({ error: upiConfigError });
  }

  const items = normalizeItems(req.body?.items);
  const total = getOrderTotal(items);

  if (items.length === 0) {
    return res.status(400).json({ error: 'Please add at least one item to continue.' });
  }

  if (total <= 0) {
    return res.status(400).json({ error: 'Invalid order total.' });
  }

  const paymentSessionId = createPaymentSessionId();
  const transactionRef = `CS${Date.now()}`;
  const upiUrl = buildUpiUrl({ amount: total, transactionRef });
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiUrl)}`;

  paymentSessions.set(paymentSessionId, {
    createdAt: Date.now(),
    items,
    total,
    upi_transaction_ref: transactionRef,
  });

  return res.status(201).json({
    payment_session_id: paymentSessionId,
    upi_url: upiUrl,
    qr_url: qrUrl,
    amount: total,
    currency: 'INR',
    payee_name: paymentConfig.payeeName,
    upi_vpa: paymentConfig.upiVpa,
    note: paymentConfig.note,
    upi_transaction_ref: transactionRef,
  });
});

app.post('/api/payments/upi/confirm', async (req, res) => {
  cleanupPaymentSessions();

  const paymentSessionId = String(req.body?.payment_session_id || '').trim();
  const customerRef = String(req.body?.upi_transaction_ref || '').trim();

  if (!paymentSessionId) {
    return res.status(400).json({ error: 'payment_session_id is required.' });
  }

  const session = paymentSessions.get(paymentSessionId);
  if (!session) {
    return res.status(404).json({ error: 'Payment session expired or invalid. Please retry checkout.' });
  }

  const upiTransactionRef = customerRef || session.upi_transaction_ref;
  const order = await createOrderRecord({
    items: session.items,
    total: session.total,
    payment: {
      method: 'upi',
      status: 'paid',
      upi_transaction_ref: upiTransactionRef,
      payment_session_id: paymentSessionId,
    },
  });

  paymentSessions.delete(paymentSessionId);
  return res.status(201).json({
    id: order.id,
    message: 'Payment received. Order created successfully.',
    payment_status: 'paid',
    upi_transaction_ref: upiTransactionRef,
  });
});

app.post('/api/orders', async (req, res) => {
  const items = normalizeItems(req.body?.items);
  const total = getOrderTotal(items);

  if (items.length === 0) {
    return res.status(400).json({ error: 'Please add at least one item to place an order.' });
  }

  const order = await createOrderRecord({
    items,
    total,
    payment: req.body?.payment,
  });

  return res.status(201).json(order);
});

app.get('/api', (req, res) => {
  res.json({
    message: 'Coffee Shop API',
    mode: dbConnected ? 'database' : 'fallback',
    endpoints: [
      'GET /api/products',
      'POST /api/products',
      'DELETE /api/products/:id',
      'GET /api/orders',
      'POST /api/orders',
      'POST /api/payments/razorpay/order',
      'POST /api/payments/razorpay/verify',
      'POST /api/payments/upi/init',
      'POST /api/payments/upi/confirm',
      'GET /api/health',
    ],
    frontend: 'http://localhost:3000',
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    db: dbConnected,
    mode: dbConnected ? 'database' : 'fallback',
    database: dbConfig.database,
    razorpayConfigured: isRazorpayConfigured(),
    error: dbConnected ? null : dbError,
  });
});

// Serve frontend build if it exists (for integrated deployment).
const frontendBuildPath = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendBuildPath)) {
  app.use(express.static(frontendBuildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.redirect('/api');
  });
}

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API docs: http://localhost:${PORT}/`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Shut down the running server or change PORT.`);
  } else {
    console.error('Server error:', error);
  }
  process.exit(1);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Shut down the running server or change PORT.`);
  } else {
    console.error('Server error:', error);
  }
  process.exit(1);
});
