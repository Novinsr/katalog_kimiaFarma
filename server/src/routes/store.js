import express from 'express';
import { db } from '../db/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

//GET store setting (public)
router.get('/', (req, res) => {
    const settings = db.getSettings();
    res.json({
        success: true,
        data: settings
    });
});

//PUT update store settings (admin protected)
router.put('/', authenticateToken, (req, res) => {
    const { storeName, tagline, phone, address } = req.body;

    const current = db.getSettings();
    const updated = db.updateSettings({
        storeName: storeName || current.storeName,
        tagline: tagline || current.tagline,
        phhone: phone ? phone.replace(/[^0-9]/g,'') : current.phone,
        address: address !== undefined ? address : current.address
    });

    res.json({
        success: true,
        message: 'Pengaturan toko berhasil disimpan',
        data: updated
    });
});

export default router;