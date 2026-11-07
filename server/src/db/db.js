import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SQLITE_FILE = path.join(__dirname, 'katalogwa.sqlite');

class SqliteDatabase {
  constructor() {
    this.db = new DatabaseSync(SQLITE_FILE);
    this.initTables();
    this.seedInitialData();
  }

  initTables() {
    // Enable foreign keys
    this.db.exec('PRAGMA foreign_keys = ON;');

    // 1. Categories Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        slug TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Products Table (Relational with foreign key to categories)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
        price INTEGER NOT NULL,
        stock INTEGER NOT NULL DEFAULT 10,
        stock_status TEXT NOT NULL DEFAULT 'Tersedia',
        description TEXT,
        image TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Schema migration check: ensure 'stock' column exists
    try {
      const productCols = this.db.prepare('PRAGMA table_info(products)').all();
      const hasStock = productCols.some((col) => col.name === 'stock');
      if (!hasStock) {
        this.db.exec('ALTER TABLE products ADD COLUMN stock INTEGER NOT NULL DEFAULT 10');
      }
    } catch {
      // Ignore if already added
    }

    // 2b. Orders Table (Relational with customer, delivery, and processing branch)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        order_number TEXT NOT NULL UNIQUE,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        address TEXT NOT NULL,
        kelurahan TEXT,
        kecamatan TEXT,
        city TEXT DEFAULT 'Kota Sukabumi',
        notes TEXT,
        branch_id TEXT NOT NULL,
        branch_name TEXT NOT NULL,
        delivery_method TEXT NOT NULL DEFAULT 'Diantar ke Alamat',
        status TEXT NOT NULL DEFAULT 'Menunggu Verifikasi',
        total_price INTEGER NOT NULL,
        items_json TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Schema migration check: repair column types if existing database used typo 'NEXT'
    try {
      const productCols = this.db.prepare('PRAGMA table_info(products)').all();
      const hasNextType = productCols.some((col) => col.type === 'NEXT');
      if (hasNextType) {
        this.db.exec('PRAGMA foreign_keys = OFF;');
        this.db.exec(`
          CREATE TABLE products_temp (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
            price INTEGER NOT NULL,
            stock_status TEXT NOT NULL DEFAULT 'Tersedia',
            description TEXT,
            image TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
          );
          INSERT INTO products_temp SELECT id, name, category_id, price, stock_status, description, image, created_at, updated_at FROM products;
          DROP TABLE products;
          ALTER TABLE products_temp RENAME TO products;
        `);
        this.db.exec('PRAGMA foreign_keys = ON;');
      }
    } catch {
      // Ignore migration errors
    }

    // 3. Settings Key-Value Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    // 4. Admin Authentication Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS admins (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_products_cat ON products(category_id);
      CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_status);
    `);
  }

  seedInitialData() {
    // Seed Settings
    const existingSettings = this.db.prepare('SELECT COUNT(*) AS count FROM settings').get();
    if (existingSettings.count === 0) {
      const insertSetting = this.db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
      insertSetting.run('storeName', 'Kimia Farma');
      insertSetting.run('tagline', 'Toko Obat Terpercaya');
      insertSetting.run('phone', '6281234567890');
      insertSetting.run('address', 'Jl. Melati No.22, Kebayoran Baru, Jakarta Selatan');
      insertSetting.run('currency', 'Rp');
    }

    // Seed Admin
    const existingAdmin = this.db.prepare('SELECT COUNT(*) AS count FROM admins').get();
    if (existingAdmin.count === 0) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      this.db.prepare(
        'INSERT INTO admins (id, name, email, password) VALUES (?, ?, ?, ?)'
      ).run('admin-1', 'Owner Kimia Farma', 'admin@katalogwa.com', hashedPassword);
    }

    // Seed Categories
    const existingCategories = this.db.prepare('SELECT COUNT(*) AS count FROM categories').get();
    if (existingCategories.count === 0) {
      const insertCat = this.db.prepare('INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)');
      insertCat.run('cat-1', 'Obat', 'obat');
      insertCat.run('cat-2', 'Vitamin', 'vitamin');
      insertCat.run('cat-3', 'Alat Kesehatan', 'alat-kesehatan');
    } else {
      // Fix slug space if already seeded previously with 'alat kesehatan'
      this.db.prepare("UPDATE categories SET slug = 'alat-kesehatan' WHERE slug = 'alat kesehatan'").run();
    }

    // Seed Products
    const existingProducts = this.db.prepare('SELECT COUNT(*) AS count FROM products').get();
    if (existingProducts.count === 0) {
      const insertProduct = this.db.prepare(`
        INSERT INTO products (id, name, category_id, price, stock_status, description, image)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const initialProducts = [
        {
          id: 'prod-1',
          name: 'Obat Paracetamol',
          categoryId: 'cat-1',
          price: 10000,
          stockStatus: 'Tersedia',
          description: 'Obat Paracetamol',
          image: '-'
        },
        {
          id: 'prod-2',
          name: 'Obat Aspirin',
          categoryId: 'cat-1',
          price: 15000,
          stockStatus: 'Tersedia',
          description: 'Obat Aspirin',
          image: '-'
        },
        {
          id: 'prod-3',
          name: 'Obat Antihistamin',
          categoryId: 'cat-1',
          price: 15000,
          stockStatus: 'Tersedia',
          description: 'Obat Antihistamin',
          image: '-'
        },
        {
          id: 'prod-4',
          name: 'Vitamin C',
          categoryId: 'cat-2',
          price: 20000,
          stockStatus: 'Tersedia',
          description: 'Vitamin C',
          image: '-'
        },
        {
          id: 'prod-5',
          name: 'Vitamin D',
          categoryId: 'cat-2',
          price: 20000,
          stockStatus: 'Tersedia',
          description: 'Vitamin D',
          image: '-'
        },
        {
          id: 'prod-6',
          name: 'Vitamin Kalsium',
          categoryId: 'cat-2',
          price: 30000,
          stockStatus: 'Tersedia',
          description: 'Obat Vitamin Kalsium',
          image: '-'
        },
        {
          id: 'prod-7',
          name: 'Termometer',
          categoryId: 'cat-3',
          price: 150000,
          stockStatus: 'Tersedia',
          description: 'Termometer',
          image: '-'
        },
        {
          id: 'prod-8',
          name: 'Perban',
          categoryId: 'cat-3',
          price: 20000,
          stockStatus: 'Tersedia',
          description: 'Perban',
          image: '-'
        },
        {
          id: 'prod-9',
          name: 'Tabung Oksigen',
          categoryId: 'cat-3',
          price: 150000,
          stockStatus: 'Tersedia',
          description: 'Tabung Oksigen',
          image: '-'
        }
      ];

