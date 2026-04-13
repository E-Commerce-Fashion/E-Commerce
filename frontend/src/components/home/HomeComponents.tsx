'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { ShoppingBag, Star, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '@/components/product/ProductCard';
import { formatCurrency, getDiscountPercent } from '@/utils';
import { useCartStore } from '@/store/cartStore';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

// ==========================================
// COMPONENT 1: ThreeDCarousel (GURANTEED 3D)
// ==========================================

interface CarouselItem {
  image: string;
  title?: string;
  category?: string;
  price?: string;
  link?: string;
}

interface ThreeDCarouselProps {
  items: CarouselItem[];
  autoplayInterval?: number;
  performanceMode?: boolean;
}

const CARD_WIDTH = 320;
const PERSPECTIVE = 1500;

function CarouselCard({
  item,
  index,
  isActive,
  angleStep,
  cardWidth,
  radius,
  performanceMode,
}: {
  item: CarouselItem;
  index: number;
  isActive: boolean;
  angleStep: number;
  cardWidth: number;
  radius: number;
  performanceMode: boolean;
}) {
  const angle = index * angleStep;

  // Separation Fix: Using raw transform string to guarantee rotateY -> translateZ order
  const transformString = `rotateY(${angle}deg) translateZ(${radius}px)`;

  return (
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{
        width: `min(74vw, ${cardWidth}px)`,
        aspectRatio: `${3} / ${4.2}`,
        transform: transformString,
        transformStyle: 'preserve-3d',
        willChange: 'transform',
      }}
    >
      <motion.div
        animate={{
          scale: isActive ? (performanceMode ? 1.03 : 1.1) : (performanceMode ? 0.9 : 0.85),
          opacity: isActive ? 1 : 0.6,
          // Removed expensive blur filter for performance
        }}
        transition={performanceMode ? { duration: 0.28, ease: 'easeOut' } : { type: 'spring', stiffness: 100, damping: 20 }}
        className="relative w-full h-full rounded-[28px] overflow-hidden border border-white/10 shadow-2xl transition-all duration-500"
        style={{
          background: 'var(--bg-surface)',
          borderColor: isActive ? 'var(--accent-gold)' : 'var(--border)',
          boxShadow: isActive
            ? performanceMode
              ? '0 16px 34px -10px rgba(0,0,0,0.6), 0 0 16px rgba(var(--accent-gold-rgb), 0.2)'
              : '0 30px 70px -12px rgba(0,0,0,0.8), 0 0 30px rgba(var(--accent-gold-rgb), 0.25)'
            : performanceMode
              ? '0 10px 24px -8px rgba(0,0,0,0.45)'
              : '0 15px 35px -8px rgba(0,0,0,0.5)',
        }}
      >
        <Image
          src={item.image}
          alt={item.title || 'Collection Item'}
          fill
          priority={index === 0} // Only prioritize the very first card
          className="object-cover"
          sizes="400px"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (!target.src.includes('placeholder')) {
              target.src = '/placeholder-product.svg';
            }
          }}
        />
        <div className={`absolute inset-0 bg-black/40 transition-opacity duration-500 ${isActive ? 'opacity-0' : 'opacity-100'}`} />
        <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/20 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 p-7 flex flex-col gap-1">
          {item.category && (
            <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: 'var(--accent-gold)' }}>
              {item.category}
            </span>
          )}
          {item.title && (
            <h3 className="text-xl md:text-2xl font-bold text-white font-serif italic leading-tight">
              {item.title}
            </h3>
          )}
          <div className="flex items-center justify-between mt-3">
            {item.price && (
              <p className="text-sm font-medium text-white/70">
                {item.price}
              </p>
            )}
            {item.link && (
              <Link href={item.link} className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-white border-b border-white/20 pb-0.5 hover:border-white transition-all">
                Browse <ArrowRight size={10} />
              </Link>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function ThreeDCarousel({ items, autoplayInterval = 5000, performanceMode = false }: ThreeDCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isCompactView, setIsCompactView] = useState(false);
  const [isShortViewport, setIsShortViewport] = useState(false);
  const totalItems = items.length;
  const angleStep = 360 / totalItems;

  useEffect(() => {
    const onResize = () => {
      setIsCompactView(window.innerWidth < 768);
      setIsShortViewport(window.innerHeight < 760);
    };
    onResize();
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % totalItems);
    }, autoplayInterval);
    return () => clearInterval(interval);
  }, [totalItems, autoplayInterval, isPaused]);

  const goNext = useCallback(() => setActiveIndex((prev) => (prev + 1) % totalItems), [totalItems]);
  const goPrev = useCallback(() => setActiveIndex((prev) => (prev - 1 + totalItems) % totalItems), [totalItems]);

  const sectionMinHeight = isShortViewport
    ? '560px'
    : isCompactView
      ? '680px'
      : performanceMode
        ? '760px'
        : '820px';
  const stageHeight = isShortViewport
    ? '330px'
    : isCompactView
      ? '420px'
      : performanceMode
        ? '520px'
        : '600px';
  const stagePaddingTop = isShortViewport ? '3.5rem' : isCompactView ? '4.5rem' : performanceMode ? '6rem' : '8rem';
  const stagePaddingBottom = isShortViewport ? '2.5rem' : isCompactView ? '4rem' : performanceMode ? '5rem' : '8rem';
  const cardWidth = isShortViewport ? 232 : isCompactView ? 270 : performanceMode ? 300 : CARD_WIDTH;
  const carouselRadius = isShortViewport ? 305 : isCompactView ? 365 : performanceMode ? 430 : 500;
  const carouselPerspective = isShortViewport ? 980 : isCompactView ? 1160 : performanceMode ? 1280 : PERSPECTIVE;
  const actionButtonClass = isCompactView
    ? 'w-12 h-12'
    : 'w-16 h-16';

  return (
    <div className="relative w-full flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: 'var(--bg-base)',
        minHeight: sectionMinHeight,
        paddingTop: stagePaddingTop,
        paddingBottom: stagePaddingBottom,
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >

      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle at center, var(--accent-gold) 0%, transparent 70%)',
            filter: 'blur(100px)'
          }}
        />
      </div>

      {/* Main 3D Container */}
      <div
        className="relative w-full flex items-center justify-center"
        style={{ perspective: `${carouselPerspective}px`, height: stageHeight }}
      >
        <motion.div
          className="relative w-0 h-0"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: -activeIndex * angleStep }}
          transition={performanceMode
            ? { duration: 0.4, ease: 'easeOut' }
            : { type: 'spring', stiffness: isShortViewport ? 46 : 40, damping: isShortViewport ? 17 : 14, mass: 1.1 }}
        >
          {items.map((item, index) => (
            <CarouselCard
              key={`${item.image}-${index}`}
              item={item}
              index={index}
              isActive={index === activeIndex}
              angleStep={angleStep}
              cardWidth={cardWidth}
              radius={carouselRadius}
              performanceMode={performanceMode}
            />
          ))}
        </motion.div>
      </div>

      {/* Navigation Controls */}
      <div className="relative z-30 flex items-center gap-6 sm:gap-12 mt-10 sm:mt-12">
        <button
          onClick={goPrev}
          className={`${actionButtonClass} rounded-full border border-(--border) flex items-center justify-center transition-all bg-(--bg-surface) text-(--text-primary) hover:border-(--accent-gold) hover:scale-110 active:scale-95 shadow-2xl`}
        >
          <ChevronLeft size={isCompactView ? 22 : 28} />
        </button>

        <div className="flex gap-2 sm:gap-4">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className="h-2 sm:h-2.5 rounded-full transition-all duration-700"
              style={{
                width: i === activeIndex ? (isCompactView ? '2.5rem' : '4rem') : (isCompactView ? '0.75rem' : '1rem'),
                background: i === activeIndex ? 'var(--accent-gold)' : 'var(--border-strong)',
                boxShadow: i === activeIndex ? '0 0 20px rgba(var(--accent-gold-rgb), 0.4)' : 'none'
              }}
            />
          ))}
        </div>

        <button
          onClick={goNext}
          className={`${actionButtonClass} rounded-full border border-(--border) flex items-center justify-center transition-all bg-(--bg-surface) text-(--text-primary) hover:border-(--accent-gold) hover:scale-110 active:scale-95 shadow-2xl`}
        >
          <ChevronRight size={isCompactView ? 22 : 28} />
        </button>
      </div>

      <div className="mt-10 sm:mt-12 text-center max-w-xl px-4">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-40 mb-3" style={{ color: 'var(--text-muted)' }}>
          Selected Collection
        </p>
        <h4 className="text-2xl sm:text-3xl font-serif italic text-white tracking-[0.16em] sm:tracking-widest">
          {items[activeIndex].title}
        </h4>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENT 2: RecentProductsSection
