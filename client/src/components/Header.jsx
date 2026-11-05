import React from 'react';
import { Lock, LogOut, LayoutDashboard, Store, MessageCircle, Clock, ShieldCheck, PhoneCall } from 'lucide-react';
import Logo from '../assets/KimiaFarma.jpg';

export const Header = ({
    storeSettings,
    isAdminView,
    setIsAdminView,
    adminUser,
    onOpenLogin,
    onLogout
}) => {
    const rawPhone = storeSettings?.phone || '6281234567890';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const waHelpLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent('Halo Apoteker Kimia Farma, saya ingin konsultasi mengenai ketersediaan obat dan cara pemesanan.')}`;

    return (
        <header className="site-header">
            {/* Top Micro-Bar (Apotek Announcement) */}
            <div className="header-top-bar">
                <div className="container header-top-inner">
                    <div className="top-bar-item">
                        <span className="live-status-dot"></span>
                        <Clock size={13} />
                        <span>Apotek Buka • 07:00 - 22:00 WIB</span>
                    </div>

                    <div className="top-bar-item hide-mobile">
                        <ShieldCheck size={14} className="text-blue" />
                        <span>Resmi Berizin BPOM & Kemenkes RI</span>
                    </div>

                    <div className="top-bar-item">
                        <a
                            href={waHelpLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="top-bar-link"
                            title="Hubungi Apoteker Siaga via WhatsApp"
                        >
                            <PhoneCall size={12} />
                            <span>CS Apotek: {storeSettings?.phone || '0812-3456-7890'}</span>
                        </a>
                    </div>
                </div>
            </div>

            {/* Main Navigation Bar */}
            <div className="container header-container">
                {/* Brand / Logo */}
                <div
                    className="brand-group"
                    onClick={() => setIsAdminView(false)}
                    style={{ cursor: 'pointer' }}
                    title="Kembali ke Beranda Katalog"
                >
                    <div className="logo-brand">
                        <img
                            src={Logo}
                            alt={storeSettings?.storeName || 'Kimia Farma'}
                            style={{
                                height: '46px',
                                width: 'auto',
                                maxHeight: '46px',
                                objectFit: 'contain',
                                borderRadius: '8px'
                            }}
                        />
                    </div>

                    <div className="brand-info">
                        <div className="brand-title-wrap">
                            <span className="brand-name">Kimia Farma</span>
                            <span className="brand-tag">Apotek Digital</span>
                        </div>
                        <p className="store-subtext">
                            {storeSettings?.storeName || 'Apotek Kimia Farma'} • <span className="text-orange">{storeSettings?.tagline || 'Solusi Sehat & Terpercaya'}</span>
                        </p>
                    </div>
                </div>

                {/* Action Controls */}
                <div className="header-actions">
                    {/* Quick WhatsApp Consultation Button (Customer View) */}
                    {!isAdminView && (
                        <a
                            href={waHelpLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-wa-subtle btn-sm hide-mobile"
                            title="Tanya Apoteker langsung via WhatsApp"
                        >
                            <MessageCircle size={16} />
                            <span>Konsultasi Apoteker</span>
                        </a>
                    )}

                    {adminUser ? (
                        <div className="admin-status-bar">
                            <span className="admin-badge">
                                <span className="admin-dot"></span>
                                {adminUser.name || 'Admin'}
                            </span>

                            {isAdminView ? (
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => setIsAdminView(false)}
                                    title="Kembali ke tampilan katalog pelanggan"
                                >
                                    <Store size={16} />
                                    <span>Lihat Katalog</span>
                                </button>
                            ) : (
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => setIsAdminView(true)}
                                    title="Buka panel admin apotek"
                                >
                                    <LayoutDashboard size={16} />
                                    <span>Dashboard</span>
                                </button>
                            )}

                            <button
                                className="btn btn-danger-soft btn-sm"
                                onClick={onLogout}
                                title="Keluar dari akun admin"
                            >
                                <LogOut size={16} />
                                <span className="hide-mobile">Logout</span>
                            </button>
                        </div>
                    ) : (
                        <button
                            className="btn btn-primary-soft btn-sm admin-login-btn"
                            onClick={onOpenLogin}
                            id="admin-login-trigger"
                            title="Login Pengelola Apotek"
                        >
                            <Lock size={15} />
                            <span>Login Admin</span>
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};