      for (const p of initialProducts) {
        insertProduct.run(p.id, p.name, p.categoryId, p.price, p.stockStatus, p.description, p.image);
      }
    }
  }

  // --- Settings SQL Operations ---
  getSettings() {
    const rows = this.db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    return settings;
  }

  updateSettings(newSettings) {
    const upsert = this.db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);

    for (const [key, val] of Object.entries(newSettings)) {
      if (val !== undefined && val !== null) {
        upsert.run(key, String(val));
      }
    }
    return this.getSettings();
  }

  // --- Admin SQL Operations ---
  getAdmin() {
    return this.db.prepare('SELECT id, name, email, password FROM admins LIMIT 1').get();
  }

  getAdminByEmail(email) {
    return this.db.prepare('SELECT id, name, email, password FROM admins WHERE LOWER(email) = LOWER(?)').get(email);
  }

  getAdminById(id) {
    return this.db.prepare('SELECT id, name, email, password FROM admins WHERE id = ?').get(id);
  }

  updateAdmin(id, updateData) {
    const current = this.getAdminById(id) || this.getAdmin();
    if (!current) return null;

    const name = updateData.name !== undefined ? updateData.name.trim() : current.name;
    const email = updateData.email !== undefined ? updateData.email.trim().toLowerCase() : current.email;
    const password = updateData.password !== undefined ? updateData.password : current.password;

    this.db.prepare(`
      UPDATE admins
      SET name = ?, email = ?, password = ?
      WHERE id = ?
    `).run(name, email, password, current.id);

    return {
      id: current.id,
      name,
      email
    };
  }

  // --- Category SQL Operations ---
  getCategories() {
    return this.db.prepare(`
      SELECT 
        c.id, 
        c.name, 
        c.slug, 
        c.created_at AS createdAt,
        COUNT(p.id) AS productCount
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id
      ORDER BY c.created_at ASC
    `).all();
  }

  getCategoryById(id) {
    return this.db.prepare('SELECT id, name, slug, created_at AS createdAt FROM categories WHERE id = ?').get(id);
  }

  addCategory(name) {
    const trimmed = name.trim();
    const id = `cat-${Date.now()}`;
    const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `cat-${Date.now()}`;
    this.db.prepare('INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)').run(id, trimmed, slug);
    return { id, name: trimmed, slug, productCount: 0 };
  }

  updateCategory(id, name) {
    const trimmed = name.trim();
    const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `cat-${Date.now()}`;
    const res = this.db.prepare('UPDATE categories SET name = ?, slug = ? WHERE id = ?').run(trimmed, slug, id);
    if (res.changes === 0) return null;
    return { id, name: trimmed, slug };
  }

  // Alias to ensure compatibility if invoked as updatedCategory
  updatedCategory(id, name) {
    return this.updateCategory(id, name);
  }

  deleteCategory(id) {
    const res = this.db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    return res.changes > 0;
  }

  // --- Product SQL Operations ---
  getProducts(filters = {}) {
    let sql = `
      SELECT 
        p.id, 
        p.name, 
        p.category_id AS categoryId, 
        c.name AS categoryName, 
        p.price, 
        p.stock,
        p.stock_status AS stockStatus, 
        p.description, 
        p.image, 
        p.created_at AS createdAt,
        p.updated_at AS updatedAt
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    // Support both categoryId and category
    const categoryId = filters.categoryId || filters.category;
    if (categoryId) {
      sql += ' AND p.category_id = ?';
      params.push(categoryId);
    }

    if (filters.stockStatus && filters.stockStatus !== 'all' && filters.stockStatus !== 'Semua') {
      if (filters.stockStatus === 'available') {
        sql += ' AND p.stock > 0';
      } else if (filters.stockStatus === 'out') {
        sql += ' AND p.stock <= 0';
      } else {
        sql += ' AND p.stock_status = ?';
        params.push(filters.stockStatus);
      }
    }

    if (filters.search && filters.search.trim()) {
      sql += ' AND (LOWER(p.name) LIKE ? OR LOWER(COALESCE(p.description, "")) LIKE ?)';
      const queryPattern = `%${filters.search.trim().toLowerCase()}%`;
      params.push(queryPattern, queryPattern);
    }

    sql += ' ORDER BY p.created_at DESC';

    const products = this.db.prepare(sql).all(...params);
    return products.map(p => this.computeProductStatus(p));
  }

  computeProductStatus(product) {
    if (!product) return null;
    const stock = Number(product.stock !== undefined ? product.stock : 0);
    let stockStatus = 'Tersedia';
    if (stock <= 0) {
      stockStatus = 'Habis';
    } else if (stock <= 5) {
      stockStatus = 'Stok Terbatas';
    } else {
      stockStatus = 'Tersedia';
    }
    return {
      ...product,
      stock,
      stockStatus
    };
  }

  getProductById(id) {
    const raw = this.db.prepare(`
      SELECT 
        p.id, 
        p.name, 
        p.category_id AS categoryId, 
        c.name AS categoryName, 
        p.price, 
        p.stock,
        p.stock_status AS stockStatus, 
        p.description, 
        p.image, 
        p.created_at AS createdAt,
        p.updated_at AS updatedAt
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(id);

    return this.computeProductStatus(raw);
  }

  // Alias to ensure compatibility if invoked as getProductsById
  getProductsById(id) {
    return this.getProductById(id);
  }

  addProduct(productData) {
    const id = productData.id || `prod-${Date.now()}`;
    const name = productData.name ? productData.name.trim() : '';
    const categoryId = productData.categoryId || productData.category_id;
    const price = Number(productData.price) || 0;
    const stock = productData.stock !== undefined ? Math.max(0, Number(productData.stock)) : 10;
    
    let stockStatus = 'Tersedia';
    if (stock <= 0) stockStatus = 'Habis';
    else if (stock <= 5) stockStatus = 'Stok Terbatas';

    const description = productData.description ? productData.description.trim() : '';
    const image = productData.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';

    this.db.prepare(`
      INSERT INTO products (id, name, category_id, price, stock, stock_status, description, image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, categoryId, price, stock, stockStatus, description, image);

    return this.getProductById(id);
  }

  updateProduct(id, productData) {
    const current = this.getProductById(id);
    if (!current) return null;

    const name = productData.name !== undefined ? productData.name.trim() : current.name;
    const categoryId = productData.categoryId !== undefined
      ? productData.categoryId
      : (productData.category_id !== undefined ? productData.category_id : current.categoryId);
    const price = productData.price !== undefined ? Number(productData.price) : current.price;
    
    let stock = current.stock;
    if (productData.stock !== undefined && !isNaN(productData.stock)) {
      stock = Math.max(0, Number(productData.stock));
    }

    let stockStatus = 'Tersedia';
    if (stock <= 0) stockStatus = 'Habis';
    else if (stock <= 5) stockStatus = 'Stok Terbatas';

    const description = productData.description !== undefined
      ? (productData.description ? productData.description.trim() : '')
      : current.description;
    const image = productData.image !== undefined ? productData.image : current.image;

    this.db.prepare(`
      UPDATE products 
      SET name = ?, category_id = ?, price = ?, stock = ?, stock_status = ?, description = ?, image = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, categoryId, price, stock, stockStatus, description, image, id);

    return this.getProductById(id);
  }

  updateProductStock(id, newStock) {
    const current = this.getProductById(id);
    if (!current) return null;

    const stock = Math.max(0, Number(newStock));
    let stockStatus = 'Tersedia';
    if (stock <= 0) stockStatus = 'Habis';
    else if (stock <= 5) stockStatus = 'Stok Terbatas';

    this.db.prepare(`
      UPDATE products 
      SET stock = ?, stock_status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(stock, stockStatus, id);

    return this.getProductById(id);
  }

  toggleStock(id) {
    const product = this.getProductById(id);
    if (!product) return null;

    const newStock = product.stock > 0 ? 0 : 10;
    return this.updateProductStock(id, newStock);
  }

  deleteProduct(id) {
    const res = this.db.prepare('DELETE FROM products WHERE id = ?').run(id);
    return res.changes > 0;
  }

  // --- Orders SQL Operations ---
  getOrders() {
    return this.db.prepare(`
      SELECT 
        id,
        order_number AS orderNumber,
        customer_name AS customerName,
        customer_phone AS customerPhone,
        address,
        kelurahan,
        kecamatan,
        city,
        notes,
        branch_id AS branchId,
        branch_name AS branchName,
        delivery_method AS deliveryMethod,
        status,
        total_price AS totalPrice,
        items_json AS itemsJson,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM orders
      ORDER BY created_at DESC
    `).all();
  }

  createOrder(orderData) {
    const id = `ord-${Date.now()}`;
    const orderNumber = `KF-ORD-${Date.now().toString().slice(-6)}`;
    const customerName = (orderData.customerName || '').trim();
    const customerPhone = (orderData.customerPhone || '').trim();
    const address = (orderData.address || '').trim();
    const kelurahan = (orderData.kelurahan || '').trim();
    const kecamatan = (orderData.kecamatan || '').trim();
    const city = (orderData.city || 'Kota Sukabumi').trim();
    const notes = (orderData.notes || '').trim();
    const branchId = orderData.branchId || 'KF 0221';
    const branchName = orderData.branchName || 'KF 0221';
    const deliveryMethod = 'Diantar ke Alamat';
    const status = orderData.status || 'Menunggu Verifikasi';
    const totalPrice = Number(orderData.totalPrice) || 0;
    const items = orderData.items || [];
    const itemsJson = typeof orderData.itemsJson === 'string' ? orderData.itemsJson : JSON.stringify(items);

    // Reduce stock only upon confirmed order creation
    const updateProductStmt = this.db.prepare(`
      UPDATE products
      SET stock = MAX(0, stock - ?),
          stock_status = CASE 
            WHEN MAX(0, stock - ?) <= 0 THEN 'Habis'
            WHEN MAX(0, stock - ?) <= 5 THEN 'Stok Terbatas'
            ELSE 'Tersedia'
          END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    for (const item of items) {
      if (item && item.productId && item.quantity > 0) {
        updateProductStmt.run(item.quantity, item.quantity, item.quantity, item.productId);
      }
    }

    this.db.prepare(`
      INSERT INTO orders (
        id, order_number, customer_name, customer_phone, address, 
        kelurahan, kecamatan, city, notes, branch_id, branch_name, 
        delivery_method, status, total_price, items_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, orderNumber, customerName, customerPhone, address,
      kelurahan, kecamatan, city, notes, branchId, branchName,
      deliveryMethod, status, totalPrice, itemsJson
    );

    return this.db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  }

  updateOrderStatus(id, newStatus) {
    this.db.prepare(`
      UPDATE orders 
      SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(newStatus, id);

    return this.db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  }

  close() {
    this.db.close();
  }
}

export const db = new SqliteDatabase();
