import React from 'react';
import { MessageCircle, CheckCircle2, XCircle, Eye, ShieldCheck } from 'lucide-react';

export const ProductCard = ({ product, onSelectProduct, onViewDetail }) => {
    const isAvailable = product.stockStatus === 'Tersedia';

    // Format Indonesian Rupiah
    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(number);
    };

    const fallbackImage = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80';
    const displayImage = product.image && product.image !== '-' ? product.image : fallbackImage;

    return (
        <div className={`product-card ${!isAvailable ? 'out-of-stock' : ''}`} id={`product-${product.id}`}>
            {/* Product Image Box */}
            <div className="product-image-box" onClick={() => onViewDetail && onViewDetail(product)} style={{ cursor: 'pointer' }}>
                <img
                    src={displayImage}
                    alt={product.name}
                    className="product-img"
                    loading="lazy"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = fallbackImage;
                    }}
                />

                {/* Category Pill Tag */}
                <span className="product-cat-tag">
                    {product.categoryName || 'Obat / Farmasi'}
                </span>

                {/* BPOM Pill */}
                <span className="product-bpom-badge" title="Tervalidasi BPOM RI">
                    <ShieldCheck size={11} />
                    <span>BPOM</span>
                </span>

                {/* Stock Status Badge */}
                <span className={`product-stock-tag ${isAvailable ? 'available' : 'unavailable'}`}>
                    {isAvailable ? (
                        <>
                            <CheckCircle2 size={12} />
                            <span>Tersedia</span>
                        </>
                    ) : (
                        <>
                            <XCircle size={12} />
                            <span>Habis</span>
                        </>
                    )}
                </span>
            </div>

            {/* Product Details */}
            <div className="product-content">
                <div className="product-header-group">
                    <h3
                        className="product-title"
                        title={product.name}
                        onClick={() => onViewDetail && onViewDetail(product)}
                        style={{ cursor: 'pointer' }}
                    >
                        {product.name}
                    </h3>
                    <p className="product-desc">
                        {product.description || 'Sediaan farmasi resmi berstandar apotek. Konsultasikan penggunaan dengan apoteker kami.'}
                    </p>
                </div>

                {/* Price & Action Row */}
                <div className="product-bottom-row">
                    <div className="product-price-group">
                        <span className="price-label">Harga Resmi</span>
                        <span className="product-price">{formatRupiah(product.price)}</span>
                    </div>

                    <div className="product-actions-group">
                        {onViewDetail && (
                            <button
                                type="button"
                                className="btn btn-secondary-subtle btn-sm"
                                onClick={() => onViewDetail(product)}
                                title="Lihat detail & indikasi"
                            >
                                <Eye size={15} />
                                <span>Detail</span>
                            </button>
                        )}

                        <button
                            type="button"
                            className="btn btn-wa order-btn"
                            disabled={!isAvailable}
                            onClick={() => onSelectProduct(product)}
                            id={`btn-order-${product.id}`}
                            title={isAvailable ? 'Pesan produk ini via WhatsApp' : 'Produk saat ini sedang habis'}
                        >
                            <MessageCircle size={16} />
                            <span>{isAvailable ? 'Pesan WA' : 'Habis'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
