'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingBag, Heart, Star } from 'lucide-react';
import { formatCurrency, getDiscountPercent } from '../../utils/index';
import { type Product } from '../product/ProductCard';

interface PremiumProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  index?: number;
}

export function PremiumProductCard({ product, onAddToCart, index = 0 }: PremiumProductCardProps) {
  const discountPct = product.discount_price ? getDiscountPercent(product.price, product.discount_price) : 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay: Math.min(index * 0.1, 0.4), ease: [0.22, 1, 0.36, 1] }}
      className="group flex flex-col h-full rounded-xl overflow-hidden transition-shadow duration-500"
      style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)' }}
    >
      <div className="relative aspect-4/5 overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
        <Link href={`/products/${product.id}`} className="absolute inset-0 z-10 block">
          <Image
            src={product.images?.[0]?.url || '/placeholder-product.svg'}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
          />
        </Link>

        {/* Gradient Overlay */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10" />

        {/* Sale Badge */}
        {discountPct > 0 && (
          <div className="absolute top-4 left-4 z-20 pointer-events-none">
            <span className="bg-white text-black text-[10px] font-black px-2.5 py-1 rounded shadow-sm uppercase tracking-widest">
              SALE {discountPct}%
            </span>
          </div>
        )}

        {/* Hover Actions */}
        <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center gap-3 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 ease-out">
          <button
            className="h-12 px-6 rounded-full font-bold text-xs uppercase tracking-widest shadow-lg flex items-center gap-2 transition-colors bg-white text-black hover:bg-amber-400"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAddToCart?.(product); }}
          >
            <ShoppingBag size={14} /> Add
          </button>
          <button className="h-12 w-12 rounded-full flex items-center justify-center shadow-lg transition-colors bg-white text-black hover:bg-rose-500 hover:text-white">
            <Heart size={16} />
          </button>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
          <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{product.category}</p>
          <div className="flex items-center gap-1">
            <Star size={10} fill="var(--accent-gold)" stroke="var(--accent-gold)" />
            <span className="text-[10px] font-semibold" style={{ color: 'var(--text-primary)' }}>{product.avg_rating || '5.0'}</span>
          </div>
        </div>

        <h3 className="font-serif font-semibold text-lg leading-snug mb-3 line-clamp-2 transition-colors" style={{ color: 'var(--text-primary)' }}>
          <Link href={`/products/${product.id}`}>{product.name}</Link>
        </h3>

        <div className="mt-auto flex items-baseline gap-3">
          <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            {formatCurrency(product.discount_price || product.price)}
          </span>
          {product.discount_price && (
            <span className="text-sm line-through italic" style={{ color: 'var(--text-muted)' }}>
              {formatCurrency(product.price)}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
}
