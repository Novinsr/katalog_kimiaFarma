import React, { useState, useEffect } from 'react';
import Logo from '../assets/LogoKimiaFarma.png';
import {
    Package,
    Layers,
    Settings,
    Plus,
    Search,
    Edit2,
    Trash2,
    CheckCircle,
    XCircle,
    PhoneCall,
    Save,
    AlertCircle,
    Check,
    Store,
    LogOut,
    ShoppingBag,
    Database,
    Menu,
    X,
    ExternalLink,
    ChevronRight,
    ShieldCheck,
    User,
    KeyRound,
    Mail,
    Eye,
    EyeOff,
    Truck,
    Clock,
    Calendar,
    CheckCircle2,
    AlertTriangle,
    RefreshCw,
    MessageCircle,
    MapPin,
    ArrowUpRight
} from 'lucide-react';
import { ProductFormModal } from './ProductFormModal';
import { ConfirmModal } from './ConfirmModal';
import {
    createProduct,
    updateProduct,
    toggleProductStock,
    updateProductStock,
    deleteProduct,
    createCategory,
    updateCategory,
    deleteCategory,
    updateStoreSettings,
    updateAdminProfile,
    fetchOrders,
    updateOrderStatus
} from '../services/api';

export const AdminDashboard = ({
    products,
    categories,
    storeSettings,
    adminUser,
    onRefreshData,
    onUpdateAdminUser,
    onBackToCatalog,
    onLogout
}) => {
    const [activeTab, setActiveTab] = useState('products'); // 'products' | 'categories' | 'orders' | 'settings' | 'profile'
    const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);

    // Product states
    const [productSearch, setProductSearch] = useState('');
    const [productCategoryFilter, setProductCategoryFilter] = useState('');
    const [productStockFilter, setProductStockFilter] = useState('all'); // 'all' | 'available' | 'out'
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [deletingProduct, setDeletingProduct] = useState(null);

    // Category states
    const [newCatName, setNewCatName] = useState('');
    const [editingCategory, setEditingCategory] = useState(null);
    const [editCatName, setEditCatName] = useState('');
    const [deletingCategory, setDeletingCategory] = useState(null);
    const [catError, setCatError] = useState('');

    // Settings states
    const [settingsForm, setSettingsForm] = useState({
        storeName: storeSettings?.storeName || '',
        tagline: storeSettings?.tagline || '',
        phone: storeSettings?.phone || '',
        address: storeSettings?.address || ''
    });
    const [settingsSuccess, setSettingsSuccess] = useState(false);

    // Orders states
    const [orders, setOrders] = useState([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);
    const [ordersError, setOrdersError] = useState('');
    const [orderSearch, setOrderSearch] = useState('');
    const [orderStatusFilter, setOrderStatusFilter] = useState('all');
    const [updatingOrderId, setUpdatingOrderId] = useState(null);

    // Admin Profile States
    const [profileForm, setProfileForm] = useState({
        name: adminUser?.name || '',
        email: adminUser?.email || '',
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
    const [profileErrorMsg, setProfileErrorMsg] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // Sync adminUser props to profile form
    useEffect(() => {
        if (adminUser) {
            setProfileForm((prev) => ({
                ...prev,
                name: adminUser.name || '',
                email: adminUser.email || ''
            }));
        }
    }, [adminUser]);

    // Load orders
    const loadOrders = async () => {
        setIsLoadingOrders(true);
        setOrdersError('');
        try {
            const res = await fetchOrders();
            if (res?.data) {
                setOrders(res.data);
            }
        } catch (err) {
            console.error('Gagal mengambil data pesanan:', err);
            setOrdersError(err.message || 'Gagal memuat pesanan');
        } finally {
            setIsLoadingOrders(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, []);

    useEffect(() => {
        if (activeTab === 'orders') {
            loadOrders();
        }
    }, [activeTab]);

    // Currency Formatter
    const formatRupiah = (num) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(num);
    };

    // Date Formatter
    const formatDate = (isoString) => {
        if (!isoString) return '-';
        try {
            const date = new Date(isoString);
            return new Intl.DateTimeFormat('id-ID', {
                dateStyle: 'medium',
                timeStyle: 'short'
            }).format(date);
        } catch {
            return isoString;
        }
    };

    // Filter products for admin table
    const filteredProducts = products.filter((p) => {
        const matchesCat = !productCategoryFilter || p.categoryId === productCategoryFilter;
        const query = productSearch.trim().toLowerCase();
        const matchesSearch = !query ||
            (p.name && p.name.toLowerCase().includes(query)) ||
            (p.description && p.description.toLowerCase().includes(query)) ||
            (p.categoryName && p.categoryName.toLowerCase().includes(query));
        let matchesStock = true;
        if (productStockFilter === 'available') {
            matchesStock = p.stockStatus === 'Tersedia';
        } else if (productStockFilter === 'out') {
            matchesStock = p.stockStatus !== 'Tersedia';
        }
        return matchesCat && matchesSearch && matchesStock;
    });

    // Filter orders
    const filteredOrders = orders.filter((o) => {
        const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
        const q = orderSearch.trim().toLowerCase();
        const matchesSearch = !q ||
            (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) ||
            (o.customerName && o.customerName.toLowerCase().includes(q)) ||
            (o.customerPhone && o.customerPhone.toLowerCase().includes(q)) ||
            (o.branchName && o.branchName.toLowerCase().includes(q)) ||
            (o.address && o.address.toLowerCase().includes(q));
        return matchesStatus && matchesSearch;
    });

    // Stock counts
    const totalCount = products.length;
    const availableCount = products.filter((p) => p.stockStatus === 'Tersedia').length;
    const outCount = totalCount - availableCount;
    const pendingOrdersCount = orders.filter((o) => o.status === 'Menunggu Verifikasi').length;

    // --- Handlers: Product Management ---
    const handleOpenAddProduct = () => {
        setEditingProduct(null);
        setIsProductModalOpen(true);
    };

    const handleOpenEditProduct = (prod) => {
        setEditingProduct(prod);
        setIsProductModalOpen(true);
    };

    const handleSaveProduct = async (payload, id) => {
        if (id) {
            await updateProduct(id, payload);
        } else {
            await createProduct(payload);
        }
        await onRefreshData();
    };

    const handleToggleStock = async (id) => {
        try {
            await toggleProductStock(id);
            await onRefreshData();
        } catch (err) {
            alert(`Gagal mengubah stok: ${err.message}`);
        }
    };

    const handleUpdateStock = async (id, newStock) => {
        try {
            await updateProductStock(id, Math.max(0, newStock));
            await onRefreshData();
        } catch (err) {
            alert(`Gagal mengubah stok: ${err.message}`);
        }
    };

    const handleConfirmDeleteProduct = async () => {
        if (!deletingProduct) return;
        try {
            await deleteProduct(deletingProduct.id);
            setDeletingProduct(null);
            await onRefreshData();
        } catch (err) {
            alert(`Gagal menghapus produk: ${err.message}`);
        }
    };

    // --- Handlers: Category Management ---
    const handleAddCategory = async (e) => {
        e.preventDefault();
        setCatError('');
        if (!newCatName.trim()) return;

        try {
            await createCategory(newCatName.trim());
            setNewCatName('');
            await onRefreshData();
        } catch (err) {
            setCatError(err.message || 'Gagal menambahkan kategori');
        }
    };

    const handleSaveEditCategory = async (id) => {
        if (!editCatName.trim()) return;
        try {
            await updateCategory(id, editCatName.trim());
            setEditingCategory(null);
            setEditCatName('');
            await onRefreshData();
        } catch (err) {
            alert(`Gagal mengubah kategori: ${err.message}`);
        }
    };

    const handleConfirmDeleteCategory = async () => {
        if (!deletingCategory) return;
        try {
            await deleteCategory(deletingCategory.id);
            setDeletingCategory(null);
            await onRefreshData();
        } catch (err) {
            alert(`Gagal menghapus kategori: ${err.message}`);
        }
    };

    // --- Handlers: Store Settings ---
    const handleSaveSettings = async (e) => {
        e.preventDefault();
        try {
            await updateStoreSettings(settingsForm);
            setSettingsSuccess(true);
            await onRefreshData();
            setTimeout(() => setSettingsSuccess(false), 3000);
        } catch (err) {
            alert(`Gagal menyimpan pengaturan: ${err.message}`);
        }
    };

    // --- Handlers: Orders ---
    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        setUpdatingOrderId(orderId);
        try {
            await updateOrderStatus(orderId, newStatus);
            setOrders((prev) =>
                prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
            );
        } catch (err) {
            alert(`Gagal mengubah status: ${err.message}`);
        } finally {
            setUpdatingOrderId(null);
        }
    };

    // --- Handlers: Admin Profile ---
    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setProfileErrorMsg('');
        setProfileSuccessMsg('');

        if (!profileForm.name.trim()) {
            setProfileErrorMsg('Nama pengguna admin tidak boleh kosong.');
            return;
        }

        if (!profileForm.email.trim()) {
            setProfileErrorMsg('Email admin tidak boleh kosong.');
            return;
        }

        if (profileForm.newPassword) {
            if (!profileForm.currentPassword) {
                setProfileErrorMsg('Masukkan password saat ini untuk memverifikasi penggantian password.');
                return;
            }
            if (profileForm.newPassword.length < 6) {
                setProfileErrorMsg('Password baru minimal 6 karakter.');
                return;
            }
            if (profileForm.newPassword !== profileForm.confirmNewPassword) {
                setProfileErrorMsg('Konfirmasi password baru tidak cocok.');
                return;
            }
        }

        setIsSavingProfile(true);
        try {
            const payload = {
                name: profileForm.name.trim(),
                email: profileForm.email.trim()
            };

            if (profileForm.newPassword) {
                payload.currentPassword = profileForm.currentPassword;
                payload.newPassword = profileForm.newPassword;
            }

            const res = await updateAdminProfile(payload);
            setProfileSuccessMsg(res.message || 'Profil admin berhasil diperbarui!');
            setProfileForm((prev) => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                confirmNewPassword: ''
            }));
            if (res?.user && onUpdateAdminUser) {
                onUpdateAdminUser(res.user);
            }
            if (onRefreshData) {
                await onRefreshData();
            }
            setTimeout(() => setProfileSuccessMsg(''), 4000);
        } catch (err) {
            setProfileErrorMsg(err.message || 'Gagal memperbarui profil admin. Pastikan backend aktif.');
        } finally {
            setIsSavingProfile(false);
        }
    };

    return (
        <div className="admin-sidebar-layout animate-fade-in">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpenMobile && (
                <div
                    className="sidebar-backdrop-mobile"
                    onClick={() => setIsSidebarOpenMobile(false)}
                />
            )}

            {/* ===========================================================
          LEFT NAVIGATION SIDEBAR (Kimia Farma Blue Palette)
         =========================================================== */}
            <aside className={`admin-sidebar ${isSidebarOpenMobile ? 'open' : ''}`}>
                {/* Brand Header */}
                <div className="sidebar-brand-box">
                    <div >
                        <img className="brand-logo-sidebar" src={Logo} width={50} alt="" />
                        {/* <ShoppingBag size={22} color="#ffffff" /> */}
                    </div>
                    <div>
                        <h1 className="sidebar-brand-name">Kimia Farma</h1>
                        <span className="sidebar-sub-badge">APOTEK BACK-OFFICE</span>
                    </div>
                    <button
                        className="mobile-close-sidebar-btn"
                        onClick={() => setIsSidebarOpenMobile(false)}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Database Info Pill */}
                <div className="sidebar-db-indicator">
                    <Database size={13} className="text-emerald" />
                    <span>Database: <strong>SQLite (SQL)</strong></span>
                    <span className="db-live-dot"></span>
                </div>

                {/* Sidebar Nav Items */}
                <nav className="sidebar-nav">
                    <div className="nav-section-title">Menu Utama</div>

                    <button
                        className={`sidebar-nav-item ${activeTab === 'products' ? 'active' : ''}`}
                        onClick={() => {
                            setActiveTab('products');
                            setIsSidebarOpenMobile(false);
                        }}
                        id="sidebar-link-products"
                    >
                        <Package size={18} />
                        <span className="nav-item-label">Manajemen Produk</span>
                        <span className="nav-badge-count">{totalCount}</span>
                    </button>

                    <button
                        className={`sidebar-nav-item ${activeTab === 'categories' ? 'active' : ''}`}
                        onClick={() => {
                            setActiveTab('categories');
                            setIsSidebarOpenMobile(false);
                        }}
                        id="sidebar-link-categories"
                    >
                        <Layers size={18} />
                        <span className="nav-item-label">Manajemen Kategori</span>
                        <span className="nav-badge-count">{categories.length}</span>
                    </button>

                    <button
                        className={`sidebar-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
                        onClick={() => {
                            setActiveTab('orders');
                            setIsSidebarOpenMobile(false);
                        }}
                        id="sidebar-link-orders"
                    >
                        <ShoppingBag size={18} />
                        <span className="nav-item-label">Pesanan Masuk</span>
                        {pendingOrdersCount > 0 ? (
                            <span className="nav-badge-count nav-badge-pending-order" title={`${pendingOrdersCount} pesanan baru menunggu verifikasi`}>
                                {pendingOrdersCount} Baru
                            </span>
                        ) : (
                            <span className="nav-badge-count">{orders.length}</span>
                        )}
                    </button>

                    <button
                        className={`sidebar-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                        onClick={() => {
                            setActiveTab('settings');
                            setIsSidebarOpenMobile(false);
                        }}
                        id="sidebar-link-settings"
                    >
                        <Settings size={18} />
                        <span className="nav-item-label">Pengaturan Toko & WA</span>
                    </button>

                    <button
                        className={`sidebar-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => {
                            setActiveTab('profile');
                            setIsSidebarOpenMobile(false);
                        }}
                        id="sidebar-link-profile"
                    >
                        <User size={18} />
                        <span className="nav-item-label">Profil & Akun Admin</span>
                    </button>

                    <div className="nav-section-title" style={{ marginTop: '1.25rem' }}>Akses Cepat</div>
                    <button className="sidebar-nav-item" onClick={onBackToCatalog}>
                        <Store size={18} />
                        <span className="nav-item-label">Lihat Katalog Publik</span>
                        <ExternalLink size={13} style={{ marginLeft: 'auto', opacity: 0.6 }} />
                    </button>
                </nav>

                {/* Sidebar Footer User Card */}
                <div className="sidebar-user-footer">
                    <div className="user-profile-summary">
                        <div className="user-avatar-badge">
                            <ShieldCheck size={16} color="#0284c7" />
                        </div>
                        <div className="user-text-info">
                            <strong className="user-name-title">{adminUser?.name || 'Administrator'}</strong>
                            <span className="user-email-subtitle">{adminUser?.email || 'admin@katalogwa.com'}</span>
                        </div>
                    </div>
                    <button className="sidebar-logout-btn" onClick={onLogout} title="Keluar dari sesi admin">
                        <LogOut size={16} />
                        <span>Logout Sesi</span>
                    </button>
                </div>
            </aside>

            {/* ===========================================================
          MAIN VIEWPORT CONTENT
         =========================================================== */}
            <div className="admin-main-viewport">
                {/* Top Navbar */}
                <header className="viewport-top-bar">
                    <div className="top-bar-left">
                        <button
                            className="mobile-hamburger-btn"
                            onClick={() => setIsSidebarOpenMobile(true)}
                            title="Buka menu navigasi"
                        >
                            <Menu size={22} />
                        </button>
                        <div>
                            <h2 className="viewport-title">
                                {activeTab === 'products' && 'Manajemen Produk Katalog'}
                                {activeTab === 'categories' && 'Manajemen Kategori'}
                                {activeTab === 'orders' && 'Manajemen Pesanan Masuk Pelanggan'}
                                {activeTab === 'settings' && 'Pengaturan Toko & Nomor WhatsApp'}
                                {activeTab === 'profile' && 'Profil & Keamanan Akun Admin'}
                            </h2>
                            <span className="viewport-breadcrumb">
                                Admin Panel / {activeTab === 'products' ? 'Produk' : activeTab === 'categories' ? 'Kategori' : activeTab === 'orders' ? 'Pesanan Masuk' : activeTab === 'settings' ? 'Pengaturan' : 'Profil Admin'}
                            </span>
                        </div>
                    </div>

                    <div className="top-bar-right">
                        <button className="btn btn-secondary btn-sm" onClick={onBackToCatalog}>
                            <Store size={15} />
                            <span>Katalog Publik</span>
                        </button>
                    </div>
                </header>

                {/* Main Body */}
                <main className="viewport-content-container">
                    {/* Metrics Summary Strip */}
                    <div className="metrics-grid" style={{ marginBottom: '1.75rem' }}>
                        <div className="metric-card">
                            <div className="metric-icon-box bg-emerald">
                                <Package size={22} color="#059669" />
                            </div>
                            <div>
                                <span className="metric-label">Total Produk</span>
                                <h3 className="metric-value">{totalCount}</h3>
                            </div>
                        </div>

                        <div className="metric-card">
                            <div className="metric-icon-box bg-green">
                                <CheckCircle size={22} color="#10b981" />
                            </div>
                            <div>
                                <span className="metric-label">Produk Tersedia</span>
                                <h3 className="metric-value text-emerald">{availableCount}</h3>
                            </div>
                        </div>

                        <div className="metric-card">
                            <div className="metric-icon-box bg-red">
                                <XCircle size={22} color="#ef4444" />
                            </div>
                            <div>
                                <span className="metric-label">Stok Habis</span>
                                <h3 className="metric-value text-danger">{outCount}</h3>
                            </div>
                        </div>

                        <div className="metric-card">
                            <div className="metric-icon-box bg-slate">
                                <Layers size={22} color="#475569" />
                            </div>
                            <div>
                                <span className="metric-label">Total Kategori</span>
                                <h3 className="metric-value">{categories.length}</h3>
                            </div>
                        </div>

                        <div className="metric-card" onClick={() => setActiveTab('orders')} style={{ cursor: 'pointer' }} title="Klik untuk melihat pesanan masuk">
                            <div className="metric-icon-box bg-blue" style={{ background: 'var(--blue-50)' }}>
                                <ShoppingBag size={22} color="var(--blue-600)" />
                            </div>
                            <div>
                                <span className="metric-label">Pesanan Masuk</span>
                                <h3 className="metric-value text-blue" style={{ color: 'var(--blue-700)' }}>
                                    {orders.length}
                                    {pendingOrdersCount > 0 && (
                                        <span style={{ fontSize: '0.72rem', fontWeight: 700, marginLeft: '0.4rem', color: 'var(--orange-600)' }}>
                                            ({pendingOrdersCount} baru)
                                        </span>
                                    )}
                                </h3>
                            </div>
                        </div>
                    </div>

                    {/* ===========================================================
                      MODULE 1: PRODUCT MANAGEMENT
                     =========================================================== */}
                    {activeTab === 'products' && (
                        <div className="admin-tab-content animate-fade-in">
                            {/* Controls Bar */}
                            <div className="table-controls-bar">
                                <div className="table-search-group">
                                    <div className="search-input-wrapper admin-search-wrapper">
                                        <Search size={16} className="search-icon" />
                                        <input
                                            type="text"
                                            className="search-input"
                                            placeholder="Cari nama atau deskripsi obat..."
                                            value={productSearch}
                                            onChange={(e) => setProductSearch(e.target.value)}
                                        />
                                        {productSearch && (
                                            <button
                                                type="button"
                                                className="search-clear-btn"
                                                onClick={() => setProductSearch('')}
                                                title="Hapus pencarian"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>

                                    <select
                                        className="form-select filter-select"
                                        value={productCategoryFilter}
                                        onChange={(e) => setProductCategoryFilter(e.target.value)}
                                        aria-label="Filter Kategori"
                                    >
                                        <option value="">Semua Kategori ({categories.length})</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>

                                    <select
                                        className="form-select filter-select"
                                        value={productStockFilter}
                                        onChange={(e) => setProductStockFilter(e.target.value)}
                                        aria-label="Filter Status Stok"
                                    >
                                        <option value="all">Semua Stok</option>
                                        <option value="available">Tersedia Saja</option>
                                        <option value="out">Habis Saja</option>
                                    </select>
                                </div>

                                <div className="table-actions-right">
                                    <span className="table-count-indicator">
                                        Menampilkan <strong>{filteredProducts.length}</strong> produk
                                    </span>
                                    <button
                                        className="btn btn-primary"
                                        onClick={handleOpenAddProduct}
                                        id="btn-add-product"
                                    >
                                        <Plus size={17} />
                                        <span>Tambah Produk</span>
                                    </button>
                                </div>
                            </div>

                            {/* Products Table Card */}
                            <div className="table-container">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '80px', textAlign: 'center' }}>Foto</th>
                                            <th>Informasi Produk Farmasi</th>
                                            <th style={{ width: '150px' }}>Kategori</th>
                                            <th style={{ width: '130px' }}>Harga Satuan</th>
                                            <th style={{ width: '220px', textAlign: 'center' }}>Jumlah Stok & Status</th>
                                            <th style={{ width: '110px', textAlign: 'right' }}>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredProducts.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="table-empty-cell">
                                                    <div className="table-empty-state">
                                                        <Package size={40} color="var(--slate-400)" />
                                                        <h4>Produk Tidak Ditemukan</h4>
                                                        <p>
                                                            {productSearch || productCategoryFilter || productStockFilter !== 'all'
                                                                ? 'Tidak ada produk yang cocok dengan pencarian atau filter yang dipilih.'
                                                                : 'Belum ada produk obat di database. Klik tombol "Tambah Produk" di atas.'}
                                                        </p>
                                                        {(productSearch || productCategoryFilter || productStockFilter !== 'all') && (
                                                            <button
                                                                type="button"
                                                                className="btn btn-secondary btn-sm"
                                                                onClick={() => {
                                                                    setProductSearch('');
                                                                    setProductCategoryFilter('');
                                                                    setProductStockFilter('all');
                                                                }}
                                                                style={{ marginTop: '0.5rem' }}
                                                            >
                                                                Reset Filter
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredProducts.map((prod) => {
                                                const isAvailable = prod.stockStatus === 'Tersedia';
                                                const fallbackImg = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80';
                                                const displayImg = prod.image && prod.image !== '-' ? prod.image : fallbackImg;

                                                return (
                                                    <tr key={prod.id} className={!isAvailable ? 'row-out-of-stock' : ''}>
                                                        {/* Image */}
                                                        <td style={{ textAlign: 'center' }}>
                                                            <div className="table-product-thumb-wrap">
                                                                <img
                                                                    src={displayImg}
                                                                    alt={prod.name}
                                                                    className="table-product-thumb"
                                                                    loading="lazy"
                                                                    onError={(e) => {
                                                                        e.target.onerror = null;
                                                                        e.target.src = fallbackImg;
                                                                    }}
                                                                />
                                                            </div>
                                                        </td>

                                                        {/* Name & Desc */}
                                                        <td>
                                                            <div className="table-product-info">
                                                                <span className="table-product-name">{prod.name}</span>
                                                                {prod.description ? (
                                                                    <p className="table-product-desc" title={prod.description}>
                                                                        {prod.description}
                                                                    </p>
                                                                ) : (
                                                                    <span className="table-no-desc">Tanpa deskripsi tambahan</span>
                                                                )}
                                                            </div>
                                                        </td>

                                                        {/* Category */}
                                                        <td>
                                                            <span className="badge badge-category">
                                                                {prod.categoryName || 'Tanpa Kategori'}
                                                            </span>
                                                        </td>

                                                        {/* Price */}
                                                        <td>
                                                            <span className="table-product-price">
                                                                {formatRupiah(prod.price)}
                                                            </span>
                                                        </td>

                                                        {/* Stock & Status Cell */}
                                                        <td style={{ textAlign: 'center' }}>
                                                            <div className="admin-stock-mgmt-cell">
                                                                <div className="admin-stock-stepper">
                                                                    <span className="admin-stock-number">
                                                                        <strong>
                                                                            {prod.stock !== undefined ? prod.stock : 0}
                                                                        </strong>{' '}
                                                                        pcs
                                                                    </span>
                                                                </div>

                                                                <div
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        gap: '0.4rem',
                                                                        marginTop: '0.35rem'
                                                                    }}
                                                                >
                                                                    <span
                                                                        className={`stock-status-pill ${(prod.stock !== undefined ? prod.stock : 0) > 5
                                                                            ? 'available'
                                                                            : (prod.stock !== undefined ? prod.stock : 0) > 0
                                                                                ? 'limited'
                                                                                : 'unavailable'
                                                                            }`}
                                                                    >
                                                                        {(prod.stock !== undefined ? prod.stock : 0) > 5
                                                                            ? 'Tersedia'
                                                                            : (prod.stock !== undefined ? prod.stock : 0) > 0
                                                                                ? 'Stok Terbatas'
                                                                                : 'Habis'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Actions */}
                                                        <td style={{ textAlign: 'right' }}>
                                                            <div className="table-actions-group">
                                                                <button
                                                                    className="btn-icon btn-action-edit"
                                                                    onClick={() => handleOpenEditProduct(prod)}
                                                                    title="Edit Produk"
                                                                >
                                                                    <Edit2 size={15} />
                                                                </button>
                                                                <button
                                                                    className="btn-icon btn-action-delete"
                                                                    onClick={() => setDeletingProduct(prod)}
                                                                    title="Hapus Produk"
                                                                >
                                                                    <Trash2 size={15} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ===========================================================
                      MODULE: ORDERS MANAGEMENT (PESANAN MASUK)
                     =========================================================== */}
                    {activeTab === 'orders' && (
                        <div className="admin-tab-content animate-fade-in">
                            <div className="table-controls-bar">
                                <div className="table-search-group">
                                    <div className="search-input-wrapper admin-search-wrapper">
                                        <Search size={16} className="search-icon" />
                                        <input
                                            type="text"
                                            className="search-input"
                                            placeholder="Cari no. pesanan, nama pemesan, no. WA, alamat..."
                                            value={orderSearch}
                                            onChange={(e) => setOrderSearch(e.target.value)}
                                        />
                                        {orderSearch && (
                                            <button
                                                type="button"
                                                className="search-clear-btn"
                                                onClick={() => setOrderSearch('')}
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>

                                    <div className="filter-select-wrapper">
                                        <select
                                            className="filter-select"
                                            value={orderStatusFilter}
                                            onChange={(e) => setOrderStatusFilter(e.target.value)}
                                        >
                                            <option value="all">Semua Status Pesanan</option>
                                            <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                                            <option value="Pesanan Diproses">Pesanan Diproses</option>
                                            <option value="Sedang Diantar">Sedang Diantar</option>
                                            <option value="Pesanan Selesai">Pesanan Selesai</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="table-actions-right">
                                    <button
                                        type="button"
                                        className="btn btn-secondary btn-sm"
                                        onClick={loadOrders}
                                        disabled={isLoadingOrders}
                                    >
                                        <RefreshCw size={15} className={isLoadingOrders ? 'animate-spin' : ''} />
                                        <span>Segarkan Pesanan</span>
                                    </button>
                                </div>
                            </div>

                            {/* Orders Table */}
                            <div className="table-container">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '140px' }}>No. Pesanan</th>
                                            <th style={{ width: '170px' }}>Pelanggan</th>
                                            <th style={{ width: '230px' }}>Cabang & Alamat Pengiriman</th>
                                            <th>Item Produk & Qty</th>
                                            <th style={{ width: '130px' }}>Total Harga</th>
                                            <th style={{ width: '150px' }}>Metode Pengiriman</th>
                                            <th style={{ width: '190px', textAlign: 'center' }}>Status Pesanan</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoadingOrders ? (
                                            <tr>
                                                <td colSpan="7" className="table-empty-cell">
                                                    <div className="table-empty-state">
                                                        <RefreshCw size={32} className="animate-spin text-blue" />
                                                        <p>Memuat daftar pesanan...</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : filteredOrders.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="table-empty-cell">
                                                    <div className="table-empty-state">
                                                        <ShoppingBag size={40} color="var(--slate-400)" />
                                                        <h4>Belum Ada Pesanan Masuk</h4>
                                                        <p>
                                                            {orderSearch || orderStatusFilter !== 'all'
                                                                ? 'Tidak ada pesanan yang cocok dengan filter pencarian.'
                                                                : 'Pesanan checkout dari formulir pelanggan akan otomatis masuk dan tercatat di sini.'}
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredOrders.map((ord) => {
                                                let items = [];
                                                try {
                                                    items = typeof ord.itemsJson === 'string' ? JSON.parse(ord.itemsJson) : (ord.itemsJson || []);
                                                } catch {
                                                    items = [];
                                                }

                                                const cleanPhone = (ord.customerPhone || '').replace(/\D/g, '');
                                                const waChatLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Halo ${ord.customerName}, kami dari Apotek Kimia Farma mengonfirmasi pesanan Anda (${ord.orderNumber}). Status saat ini: ${ord.status}.`)}`;

                                                return (
                                                    <tr key={ord.id}>
                                                        {/* Order Number & Date */}
                                                        <td>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                                                <strong style={{ fontSize: '0.85rem', color: 'var(--blue-900)' }}>{ord.orderNumber}</strong>
                                                                <span style={{ fontSize: '0.72rem', color: 'var(--slate-500)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                                    <Clock size={11} /> {formatDate(ord.createdAt)}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* Customer Info */}
                                                        <td>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                                <strong style={{ fontSize: '0.85rem', color: 'var(--slate-900)' }}>{ord.customerName}</strong>
                                                                <a
                                                                    href={waChatLink}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="btn-wa-subtle"
                                                                    style={{
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: '0.3rem',
                                                                        fontSize: '0.74rem',
                                                                        padding: '0.2rem 0.5rem',
                                                                        borderRadius: '4px',
                                                                        textDecoration: 'none',
                                                                        width: 'fit-content'
                                                                    }}
                                                                    title="Hubungi pemesan lewat WhatsApp"
                                                                >
                                                                    <PhoneCall size={12} />
                                                                    <span>{ord.customerPhone}</span>
                                                                </a>
                                                            </div>
                                                        </td>

                                                        {/* Branch & Delivery Address */}
                                                        <td>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                                                <span style={{
                                                                    fontSize: '0.74rem',
                                                                    fontWeight: 700,
                                                                    background: 'var(--blue-50)',
                                                                    color: 'var(--blue-700)',
                                                                    border: '1px solid var(--blue-200)',
                                                                    padding: '0.15rem 0.5rem',
                                                                    borderRadius: '4px',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '0.3rem',
                                                                    width: 'fit-content'
                                                                }}>
                                                                    <MapPin size={11} />
                                                                    <span>{ord.branchName || ord.branchId}</span>
                                                                </span>
                                                                <span style={{ fontSize: '0.78rem', color: 'var(--slate-700)', lineHeight: '1.3' }}>
                                                                    {ord.address}{ord.kelurahan ? `, Kel. ${ord.kelurahan}` : ''}{ord.kecamatan ? `, Kec. ${ord.kecamatan}` : ''}, {ord.city || 'Kota Sukabumi'}
                                                                </span>
                                                                {ord.notes && (
                                                                    <span style={{ fontSize: '0.72rem', color: 'var(--slate-500)', fontStyle: 'italic' }}>
                                                                        Catatan: "{ord.notes}"
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>

                                                        {/* Order Items */}
                                                        <td>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                                {items.map((it, idx) => (
                                                                    <div key={idx} style={{ fontSize: '0.8rem', color: 'var(--slate-800)', display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                                                                        <span><strong>{it.name || 'Produk Farmasi'}</strong></span>
                                                                        <span style={{ color: 'var(--slate-600)', whiteSpace: 'nowrap' }}>x{it.quantity} pcs</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </td>

                                                        {/* Total Price */}
                                                        <td>
                                                            <strong style={{ fontSize: '0.88rem', color: 'var(--orange-600)' }}>
                                                                {formatRupiah(ord.totalPrice)}
                                                            </strong>
                                                        </td>

                                                        {/* Delivery Method */}
                                                        <td>
                                                            <span style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '0.35rem',
                                                                fontSize: '0.74rem',
                                                                fontWeight: 700,
                                                                background: '#f0fdf4',
                                                                color: '#15803d',
                                                                border: '1px solid #bbf7d0',
                                                                padding: '0.2rem 0.55rem',
                                                                borderRadius: '9999px',
                                                                whiteSpace: 'nowrap'
                                                            }}>
                                                                <Truck size={12} />
                                                                <span>Diantar ke Alamat</span>
                                                            </span>
                                                        </td>

                                                        {/* Order Status Select */}
                                                        <td style={{ textAlign: 'center' }}>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'center' }}>
                                                                <select
                                                                    className={`order-status-select status-${ord.status === 'Menunggu Verifikasi'
                                                                        ? 'pending'
                                                                        : ord.status === 'Pesanan Diproses'
                                                                            ? 'processing'
                                                                            : ord.status === 'Sedang Diantar'
                                                                                ? 'shipping'
                                                                                : 'completed'
                                                                        }`}
                                                                    value={ord.status}
                                                                    disabled={updatingOrderId === ord.id}
                                                                    onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                                                                >
                                                                    <option value="Menunggu Verifikasi">⏳ Menunggu Verifikasi</option>
                                                                    <option value="Pesanan Diproses">⚙️ Pesanan Diproses</option>
                                                                    <option value="Sedang Diantar">🚚 Sedang Diantar</option>
                                                                    <option value="Pesanan Selesai">✅ Pesanan Selesai</option>
                                                                </select>
                                                                {updatingOrderId === ord.id && (
                                                                    <span style={{ fontSize: '0.68rem', color: 'var(--blue-600)' }}>Menyimpan...</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ===========================================================
                      MODULE 2: CATEGORY MANAGEMENT
                     =========================================================== */}
                    {activeTab === 'categories' && (
                        <div className="admin-tab-content animate-fade-in">
                            <div className="category-manager-grid">
                                {/* Form Add Category */}
                                <div className="card-box">
                                    <h3 className="box-title">Tambah Kategori Baru</h3>
                                    <p className="box-subtitle">
                                        Kategori tersimpan di tabel SQL <code>categories</code> dan tampil sebagai tombol filter pill di katalog pelanggan.
                                    </p>

                                    {catError && (
                                        <div className="form-alert-error" style={{ marginBottom: '1rem' }}>
                                            <AlertCircle size={16} />
                                            <span>{catError}</span>
                                        </div>
                                    )}

                                    <form onSubmit={handleAddCategory}>
                                        <div className="form-group">
                                            <label className="form-label">Nama Kategori</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="cth: Obat Bebas, Vitamin, Alat Medis..."
                                                value={newCatName}
                                                onChange={(e) => setNewCatName(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                                            <Plus size={16} />
                                            <span>Tambah Kategori ke Database SQL</span>
                                        </button>
                                    </form>
                                </div>

                                {/* List of Categories */}
                                <div className="card-box">
                                    <h3 className="box-title">Daftar Kategori ({categories.length})</h3>
                                    <div className="category-items-list">
                                        {categories.map((cat) => (
                                            <div key={cat.id} className="category-item-row">
                                                {editingCategory?.id === cat.id ? (
                                                    <div className="category-inline-edit">
                                                        <input
                                                            type="text"
                                                            className="form-input"
                                                            value={editCatName}
                                                            onChange={(e) => setEditCatName(e.target.value)}
                                                            autoFocus
                                                        />
                                                        <button
                                                            className="btn btn-primary btn-sm"
                                                            onClick={() => handleSaveEditCategory(cat.id)}
                                                        >
                                                            <Save size={14} />
                                                        </button>
                                                        <button
                                                            className="btn btn-secondary btn-sm"
                                                            onClick={() => setEditingCategory(null)}
                                                        >
                                                            Batal
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="cat-name-info">
                                                            <strong>{cat.name}</strong>
                                                        </div>
                                                        <div className="cat-actions-group">
                                                            <button
                                                                className="btn-icon"
                                                                onClick={() => {
                                                                    setEditingCategory(cat);
                                                                    setEditCatName(cat.name);
                                                                }}
                                                                title="Ubah Nama Kategori"
                                                            >
                                                                <Edit2 size={14} />
                                                            </button>
                                                            <button
                                                                className="btn-icon btn-icon-danger"
                                                                onClick={() => setDeletingCategory(cat)}
                                                                title="Hapus Kategori"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===========================================================
                      MODULE 3: STORE SETTINGS
                     =========================================================== */}
                    {activeTab === 'settings' && (
                        <div className="admin-tab-content animate-fade-in">
                            <div className="card-box" style={{ maxWidth: '640px' }}>
                                <h3 className="box-title">Pengaturan Profil Apotek & WhatsApp</h3>
                                <p className="box-subtitle">
                                    Konfigurasi ini menentukan nomor WhatsApp resmi apoteker yang dihubungi saat pelanggan mengirim order resep atau pesanan.
                                </p>

                                {settingsSuccess && (
                                    <div className="form-alert-success">
                                        <CheckCircle size={16} />
                                        <span>Pengaturan berhasil disimpan ke database SQL!</span>
                                    </div>
                                )}

                                <form onSubmit={handleSaveSettings}>
                                    <div className="form-group">
                                        <label className="form-label">Nama Apotek / Toko</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={settingsForm.storeName}
                                            onChange={(e) => setSettingsForm({ ...settingsForm, storeName: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Tagline Toko</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={settingsForm.tagline}
                                            onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">
                                            <PhoneCall size={15} />
                                            <span>Nomor WhatsApp Tujuan (Gunakan kode negara, cth: 6281234567890)</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="6281234567890"
                                            value={settingsForm.phone}
                                            onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                                            required
                                        />
                                        <small style={{ color: 'var(--slate-500)', marginTop: '0.2rem' }}>
                                            Nomor ini yang akan menerima chat otomatis saat pelanggan mengklik "Kirim Pesanan ke WhatsApp".
                                        </small>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Alamat Toko</label>
                                        <textarea
                                            rows="2"
                                            className="form-textarea"
                                            value={settingsForm.address}
                                            onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                                        />
                                    </div>

                                    <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                                        <Save size={16} />
                                        <span>Simpan Pengaturan ke SQL</span>
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* ===========================================================
                      MODULE 4: ADMIN PROFILE & SECURITY
                     =========================================================== */}
                    {activeTab === 'profile' && (
                        <div className="admin-tab-content animate-fade-in">
                            <div className="card-box" style={{ maxWidth: '640px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '10px',
                                        background: 'var(--blue-50)',
                                        color: 'var(--blue-600)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <User size={22} />
                                    </div>
                                    <div>
                                        <h3 className="box-title" style={{ margin: 0 }}>Profil & Keamanan Akun Admin</h3>
                                        <p className="box-subtitle" style={{ margin: 0 }}>
                                            Ubah nama pengguna admin, alamat email login, dan password akun.
                                        </p>
                                    </div>
                                </div>

                                {profileSuccessMsg && (
                                    <div className="form-alert-success" style={{ marginTop: '1rem', marginBottom: '1.25rem' }}>
                                        <CheckCircle2 size={16} />
                                        <span>{profileSuccessMsg}</span>
                                    </div>
                                )}

                                {profileErrorMsg && (
                                    <div className="form-alert-error" style={{ marginTop: '1rem', marginBottom: '1.25rem' }}>
                                        <AlertCircle size={16} />
                                        <span>{profileErrorMsg}</span>
                                    </div>
                                )}

                                <form onSubmit={handleSaveProfile} style={{ marginTop: '1.25rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">
                                            <User size={15} />
                                            <span>Nama Pengguna Admin *</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={profileForm.name}
                                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                            placeholder="cth: Kimia Farma / Administrator"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">
                                            <Mail size={15} />
                                            <span>Email Login Admin *</span>
                                        </label>
                                        <input
                                            type="email"
                                            className="form-input"
                                            value={profileForm.email}
                                            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                            placeholder="cth: admin@katalogwa.com"
                                            required
                                        />
                                    </div>

                                    <div style={{
                                        margin: '1.5rem 0 1rem',
                                        padding: '1.25rem',
                                        background: '#f8fafc',
                                        borderRadius: 'var(--radius-lg)',
                                        border: '1px solid var(--slate-200)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                            <KeyRound size={17} color="var(--blue-600)" />
                                            <strong style={{ fontSize: '0.9rem', color: 'var(--slate-800)' }}>
                                                Ubah Password Admin
                                            </strong>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginLeft: 'auto' }}>
                                                (Kosongkan jika tidak ingin ganti)
                                            </span>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Password Saat Ini</label>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    type={showCurrentPassword ? 'text' : 'password'}
                                                    className="form-input"
                                                    placeholder="Ketik password lama Anda saat ini"
                                                    value={profileForm.currentPassword}
                                                    onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
                                                    style={{ paddingRight: '2.5rem' }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                    style={{
                                                        position: 'absolute',
                                                        right: '0.75rem',
                                                        top: '50%',
                                                        transform: 'translateY(-50%)',
                                                        background: 'transparent',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        color: 'var(--slate-400)'
                                                    }}
                                                >
                                                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Password Baru (Minimal 6 karakter)</label>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    type={showNewPassword ? 'text' : 'password'}
                                                    className="form-input"
                                                    placeholder="Minimal 6 karakter"
                                                    value={profileForm.newPassword}
                                                    onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                                                    style={{ paddingRight: '2.5rem' }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                    style={{
                                                        position: 'absolute',
                                                        right: '0.75rem',
                                                        top: '50%',
                                                        transform: 'translateY(-50%)',
                                                        background: 'transparent',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        color: 'var(--slate-400)'
                                                    }}
                                                >
                                                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label className="form-label">Ulangi Password Baru</label>
                                            <input
                                                type={showNewPassword ? 'text' : 'password'}
                                                className="form-input"
                                                placeholder="Ketik ulang password baru Anda"
                                                value={profileForm.confirmNewPassword}
                                                onChange={(e) => setProfileForm({ ...profileForm, confirmNewPassword: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={isSavingProfile}
                                        style={{ marginTop: '0.5rem' }}
                                    >
                                        <Save size={16} />
                                        <span>{isSavingProfile ? 'Menyimpan Profil...' : 'Simpan Perubahan Profil'}</span>
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Product Form Modal (Add / Edit) */}
            <ProductFormModal
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                onSave={handleSaveProduct}
                editingProduct={editingProduct}
                categories={categories}
            />

            {/* Confirm Delete Product Modal */}
            <ConfirmModal
                isOpen={!!deletingProduct}
                title="Hapus Produk Ini?"
                message={`Apakah Anda yakin ingin menghapus "${deletingProduct?.name}" dari database SQL? Tindakan ini tidak dapat dibatalkan.`}
                onConfirm={handleConfirmDeleteProduct}
                onCancel={() => setDeletingProduct(null)}
                confirmText="Hapus Produk"
            />

            {/* Confirm Delete Category Modal */}
            <ConfirmModal
                isOpen={!!deletingCategory}
                title="Hapus Kategori Ini?"
                message={`Apakah Anda yakin ingin menghapus kategori "${deletingCategory?.name}" dari database SQL?`}
                onConfirm={handleConfirmDeleteCategory}
                onCancel={() => setDeletingCategory(null)}
                confirmText="Hapus Kategori"
            />
        </div>
    );
};
