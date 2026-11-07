import React, { useState, useEffect, useMemo } from "react";
import {
  fetchProducts,
  fetchCategories,
  fetchStoreSettings,
  fetchAdminProfile,
  clearAuthToken,
  getAuthToken
} from './services/api';
import { Header } from './components/Header';
import { CategoryPills } from './components/CategoryPills';
import { SearchBar } from './components/SearchBar';
import { ProductCard } from './components/ProductCard';
import { OrderModal } from './components/OrderModal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminDashboard } from './components/AdminDashboard';
import { BranchLocationSection, SUKABUMI_BRANCHES } from './components/BranchLocationSection';
import {
  MessageCircle,
  MapPin,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  HeartPulse,
  FileText,
  Clock,
  Sparkles,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  PhoneCall,
  Search,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export function App() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [storeSettings, setStoreSettings] = useState(null);
  const [activeCategoryId, setActiveCategoryId] = useState('');
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('all'); // 'all' | 'available' | 'out'
  const [sortBy, setSortBy] = useState('default'); // 'default' | 'price-asc' | 'price-desc' | 'name-asc'
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Modals
  const [selectedProductForOrder, setSelectedProductForOrder] = useState(null);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState(null);
  const [selectedProcessingBranch, setSelectedProcessingBranch] = useState(SUKABUMI_BRANCHES[0]);

  // Admin authentication & views
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Popular search keywords for quick filtering
  const quickSearchTags = [
    'Paracetamol',
    'Vitamin C',
    'Termometer',
    'Minyak Kayu Putih',
    'Antasida',
    'Plester'
  ];

  // Load all initial data from Node.js backend
  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const [prodRes, catRes, storeRes] = await Promise.all([
        fetchProducts(),
        fetchCategories(),
        fetchStoreSettings()
      ]);

      if (prodRes?.data) setProducts(prodRes.data);
      if (catRes?.data) setCategories(catRes.data);
      if (storeRes?.data) setStoreSettings(storeRes.data);
    } catch (err) {
      console.error('Gagal mengambil data katalog:', err);
      setErrorMessage(err.message || 'Gagal memuat data dari server. Pastikan backend sudah berjalan.');
    } finally {
      setIsLoading(false);
    }
  };

  // Restore authenticated session on mount if token exists
  useEffect(() => {
    loadData();

    const token = getAuthToken();
    if (token) {
      fetchAdminProfile()
        .then((res) => {
          if (res?.user) setAdminUser(res.user);
        })
        .catch(() => {
          clearAuthToken();
          setAdminUser(null);
        });
    }
  }, []);

  // Handle Logout
  const handleLogout = () => {
    clearAuthToken();
    setAdminUser(null);
    setIsAdminView(false);
  };

  // Filter & Sort products for Customer Catalog View
  const processedProducts = useMemo(() => {
    let result = products.filter((p) => {
      // Category filter
      const matchesCat = !activeCategoryId || p.categoryId === activeCategoryId;

      // Search keyword filter
      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        (p.name && p.name.toLowerCase().includes(query)) ||
        (p.description && p.description.toLowerCase().includes(query)) ||
        (p.categoryName && p.categoryName.toLowerCase().includes(query));

      // Stock status filter
      let matchesStock = true;
      if (stockFilter === 'available') {
        matchesStock = p.stockStatus === 'Tersedia';
      } else if (stockFilter === 'out') {
        matchesStock = p.stockStatus !== 'Tersedia';
      }

      return matchesCat && matchesSearch && matchesStock;
    });

    // Sorting
    if (sortBy === 'price-asc') {
      result.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (sortBy === 'name-asc') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    return result;
  }, [products, activeCategoryId, search, stockFilter, sortBy]);

  // Reset page to 1 when filters or sorting change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeCategoryId, stockFilter, sortBy]);

  // Pagination calculation (10 data per halaman)
  const totalPages = Math.ceil(processedProducts.length / ITEMS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);

  const paginatedProducts = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return processedProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [processedProducts, safeCurrentPage]);

  // Clean phone number for WhatsApp links
  const rawPhone = storeSettings?.phone || '6281234567890';
  const cleanPhone = rawPhone.replace(/\D/g, '');
  const prescriptionWALink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    'Halo Apoteker Kimia Farma, saya ingin mengirimkan foto resep dokter untuk ditebus. Mohon dibantu pengecekan obat dan total biayanya.'
  )}`;

  return (
    <div className="app-layout">
      {/* Main Content Area */}
      {isAdminView && adminUser ? (
        /* FLOW 2: ADMIN BACK-OFFICE WITH DEDICATED SIDEBAR */
        <AdminDashboard
          products={products}
          categories={categories}
          storeSettings={storeSettings}
          adminUser={adminUser}
          onRefreshData={loadData}
          onUpdateAdminUser={(user) => setAdminUser(user)}
          onBackToCatalog={() => setIsAdminView(false)}
          onLogout={handleLogout}
        />
      ) : (
        /* FLOW 1: CUSTOMER CATALOG & WHATSAPP ORDERING */
        <>
          {/* Top Header Navigation for Public Customers */}
          <Header
            storeSettings={storeSettings}
            isAdminView={isAdminView}
            setIsAdminView={setIsAdminView}
            adminUser={adminUser}
            onOpenLogin={() => setIsAdminLoginOpen(true)}
            onLogout={handleLogout}
          />

          <main className="customer-catalog-view animate-fade-in">
            {/* HERO SECTION: Minimalist Healthcare & Pharmacy Focus */}
            <section className="hero-section">
              <div className="container hero-container">
                <div className="hero-content">
                  <div className="hero-badge">
                    <ShieldCheck size={16} />
                    <span>Apotek Terpercaya BUMN • 100% Produk Original BPOM</span>
                  </div>

                  <h1 className="hero-headline">
                    Solusi Kebutuhan Obat & Vitamin Terpercaya
                  </h1>

                  <p className="hero-subtext">
                    Dapatkan produk farmasi berkualitas dengan mudah, higienis, dan bergaransi resmi. Konsultasi langsung dengan apoteker kami tanpa antre via WhatsApp.
                  </p>

                  {/* Trust Highlights inside Hero */}
                  <div className="hero-trust-row">
                    <div className="hero-trust-item">
                      <CheckCircle2 size={16} className="text-orange" />
                      <span>Resep & Non-Resep</span>
                    </div>
                    <div className="hero-trust-item">
                      <CheckCircle2 size={16} className="text-orange" />
                      <span>Gratis Konsultasi Apoteker</span>
                    </div>
                    <div className="hero-trust-item">
                      <CheckCircle2 size={16} className="text-orange" />
                      <span>Pesan Cepat Tanpa Akun</span>
                    </div>
                  </div>

                  {/* Search Bar in Hero */}
                  <div className="hero-search-box">
                    <SearchBar
                      search={search}
                      setSearch={setSearch}
                      placeholder="Cari obat, vitamin, atau alat kesehatan (cth: Paracetamol, Vitamin C, Termometer)..."
                    />

                    {/* Quick Search Tag Pills */}
                    <div className="quick-tags-container">
                      <span className="quick-tags-label">Pencarian Populer:</span>
                      <div className="quick-tags-list">
                        {quickSearchTags.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            className={`quick-tag-pill ${search === tag ? 'active' : ''}`}
                            onClick={() => setSearch(search === tag ? '' : tag)}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* TRUST PILLARS BAR */}
            <section className="trust-pillars-section">
              <div className="container">
                <div className="trust-pillars-grid">
                  <div className="trust-pillar-card">
                    <div className="trust-icon-box bg-blue-subtle text-blue">
                      <ShieldCheck size={24} />
                    </div>
                    <div>
                      <h4 className="trust-title">100% Asli & Izin BPOM</h4>
                      <p className="trust-desc">Semua obat bersumber dari distributor resmi dengan standar mutu farmasi terjamin.</p>
                    </div>
                  </div>

                  <div className="trust-pillar-card">
                    <div className="trust-icon-box bg-orange-subtle text-orange">
                      <HeartPulse size={24} />
                    </div>
                    <div>
                      <h4 className="trust-title">Konsultasi Apoteker</h4>
                      <p className="trust-desc">Tanyakan indikasi, dosis, atau interaksi obat langsung ke apoteker via WhatsApp.</p>
                    </div>
                  </div>

                  <div className="trust-pillar-card">
                    <div className="trust-icon-box bg-blue-subtle text-blue">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h4 className="trust-title">Layanan Resep Dokter</h4>
                      <p className="trust-desc">Kirim foto resep dokter Anda, kami siapkan obat dengan teliti dan higienis.</p>
                    </div>
                  </div>

                  <div className="trust-pillar-card">
                    <div className="trust-icon-box bg-orange-subtle text-orange">
                      <MessageCircle size={24} />
                    </div>
                    <div>
                      <h4 className="trust-title">Pesan Cepat via WhatsApp</h4>
                      <p className="trust-desc">Pemesanan instan tanpa perlu repot membuat akun atau install aplikasi baru.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* CATALOG SECTION */}
            <section className="catalog-section" id="katalog">
              <div className="container">
                {/* Section Header */}
                <div className="catalog-header-wrap">
                  <div>
                    <h2 className="catalog-section-title">Katalog Produk Obat & Alkes</h2>
                    <p className="catalog-section-sub">Pilih kategori atau gunakan pencarian untuk menemukan produk yang Anda butuhkan</p>
                  </div>
                </div>

                {/* Category Filter Pills */}
                <CategoryPills
                  categories={categories}
                  activeCategoryId={activeCategoryId}
                  onSelectCategory={setActiveCategoryId}
                  totalProductCount={products.length}
                  totalProductsCount={products.length}
                />

                {/* Sorting and Filter Toolbar */}
                <div className="catalog-toolbar">
                  <div className="catalog-count-badge">
                    <span>
                      Menampilkan{' '}
                      {processedProducts.length > 0 ? (
                        <>
                          <strong>{(safeCurrentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(safeCurrentPage * ITEMS_PER_PAGE, processedProducts.length)}</strong> dari <strong>{processedProducts.length}</strong>
                        </>
                      ) : (
                        <strong>0</strong>
                      )}{' '}
                      produk
                      {totalPages > 1 && (
                        <span className="catalog-page-indicator">
                          (Hal. {safeCurrentPage}/{totalPages})
                        </span>
                      )}
                    </span>
                    {(search || activeCategoryId || stockFilter !== 'all') && (
                      <button
                        className="btn-link-reset"
                        onClick={() => {
                          setSearch('');
                          setActiveCategoryId('');
                          setStockFilter('all');
                          setSortBy('default');
                        }}
                      >
                        Reset Filter
                      </button>
                    )}
                  </div>

                  <div className="catalog-filters-group">
                    {/* Stock Filter Pills */}
                    <div className="filter-pill-group">
                      <span className="filter-label"><Filter size={13} /> Stok:</span>
                      <button
                        className={`filter-btn ${stockFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setStockFilter('all')}
                      >
                        Semua
                      </button>
                      <button
                        className={`filter-btn ${stockFilter === 'available' ? 'active' : ''}`}
                        onClick={() => setStockFilter('available')}
                      >
                        Tersedia
                      </button>
                      <button
                        className={`filter-btn ${stockFilter === 'out' ? 'active' : ''}`}
                        onClick={() => setStockFilter('out')}
                      >
                        Habis
                      </button>
                    </div>

                    {/* Sorting Select */}
                    <div className="sort-select-wrapper">
                      <ArrowUpDown size={14} className="sort-icon" />
                      <select
                        className="sort-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        aria-label="Urutkan Produk"
                      >
                        <option value="default">Urutan Default</option>
                        <option value="price-asc">Harga Terendah</option>
                        <option value="price-desc">Harga Tertinggi</option>
                        <option value="name-asc">Nama (A - Z)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Error Notice */}
                {errorMessage && (
                  <div className="alert-box alert-error">
                    <div className="alert-content">
                      <AlertCircle size={20} />
                      <span>{errorMessage}</span>
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={loadData}
                      style={{ background: '#ffffff' }}
                    >
                      <RefreshCw size={14} />
                      <span>Coba Lagi</span>
                    </button>
                  </div>
                )}

                {/* Loading Skeleton */}
                {isLoading ? (
                  <div className="catalog-loading-state">
                    <RefreshCw size={36} className="animate-spin text-blue" />
                    <p>Memuat katalog produk farmasi...</p>
                  </div>
                ) : processedProducts.length > 0 ? (
                  <>
                    {/* Product Grid */}
                    <div className="catalog-grid animate-fade-in">
                      {paginatedProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onSelectProduct={setSelectedProductForOrder}
                          onViewDetail={setSelectedProductForDetail}
                        />
                      ))}
                    </div>

                    {/* Catalog Pagination Controls (10 Produk Per Halaman) */}
                    {totalPages > 1 && (
                      <nav className="catalog-pagination-wrap animate-fade-in" aria-label="Navigasi Halaman Katalog">
                        <button
                          type="button"
                          className="pagination-btn pagination-nav-btn"
                          disabled={safeCurrentPage === 1}
                          onClick={() => {
                            setCurrentPage((prev) => Math.max(prev - 1, 1));
                            document.getElementById('katalog')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          aria-label="Halaman Sebelumnya"
                        >
                          <ChevronLeft size={16} />
                          <span>Sebelumnya</span>
                        </button>

                        <div className="pagination-numbers">
                          {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                            <button
                              key={pageNum}
                              type="button"
                              className={`pagination-btn pagination-num-btn ${safeCurrentPage === pageNum ? 'active' : ''}`}
                              onClick={() => {
                                setCurrentPage(pageNum);
                                document.getElementById('katalog')?.scrollIntoView({ behavior: 'smooth' });
                              }}
                              aria-current={safeCurrentPage === pageNum ? 'page' : undefined}
                            >
                              {pageNum}
                            </button>
                          ))}
                        </div>

                        <button
                          type="button"
                          className="pagination-btn pagination-nav-btn"
                          disabled={safeCurrentPage === totalPages}
                          onClick={() => {
                            setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                            document.getElementById('katalog')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          aria-label="Halaman Berikutnya"
                        >
                          <span>Berikutnya</span>
                          <ChevronRight size={16} />
                        </button>
                      </nav>
                    )}
                  </>
                ) : (
                  /* Empty Search / Filter State */
                  <div className="catalog-empty-state animate-fade-in">
                    <div className="empty-icon-wrap">
                      <Search size={36} color="var(--blue-400)" />
                    </div>
                    <h3 className="catalog-empty-title">Produk Obat Tidak Ditemukan</h3>
                    <p className="catalog-empty-desc">
                      {search
                        ? `Tidak ada produk farmasi yang sesuai dengan "${search}". Coba periksa ejaan atau cari dengan nama generik.`
                        : 'Belum ada produk yang tersedia pada filter kategori ini.'}
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.25rem' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          setSearch('');
                          setActiveCategoryId('');
                          setStockFilter('all');
                        }}
                      >
                        Tampilkan Semua Produk
                      </button>
                      <a
                        href={prescriptionWALink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-wa-subtle btn-sm"
                      >
                        <MessageCircle size={15} />
                        <span>Tanya Apoteker di WA</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* DOCTOR PRESCRIPTION CALLOUT BANNER */}
            <section className="prescription-banner-section">
              <div className="container">
                <div className="prescription-banner-card">
                  <div className="prescription-banner-content">
                    <div className="prescription-badge">
                      <Sparkles size={14} />
                      <span>Layanan Tebus Resep Cepat</span>
                    </div>
                    <h3 className="prescription-title">
                      Punya Resep Dokter yang Ingin Ditebus?
                    </h3>
                    <p className="prescription-desc">
                      Foto lembar resep dokter Anda dan kirimkan via WhatsApp. Apoteker Kimia Farma akan memeriksa ketersediaan sediaan, menghitung dosis dan harga, serta mengantarkannya langsung ke alamat Anda setelah verifikasi selesai.
                    </p>
                    <div className="prescription-steps-row">
                      <div className="p-step">
                        <span className="p-step-num">1</span>
                        <div className="p-step-text-wrap">
                          <strong className="p-step-main">Foto Resep</strong>
                          <span className="p-step-sub">Kamera HP jelas</span>
                        </div>
                      </div>
                      <div className="p-step-arrow">→</div>
                      <div className="p-step">
                        <span className="p-step-num">2</span>
                        <div className="p-step-text-wrap">
                          <strong className="p-step-main">Kirim via WA</strong>
                          <span className="p-step-sub">Chat langsung apotek</span>
                        </div>
                      </div>
                      <div className="p-step-arrow">→</div>
                      <div className="p-step">
                        <span className="p-step-num">3</span>
                        <div className="p-step-text-wrap">
                          <strong className="p-step-main">Apoteker Verifikasi</strong>
                          <span className="p-step-sub">Cek dosis & ketersediaan</span>
                        </div>
                      </div>
                      <div className="p-step-arrow">→</div>
                      <div className="p-step p-step-highlight">
                        <span className="p-step-num">4</span>
                        <div className="p-step-text-wrap">
                          <strong className="p-step-main">Obat Diantar ke Rumah</strong>
                          <span className="p-step-sub">Pengiriman aman langsung ke alamat</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="prescription-banner-action">
                    <a
                      href={prescriptionWALink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-prescription-wa"
                    >
                      <MessageCircle size={18} />
                      <span>Kirim Foto Resep via WA</span>
                    </a>
                    <span className="prescription-sub-action">
                      Apoteker siaga siap melayani setiap hari
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION: LOKASI & CABANG KIMIA FARMA (Sebelum Footer) */}
            <BranchLocationSection
              storeSettings={storeSettings}
              selectedProcessingBranch={selectedProcessingBranch}
              onSelectProcessingBranch={setSelectedProcessingBranch}
            />

            {/* Customer Order Details Form Modal */}
            {selectedProductForOrder && (
              <OrderModal
                product={selectedProductForOrder}
                storeSettings={storeSettings}
                selectedProcessingBranch={selectedProcessingBranch}
                onClose={() => setSelectedProductForOrder(null)}
                onOrderSuccess={() => {
                  loadData();
                  setSelectedProductForOrder(null);
                }}
              />
            )}

            {/* Product Detail Modal */}
            {selectedProductForDetail && (
              <ProductDetailModal
                product={selectedProductForDetail}
                storeSettings={storeSettings}
                onClose={() => setSelectedProductForDetail(null)}
                onOrder={(product) => {
                  setSelectedProductForDetail(null);
                  setSelectedProductForOrder(product);
                }}
              />
            )}

            {/* Public Modern Pharmacy Footer */}
            <footer className="site-footer">
              <div className="container footer-container">
                <div className="footer-col footer-col-brand">
                  <div className="footer-brand-title">
                    <span className="text-blue">Kimia Farma</span>
                    <span className="footer-tag">Apotek Resmi</span>
                  </div>
                  <p className="footer-brand-desc">
                    {storeSettings?.tagline || 'Layanan apotek terpercaya dengan standar farmasi BUMN. Menyediakan obat resmi berizin BPOM, suplemen, serta alat kesehatan terlengkap.'}
                  </p>
                  <div className="footer-cert-badges">
                    <span className="footer-cert-pill"><ShieldCheck size={12} /> BPOM RI</span>
                    <span className="footer-cert-pill"><HeartPulse size={12} /> Kemenkes RI</span>
                    <span className="footer-cert-pill"><Clock size={12} /> Buka Setiap Hari</span>
                  </div>
                </div>

                <div className="footer-col">
                  <h4 className="footer-col-title">Jam Layanan Apotek</h4>
                  <ul className="footer-info-list">
                    <li><strong>Senin - Minggu:</strong> 07:00 - 22:00 WIB</li>
                    <li><strong>Layanan WhatsApp:</strong> 24 Jam Online Respon Cepat</li>
                    <li><strong>Penebusan Resep:</strong> Setiap Hari Kerja & Libur</li>
                  </ul>
                </div>

                <div className="footer-col">
                  <h4 className="footer-col-title">Informasi & Kontak</h4>
                  <ul className="footer-info-list">
                    <li className="footer-address">
                      <MapPin size={16} className="text-orange" />
                      <span>{storeSettings?.address || 'Jl. Melati No.22, Kebayoran Baru, Jakarta Selatan'}</span>
                    </li>
                    <li className="footer-phone">
                      <PhoneCall size={16} className="text-blue" />
                      <span>CS WhatsApp: <strong>{storeSettings?.phone || '0812-3456-7890'}</strong></span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="footer-bottom-bar">
                <div className="container footer-bottom-inner">
                  <p>© {new Date().getFullYear()} {storeSettings?.storeName || 'Apotek Kimia Farma'}. Hak Cipta Dilindungi Undang-Undang.</p>
                  <p className="footer-disclaimer">Konsultasikan penggunaan obat keras dengan resep dokter atau petunjuk apoteker.</p>
                </div>
              </div>
            </footer>
          </main>
        </>
      )}

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={(user) => {
          setAdminUser(user);
          setIsAdminView(true);
        }}
      />
    </div>
  );
}

export default App;
