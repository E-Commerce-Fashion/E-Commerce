'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { SlidersHorizontal, ChevronDown, Heart } from 'lucide-react'
import { type Product } from '@/components/product/ProductCard'
import api from '@/lib/axios'
import { useCartStore } from '@/store/cartStore'
import { formatCurrency } from '@/utils'
import { toast } from 'react-hot-toast'
import Image from 'next/image'

const categories = ['all', 'shirts', 'pants', 'dresses', 'jackets', 'accessories']
const sortOptions = [
  { label: 'Newest', value: 'created_at:desc' },
  { label: 'Price: Low → High', value: 'price:asc' },
  { label: 'Price: High → Low', value: 'price:desc' },
  { label: 'Top Rated', value: 'avg_rating:desc' },
]
const filterRows = ['Status', 'Price', 'Collections', 'Chains', 'Categories', 'On Sale In']

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <main className="page-with-navbar-offset min-h-screen px-3 sm:px-6 lg:px-8 pb-16 bg-linear-to-br from-[#5f3a45] via-[#2a284f] to-[#161b42]">
          <div className="mx-auto  pt-2 sm:pt-3">
            <div className="flex flex-col lg:flex-row gap-5">
              <div className="lg:w-64 shrink-0">
                <div className="h-130 rounded-xl border border-white/10 bg-white/6 skeleton" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="h-11 rounded-xl border border-white/10 bg-white/6 skeleton mb-4" />
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-white/10 bg-[#222954]/75 overflow-hidden">
                      <div className="aspect-4/5 skeleton bg-[#2d3568]/70" />
                      <div className="p-3 space-y-2.5">
                        <div className="h-2.5 w-24 skeleton rounded-full" />
                        <div className="h-4.5 w-2/3 skeleton rounded" />
                        <div className="h-3 w-16 skeleton rounded" />
                        <div className="h-8 rounded-lg skeleton" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      }
    >
      <ProductsPageContent />
    </Suspense>
  )
}

function ProductsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get('category') || 'all'

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  const [category, setCategory] = useState(initialCategory)
  const [sortBy, setSortBy] = useState('created_at:desc')
  const [searchQuery, setSearchQuery] = useState('')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000])
  const [filterOpen, setFilterOpen] = useState(false)
  const [wishlisted, setWishlisted] = useState<Record<string, boolean>>({})

  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)

  const fetchProducts = useCallback(async (pageNum = 1, append = false) => {
    try {
      setLoading(true)
      const [sort, order] = sortBy.split(':')
      const params: Record<string, string | number> = {
        page: pageNum,
        limit: 9,
        sort,
        order,
      }

      if (category !== 'all') params.category = category
      if (searchQuery) params.search = searchQuery
      if (priceRange[0] > 0) params.minPrice = priceRange[0]
      if (priceRange[1] < 10000) params.maxPrice = priceRange[1]

      const { data } = await api.get('/products', { params })
      if (data.success) {
        setProducts(append ? (prev) => [...prev, ...data.data] : data.data)
        setTotalCount(data.pagination.total)
        setHasMore(data.pagination.hasNextPage)
      }
    } catch {
      setProducts([])
      setTotalCount(0)
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [category, sortBy, searchQuery, priceRange])

  useEffect(() => {
    setPage(1)
    fetchProducts(1, false)
  }, [fetchProducts])

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchProducts(nextPage, true)
  }

  const filteredProducts = inStockOnly
    ? products.filter((p) => (p.sizes || []).some((s) => Number(s.stock) > 0))
    : products

  const activeSortLabel = sortOptions.find((s) => s.value === sortBy)?.label || 'Newest'

  const handleBuyNow = (product: Product) => {
    const primary = (product.sizes || []).find((s) => Number(s.stock) > 0)
    if (!primary) {
      toast.error('Out of stock')
      return
    }
    addItem({
      product_id: product.id,
      name: product.name,
      price: product.discount_price || product.price,
      size: String(primary.size || 'Free'),
      qty: 1,
      image: product.images?.[0]?.url || '/placeholder-product.svg',
      stock: Number(primary.stock || 1),
    })
    openCart()
    toast.success('Added to cart')
  }

  return (
    <main className="page-with-navbar-offset min-h-screen px-3 sm:px-6 lg:px-8 pb-16 bg-linear-to-br from-[#5f3a45] via-[#2a284f] to-[#161b42]">
      <div className="mx-auto  pt-2 sm:pt-3">
        <div className="flex flex-col lg:flex-row gap-5">
          <aside className="lg:w-64 shrink-0">
            <button
              onClick={() => setFilterOpen((prev) => !prev)}
              className="lg:hidden mb-3 inline-flex items-center gap-2 rounded-lg border border-white/12 bg-white/8 px-3 py-2 text-sm text-white/85"
            >
              <SlidersHorizontal size={16} />
              Filters
            </button>

            <div className={`${filterOpen ? 'block' : 'hidden'} lg:block rounded-xl border border-white/10 bg-white/7 backdrop-blur-md p-4`}>
              <div className="flex items-center gap-2 text-white mb-4">
                <SlidersHorizontal size={16} />
                <p className="text-xl font-semibold">Filters</p>
              </div>

              <div className="space-y-1 mb-4">
                {filterRows.map((row) => (
                  <button
                    key={row}
                    className="w-full flex items-center justify-between rounded-lg px-2.5 py-2.5 text-left text-white/90 text-sm hover:bg-white/6 transition-colors"
                  >
                    <span>{row}</span>
                    <ChevronDown size={14} className="opacity-70" />
                  </button>
                ))}
              </div>

              <div className="space-y-3 border-t border-white/10 pt-4">
                <label className="flex items-center gap-2 text-sm text-white/90">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="accent-violet-500"
                  />
                  In stock only
                </label>

                <div>
                  <p className="text-xs text-white/70 mb-2">Max Price: ₹{priceRange[1]}</p>
                  <input
                    type="range"
                    min={500}
                    max={10000}
                    step={100}
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([0, Number(e.target.value)])}
                    className="w-full accent-violet-500"
                  />
                </div>
              </div>
            </div>
          </aside>

          <section className="flex-1 min-w-0">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-white/75 text-sm">{totalCount.toLocaleString()} items</p>

              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="appearance-none rounded-md border border-white/18 bg-[#1d244a]/70 px-3 py-2 pr-8 text-sm text-white outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c} className="bg-[#111735] text-white capitalize">{c === 'all' ? 'All Items' : c}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/70" />
                </div>

                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none rounded-md border border-white/18 bg-[#1d244a]/70 px-3 py-2 pr-8 text-sm text-white outline-none"
                  >
                    {sortOptions.map((s) => (
                      <option key={s.value} value={s.value} className="bg-[#111735] text-white">{s.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/70" />
                </div>
              </div>
            </div>

            {loading && products.length === 0 ? (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-white/10 bg-[#222954]/75 overflow-hidden">
                    <div className="aspect-4/5 skeleton bg-[#2d3568]/70" />
                    <div className="p-3 space-y-2.5">
                      <div className="h-2.5 w-24 skeleton rounded-full" />
                      <div className="h-4.5 w-2/3 skeleton rounded" />
                      <div className="h-3 w-16 skeleton rounded" />
                      <div className="h-8 rounded-lg skeleton" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-xl border border-white/12 bg-[#1d244a]/60 p-10 text-center text-white/80">
                No products match the selected filters.
              </div>
            ) : (
              <>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredProducts.map((product) => {
                    const price = product.discount_price || product.price
                    const img = product.images?.[0]?.url || '/placeholder-product.svg'
                    return (
                      <motion.article
                        key={product.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                        className="rounded-xl border border-white/10 bg-[#222954]/80 p-2.5"
                      >
                        <button
                          onClick={() => router.push(`/products/${product.id}`)}
                          className="w-full text-left"
                        >
                          <div className="relative aspect-4/5 overflow-hidden rounded-md bg-[#1a1f3f]">
                            <Image
                              src={img}
                              alt={product.name}
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                              className="object-cover"
                            />
                          </div>
                        </button>

                        <div className="mt-2.5 px-1">
                          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-white/45">
                            <span>{String(product.category || 'Collection').slice(0, 18)}</span>
                            <span>{String(product.id).slice(0, 8)}</span>
                          </div>
                          <p className="mt-1 text-sm font-semibold text-white line-clamp-1">{product.name}</p>
                          <p className="mt-1 text-sm font-bold text-white">{formatCurrency(price)}</p>

                          <div className="mt-2.5 flex items-center gap-2">
                            <button
                              onClick={() => setWishlisted((prev) => ({ ...prev, [product.id]: !prev[product.id] }))}
                              className="w-8 h-8 rounded-full border border-white/15 bg-[#1a1f3f] flex items-center justify-center text-white/85"
                              aria-label="Wishlist"
                            >
                              <Heart
                                size={14}
                                fill={wishlisted[product.id] ? '#ef4444' : 'none'}
                                color={wishlisted[product.id] ? '#ef4444' : 'currentColor'}
                              />
                            </button>

                            <button
                              onClick={() => handleBuyNow(product)}
                              className="flex-1 h-8 rounded-md bg-linear-to-r from-violet-600 to-fuchsia-500 text-white text-xs font-semibold"
                            >
                              Buy Now
                            </button>
                          </div>
                        </div>
                      </motion.article>
                    )
                  })}
                </div>

                {hasMore && (
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={loadMore}
                      disabled={loading}
                      className="rounded-md border border-white/20 bg-white/10 px-6 py-2 text-sm font-medium text-white hover:bg-white/15 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Loading...' : `Load More (${activeSortLabel})`}
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
