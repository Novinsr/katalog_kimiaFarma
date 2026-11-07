import React, { useState, useMemo } from 'react';
import {
    MapPin,
    Search,
    ExternalLink,
    Clock,
    Phone,
    Truck,
    Gift,
    ShieldAlert,
    Navigation,
    Info,
    CheckCircle2,
    Check
} from 'lucide-react';

// Data cabang Kimia Farma HANYA di KOTA SUKABUMI sesuai spesifikasi
export const SUKABUMI_BRANCHES = [
    {
        id: 'KF 0221',
        code: 'KF 0221',
        name: 'Kimia Farma 0221 Sudirman',
        address: 'Jl. Jend. Sudirman No. 81B, Kel. Benteng, Kec. Warudoyong, Kota Sukabumi, Jawa Barat',
        area: 'Warudoyong / Benteng',
        city: 'Kota Sukabumi',
        hours: 'Buka Setiap Hari (07:00 - 22:00 WIB)',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Jl.+Jend.+Sudirman+No.+81B+Kel.+Benteng+Kec.+Warudoyong+Kota+Sukabumi+Jawa+Barat',
        mapEmbedQuery: 'Jl. Jend. Sudirman No. 81B, Kel. Benteng, Kec. Warudoyong, Kota Sukabumi'
    },
    {
        id: 'KF 1055 Cipoho',
        code: 'KF 1055 Cipoho',
        name: 'Kimia Farma 1055 Cipoho',
        address: 'Jl. Pelabuhan II No. 21, Kel. Cikondang, Kec. Citamiang, Kota Sukabumi, Jawa Barat',
        area: 'Citamiang / Cikondang',
        city: 'Kota Sukabumi',
        hours: 'Buka Setiap Hari (08:00 - 22:00 WIB)',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Jl.+Pelabuhan+II+No.+21+Kel.+Cikondang+Kec.+Citamiang+Kota+Sukabumi+Jawa+Barat',
        mapEmbedQuery: 'Jl. Pelabuhan II No. 21, Kel. Cikondang, Kec. Citamiang, Kota Sukabumi'
    },
    {
        id: 'KF 0008',
        code: 'KF 0008',
        name: 'Kimia Farma 0008 Veteran',
        address: 'Jl. Veteran II No. 2, Kel. Selabatu, Kec. Cikole, Kota Sukabumi, Jawa Barat',
        area: 'Cikole / Selabatu',
        city: 'Kota Sukabumi',
        hours: 'Buka Setiap Hari (07:30 - 22:00 WIB)',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Jl.+Veteran+II+No.+2+Kel.+Selabatu+Kec.+Cikole+Kota+Sukabumi+Jawa+Barat',
        mapEmbedQuery: 'Jl. Veteran II No. 2, Kel. Selabatu, Kec. Cikole, Kota Sukabumi'
    },
    {
        id: 'KF 0686 Pangleseran',
        code: 'KF 0686 Pangleseran',
        name: 'Kimia Farma 0686 Siliwangi',
        address: 'Jl. Siliwangi No. 92, Kel. Selabatu, Kec. Cikole, Kota Sukabumi, Jawa Barat',
        area: 'Cikole / Siliwangi',
        city: 'Kota Sukabumi',
        hours: 'Buka Setiap Hari (08:00 - 22:00 WIB)',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Jl.+Siliwangi+No.+92+Kel.+Selabatu+Kec.+Cikole+Kota+Sukabumi+Jawa+Barat',
        mapEmbedQuery: 'Jl. Siliwangi No. 92, Kel. Selabatu, Kec. Cikole, Kota Sukabumi'
    }
];

