'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { SlidersHorizontal, X, ChevronDown, Grid3X3, LayoutList, Search } from 'lucide-react'
import { ProductCard, type Product } from '@/components/product/ProductCard'
import api from '@/lib/axios'

const categories = ['all', 'shirts', 'pants', 'dresses', 'jackets', 'accessories']
const sortOptions = [
  { label: 'Newest',        value: 'created_at:desc' },
  { label: 'Price: Low → High', value: 'price:asc' },
  { label: 'Price: High → Low', value: 'price:desc' },
  { label: 'Top Rated',     value: 'avg_rating:desc' },
]
const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <main className="page-with-navbar-offset pb-20 px-3 sm:px-6 lg:px-8 min-h-screen w-full" style={{ background: 'var(--bg-base)' }}>
          <div className="w-full space-y-4">
            <div className="h-10 w-56 skeleton rounded-2xl" />
            <div className="h-16 skeleton rounded-2xl" />
            <div className="grid gap-5 grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                  <div className="aspect-3/4 skeleton" />
                  <div className="p-4 space-y-3">
                    <div className="h-3 w-16 skeleton rounded" />
                    <div className="h-4 w-3/4 skeleton rounded" />
                    <div className="h-4 w-1/2 skeleton rounded" />
                  </div>
                </div>
              ))}
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
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get('category') || 'all'

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  // Filters
  const [category, setCategory] = useState(initialCategory)
  const [sortBy, setSortBy] = useState('created_at:desc')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000])
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const fetchProducts = useCallback(async (pageNum = 1, append = false) => {
    try {
      setLoading(true)
      const [sort, order] = sortBy.split(':')
      const params: Record<string, string | number> = {
        page: pageNum,
        limit: 12,
        sort,
        order,
      }
      if (category !== 'all') params.category = category
      if (searchQuery) params.search = searchQuery
      if (selectedSizes.length) params.sizes = selectedSizes.join(',')
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
  }, [category, sortBy, searchQuery, selectedSizes, priceRange])

  useEffect(() => {
    setPage(1)
    fetchProducts(1, false)
  }, [fetchProducts])

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    fetchProducts(next, true)
  }

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    )
  }

  const clearFilters = () => {
    setCategory('all')
    setSelectedSizes([])
    setPriceRange([0, 10000])
    setSearchQuery('')
    setSortBy('created_at:desc')
  }

  const activeFilterCount = [
    category !== 'all' ? 1 : 0,
    selectedSizes.length > 0 ? 1 : 0,
    priceRange[0] > 0 || priceRange[1] < 10000 ? 1 : 0,
  ].reduce((a, b) => a + b, 0)

  return (
    <>
      <main className="page-with-navbar-offset pb-20 px-3 sm:px-6 lg:px-8 min-h-screen w-full" style={{ background: 'var(--bg-base)' }}>
        <div className="w-full">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"
          >
            <h1 className="text-3xl sm:text-4xl font-bold font-serif" style={{ color: 'var(--text-primary)' }}>
              {category !== 'all' ? <span className="capitalize">{category}</span> : 'All Collections'}
            </h1>
            <p className="text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>
              {totalCount} products {category !== 'all' && `in ${category}`}
            </p>
          </motion.div>

          {/* Toolbar */}
          <div
            className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 mb-6 p-3 sm:p-5 rounded-2xl"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            {/* Search */}
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl w-full sm:flex-1 min-w-0 sm:min-w-50 max-w-none sm:max-w-2xl"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              <Search size={16} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none text-sm flex-1"
                style={{ color: 'var(--text-primary)' }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}>
                  <X size={14} style={{ color: 'var(--text-muted)' }} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              {/* Filter toggle */}
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className="relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  background: filterOpen ? 'rgba(var(--accent-gold-rgb), 0.1)' : 'var(--bg-elevated)',
                  border: `1px solid ${filterOpen ? 'var(--accent-gold)' : 'var(--border)'}`,
                  color: filterOpen ? 'var(--accent-gold)' : 'var(--text-secondary)',
                }}
              >
                <SlidersHorizontal size={14} />
                Filters
                {activeFilterCount > 0 && (
                  <span
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{ background: 'var(--accent-gold)', color: '#0A0A0F' }}
                  >
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Sort dropdown */}
              <div className="relative">
                <button
                  onClick={() => setSortOpen(!sortOpen)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                >
                  Sort
                  <ChevronDown size={14} className={`transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {sortOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="absolute right-0 top-full mt-2 w-48 rounded-xl shadow-lg overflow-hidden z-20"
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                    >
                      {sortOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => { setSortBy(opt.value); setSortOpen(false) }}
                          className="block w-full text-left px-4 py-2.5 text-sm transition-colors"
                          style={{
                            color: sortBy === opt.value ? 'var(--accent-gold)' : 'var(--text-secondary)',
                            background: sortBy === opt.value ? 'rgba(var(--accent-gold-rgb), 0.05)' : 'transparent',
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* View mode */}
              <div className="hidden sm:flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <button
                  onClick={() => setViewMode('grid')}
                  className="p-2 transition-colors"
                  style={{
                    background: viewMode === 'grid' ? 'var(--accent-gold)' : 'var(--bg-elevated)',
                    color: viewMode === 'grid' ? '#0A0A0F' : 'var(--text-muted)',
                  }}
                >
                  <Grid3X3 size={14} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className="p-2 transition-colors"
                  style={{
                    background: viewMode === 'list' ? 'var(--accent-gold)' : 'var(--bg-elevated)',
                    color: viewMode === 'list' ? '#0A0A0F' : 'var(--text-muted)',
                  }}
                >
                  <LayoutList size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Filter panel */}
          <AnimatePresence>
            {filterOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden mb-6"
              >
                <div
                  className="p-6 rounded-2xl space-y-6"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                >
                  {/* Categories */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Category</p>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setCategory(cat)}
                          className="px-4 py-1.5 rounded-full text-sm capitalize transition-all duration-200"
                          style={{
                            background: category === cat ? 'var(--accent-gold)' : 'var(--bg-elevated)',
                            color: category === cat ? '#0A0A0F' : 'var(--text-secondary)',
                            border: `1px solid ${category === cat ? 'var(--accent-gold)' : 'var(--border)'}`,
                          }}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sizes */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Size</p>
                    <div className="flex flex-wrap gap-2">
                      {sizeOptions.map((size) => (
                        <button
                          key={size}
                          onClick={() => toggleSize(size)}
                          className="w-10 h-10 rounded-xl text-xs font-semibold flex items-center justify-center transition-all duration-200"
                          style={{
                            background: selectedSizes.includes(size) ? 'var(--accent-gold)' : 'var(--bg-elevated)',
                            color: selectedSizes.includes(size) ? '#0A0A0F' : 'var(--text-secondary)',
                            border: `1px solid ${selectedSizes.includes(size) ? 'var(--accent-gold)' : 'var(--border)'}`,
                          }}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
                      Price Range: ₹{priceRange[0]} — ₹{priceRange[1]}
                    </p>
                    <input
                      type="range"
                      min={0}
                      max={10000}
                      step={100}
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                      className="w-full accent-(--accent-gold)"
                    />
                  </div>

                  {/* Clear button */}
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-sm font-medium transition-colors"
                      style={{ color: 'var(--accent-rose)' }}
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Product Grid */}
          {loading && products.length === 0 ? (
            <div
              className={`grid gap-5 ${viewMode === 'grid' ? 'grid-cols-[repeat(auto-fill,minmax(240px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(260px,1fr))] xl:grid-cols-[repeat(auto-fill,minmax(280px,1fr))]' : 'grid-cols-1'}`}
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                  <div className="aspect-3/4 skeleton" />
                  <div className="p-4 space-y-3">
                    <div className="h-3 w-16 skeleton rounded" />
                    <div className="h-4 w-3/4 skeleton rounded" />
                    <div className="h-4 w-1/2 skeleton rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <p className="text-4xl mb-4">🔍</p>
              <p className="text-lg font-semibold font-serif" style={{ color: 'var(--text-primary)' }}>No products found</p>
              <p className="mt-2" style={{ color: 'var(--text-muted)' }}>Try adjusting your filters or search query.</p>
              <button
                onClick={clearFilters}
                className="mt-4 px-6 py-2 rounded-xl text-sm font-semibold"
                style={{ background: 'var(--accent-gold)', color: '#0A0A0F' }}
              >
                Clear Filters
              </button>
            </motion.div>
          ) : (
            <>
              <div className={`grid gap-5 ${viewMode === 'grid' ? 'grid-cols-[repeat(auto-fill,minmax(240px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(260px,1fr))] xl:grid-cols-[repeat(auto-fill,minmax(280px,1fr))]' : 'grid-cols-1 md:grid-cols-2'}`}>
                {products.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>

              {hasMore && (
                <div className="flex justify-center mt-10">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="px-8 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 hover:opacity-90 disabled:opacity-50"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  >
                    {loading ? 'Loading...' : 'Load More Products'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  )
}
