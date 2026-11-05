import React, { useState, useEffect } from 'react';
import { X, Upload, Image as ImageIcon, Save, AlertCircle } from 'lucide-react';

const PRESET_PHARMACY_IMAGES = [
    { label: 'Obat Tablet & Kapsul', url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80' },
    { label: 'Vitamin C & Suplemen', url: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?auto=format&fit=crop&w=800&q=80' },
    { label: 'Termometer Digital', url: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=800&q=80' },
    { label: 'Sirup Obat', url: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=800&q=80' },
    { label: 'Perban & P3K', url: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&w=800&q=80' },
    { label: 'Alat Medis & Stetoskop', url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80' }
];

export const ProductFormModal = ({ isOpen, onClose, onSave, editingProduct, categories }) => {
    const [name, setName] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [price, setPrice] = useState('');
    const [stockStatus, setStockStatus] = useState('Tersedia');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewSrc, setPreviewSrc] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (editingProduct) {
            setName(editingProduct.name || '');
            setCategoryId(editingProduct.categoryId || (categories[0]?.id || ''));
            setPrice(editingProduct.price ? String(editingProduct.price) : '');
            setStockStatus(editingProduct.stockStatus || 'Tersedia');
            setDescription(editingProduct.description || '');
            setImageUrl(editingProduct.image || '');
            setPreviewSrc(editingProduct.image || '');
            setSelectedFile(null);
        } else {
            setName('');
            setCategoryId(categories[0]?.id || '');
            setPrice('');
            setStockStatus('Tersedia');
            setDescription('');
            setImageUrl(PRESET_PHARMACY_IMAGES[0].url);
            setPreviewSrc(PRESET_PHARMACY_IMAGES[0].url);
            setSelectedFile(null);
        }
        setErrorMsg('');
    }, [editingProduct, categories, isOpen]);

    if (!isOpen) return null;

    // Handle file picker
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            const objectUrl = URL.createObjectURL(file);
            setPreviewSrc(objectUrl);
        }
    };

    // Handle preset image click
    const handleSelectPreset = (url) => {
        setSelectedFile(null);
        setImageUrl(url);
        setPreviewSrc(url);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (!name.trim()) {
            setErrorMsg('Nama produk wajib diisi.');
            return;
        }
        if (!categoryId) {
            setErrorMsg('Kategori produk wajib dipilih.');
            return;
        }
        if (!price || isNaN(price) || Number(price) <= 0) {
            setErrorMsg('Harga produk harus angka positif.');
            return;
        }

        setIsSubmitting(true);
        try {
            let payload;
            if (selectedFile) {
                payload = new FormData();
                payload.append('name', name.trim());
                payload.append('categoryId', categoryId);
                payload.append('price', price);
                payload.append('stockStatus', stockStatus);
                payload.append('description', description.trim());
                payload.append('photo', selectedFile);
            } else {
                payload = {
                    name: name.trim(),
                    categoryId,
                    price: Number(price),
                    stockStatus,
                    description: description.trim(),
                    imageUrl: previewSrc || imageUrl
                };
            }

            await onSave(payload, editingProduct?.id);
            onClose();
        } catch (err) {
            setErrorMsg(err.message || 'Gagal menyimpan produk.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div
                className="modal-content animate-slide-up"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '600px' }}
            >
                <div className="modal-header">
                    <div className="modal-title-group">
                        <h2 className="modal-title">
                            {editingProduct ? 'Edit Informasi Produk Apotek' : 'Tambah Produk Apotek Baru'}
                        </h2>
                        <p className="modal-subtitle">
                            Lengkapi data obat atau alat kesehatan untuk katalog apotek
                        </p>
                    </div>
                    <button className="btn-icon" onClick={onClose} title="Tutup">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {errorMsg && (
                            <div className="form-alert-error animate-fade-in">
                                <AlertCircle size={18} />
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        {/* Product Image Preview & Selector */}
                        <div className="product-form-media-section">
                            <div className="media-preview-box">
                                {previewSrc ? (
                                    <img src={previewSrc} alt="Preview" className="media-preview-img" />
                                ) : (
                                    <div className="media-placeholder">
                                        <ImageIcon size={32} />
                                        <span>Belum ada foto</span>
                                    </div>
                                )}
                            </div>

                            <div className="media-controls">
                                <label className="btn btn-secondary btn-sm upload-file-btn">
                                    <Upload size={15} />
                                    <span>Upload Foto Produk</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        style={{ display: 'none' }}
                                    />
                                </label>

                                <div className="preset-images-row">
                                    <span className="preset-label">Atau pilih sampel apotek:</span>
                                    <div className="preset-thumbs">
                                        {PRESET_PHARMACY_IMAGES.map((preset, idx) => (
                                            <button
                                                type="button"
                                                key={idx}
                                                className={`preset-thumb-btn ${previewSrc === preset.url ? 'active' : ''}`}
                                                onClick={() => handleSelectPreset(preset.url)}
                                                title={preset.label}
                                            >
                                                <img src={preset.url} alt={preset.label} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Product Name */}
                        <div className="form-group">
                            <label className="form-label">
                                <span>Nama Produk Obat / Alkes</span>
                                <span className="text-danger">*</span>
                            </label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="cth: Paracetamol 500mg (10 Tablet)"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        {/* Category & Price Row */}
                        <div className="form-row-2">
                            <div className="form-group">
                                <label className="form-label">
                                    <span>Kategori Produk</span>
                                    <span className="text-danger">*</span>
                                </label>
                                <select
                                    className="form-select"
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    required
                                >
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    <span>Harga (Rp)</span>
                                    <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder="15000"
                                    min="0"
                                    step="500"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Stock Status Selector */}
                        <div className="form-group">
                            <label className="form-label">
                                <span>Status Ketersediaan Stok</span>
                            </label>
                            <div className="stock-radio-group">
                                <label className={`stock-radio-card ${stockStatus === 'Tersedia' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="stockStatus"
                                        value="Tersedia"
                                        checked={stockStatus === 'Tersedia'}
                                        onChange={() => setStockStatus('Tersedia')}
                                    />
                                    <div>
                                        <strong>Tersedia</strong>
                                        <p>Dapat dipesan pasien/pelanggan via WhatsApp</p>
                                    </div>
                                </label>

                                <label className={`stock-radio-card ${stockStatus === 'Habis' ? 'selected-out' : ''}`}>
                                    <input
                                        type="radio"
                                        name="stockStatus"
                                        value="Habis"
                                        checked={stockStatus === 'Habis'}
                                        onChange={() => setStockStatus('Habis')}
                                    />
                                    <div>
                                        <strong>Habis</strong>
                                        <p>Tombol pemesanan dinonaktifkan di katalog</p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="form-group">
                            <label className="form-label">
                                <span>Deskripsi / Khasiat & Aturan Pakai</span>
                            </label>
                            <textarea
                                rows="2"
                                className="form-textarea"
                                placeholder="Jelaskan indikasi, dosis, kandungan, atau aturan pakai produk ini..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isSubmitting}
                        >
                            <Save size={16} />
                            <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Produk'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