// ==========================================

interface RecentProductsSectionProps {
  products: Product[];
  category: string;
}

export function RecentProductsSection({ products, category }: RecentProductsSectionProps) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  const handleQuickPurchase = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Default to first available size or 'Free'
    const size = product.sizes?.[0]?.size || 'Free';
    const stock = product.sizes?.[0]?.stock || 1;

    addItem({
      product_id: product.id,
      name: product.name,
      price: product.discount_price || product.price,
      size,
      qty: 1,
      image: product.images?.[0]?.url || '/placeholder-product.svg',
      stock,
    });
    openCart();
    toast.success(`${product.name} added to cart!`);
  };

  if (products.length === 0) return null;

  return (
    <section className="w-full py-20 sm:py-24 px-3 sm:px-5 lg:px-6">
      <div className="mx-auto w-full ">
        <div className="mb-16 border-b pb-8" style={{ borderColor: 'var(--border)' }}>
          <p className="text-[10px] uppercase tracking-[0.3em] font-black mb-2" style={{ color: 'var(--accent-gold)' }}>
            Editorial Picks
          </p>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <h2 className="text-4xl md:text-5xl font-serif font-bold italic" style={{ color: 'var(--text-primary)' }}>
              Recent Arrivals <span className="text-xl font-normal opacity-40 ml-4 italic">/ {category}</span>
            </h2>
            <Link href={`/products?category=${category}`} className="text-xs font-bold uppercase tracking-widest border-b pb-1 border-current hover:border-transparent transition-all" style={{ color: 'var(--text-secondary)' }}>
              Explore Category
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-8 2xl:gap-x-10 gap-y-16">
          {products.map((product) => {
            const discountPct = product.discount_price ? getDiscountPercent(product.price, product.discount_price) : 0;
            return (
              <motion.article
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex flex-col h-full group"
              >
                {/* Image with Badges */}
                <Link
                  href={`/products/${product.id}`}
                  className="relative aspect-3/4 rounded-3xl overflow-hidden mb-8 block shadow-xl transition-shadow duration-500 group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
                >
                  <Image
                    src={product.images?.[0]?.url || '/placeholder-product.svg'}
                    alt={product.name}
                    fill
                    priority={false}
                    loading={products.indexOf(product) < 2 ? 'eager' : 'lazy'}
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (!target.src.includes('placeholder')) {
                        target.src = '/placeholder-product.svg';
                      }
                    }}
                  />

                  <div className="absolute top-5 left-5 flex flex-col gap-2">
                    {discountPct > 0 && (
                      <span className="bg-red-600 text-white text-[10px] font-black px-2.5 py-1.5 rounded shadow-lg uppercase tracking-tighter">
                        SALE {discountPct}% OFF
                      </span>
                    )}
                    {product.is_featured && (
                      <span className="bg-(--accent-gold) text-black text-[10px] font-black px-2.5 py-1.5 rounded shadow-lg uppercase tracking-tighter">
                        FEATURED
                      </span>
                    )}
                  </div>
                </Link>

                {/* Data in specific order requested */}
                <div className="flex flex-col flex-1 px-1">
                  <p className="text-[11px] font-black uppercase tracking-[0.25em] opacity-40 mb-2" style={{ color: 'var(--text-muted)' }}>
                    {product.category}
                  </p>

                  <div className="flex items-center gap-1.5 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={11}
                        fill={star <= product.avg_rating ? 'var(--accent-gold)' : 'none'}
                        stroke="var(--accent-gold)"
                        strokeWidth={2}
                      />
                    ))}
                    <span className="text-xs font-bold ml-2 opacity-70">{product.avg_rating || '5.0'}</span>
                  </div>

                  <h3 className="text-xl font-bold font-serif mb-3 line-clamp-1 group-hover:text-(--accent-gold) transition-colors" style={{ color: 'var(--text-primary)' }}>
                    <Link href={`/products/${product.id}`}>
                      {product.name}
                    </Link>
                  </h3>

                  <div className="flex items-baseline gap-3 mb-8">
                    <span className="text-2xl font-bold font-serif" style={{ color: 'var(--text-primary)' }}>
                      {formatCurrency(product.discount_price || product.price)}
                    </span>
                    {product.discount_price && (
                      <span className="text-base line-through opacity-25 italic">
                        {formatCurrency(product.price)}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={(e) => handleQuickPurchase(product, e)}
                    className="mt-auto w-full h-14 bg-[#0A0A0F] text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] hover:bg-(--accent-gold) hover:text-black transition-all duration-500 shadow-lg group-hover:shadow-2xl"
                  >
                    Quick Purchase
                  </button>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
