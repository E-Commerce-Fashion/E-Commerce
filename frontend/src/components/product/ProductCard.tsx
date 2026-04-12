'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, ShoppingBag, Star, Eye } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { formatCurrency, getDiscountPercent } from '@/utils'
import { toast } from 'react-hot-toast'

export interface Product {
  id: string
  name: string
  price: number
  discount_price?: number
  images: { url: string; public_id: string; color?: string }[]
  sizes: { size: string; stock: number; color?: string }[]
  colors?: string[]
  category: string
  avg_rating: number
  rating_count: number
  is_featured?: boolean
}

interface ProductCardProps {
  product: Product
  index?: number
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const [hovered, setHovered] = useState(false)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [wishlisted, setWishlisted] = useState(false)
  const [imageIdx, setImageIdx] = useState(0)
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)

  const mainImage = product.images?.[imageIdx]?.url || '/placeholder-product.svg'
  const hoverImage = product.images?.[1]?.url
  const discountPct = product.discount_price
    ? getDiscountPercent(product.price, product.discount_price)
    : 0
  const displayPrice = product.discount_price || product.price

  const availableSizes = Array.from(
    (product.sizes || []).reduce((map, entry) => {
      if (entry.stock <= 0) return map

      const sizeKey = String(entry.size || '').trim().toUpperCase()
      if (!sizeKey) return map

      const existing = map.get(sizeKey) || 0
      map.set(sizeKey, existing + Number(entry.stock || 0))
      return map
    }, new Map<string, number>())
  ).map(([size, stock]) => ({ size, stock }))

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!selectedSize && availableSizes.length > 0) {
      toast.error('Please select a size', { id: 'size-error' })
      return
    }
    const size = selectedSize || availableSizes[0]?.size || 'Free'
    const sizeEntry = availableSizes.find((s) => s.size === size)
    addItem({
      product_id: product.id,
      name: product.name,
      price: displayPrice,
      size,
      qty: 1,
      image: mainImage,
      stock: sizeEntry?.stock || 1,
    })
    openCart()
    toast.success(`${product.name} added to cart!`, { id: `cart-${product.id}` })
  }

  const router = useRouter()

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => router.push(`/products/${product.id}`)}
      className="group relative rounded-2xl overflow-hidden flex flex-col h-full cursor-pointer"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        boxShadow: hovered ? '0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px var(--accent-gold)' : 'var(--shadow-sm)',
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      }}
    >
      {/* Animated Background Aura */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 50% 50%, rgba(var(--accent-gold-rgb), 0.06), transparent 70%)',
            }}
          />
        )}
      </AnimatePresence>

      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          animate={hovered ? { x: ['0%', '10%', '-10%', '0%'], y: ['0%', '5%', '-5%', '0%'] } : {}}
          transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(var(--accent-gold) 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}
        />
      </div>

      {/* Image container */}
      <div className="relative block overflow-hidden aspect-3/4 z-10">
        <div className="absolute inset-0">
          <Image
            src={hovered && hoverImage ? hoverImage : mainImage}
            alt={product.name}
            fill
            priority={index < 4}
            className="object-cover transition-all duration-1000 ease-out"
            style={{ transform: hovered ? 'scale(1.1) rotate(1deg)' : 'scale(1) rotate(0deg)' }}
            sizes="(max-width: 768px) 50vw, 30vw"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (!target.src.includes('placeholder')) {
                target.src = '/placeholder-product.svg';
              }
            }}
          />
        </div>

        {/* Glossy Overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
          {discountPct > 0 && (
            <motion.span
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="px-2.5 py-1 rounded-lg text-[10px] font-black tracking-tighter uppercase"
              style={{ background: 'var(--accent-rose)', color: '#fff', boxShadow: '0 4px 12px rgba(244,63,94,0.3)' }}
            >
              SALE {discountPct}% OFF
            </motion.span>
          )}
          {product.is_featured && (
            <motion.span
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="px-2.5 py-1 rounded-lg text-[10px] font-black tracking-tighter uppercase"
              style={{ background: 'var(--accent-gold)', color: '#0A0A0F', boxShadow: '0 4px 12px rgba(212,175,55,0.3)' }}
            >
              FEATURED
            </motion.span>
          )}
        </div>

        {/* Action Buttons Hub */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setWishlisted(!wishlisted);
            }}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 hover:scale-110"
            style={{
              background: wishlisted ? 'var(--accent-rose)' : 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: wishlisted ? '0 0 20px rgba(244,63,94,0.4)' : 'none'
            }}
          >
            <Heart size={16} fill={wishlisted ? '#fff' : 'none'} stroke={wishlisted ? '#fff' : 'white'} />
          </button>
        </div>

        {/* Image Nav Dots */}
        {product.images?.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
            {product.images.slice(0, 4).map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.preventDefault(); setImageIdx(i) }}
                className="h-1 rounded-full transition-all duration-300"
                style={{
                  width: imageIdx === i ? '24px' : '8px',
                  background: imageIdx === i ? 'var(--accent-gold)' : 'rgba(255,255,255,0.4)',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-5 flex flex-col gap-4 flex-1 z-10">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50" style={{ color: 'var(--text-muted)' }}>
            {product.category}
          </span>
          {product.rating_count > 0 && (
            <div className="flex items-center gap-1">
              <Star size={10} fill="var(--accent-gold)" stroke="var(--accent-gold)" />
              <span className="text-[10px] font-bold" style={{ color: 'var(--text-primary)' }}>{product.avg_rating}</span>
            </div>
          )}
        </div>

        <div>
          <h3
            className="text-lg font-bold font-serif leading-tight line-clamp-1 transition-colors group-hover:text-(--accent-gold)"
            style={{ color: 'var(--text-primary)' }}
          >
            {product.name}
          </h3>
        </div>

        {/* Size Selection Toggle (Hover only) */}
        <div className="h-10 overflow-hidden">
          <AnimatePresence mode="wait">
            {!hovered ? (
              <motion.div
                key="price"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-baseline gap-2"
              >
                <span className="text-xl font-bold font-serif" style={{ color: 'var(--accent-gold)' }}>
                  {formatCurrency(displayPrice)}
                </span>
                {product.discount_price && (
                  <span className="text-xs line-through opacity-40" style={{ color: 'var(--text-muted)' }}>
                    {formatCurrency(product.price)}
                  </span>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="sizes"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-wrap gap-1.5"
              >
                {availableSizes.slice(0, 4).map(({ size }) => (
                  <button
                    key={size}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSize(selectedSize === size ? null : size);
                    }}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all"
                    style={{
                      borderColor: selectedSize === size ? 'var(--accent-gold)' : 'var(--border)',
                      color: selectedSize === size ? 'var(--accent-gold)' : 'var(--text-muted)',
                      background: selectedSize === size ? 'rgba(var(--accent-gold-rgb), 0.1)' : 'transparent',
                      boxShadow: selectedSize === size ? '0 0 10px rgba(var(--accent-gold-rgb), 0.2)' : 'none'
                    }}
                  >
                    {size}
                  </button>
                ))}
                {availableSizes.length > 4 && <span className="text-[10px] flex items-center px-1 opacity-50">+{availableSizes.length - 4}</span>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={handleAddToCart}
          className="group/btn relative w-full h-12 rounded-xl overflow-hidden font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
        >
          <div className="absolute inset-0 bg-linear-to-r from-(--accent-gold) to-(--accent-rose) opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
          <span className="relative z-10 flex items-center justify-center gap-2 group-hover/btn:text-[#0A0A0F]">
            <ShoppingBag size={14} />
            Quick Purchase
          </span>
        </button>
      </div>
    </motion.div>
  )
}
