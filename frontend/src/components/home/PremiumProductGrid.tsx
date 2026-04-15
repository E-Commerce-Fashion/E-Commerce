'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PremiumProductCard } from '../ui/PremiumProductCard';
import { type Product } from '../product/ProductCard';
import { PremiumButton } from '../ui/PremiumButton';
import Link from 'next/link';

interface PremiumProductGridProps {
  products: Product[];
  title?: string;
  subtitle?: string;
  onAddToCart?: (product: Product) => void;
}

export function PremiumProductGrid({
  products,
  title = 'Curated Selection',
  subtitle = 'The Essentials',
  onAddToCart,
}: PremiumProductGridProps) {
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))].slice(0, 6);
  const filtered = activeCategory === 'All' ? products : products.filter(p => p.category === activeCategory);

  if (products.length === 0) return null;

  return (
    <section className="w-full py-24 sm:py-32 px-6 md:px-12 lg:px-20" style={{ background: 'var(--bg-surface)' }}>
      <div className="mx-auto w-full max-w-[1200px]">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-[10px] uppercase tracking-[0.3em] font-semibold mb-3" style={{ color: 'var(--accent-gold)' }}>
              {subtitle}
            </p>
            <h2 className="text-4xl md:text-5xl font-serif" style={{ color: 'var(--text-primary)' }}>
              {title}
            </h2>
          </motion.div>

          {/* Category Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-wrap gap-6"
          >
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="text-[11px] uppercase tracking-widest font-semibold transition-all duration-300 pb-1 border-b-2"
                style={{
                  borderColor: activeCategory === cat ? 'var(--text-primary)' : 'transparent',
                  color: activeCategory === cat ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
              >
                {cat}
              </button>
            ))}
          </motion.div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16">
          {filtered.slice(0, 8).map((product, index) => (
            <PremiumProductCard
              key={product.id}
              product={product}
              index={index}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>

        {/* See All CTA */}
        {products.length > 8 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-20 flex justify-center"
          >
            <Link href="/products">
              <PremiumButton variant="secondary">
                View Entire Collection
              </PremiumButton>
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}
