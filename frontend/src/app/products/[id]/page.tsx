'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, ShoppingBag, Star, Minus, Plus, ChevronLeft, Share2, Ruler, Truck, ShieldCheck, RefreshCw, Check
} from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { formatCurrency, getDiscountPercent } from '@/utils'
import { toast } from 'react-hot-toast'
import api from '@/lib/axios'
import type { Product } from '@/components/product/ProductCard'

export default function ProductDetailPage() {
  const { id } = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [qty, setQty] = useState(1)
  const [wishlisted, setWishlisted] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)

  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await api.get(`/products/${id}`)
        if (data.success) setProduct(data.data)
      } catch {
        setProduct(null)
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [id])

  useEffect(() => {
    if (!product) return

    const imageColors = (product.images || [])
      .map((img) => img?.color)
      .filter((value): value is string => Boolean(value))
    const allColors = Array.from(new Set([...(product.colors || []), ...imageColors]))

    setSelectedColor((current) => current || allColors[0] || null)
  }, [product])

  if (loading) {
    return (
      <main className="page-with-navbar-offset px-4 min-h-screen" style={{ background: 'var(--bg-base)' }}>
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10">
          <div className="aspect-3/4 skeleton rounded-3xl" />
          <div className="space-y-4 pt-10">
            <div className="h-4 w-24 skeleton rounded" />
            <div className="h-8 w-3/4 skeleton rounded" />
            <div className="h-6 w-1/3 skeleton rounded" />
            <div className="h-20 w-full skeleton rounded" />
          </div>
        </div>
      </main>
    )
  }

  if (!product) {
    return (
      <main className="page-with-navbar-offset px-4 min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="text-center">
          <p className="text-5xl mb-4">😞</p>
          <h1 className="text-2xl font-bold font-serif" style={{ color: 'var(--text-primary)' }}>Product not found</h1>
          <Link href="/products" className="mt-4 inline-block px-6 py-2 rounded-xl text-sm font-semibold" style={{ background: 'var(--accent-gold)', color: '#0A0A0F' }}>
            Back to Shop
          </Link>
        </div>
      </main>
    )
  }

  const displayPrice = product.discount_price || product.price
  const discountPct = product.discount_price ? getDiscountPercent(product.price, product.discount_price) : 0
  const allColors = Array.from(new Set([
    ...(product.colors || []),
    ...((product.images || []).map((img) => img?.color).filter((value): value is string => Boolean(value))),
  ]))
  const colorScopedImages = selectedColor
    ? (product.images || []).filter((img) => !img.color || img.color === selectedColor)
    : (product.images || [])
  const effectiveImages = colorScopedImages.length ? colorScopedImages : (product.images || [])
  const availableSizes = Array.from(
    (product.sizes || []).reduce((map, entry) => {
      if (entry.stock <= 0) return map
      if (selectedColor && entry.color && entry.color !== selectedColor) return map

      const key = String(entry.size || '').trim().toUpperCase()
      if (!key) return map
      const existing = map.get(key) || 0
      map.set(key, existing + Number(entry.stock || 0))
      return map
    }, new Map<string, number>())
  ).map(([size, stock]) => ({ size, stock }))

  const selectedSizeStock = availableSizes.find((item) => item.size === selectedSize)?.stock || 0

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error('Please select a size')
      return
    }
    addItem({
      product_id: product.id,
      name: product.name,
      price: displayPrice,
      size: selectedSize,
      color: selectedColor || undefined,
      qty,
      image: effectiveImages?.[selectedImage]?.url || effectiveImages?.[0]?.url || '',
      stock: selectedSizeStock,
    })
    setAddedToCart(true)
    toast.success(`${product.name} added to cart!`)
    setTimeout(() => setAddedToCart(false), 2000)
    openCart()
  }

  return (
    <>
      <main className="page-with-navbar-offset pb-20 px-4 min-h-screen" style={{ background: 'var(--bg-base)' }}>
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <motion.nav
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-sm mb-6 pt-4"
          >
            <Link href="/products" className="flex items-center gap-1 transition-colors hover:text-(--accent-gold)" style={{ color: 'var(--text-muted)' }}>
              <ChevronLeft size={14} /> Products
            </Link>
            <span style={{ color: 'var(--text-muted)' }}>/</span>
            <span className="capitalize" style={{ color: 'var(--text-muted)' }}>{product.category}</span>
            <span style={{ color: 'var(--text-muted)' }}>/</span>
            <span style={{ color: 'var(--text-secondary)' }}>{product.name}</span>
          </motion.nav>

          <div className="grid lg:grid-cols-2 gap-10">
            {/* Images */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Main image */}
              <div
                className="relative aspect-3/4 rounded-3xl overflow-hidden mb-4"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
              >
                {effectiveImages?.[selectedImage]?.url ? (
                  <Image
                    src={effectiveImages[selectedImage].url}
                    alt={product.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-6xl opacity-40">👔</span>
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {discountPct > 0 && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: 'var(--accent-rose)', color: '#fff' }}>
                      -{discountPct}% OFF
                    </span>
                  )}
                  {product.is_featured && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: 'var(--accent-gold)', color: '#0A0A0F' }}>
                      ✨ Featured
                    </span>
                  )}
                </div>

                {/* Wishlist & Share */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <button
                    onClick={() => { setWishlisted(!wishlisted); toast.success(wishlisted ? 'Removed from wishlist' : 'Added to wishlist') }}
                    className="w-10 h-10 rounded-full flex items-center justify-center glass transition-all"
                  >
                    <Heart size={16} fill={wishlisted ? 'var(--accent-rose)' : 'none'} stroke={wishlisted ? 'var(--accent-rose)' : 'var(--text-primary)'} />
                  </button>
                  <button className="w-10 h-10 rounded-full flex items-center justify-center glass transition-all">
                    <Share2 size={16} style={{ color: 'var(--text-primary)' }} />
                  </button>
                </div>
              </div>

              {/* Thumbnail strip */}
              {effectiveImages?.length > 1 && (
                <div className="flex gap-3">
                  {effectiveImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className="relative w-20 h-24 rounded-xl overflow-hidden transition-all duration-200"
                      style={{
                        border: `2px solid ${selectedImage === i ? 'var(--accent-gold)' : 'var(--border)'}`,
                        opacity: selectedImage === i ? 1 : 0.6,
                      }}
                    >
                      {img.url ? (
                        <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--bg-elevated)' }}>
                          <span className="text-lg opacity-40">👔</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex flex-col"
            >
              <p className="text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--accent-gold)' }}>
                {product.category}
              </p>

              <h1 className="text-3xl sm:text-4xl font-bold font-serif mb-4" style={{ color: 'var(--text-primary)' }}>
                {product.name}
              </h1>

              {/* Rating */}
              {product.rating_count > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={16} fill={i < Math.round(product.avg_rating) ? 'var(--accent-gold)' : 'none'} stroke="var(--accent-gold)" />
                    ))}
                  </div>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {product.avg_rating.toFixed(1)} ({product.rating_count} reviews)
                  </span>
                </div>
              )}

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-3xl font-bold" style={{ color: 'var(--accent-gold)' }}>
                  {formatCurrency(displayPrice)}
                </span>
                {product.discount_price && (
                  <>
                    <span className="text-lg line-through" style={{ color: 'var(--text-muted)' }}>
                      {formatCurrency(product.price)}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'rgba(var(--accent-rose-rgb), 0.15)', color: 'var(--accent-rose)' }}>
                      Save {formatCurrency(product.price - product.discount_price)}
                    </span>
                  </>
                )}
              </div>

              {/* Description */}
              <p className="leading-relaxed mb-8" style={{ color: 'var(--text-secondary)' }}>
                {(product as any).description || 'A premium fashion piece crafted with care and attention to detail.'}
              </p>

              {allColors.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Select Color</p>
                  <div className="flex flex-wrap gap-2">
                    {allColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          setSelectedColor(color)
                          setSelectedImage(0)
                          setSelectedSize(null)
                          setQty(1)
                        }}
                        className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                        style={{
                          background: selectedColor === color ? 'var(--accent-gold)' : 'var(--bg-elevated)',
                          color: selectedColor === color ? '#0A0A0F' : 'var(--text-secondary)',
                          border: `1px solid ${selectedColor === color ? 'var(--accent-gold)' : 'var(--border)'}`,
                        }}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selection */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Select Size</p>
                  <button className="flex items-center gap-1 text-xs transition-colors hover:text-(--accent-gold)" style={{ color: 'var(--text-muted)' }}>
                    <Ruler size={12} /> Size Guide
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map(({ size, stock }) => (
                    <button
                      key={size}
                      disabled={stock === 0}
                      onClick={() => setSelectedSize(selectedSize === size ? null : size)}
                      className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-30 disabled:line-through"
                      style={{
                        background: selectedSize === size ? 'var(--accent-gold)' : 'var(--bg-elevated)',
                        color: selectedSize === size ? '#0A0A0F' : 'var(--text-secondary)',
                        border: `1px solid ${selectedSize === size ? 'var(--accent-gold)' : 'var(--border)'}`,
                      }}
                    >
                      {size}
                      {stock <= 3 && stock > 0 && (
                        <span className="ml-1 text-xs opacity-60">({stock} left)</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="mb-8">
                <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Quantity</p>
                <div
                  className="inline-flex items-center gap-3 px-2 py-1 rounded-xl"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                >
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-(--bg-surface)"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{qty}</span>
                  <button
                    onClick={() => setQty(Math.min(selectedSizeStock || 10, qty + 1))}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-(--bg-surface)"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Add to Cart + Buy Now */}
              <div className="flex gap-3 mb-8">
                <motion.button
                  onClick={handleAddToCart}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-sm transition-all duration-300"
                  style={{
                    background: addedToCart
                      ? 'rgba(34,197,94,0.15)'
                      : 'linear-gradient(135deg, var(--accent-gold), var(--accent-rose))',
                    color: addedToCart ? '#22c55e' : '#0A0A0F',
                    border: addedToCart ? '1px solid #22c55e' : 'none',
                  }}
                >
                  {addedToCart ? (
                    <><Check size={16} /> Added!</>
                  ) : (
                    <><ShoppingBag size={16} /> Add to Cart</>
                  )}
                </motion.button>
                <Link
                  href="/checkout"
                  className="flex-1 flex items-center justify-center py-4 rounded-2xl font-semibold text-sm transition-all duration-200 hover:bg-(--bg-elevated)"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                >
                  Buy Now
                </Link>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-3 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
                {[
                  { icon: Truck,       text: 'Free Delivery' },
                  { icon: ShieldCheck, text: 'Secure Payment' },
                  { icon: RefreshCw,   text: '30-Day Returns' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex flex-col items-center gap-1.5 text-center">
                    <Icon size={16} style={{ color: 'var(--accent-gold)' }} />
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </>
  )
}
