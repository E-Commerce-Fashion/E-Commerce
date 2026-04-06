'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Heart, ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '@/lib/axios'
import { useUserStore } from '@/store/userStore'
import { AccountShell } from '@/components/account/AccountShell'
import { ProductCard, type Product } from '@/components/product/ProductCard'

export default function WishlistPage() {
  const router = useRouter()
  const { isAuthenticated, hasHydrated } = useUserStore()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<Product[]>([])

  useEffect(() => {
    if (!hasHydrated) return

    if (!isAuthenticated) {
      router.replace('/login')
      return
    }

    const fetchWishlist = async () => {
      try {
        const { data } = await api.get('/products/user/wishlist')
        if (data.success) {
          setItems((data.data || []) as Product[])
        }
      } catch {
        setItems([])
        toast.error('Failed to load wishlist')
      } finally {
        setLoading(false)
      }
    }

    fetchWishlist()
  }, [hasHydrated, isAuthenticated, router])

  return (
    <AccountShell
      title="Wishlist"
      subtitle="Your saved products and favorites in one place."
    >
      <div className="w-full">
        {loading ? (
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            <Loader2 size={16} className="animate-spin" />
            Loading wishlist...
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            {items.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-8 text-center"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(var(--accent-rose-rgb), 0.12)' }}>
              <Heart size={24} style={{ color: 'var(--accent-rose)' }} />
            </div>
            <h1 className="text-3xl font-bold font-serif" style={{ color: 'var(--text-primary)' }}>
              Your Wishlist
            </h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              Wishlist features will appear here as you save your favorite items.
            </p>

            <Link
              href="/products"
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-rose))', color: '#0A0A0F' }}
            >
              Browse Products
              <ArrowRight size={16} />
            </Link>
          </motion.div>
        )}
      </div>
    </AccountShell>
  )
}
