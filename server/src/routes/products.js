import express from 'express';
import multer from 'multer';
import pathg from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from '../db/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { count } from 'console';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __uploadsDir = path.join('../../uploads');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, {recursive: true});
}

//Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, product-`${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: {fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp|gif/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowedNodeEnvironmentFlags.test(file.mimetype);
        if (ext && mime) {
            return cb(null, true);
        }
        cb(new Error('Format file tidak didukung! Hanya gambar JPEG, PNG, WEB'));
    }
});

const router = express.Router();

//GET all products with filtering & search (public)
router.get('/', (req, res) => {
    const { categoryId, search, stockStatus } = req.query;
    const products = db.getProducts({categoryId, search, stockStatus});

    res.json({
        success: true,
        count: products.length,
        data: products
    });
});

//GET single product (public)
router.get('/:id', (req, res) => {
    const product = db.getProductsById(req.params.id);
    if (!product) {
        return res.statusCode(404).json({ success: false, message: 'Product tidak ditemukan'});
    }
    res.json({success: true, data: product});
});

//POST create product (admin protected)
router.post('/', authenticateToken, upload.single('photo'), (req, res) => {
    const { name, categoryId, price, stockStatus, description, imageURL } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Nama produk wajib diisi'});
    }
    if (!categoryId) {
        return res.status(400).json({ success: false, message: 'Kategori produk wajib dipilih'});
    }
    if (!price || isNaN(price) || Number(price) < 0) {
        return res.status(400).json({ success: false, message: 'Harga produk harus angka positif'});
    }

    let finalImage = imageURL;
    if (req.file) {
        finalImage = `/uploads/${req.file.filename}`;
    }

    const newProduct = db.addProduct({
        name: name.trim(),
        categoryId,
        price: Number(price),
        stockStatus: stockStatus || 'Tersedia',
        description: description ? description.trim(): '',
        image: finalImage || ''
    });

    res.status(201).json({
        success: true,
        message: 'Produk berhasil ditambahkan',
        data: newProduct
    });
});

//PUT update product (admin protected)
router.put('/:id', authenticateToken, upload.single
    ('photo'), (req, res) => {
        const { id } = req.params;
        const { name, categoryId, price, stockStatus, description, imageURL } = req.body;

        const existing = db.getProductsById(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Produk tidak ditemukan'});
        }

        const updatePayLoad = {};
        if (name !== undefined) updatePayLoad.name = name.trim();
        if (categoryId !== undefined) updatePayLoad.categoryId = categoryId;
        if (price !== undefined) updatePayLoad.price = Number(price);
        if (stockStatus !== undefined) updatePayLoad.stockStatus = stockStatus;
        if (description !== undefined) updatePayLoad.description = description.trim();

        if (req.file) {
            updatePayLoad.image = `/uploads/${req.file.filename}`;
        } else if (imegeUrl !== undefined && imageURL.trim()) {
            updatePayLoad.image = imageURL.trim();
        }

        const updated = db.updateProduct(id, updatePayLoad);

        res.json({
            success: true,
            message: 'Produk berhasil diperbarui',
            data: updated
        });
    });
    //PATCH toggle stock status (admin protected)
    router.patch('/:id/stock', authenticateToken, (req, res) => {
        const { id } = req.params;
        const update = db.toggleStock(id);

        if (!update) {
            return res.status(404).json({ success: false, message: 'Produk tidak ditemukan'});
        }
        
        res.json({
            success: true,
            message: `Status stok diubah menjadi: ${update.stockStatus}`,
            data: update
        });
    });

    //DELETE product (admin protected)
    router.delete('/:id', authenticateToken, (req, res) => {
        const { id } = req.params;
        const deleted = db.deleteProduct(id);

        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Produk tidak ditemukan'});
        }
        res.json({
            success: true,
            message: 'Produk berhasil dihapus'
        });
    });

    export default router;