import React from 'react';
import { Pill, Sparkles, HeartPulse, Leaf, Layers, ShieldCheck } from 'lucide-react';

export const CategoryPills = ({ categories, activeCategoryId, onSelectCategory, totalProductCount }) => {
    // Pharmacy Category icon helper
    const getCategoryIcon = (name) => {
        const lower = (name || '').toLowerCase();
        if (lower.includes('obat')) return <Pill size={15} />;
        if (lower.includes('vitamin') || lower.includes('suplemen')) return <Sparkles size={15} />;
        if (lower.includes('alat') || lower.includes('kesehatan') || lower.includes('medis')) return <HeartPulse size={15} />;
        if (lower.includes('herbal') || lower.includes('jamu') || lower.includes('alami')) return <Leaf size={15} />;
        return <ShieldCheck size={15} />;
    };

    return (
        <div className="category-pills-wrapper">
            <div className="category-pills-scroll">
                {/* All Products Pill */}
                <button
                    className={`category-pill ${activeCategoryId === '' ? 'active' : ''}`}
                    onClick={() => onSelectCategory('')}
                    id="cat-pill-all"
                >
                    <Layers size={15} />
                    <span>Semua Produk</span>
                    {totalProductCount !== undefined && (
                        <span className="pill-count">{totalProductCount}</span>
                    )}
                </button>
                {/* Dynamic Pharmacy Category Pills */}
                {categories.map((cat) => {
                    const isActive = activeCategoryId === cat.id;
                    return (
                        <button
                            key={cat.id}
                            className={`category-pill ${isActive ? 'active' : ''}`}
                            onClick={() => onSelectCategory(cat.id)}
                            id={`cat-pill-${cat.slug || cat.id}`}
                        >
                            {getCategoryIcon(cat.name)}
                            <span>{cat.name}</span>
                            {cat.productCount !== undefined && (
                                <span className="pill-count">{cat.productCount}</span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
