import React, { useState } from 'react';
import {
    X,
    MessageCircle,
    AlertCircle,
    Send,
    Truck,
    MapPin,
    AlertTriangle,
    CheckCircle2,
    Check,
    Building2,
    Calendar,
    Phone,
    User,
    FileText,
    ShieldCheck
} from 'lucide-react';
import { SUKABUMI_BRANCHES } from './BranchLocationSection';
import { getImageUrl, SERVER_URL } from '../services/api';

export const OrderModal = ({
    product,
    storeSettings,
    selectedProcessingBranch,
    onClose,
    onOrderSuccess
}) => {
    // Current stock from product
    const stock = Number(product?.stock !== undefined ? product.stock : 10);
    const maxQty = Math.max(1, stock);

    // Initial processing branch fallback to KF 0221
    const defaultBranch = selectedProcessingBranch || SUKABUMI_BRANCHES[0];

    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [address, setAddress] = useState('');
    const [kelurahan, setKelurahan] = useState('');
    const [kecamatan, setKecamatan] = useState('');
    const [city] = useState('Kota Sukabumi');
    const [notes, setNotes] = useState('');
    const [branchId, setBranchId] = useState(defaultBranch.id);
    const [quantity, setQuantity] = useState(1);

    const [errorMsg, setErrorMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderConfirmedData, setOrderConfirmedData] = useState(null);

    if (!product) return null;

    const chosenBranch = SUKABUMI_BRANCHES.find((b) => b.id === branchId) || defaultBranch;
    const storeName = storeSettings?.storeName || 'Apotek Kimia Farma';
    const storePhone = (storeSettings?.phone || '6281234567890').replace(/[^0-9]/g, '');

    const formatRupiah = (num) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(num);
    };

    const totalPrice = (product.price || 0) * quantity;

    // Handle Quantity increments with stock guard
    const handleQtyChange = (newQty) => {
        if (newQty < 1) return;
        if (newQty > stock) {
            setErrorMsg(`Jumlah pesanan tidak boleh melebihi stok tersedia (${stock} pcs).`);
            setQuantity(stock);
            return;
        }
        setErrorMsg('');
        setQuantity(newQty);
    };

    // Format WhatsApp Message for order forwarding
    const generateWAMessage = (orderNumber) => {
        return `Halo ${storeName}, saya telah melakukan pemesanan via Katalog:
Nomor Pesanan: ${orderNumber || 'KF-ORD-PENDING'}

Detail Pesanan:
- Produk: ${product.name}
- Jumlah: ${quantity} pcs
- Harga Satuan: ${formatRupiah(product.price)}
- Total Harga: ${formatRupiah(totalPrice)}

Cabang Pemrosesan:
${chosenBranch.code} (${chosenBranch.name})
${chosenBranch.address}

Metode Pengiriman:
🚚 Diantar ke Alamat (Khusus Wilayah Kota Sukabumi)

Data Penerima:
- Nama: ${customerName.trim()}
- No. WhatsApp: ${customerPhone.trim()}
- Alamat Lengkap: ${address.trim()}
- Kelurahan: ${kelurahan.trim() || '-'}
- Kecamatan: ${kecamatan.trim() || '-'}
- Kota: Kota Sukabumi
- Catatan untuk Kurir: ${notes.trim() || '-'}

Status Pesanan: Menunggu Verifikasi
Mohon segera diverifikasi oleh apoteker dan diproses pengantarannya. Terima kasih!`;
    };

    // Handle Submit Checkout Order
    const handleSubmitOrder = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        // Required Validations
        if (!customerName.trim()) {
            setErrorMsg('Nama penerima wajib diisi.');
            return;
        }
        if (!customerPhone.trim()) {
            setErrorMsg('Nomor WhatsApp/telepon wajib diisi.');
            return;
        }
        if (!address.trim()) {
            setErrorMsg('Alamat lengkap pengiriman wajib diisi.');
            return;
        }
        if (quantity > stock) {
            setErrorMsg(`Jumlah melebihi stok yang tersedia (${stock} pcs).`);
            return;
        }
        if (stock === 0) {
            setErrorMsg('Maaf, produk ini saat ini habis dan tidak dapat dipesan.');
            return;
        }

        setIsSubmitting(true);
        try {
            const orderPayload = {
                customerName: customerName.trim(),
                customerPhone: customerPhone.trim(),
                address: address.trim(),
                kelurahan: kelurahan.trim(),
                kecamatan: kecamatan.trim(),
                city: 'Kota Sukabumi',
                notes: notes.trim(),
                branchId: chosenBranch.id,
                branchName: `${chosenBranch.code} - ${chosenBranch.name}`,
                deliveryMethod: 'Diantar ke Alamat',
                totalPrice,
                items: [
                    {
                        productId: product.id,
                        name: product.name,
                        price: product.price,
                        quantity
                    }
                ]
            };

            // Call API backend to record order and deduct stock in database
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderPayload)
            });

            const resData = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(resData.message || 'Gagal membuat pesanan');
            }

            const createdOrder = resData.data;
            setOrderConfirmedData(createdOrder);

            // Notify parent to refresh products data so stock reflects update across App
            if (onOrderSuccess) {
                onOrderSuccess(createdOrder);
            }
        } catch (err) {
            setErrorMsg(err.message || 'Terjadi kesalahan saat memproses pesanan.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Forward confirmed order to WhatsApp
    const handleOpenWhatsApp = () => {
        const orderNumber = orderConfirmedData?.order_number || orderConfirmedData?.orderNumber;
        const msg = generateWAMessage(orderNumber);
        const encoded = encodeURIComponent(msg);
        const url = `https://wa.me/${storePhone}?text=${encoded}`;
        window.open(url, '_blank', 'noopener,noreferrer');
        onClose();
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div
                className="modal-content animate-slide-up"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '620px' }}
            >
                {/* Modal Header */}
                <div className="modal-header">
                    <div className="modal-title-group">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '3px' }}>
                            <span className="brand-tag">🚚 Diantar ke Alamat</span>
                            <span className="branch-prototype-tag">Kota Sukabumi</span>
                        </div>
                        <h2 className="modal-title">
                            {orderConfirmedData ? 'Detail Konfirmasi Pesanan' : 'Form Pemesanan & Pengantaran Obat'}
                        </h2>
                        <p className="modal-subtitle">
                            {orderConfirmedData
                                ? 'Pesanan berhasil dicatat dan stok telah diperbarui!'
                                : 'Obat akan disiapkan oleh apoteker cabang dan diantar ke rumah Anda.'}
                        </p>
                    </div>
                    <button className="btn-icon" onClick={onClose} title="Tutup">
                        <X size={20} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="modal-body">
                    {/* View: Setelah Pesanan Berhasil Dikonfirmasi (Order Detail Card) */}
                    {orderConfirmedData ? (
                        <div className="order-success-confirmation animate-fade-in">
                            <div className="order-success-header">
                                <div className="order-success-icon-wrap">
                                    <CheckCircle2 size={32} color="#10b981" />
                                </div>
                                <h3 className="order-success-title">Pesanan Berhasil Dibuat!</h3>
                                <p className="order-success-subtitle">
                                    Nomor Pesanan: <strong>{orderConfirmedData.order_number || orderConfirmedData.orderNumber}</strong>
                                </p>
                            </div>

                            {/* Summary Detail Sesuai Spesifikasi Prompt Point 15 */}
                            <div className="order-receipt-card">
                                <div className="receipt-section-title">
                                    <FileText size={15} color="var(--blue-600)" />
                                    <span>Ringkasan Produk & Biaya:</span>
                                </div>

                                <div className="receipt-row">
                                    <span>Produk:</span>
                                    <strong>{product.name}</strong>
                                </div>
                                <div className="receipt-row">
                                    <span>Jumlah:</span>
                                    <span>{quantity} pcs</span>
                                </div>
                                <div className="receipt-row">
                                    <span>Harga Satuan:</span>
                                    <span>{formatRupiah(product.price)}</span>
                                </div>
                                <div className="receipt-row receipt-subtotal-row">
                                    <span>Subtotal:</span>
                                    <strong className="text-orange">{formatRupiah(totalPrice)}</strong>
                                </div>

                                <div className="receipt-divider"></div>

                                <div className="receipt-row">
                                    <span>Cabang Pemrosesan:</span>
                                    <strong className="text-blue">{chosenBranch.code} ({chosenBranch.name})</strong>
                                </div>
                                <div className="receipt-row">
                                    <span>Metode Pengiriman:</span>
                                    <span className="receipt-delivery-badge">🚚 Diantar ke Alamat</span>
                                </div>
                                <div className="receipt-row">
                                    <span>Alamat Pengiriman:</span>
                                    <span style={{ textAlign: 'right', maxWidth: '280px' }}>
                                        {address}, {kelurahan && `Kel. ${kelurahan}, `}{kecamatan && `Kec. ${kecamatan}, `}Kota Sukabumi
                                    </span>
                                </div>
                                <div className="receipt-row">
                                    <span>Status Pesanan:</span>
                                    <span className="badge badge-warning" style={{ fontSize: '0.78rem' }}>
                                        Menunggu Verifikasi
                                    </span>
                                </div>
                            </div>

                            <div className="order-next-step-box">
                                <p>
                                    Silakan lanjutkan konfirmasi dengan apoteker kami melalui WhatsApp untuk mempercepat verifikasi resep/dosis dan pengantaran kurir apotek.
                                </p>
                            </div>

                            <div className="modal-footer" style={{ padding: '1rem 0 0', background: 'transparent' }}>
                                <button type="button" className="btn btn-secondary" onClick={onClose}>
                                    Tutup
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-wa"
                                    onClick={handleOpenWhatsApp}
                                >
                                    <MessageCircle size={16} />
                                    <span>Kirim Konfirmasi ke WhatsApp Apotek</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* View: Form Checkout Pengantaran */
                        <form onSubmit={handleSubmitOrder}>
                            {/* Product Info Bar */}
                            <div className="order-product-summary">
                                <img
                                    src={getImageUrl(product.image) || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80'}
                                    alt={product.name}
                                    className="summary-img"
                                    onError={(e) => {
                                        if (!e.target.dataset.triedRelative && product.image && product.image.includes('product-')) {
                                            e.target.dataset.triedRelative = 'true';
                                            const filename = product.image.split('/').pop().trim();
                                            e.target.src = `/uploads/${filename}`;
                                            return;
                                        }
                                        if (!e.target.dataset.triedServer && product.image && product.image.includes('product-')) {
                                            e.target.dataset.triedServer = 'true';
                                            const filename = product.image.split('/').pop().trim();
                                            const base = SERVER_URL.replace(/\/+$/, '');
                                            e.target.src = `${base}/uploads/${filename}`;
                                            return;
                                        }
                                        e.target.onerror = null;
                                        e.target.src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80';
                                    }}
                                />
                                <div className="summary-details">
                                    <span className="summary-category">{product.categoryName || 'Produk Farmasi'}</span>
                                    <h4 className="summary-name">{product.name}</h4>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', margin: '3px 0 6px' }}>
                                        <span className="product-stock-tag available" style={{ position: 'static', padding: '0.15rem 0.5rem', fontSize: '0.7rem' }}>
                                            Stok: {stock} pcs
                                        </span>
                                        {stock <= 5 && stock > 0 && (
                                            <span style={{ fontSize: '0.7rem', color: '#c2410c', fontWeight: 700 }}>
                                                (Stok Terbatas!)
                                            </span>
                                        )}
                                    </div>

                                    <div className="summary-price-row">
                                        <span className="summary-unit-price">{formatRupiah(product.price)} / pcs</span>
                                        
                                        {/* Quantity Selector with Stock Guard */}
                                        <div className="quantity-control">
                                            <button
                                                type="button"
                                                className="qty-btn"
                                                onClick={() => handleQtyChange(quantity - 1)}
                                                disabled={quantity <= 1}
                                            >
                                                -
                                            </button>
                                            <span className="qty-number">{quantity}</span>
                                            <button
                                                type="button"
                                                className="qty-btn"
                                                onClick={() => handleQtyChange(quantity + 1)}
                                                disabled={quantity >= stock}
                                                title={quantity >= stock ? 'Jumlah maksimal sesuai sisa stok' : 'Tambah'}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Total Price Banner */}
                            <div className="order-total-bar">
                                <span>Subtotal ({quantity} pcs):</span>
                                <span className="total-amount">{formatRupiah(totalPrice)}</span>
                            </div>

                            {/* Error Alert */}
                            {errorMsg && (
                                <div className="form-alert-error animate-fade-in" style={{ marginBottom: '1rem' }}>
                                    <AlertCircle size={18} />
                                    <span>{errorMsg}</span>
                                </div>
                            )}

                            {/* Alur Pemesanan Strip Sesuai Point 12 */}
                            <div className="order-process-strip">
                                <span className="strip-title">Alur Pemesanan:</span>
                                <div className="strip-steps">
                                    <span>Pilih Produk</span> →
                                    <span className="strip-active">Pilih Cabang</span> →
                                    <span className="strip-active">Isi Alamat</span> →
                                    <span>Konfirmasi</span> →
                                    <span>Obat Diantar</span>
                                </div>
                            </div>

                            {/* Form Section 1: Cabang Pemrosesan Pesanan */}
                            <div className="form-group" style={{ marginTop: '0.85rem' }}>
                                <label className="form-label">
                                    <Building2 size={15} color="var(--blue-600)" />
                                    <span>Cabang Pemrosesan Pesanan (Kota Sukabumi)</span>
                                    <span className="text-danger">*</span>
                                </label>
                                <select
                                    className="form-select"
                                    value={branchId}
                                    onChange={(e) => setBranchId(e.target.value)}
                                    required
                                >
                                    {SUKABUMI_BRANCHES.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.code} - {b.name} ({b.area})
                                        </option>
                                    ))}
                                </select>
                                <small style={{ color: 'var(--slate-500)', marginTop: '3px', display: 'block' }}>
                                    Cabang di atas adalah gerai apotek yang memproses dan menyiapkan pesanan Anda. Obat akan <strong>diantar ke alamat rumah</strong>, bukan diambil di cabang.
                                </small>
                            </div>

                            {/* Metode Pengiriman Locked (Point 11 & 13) */}
                            <div className="form-group">
                                <label className="form-label">
                                    <Truck size={15} color="#059669" />
                                    <span>Metode Pengiriman</span>
                                </label>
                                <div className="delivery-locked-box">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Truck size={18} color="#059669" />
                                        <strong>🚚 Antar ke Alamat (Khusus Wilayah Kota Sukabumi)</strong>
                                    </div>
                                    <span className="delivery-locked-notice">
                                        Seluruh obat hanya dapat diantar langsung ke alamat pelanggan demi kenyamanan dan keamanan pasien.
                                    </span>
                                </div>
                            </div>

                            {/* Form Section 2: Data Penerima */}
                            <div className="form-row-2">
                                <div className="form-group">
                                    <label className="form-label">
                                        <User size={14} />
                                        <span>Nama Penerima</span>
                                        <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="cth: Budi Santoso"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        <Phone size={14} />
                                        <span>No. WhatsApp / Telepon</span>
                                        <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        className="form-input"
                                        placeholder="cth: 081234567890"
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Form Section 3: Alamat Lengkap Pengiriman */}
                            <div className="form-group">
                                <label className="form-label">
                                    <MapPin size={14} />
                                    <span>Alamat Lengkap Pengiriman</span>
                                    <span className="text-danger">*</span>
                                </label>
                                <textarea
                                    rows="2"
                                    className="form-textarea"
                                    placeholder="Nama jalan, nomor rumah, RT/RW, patokan lokasi..."
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-row-3">
                                <div className="form-group">
                                    <label className="form-label" style={{ fontSize: '0.78rem' }}>Kelurahan</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="cth: Benteng"
                                        value={kelurahan}
                                        onChange={(e) => setKelurahan(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontSize: '0.78rem' }}>Kecamatan</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="cth: Warudoyong"
                                        value={kecamatan}
                                        onChange={(e) => setKecamatan(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontSize: '0.78rem' }}>Kota / Kabupaten</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={city}
                                        disabled
                                        style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
                                    />
                                </div>
                            </div>

                            {/* Form Section 4: Catatan untuk Kurir */}
                            <div className="form-group">
                                <label className="form-label">
                                    <span>Catatan untuk Kurir Pengantar</span>
                                    <span className="text-muted" style={{ fontWeight: 400 }}>(Opsional)</span>
                                </label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Contoh: Titip di satpam / rumah pagar hijau / hubungi sebelum antar"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>

                            {/* Modal Footer Actions */}
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={onClose}>
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={isSubmitting || stock === 0}
                                >
                                    <Send size={16} />
                                    <span>{isSubmitting ? 'Memproses Pesanan...' : 'Konfirmasi Pesanan (Diantar)'}</span>
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
