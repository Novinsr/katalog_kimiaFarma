import React, { useState, useEffect, useRef } from 'react';
import {
    X,
    Upload,
    Image as ImageIcon,
    Save,
    AlertCircle,
    Package,
    Tag,
    DollarSign,
    FileText,
    CheckCircle2,
    XCircle,
    ChevronDown,
    Link as LinkIcon
} from 'lucide-react';

const PRESET_PHARMACY_IMAGES = [
    { label: 'Obat Tablet & Kapsul', url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80' },
    { label: 'Vitamin C & Suplemen', url: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?auto=format&fit=crop&w=800&q=80' },
    { label: 'Termometer Digital', url: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=800&q=80' },
    { label: 'Sirup Obat', url: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=800&q=80' },
    { label: 'Perban & P3K', url: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&w=800&q=80' },
    { label: 'Alat Medis', url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80' }
];

export const ProductFormModal = ({ isOpen, onClose, onSave, editingProduct, categories }) => {
    const [name, setName] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('10');
    const [stockStatus, setStockStatus] = useState('Tersedia');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewSrc, setPreviewSrc] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (editingProduct) {
            setName(editingProduct.name || '');
            setCategoryId(editingProduct.categoryId || (categories[0]?.id || ''));
            setPrice(editingProduct.price ? String(editingProduct.price) : '');
            setStock(editingProduct.stock !== undefined ? String(editingProduct.stock) : '10');
            setStockStatus(editingProduct.stockStatus || 'Tersedia');
            setDescription(editingProduct.description || '');
            const initialImg = editingProduct.image && editingProduct.image !== '-' ? editingProduct.image : '';
            // Jangan masukkan path file upload lokal (/uploads/...) ke input link URL
            const isWebUrl = initialImg.startsWith('http://') || initialImg.startsWith('https://');
            setImageUrl(isWebUrl ? initialImg : '');
            setPreviewSrc(initialImg || PRESET_PHARMACY_IMAGES[0].url);
            setSelectedFile(null);
        } else {
            setName('');
            setCategoryId(categories[0]?.id || '');
            setPrice('');
            setStock('10');
            setStockStatus('Tersedia');
            setDescription('');
            setImageUrl('');
            setPreviewSrc(PRESET_PHARMACY_IMAGES[0].url);
            setSelectedFile(null);
        }
        setErrorMsg('');
    }, [editingProduct, categories, isOpen]);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
            // Check size max 5MB
            if (file.size > 5 * 1024 * 1024) {
                setErrorMsg('Ukuran file maksimal 5MB');
                return;
            }
            setSelectedFile(file);
            setImageUrl('');
            const objectUrl = URL.createObjectURL(file);
            setPreviewSrc(objectUrl);
            setErrorMsg('');
        }
    };

    const handleSelectPreset = (url) => {
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setImageUrl(url);
        setPreviewSrc(url);
    };

    const handleUrlChange = (e) => {
        const val = e.target.value;
        setImageUrl(val);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setPreviewSrc(val || (PRESET_PHARMACY_IMAGES[0].url));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (!name.trim()) { setErrorMsg('Nama produk wajib diisi.'); return; }
        if (!categoryId) { setErrorMsg('Kategori produk wajib dipilih.'); return; }
        if (!price || isNaN(price) || Number(price) < 0) { setErrorMsg('Harga produk harus angka positif.'); return; }
        if (stock === '' || isNaN(stock) || Number(stock) < 0) { setErrorMsg('Jumlah stok harus berupa angka (minimal 0).'); return; }

        const parsedStock = Math.max(0, parseInt(stock, 10) || 0);
        let autoStatus = 'Tersedia';
        if (parsedStock === 0) autoStatus = 'Habis';
        else if (parsedStock <= 5) autoStatus = 'Stok Terbatas';

        setIsSubmitting(true);
        try {
            let payload;
            if (selectedFile) {
                payload = new FormData();
                payload.append('name', name.trim());
                payload.append('categoryId', categoryId);
                payload.append('price', price);
                payload.append('stock', parsedStock);
                payload.append('stockStatus', autoStatus);
                payload.append('description', description.trim());
                payload.append('photo', selectedFile);
                // Jangan menyertakan link path atau link URL saat upload foto
            } else {
                const finalImg = imageUrl.trim() || (editingProduct?.image && editingProduct.image !== '-' ? editingProduct.image : '') || previewSrc || PRESET_PHARMACY_IMAGES[0].url;
                payload = {
                    name: name.trim(),
                    categoryId,
                    price: Number(price),
                    stock: parsedStock,
                    stockStatus: autoStatus,
                    description: description.trim(),
                    imageURL: finalImg,
                    imageUrl: finalImg,
                    image: finalImg
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

    const isEdit = !!editingProduct;

    return (
        <div className="pf-backdrop" onClick={onClose}>
            <div className="pf-modal animate-slide-up" onClick={(e) => e.stopPropagation()}>

                {/* ── HEADER ── */}
                <div className="pf-header">
                    <div className="pf-header-icon">
                        <Package size={20} />
                    </div>
                    <div className="pf-header-text">
                        <h2 className="pf-title">
                            {isEdit ? 'Edit Produk Apotek' : 'Tambah Produk Baru'}
                        </h2>
                        <p className="pf-subtitle">
                            {isEdit ? 'Perbarui informasi obat / alat kesehatan' : 'Lengkapi data obat atau alat kesehatan'}
                        </p>
                    </div>
                    <button className="pf-close-btn" onClick={onClose} title="Tutup">
                        <X size={18} />
                    </button>
                </div>

                {/* ── BODY ── */}
                <form onSubmit={handleSubmit} className="pf-form">
                    <div className="pf-body">

                        {/* Error */}
                        {errorMsg && (
                            <div className="pf-alert animate-fade-in">
                                <AlertCircle size={16} />
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        {/* ── IMAGE SECTION ── */}
                        <div className="pf-section">
                            <p className="pf-section-label">
                                <ImageIcon size={13} /> Foto Produk
                            </p>
                            <div className="pf-media-row">
                                {/* Preview */}
                                <div className="pf-preview-box">
                                    {previewSrc ? (
                                        <img
                                            src={previewSrc}
                                            alt="Preview"
                                            className="pf-preview-img"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = PRESET_PHARMACY_IMAGES[0].url;
                                            }}
                                        />
                                    ) : (
                                        <div className="pf-preview-placeholder">
                                            <ImageIcon size={28} />
                                            <span>Belum ada foto</span>
                                        </div>
                                    )}
                                </div>

                                {/* Controls */}
                                <div className="pf-media-controls">
                                    <div className="pf-upload-action-row">
                                        <label className="pf-upload-btn">
                                            <Upload size={14} />
                                            <span>{selectedFile ? 'Ganti File Upload' : 'Upload File Gambar'}</span>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp,image/gif"
                                                onChange={handleFileChange}
                                                style={{ display: 'none' }}
                                            />
                                        </label>
                                        {selectedFile && (
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <span className="pf-file-selected-name" title={selectedFile.name}>
                                                    ✓ {selectedFile.name}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedFile(null);
                                                        if (fileInputRef.current) fileInputRef.current.value = '';
                                                        setPreviewSrc(editingProduct?.image || PRESET_PHARMACY_IMAGES[0].url);
                                                    }}
                                                    title="Batalkan pilihan file"
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: '#ef4444',
                                                        cursor: 'pointer',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        padding: '0 2px'
                                                    }}
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* URL Input */}
                                    <div className="pf-url-input-wrap">
                                        <LinkIcon size={13} className="pf-url-icon" />
                                        <input
                                            type="url"
                                            className="pf-input pf-url-input"
                                            placeholder={selectedFile ? "Menggunakan file upload (link URL tidak diikutsertakan)" : "Atau tempel link URL gambar (https://...)"}
                                            value={selectedFile ? '' : imageUrl}
                                            onChange={handleUrlChange}
                                            disabled={!!selectedFile}
                                        />
                                    </div>

                                    <div className="pf-presets-container">
                                        <p className="pf-preset-label">Atau pilih sampel apotek:</p>
                                        <div className="pf-preset-thumbs">
                                            {PRESET_PHARMACY_IMAGES.map((preset, idx) => (
                                                <button
                                                    type="button"
                                                    key={idx}
                                                    className={`pf-preset-btn ${(!selectedFile && (imageUrl === preset.url || (!imageUrl && previewSrc === preset.url))) ? 'active' : ''}`}
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
                        </div>

                        {/* ── NAMA PRODUK ── */}
                        <div className="pf-field">
                            <label className="pf-label">
                                <Package size={13} />
                                Nama Produk
                                <span className="pf-required">*</span>
                            </label>
                            <input
                                type="text"
                                className="pf-input"
                                placeholder="cth: Paracetamol 500mg (10 Tablet)"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        {/* ── KATEGORI, HARGA & JUMLAH STOK ── */}
                        <div className="pf-row-3">
                            <div className="pf-field">
                                <label className="pf-label">
                                    <Tag size={13} />
                                    Kategori
                                    <span className="pf-required">*</span>
                                </label>
                                <div className="pf-select-wrap">
                                    <select
                                        className="pf-select"
                                        value={categoryId}
                                        onChange={(e) => setCategoryId(e.target.value)}
                                        required
                                    >
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={14} className="pf-select-icon" />
                                </div>
                            </div>

                            <div className="pf-field">
                                <label className="pf-label">
                                    <DollarSign size={13} />
                                    Harga (Rp)
                                    <span className="pf-required">*</span>
                                </label>
                                <div className="pf-price-wrap">
                                    <span className="pf-price-prefix">Rp</span>
                                    <input
                                        type="number"
                                        className="pf-input pf-price-input"
                                        placeholder="15000"
                                        min="0"
                                        step="500"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="pf-field">
                                <label className="pf-label">
                                    <Package size={13} />
                                    Jumlah Stok (pcs)
                                    <span className="pf-required">*</span>
                                </label>
                                <input
                                    type="number"
                                    className="pf-input"
                                    placeholder="cth: 25"
                                    min="0"
                                    value={stock}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setStock(val);
                                        const num = parseInt(val, 10);
                                        if (!isNaN(num)) {
                                            if (num === 0) setStockStatus('Habis');
                                            else if (num <= 5) setStockStatus('Stok Terbatas');
                                            else setStockStatus('Tersedia');
                                        }
                                    }}
                                    required
                                />
                            </div>
                        </div>

                        {/* ── STATUS STOK ── */}
                        <div className="pf-field">
                            <label className="pf-label">
                                Status Ketersediaan
                            </label>
                            <div className="pf-stock-grid">
                                <label
                                    className={`pf-stock-card ${stockStatus === 'Tersedia' ? 'pf-stock-available' : ''}`}
                                >
                                    <input
                                        type="radio"
                                        name="stockStatus"
                                        value="Tersedia"
                                        checked={stockStatus === 'Tersedia'}
                                        onChange={() => setStockStatus('Tersedia')}
                                        style={{ display: 'none' }}
                                    />
                                    <div className="pf-stock-icon pf-stock-icon-green">
                                        <CheckCircle2 size={18} />
                                    </div>
                                    <div>
                                        <strong>Tersedia</strong>
                                        <p>Dapat dipesan via WhatsApp</p>
                                    </div>
                                    {stockStatus === 'Tersedia' && (
                                        <div className="pf-stock-check"><CheckCircle2 size={14} /></div>
                                    )}
                                </label>

                                <label
                                    className={`pf-stock-card ${stockStatus === 'Habis' ? 'pf-stock-out' : ''}`}
                                >
                                    <input
                                        type="radio"
                                        name="stockStatus"
                                        value="Habis"
                                        checked={stockStatus === 'Habis'}
                                        onChange={() => setStockStatus('Habis')}
                                        style={{ display: 'none' }}
                                    />
                                    <div className="pf-stock-icon pf-stock-icon-red">
                                        <XCircle size={18} />
                                    </div>
                                    <div>
                                        <strong>Habis</strong>
                                        <p>Tombol pesan dinonaktifkan</p>
                                    </div>
                                    {stockStatus === 'Habis' && (
                                        <div className="pf-stock-check pf-stock-check-red"><XCircle size={14} /></div>
                                    )}
                                </label>
                            </div>
                        </div>

                        {/* ── DESKRIPSI ── */}
                        <div className="pf-field">
                            <label className="pf-label">
                                <FileText size={13} />
                                Deskripsi / Khasiat & Aturan Pakai
                                <span className="pf-optional">(opsional)</span>
                            </label>
                            <textarea
                                rows="3"
                                className="pf-textarea"
                                placeholder="Jelaskan indikasi, dosis, kandungan, atau aturan pakai produk ini..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                    </div>

                    {/* ── FOOTER ── */}
                    <div className="pf-footer">
                        <button type="button" className="pf-btn-cancel" onClick={onClose}>
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="pf-btn-save"
                            disabled={isSubmitting}
                        >
                            <Save size={15} />
                            <span>{isSubmitting ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : 'Tambah Produk')}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
