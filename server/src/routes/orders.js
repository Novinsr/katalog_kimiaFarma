import express from 'express';
import { db } from '../db/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET all orders (admin protected)
router.get('/', authenticateToken, (req, res) => {
    const orders = db.getOrders();
    res.json({
        success: true,
        count: orders.length,
        data: orders
    });
});

// POST create order (public / customer checkout)
router.post('/', (req, res) => {
    const {
        customerName,
        customerPhone,
        address,
        kelurahan,
        kecamatan,
        city,
        notes,
        branchId,
        branchName,
        items,
        totalPrice
    } = req.body;

    if (!customerName || !customerName.trim()) {
        return res.status(400).json({ success: false, message: 'Nama penerima wajib diisi' });
    }
    if (!customerPhone || !customerPhone.trim()) {
        return res.status(400).json({ success: false, message: 'Nomor WhatsApp / telepon wajib diisi' });
    }
    if (!address || !address.trim()) {
        return res.status(400).json({ success: false, message: 'Alamat lengkap wajib diisi' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Pesanan harus memiliki minimal 1 produk' });
    }

    // Verify stock availability before placing order
    for (const it of items) {
        const prod = db.getProductById(it.productId);
        if (!prod) {
            return res.status(400).json({ success: false, message: `Produk "${it.name || it.productId}" tidak ditemukan` });
        }
        if (prod.stock < it.quantity) {
            return res.status(400).json({
                success: false,
                message: `Stok untuk "${prod.name}" tidak mencukupi (Tersisa: ${prod.stock} pcs, Dipesan: ${it.quantity} pcs)`
            });
        }
    }

    const newOrder = db.createOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        address: address.trim(),
        kelurahan: (kelurahan || '').trim(),
        kecamatan: (kecamatan || '').trim(),
        city: (city || 'Kota Sukabumi').trim(),
        notes: (notes || '').trim(),
        branchId: branchId || 'KF 0221',
        branchName: branchName || 'KF 0221 (Jl. Jend. Sudirman No. 81B)',
        items,
        totalPrice: Number(totalPrice) || 0,
        status: 'Menunggu Verifikasi'
    });

    res.status(201).json({
        success: true,
        message: 'Pesanan berhasil dibuat! Obat akan diverifikasi dan diantar ke alamat Anda.',
        data: newOrder
    });
});

// PATCH update order status (admin protected)
router.patch('/:id/status', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ['Menunggu Verifikasi', 'Pesanan Diproses', 'Sedang Diantar', 'Pesanan Selesai'];
    if (!status || !allowed.includes(status)) {
        return res.status(400).json({
            success: false,
            message: `Status tidak valid. Pilihan: ${allowed.join(', ')}`
        });
    }

    const updated = db.updateOrderStatus(id, status);
    if (!updated) {
        return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    }

    res.json({
        success: true,
        message: `Status pesanan diubah menjadi: ${updated.status}`,
        data: updated
    });
});

export default router;

