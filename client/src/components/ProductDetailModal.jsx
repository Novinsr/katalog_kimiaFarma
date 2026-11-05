import React from 'react';
import { X, MessageCircle, ShieldCheck, CheckCircle2, XCircle, AlertCircle, Pill } from 'lucide-react';

export const ProductDetailModal = ({ product, storeSettings, onClose, onOrder }) => {
    if (!product) return null;

    const isAvailable = product.stockStatus === 'Tersedia';

    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(number);
    };

    const fallbackImage = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80';
    const displayImage = product.image && product.image !== '-' ? product.image : fallbackImage;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div
                className="modal-content animate-slide-up"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '580px' }}
            >
                <div className="modal-header">
                    <div className="modal-title-group">
                        <span className="brand-tag" style={{ marginBottom: '0.35rem', display: 'inline-block' }}>
                            {product.categoryName || 'Produk Farmasi'}
                        </span>
                        <h2 className="modal-title">{product.name}</h2>
                    </div>
                    <button className="btn-icon" onClick={onClose} title="Tutup">
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    {/* Image & Key Info */}
                    <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                        <div style={{
                            width: '180px',
                            height: '180px',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            border: '1.5px solid var(--slate-200)',
                            background: '#f8fafc',
                            flexShrink: 0
                        }}>
                            <img
                                src={displayImage}
                                alt={product.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = fallbackImage;
                                }}
                            />
                        </div>

                        <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ marginBottom: '0.5rem' }}>
                                <span className="price-label">Harga Resmi Apotek</span>
                                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--orange-600)' }}>
                                    {formatRupiah(product.price)}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                                <span className={`product-stock-tag ${isAvailable ? 'available' : 'unavailable'}`} style={{ position: 'static' }}>
                                    {isAvailable ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                    <span>{isAvailable ? 'Stok Tersedia' : 'Stok Habis'}</span>
                                </span>
                                <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    background: 'var(--blue-50)',
                                    color: 'var(--blue-700)',
                                    border: '1px solid var(--blue-200)',
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '9999px'
                                }}>
                                    <ShieldCheck size={13} />
                                    <span>BPOM & Asli</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Description & Indications */}
                    <div style={{
                        background: 'var(--slate-50)',
                        border: '1.5px solid var(--slate-200)',
                        borderRadius: '12px',
                        padding: '1rem 1.25rem',
                        marginBottom: '1rem'
                    }}>
                        <h4 style={{ fontSize: '0.9rem', color: 'var(--blue-900)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Pill size={16} color="var(--blue-600)" />
                            <span>Indikasi & Deskripsi Produk:</span>
                        </h4>
                        <p style={{ fontSize: '0.88rem', color: 'var(--slate-700)', lineHeight: 1.6 }}>
                            {product.description || 'Tidak ada deskripsi tambahan. Silakan hubungi apoteker kami melalui WhatsApp untuk informasi dosis, efek samping, dan aturan minum lengkap.'}
                        </p>
                    </div>

                    {/* Disclaimer Alert */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.65rem',
                        background: '#fffbeb',
                        border: '1px solid #fde68a',
                        borderRadius: '10px',
                        padding: '0.75rem 1rem',
                        fontSize: '0.8rem',
                        color: '#92400e'
                    }}>
                        <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>Pastikan membaca petunjuk penggunaan atau resep dokter sebelum mengonsumsi obat. Apoteker kami siap membantu via WhatsApp.</span>
                    </div>
                </div>

                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>
                        Tutup
                    </button>
                    <button
                        type="button"
                        className="btn btn-wa"
                        disabled={!isAvailable}
                        onClick={() => {
                            onClose();
                            onOrder(product);
                        }}
                    >
                        <MessageCircle size={17} />
                        <span>{isAvailable ? 'Pesan Sekarang via WA' : 'Stok Sedang Habis'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