export const BranchLocationSection = ({ storeSettings, selectedProcessingBranch, onSelectProcessingBranch }) => {
    const [searchBranch, setSearchBranch] = useState('');
    const [activeBranchId, setActiveBranchId] = useState(selectedProcessingBranch?.id || SUKABUMI_BRANCHES[0].id);

    // Filter daftar cabang berdasarkan search bar pencarian
    const filteredBranches = useMemo(() => {
        let list = SUKABUMI_BRANCHES;
        const q = searchBranch.trim().toLowerCase();
        if (q) {
            list = list.filter(
                (b) =>
                    b.name.toLowerCase().includes(q) ||
                    b.code.toLowerCase().includes(q) ||
                    b.address.toLowerCase().includes(q) ||
                    b.area.toLowerCase().includes(q)
            );
        }
        return list;
    }, [searchBranch]);

    // Cabang yang sedang dilihat detail petanya
    const activeBranch = useMemo(() => {
        return (
            SUKABUMI_BRANCHES.find((b) => b.id === activeBranchId) ||
            filteredBranches[0] ||
            SUKABUMI_BRANCHES[0]
        );
    }, [activeBranchId, filteredBranches]);

    // Google Maps Embed URL
    const mapEmbedSrc = useMemo(() => {
        const query = encodeURIComponent(`Kimia Farma ${activeBranch?.mapEmbedQuery || 'Kota Sukabumi'}`);
        return `https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    }, [activeBranch]);

    const handlePickBranchAsProcessor = (branch) => {
        if (onSelectProcessingBranch) {
            onSelectProcessingBranch(branch);
        }
    };

    return (
        <section className="branch-location-section" id="lokasi-cabang">
            <div className="container">

                {/* Section Header */}
                <div className="branch-section-header">
                    <div className="branch-pill-badge">
                        <MapPin size={14} />
                        <span>Khusus Wilayah Kota Sukabumi</span>
                    </div>
                    <h2 className="branch-section-title">
                        Lokasi & Cabang <span className="text-blue">Kimia Farma</span>
                    </h2>
                    <p className="branch-section-desc">
                        Pilih cabang Kimia Farma terdekat di <strong>Kota Sukabumi</strong> sebagai <strong>cabang pemrosesan pesanan</strong> Anda. Seluruh obat akan disiapkan secara higienis dan <strong>diantar langsung ke alamat rumah Anda</strong>.
                    </p>
                    <div className="branch-prototype-notice">
                        <Info size={14} />
                        <span>Data Prototype: Cabang resmi melayani pemrosesan dan pengantaran area Kota Sukabumi. Tidak melayani ambil di tempat / pickup.</span>
                    </div>
                </div>

                {/* Delivery Information Cards (Diantar ke Rumah & Gratis Ongkir) */}
                <div className="delivery-services-grid">
                    <div className="delivery-service-card">
                        <div className="delivery-icon-box delivery-icon-truck">
                            <Truck size={24} />
                        </div>
                        <div className="delivery-content">
                            <div className="delivery-card-title-row">
                                <h3 className="delivery-title">🚚 Diantar ke Rumah</h3>
                                <span className="delivery-badge-pill">Standar Farmasi</span>
                            </div>
                            <p className="delivery-desc">
                                Pesanan akan dikirim langsung ke alamat pelanggan. Apoteker kami mengemas obat dengan aman dan higienis sampai ke pintu rumah Anda.
                            </p>
                        </div>
                    </div>

                    <div className="delivery-service-card">
                        <div className="delivery-icon-box delivery-icon-gift">
                            <Gift size={24} />
                        </div>
                        <div className="delivery-content">
                            <div className="delivery-card-title-row">
                                <h3 className="delivery-title">🎁 Gratis Ongkir*</h3>
                                <span className="delivery-badge-pill delivery-badge-orange">Promo Pengiriman</span>
                            </div>
                            <p className="delivery-desc">
                                Gratis ongkir untuk area tertentu di sekitar jangkauan cabang Kimia Farma Kota Sukabumi.
                            </p>
                            <span className="delivery-tnc">
                                *Syarat dan ketentuan berlaku berdasarkan jarak pengantaran dan minimum transaksi.
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main 2-Column Layout */}
                <div className="branch-two-col-layout">

                    {/* Left Column: Interactive Map */}
                    <div className="branch-map-col">
                        <div className="branch-map-card">
                            <div className="branch-map-card-header">
                                <div className="map-header-info">
                                    <span className="map-header-label">Cabang Sedang Dilihat</span>
                                    <strong className="map-header-name">{activeBranch.name}</strong>
                                    <p className="map-header-address">{activeBranch.address}</p>
                                </div>
                                <a
                                    href={activeBranch.mapsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-open-maps"
                                    title="Buka rute di Google Maps (tab baru)"
                                >
                                    <MapPin size={14} />
                                    <span>📍 Lihat di Google Maps</span>
                                    <ExternalLink size={13} />
                                </a>
                            </div>

                            <div className="branch-map-iframe-container">
                                <iframe
                                    title={`Peta Lokasi ${activeBranch.name}`}
                                    src={mapEmbedSrc}
                                    className="branch-map-iframe"
                                    loading="lazy"
                                    allowFullScreen
                                />
                            </div>

                            <div className="branch-map-footer">
                                <div className="branch-status-indicator">
                                    <span className="branch-live-dot"></span>
                                    <span>{activeBranch.hours}</span>
                                </div>
                                <div className="branch-processing-status">
                                    {selectedProcessingBranch?.id === activeBranch.id ? (
                                        <span className="active-processor-tag">
                                            <CheckCircle2 size={13} /> Terpilih Sebagai Cabang Pemrosesan
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            className="btn-set-processor"
                                            onClick={() => handlePickBranchAsProcessor(activeBranch)}
                                        >
                                            Pilih Sebagai Cabang Pemrosesan
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Search, Filter & Sukabumi Branches List */}
                    <div className="branch-list-col">
                        <div className="branch-directory-card">

                            {/* Search Bar & Title */}
                            <div className="branch-search-header">
                                <div className="branch-search-title-row">
                                    <h3 className="branch-dir-title">Cabang Pemrosesan Kota Sukabumi</h3>
                                    <span className="branch-count-badge">
                                        {filteredBranches.length} Cabang
                                    </span>
                                </div>

                                {/* Search Bar Input */}
                                <div className="branch-search-input-wrap">
                                    <Search size={16} className="branch-search-icon" />
                                    <input
                                        type="text"
                                        className="branch-search-input"
                                        placeholder="🔍 Cari cabang atau lokasi di Sukabumi..."
                                        value={searchBranch}
                                        onChange={(e) => setSearchBranch(e.target.value)}
                                    />
                                    {searchBranch && (
                                        <button
                                            type="button"
                                            className="branch-search-clear"
                                            onClick={() => setSearchBranch('')}
                                            title="Hapus pencarian"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Scrollable Branch Cards */}
                            <div className="branch-cards-scroll">
                                {filteredBranches.length > 0 ? (
                                    filteredBranches.map((branch) => {
                                        const isInspecting = branch.id === activeBranch.id;
                                        const isChosenProcessor = selectedProcessingBranch?.id === branch.id;

                                        return (
                                            <div
                                                key={branch.id}
                                                className={`branch-item-card ${isChosenProcessor ? 'processor-selected' : isInspecting ? 'active' : ''}`}
                                                onClick={() => setActiveBranchId(branch.id)}
                                            >
                                                <div className="branch-item-header">
                                                    <div className="branch-title-group">
                                                        <div className="branch-tags-wrap">
                                                            <span className="branch-code-badge">{branch.code}</span>
                                                            <span className="branch-prototype-tag">Data Prototype</span>
                                                        </div>
                                                        <h4 className="branch-item-name">{branch.name}</h4>
                                                    </div>

                                                    {isChosenProcessor && (
                                                        <span className="branch-selected-pill" title="Cabang pemrosesan pesanan aktif">
                                                            <CheckCircle2 size={13} />
                                                            <span>Cabang Pemrosesan</span>
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="branch-item-details">
                                                    <p className="branch-address-row">
                                                        <MapPin size={14} className="text-orange branch-pin" />
                                                        <span>{branch.address}</span>
                                                    </p>
                                                    <p className="branch-hours-row">
                                                        <Clock size={13} className="text-blue branch-clock" />
                                                        <span>{branch.hours}</span>
                                                    </p>
                                                    <p className="branch-delivery-notice-row">
                                                        <Truck size={13} className="text-emerald" />
                                                        <span>Pesanan dari cabang ini <strong>Diantar ke Alamat</strong> pelanggan</span>
                                                    </p>
                                                </div>

                                                <div className="branch-item-actions">
                                                    {/* Tombol Pilih Cabang Pemrosesan */}
                                                    <button
                                                        type="button"
                                                        className={`btn-choose-branch ${isChosenProcessor ? 'is-chosen' : ''}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handlePickBranchAsProcessor(branch);
                                                            setActiveBranchId(branch.id);
                                                        }}
                                                    >
                                                        {isChosenProcessor ? (
                                                            <>
                                                                <Check size={14} />
                                                                <span>Cabang Terpilih</span>
                                                            </>
                                                        ) : (
                                                            <span>Pilih Cabang</span>
                                                        )}
                                                    </button>

                                                    {/* Tombol Lihat di Google Maps */}
                                                    <a
                                                        href={branch.mapsUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn-branch-gmaps"
                                                        onClick={(e) => e.stopPropagation()}
                                                        title="Buka rute cabang ini di Google Maps (tab baru)"
                                                    >
                                                        <MapPin size={13} />
                                                        <span>📍 Lihat di Google Maps</span>
                                                        <ExternalLink size={12} />
                                                    </a>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="branch-empty-search">
                                        <MapPin size={32} color="var(--slate-400)" />
                                        <p className="branch-empty-text">
                                            Tidak ditemukan cabang yang cocok dengan pencarian Anda di Kota Sukabumi.
                                        </p>
                                        <button
                                            type="button"
                                            className="btn btn-secondary-subtle btn-sm"
                                            onClick={() => {
                                                setSearchBranch('');
                                            }}
                                        >
                                            Tampilkan Semua Cabang Sukabumi
                                        </button>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>

                </div>

            </div>
        </section>
    );
};
