'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative rounded-none overflow-hidden flex flex-col"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        boxShadow: hovered ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Image container */}
      <div className="relative block overflow-hidden aspect-3/4">
        <Link href={`/products/${product.id}`} className="absolute inset-0 z-0">
          <Image
            src={hovered && hoverImage ? hoverImage : mainImage}
            alt={product.name}
            fill
            priority={index === 0}
            loading={index === 0 ? 'eager' : 'lazy'}
            className="object-cover transition-transform duration-700"
            style={{ transform: hovered ? 'scale(1.06)' : 'scale(1)' }}
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {discountPct > 0 && (
            <span
              className="px-2 py-0.5 rounded-none text-xs font-bold"
              style={{ background: 'var(--accent-rose)', color: '#fff' }}
            >
              -{discountPct}%
            </span>
          )}
          {product.is_featured && (
            <span
              className="px-2 py-0.5 rounded-none text-xs font-bold"
              style={{ background: 'var(--accent-gold)', color: '#0A0A0F' }}
            >
              Featured
            </span>
          )}
        </div>

        {/* Wishlist button */}
        <button
          onClick={(e) => { e.preventDefault(); setWishlisted(!wishlisted) }}
          className="absolute top-3 right-3 w-8 h-8 rounded-none flex items-center justify-center transition-all duration-200"
          style={{
            background: wishlisted ? 'var(--accent-rose)' : 'var(--glass-bg)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--glass-border)',
          }}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            size={14}
            fill={wishlisted ? '#fff' : 'none'}
            stroke={wishlisted ? '#fff' : 'var(--text-secondary)'}
          />
        </button>

        {/* Quick view overlay */}
        <motion.div
          initial={false}
          animate={{ opacity: hovered ? 1 : 0 }}
          className="absolute inset-x-0 bottom-0 flex items-center justify-center pb-4"
        >
          <Link
            href={`/products/${product.id}`}
            className="flex items-center gap-2 px-4 py-2 rounded-none text-xs font-semibold"
            style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(12px)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
          >
            <Eye size={13} />
            Quick View
          </Link>
        </motion.div>

        {/* Multiple image dots */}
        {product.images?.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {product.images.slice(0, 4).map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.preventDefault(); setImageIdx(i) }}
                className="rounded-none transition-all duration-200"
                style={{
                  width: imageIdx === i ? '16px' : '6px',
                  height: '6px',
                  background: imageIdx === i ? 'var(--accent-gold)' : 'rgba(255,255,255,0.5)',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-4 sm:p-5 flex flex-col gap-3.5 flex-1">
        {/* Category */}
        <span className="text-sm capitalize" style={{ color: 'var(--text-muted)' }}>
          {product.category}
        </span>

        {/* Name */}
        <Link href={`/products/${product.id}`}>
          <h3
            className="text-base font-semibold leading-snug line-clamp-2 transition-colors duration-150 hover:text-(--accent-gold)"
            style={{ color: 'var(--text-primary)' }}
          >
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        {product.rating_count > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={12}
                  fill={i < Math.round(product.avg_rating) ? 'var(--accent-gold)' : 'none'}
                  stroke="var(--accent-gold)"
                />
              ))}
            </div>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              ({product.rating_count})
            </span>
          </div>
        )}

        {/* Size pills */}
        {availableSizes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {availableSizes.slice(0, 5).map(({ size }) => (
              <button
                key={size}
                onClick={() => setSelectedSize(selectedSize === size ? null : size)}
                className="px-2.5 py-0.5 rounded-none text-sm font-medium border transition-all duration-150"
                style={{
                  borderColor: selectedSize === size ? 'var(--accent-gold)' : 'var(--border)',
                  color: selectedSize === size ? 'var(--accent-gold)' : 'var(--text-muted)',
                  background: selectedSize === size ? 'rgba(var(--accent-gold-rgb), 0.08)' : 'transparent',
                }}
              >
                {size}
              </button>
            ))}
          </div>
        )}

        {/* Price + Add to cart */}
        <div className="flex items-center justify-between mt-auto pt-1">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold" style={{ color: 'var(--accent-gold)' }}>
              {formatCurrency(displayPrice)}
            </span>
            {product.discount_price && (
              <span className="text-sm line-through" style={{ color: 'var(--text-muted)' }}>
                {formatCurrency(product.price)}
              </span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            className="w-8 h-8 rounded-none flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-gold"
            style={{
              background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-rose))',
              color: '#0A0A0F',
            }}
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingBag size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
