'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion'
import { ArrowLeft, ArrowRight, Play, Sparkles, ShieldCheck, Truck, RotateCcw } from 'lucide-react'
import api from '@/lib/axios'
import { ProductCard, type Product } from '@/components/product/ProductCard'

const promoItems = ['Black Friday sale 50% off', 'Members get free express shipping', 'New outerwear drop is live']

const slides = [
  {
    title: 'Premium wear for modern living',
    subtitle: 'Discover our curated line of sharp silhouettes, soft textures, and confident layers for every season.',
    tag: 'Soft warm winter layers',
    image: '/background/hero-futuristic-store.jpg',
    thumb: '/background/hero-futuristic-store.jpg',
  },
  {
    title: 'Minimal cuts. Maximum presence.',
    subtitle: 'Tailored pieces and clean details built to move from day shifts to city nights.',
    tag: 'Urban essentials',
    image: '/background/color-rack.jpg',
    thumb: '/background/color-rack.jpg',
  },
  {
    title: 'Layered textures, refined attitude',
    subtitle: 'From oversized coats to slim basics, create looks that feel modern but effortless.',
    tag: 'Street luxe',
    image: '/background/hero-futuristic-store-alt.jpg',
    thumb: '/background/hero-futuristic-store-alt.jpg',
  },
  {
    title: 'Sharp classics for every edit',
    subtitle: 'New-season palettes, premium fabric, and silhouettes that age well in your wardrobe.',
    tag: 'Signature edits',
    image: '/background/hoodie-set.jpg',
    thumb: '/background/hoodie-set.jpg',
  },
]

const moodboards = [
  {
    title: 'Everyday Tailoring',
    desc: 'Streamlined layers in neutral shades for work and weekend.',
    image: '/background/color-rack.jpg',
  },
  {
    title: 'After-Hours Edit',
    desc: 'Crisp textures and deeper tones for evening looks.',
    image: '/background/neon-sale.jpg',
  },
  {
    title: 'Weekend Street Set',
    desc: 'Relaxed proportions with premium comfort fabrics.',
    image: '/background/hero-futuristic-store.jpg',
  },
]

const serviceHighlights = [
  { title: 'White-glove quality', desc: 'Premium materials and strict quality checks in every drop.', icon: ShieldCheck },
  { title: '48-hour dispatch', desc: 'Fast movement from warehouse to your doorstep.', icon: Truck },
  { title: 'Hassle-free returns', desc: 'Simple return flow with transparent status updates.', icon: RotateCcw },
]

const wearixHighlights = [
  { title: 'Curated drops', desc: 'New pieces selected for layered, modern looks.' },
  { title: 'Fast navigation', desc: 'Editorial layout with clear paths to product pages.' },
  { title: 'Responsive flow', desc: 'Spacing and composition adapt cleanly across screens.' },
  { title: 'Premium finish', desc: 'Balanced motion, typography, and dark luxury styling.' },
]

function useSystemReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  return reducedMotion
}

export default function HomePage() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [recentProducts, setRecentProducts] = useState<Product[]>([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const [mobileSlideIndex, setMobileSlideIndex] = useState(0)
  const shouldReduceMotion = useSystemReducedMotion()
  const { scrollYProgress } = useScroll()
  const activeSlide = useMemo(() => slides[activeIndex], [activeIndex])
  const heroImageScale = useTransform(scrollYProgress, [0, 0.34], [1, shouldReduceMotion ? 1 : 1.06])
  const heroImageY = useTransform(scrollYProgress, [0, 0.34], [0, shouldReduceMotion ? 0 : 54])
  const heroGlowOpacity = useTransform(scrollYProgress, [0, 0.22], [0.8, 0.5])

  const categories = useMemo(() => {
    const values = Array.from(new Set(recentProducts.map((item) => String(item.category || '').trim()).filter(Boolean)))
    return ['all', ...values]
  }, [recentProducts])

  const filteredRecentProducts = useMemo(() => {
    const list = activeCategory === 'all'
      ? recentProducts
      : recentProducts.filter((item) => item.category === activeCategory)
    return list.slice(0, 8)
  }, [activeCategory, recentProducts])

  const mobileRecentSlides = useMemo(() => {
    const chunkSize = 4
    const chunks: Product[][] = []
    for (let i = 0; i < filteredRecentProducts.length; i += chunkSize) {
      chunks.push(filteredRecentProducts.slice(i, i + chunkSize))
    }
    return chunks
  }, [filteredRecentProducts])

  const categoryCoverImage = useMemo(() => {
    const scoped = activeCategory === 'all'
      ? recentProducts
      : recentProducts.filter((item) => item.category === activeCategory)
    const withImage = scoped.find((item) => item.images?.[0]?.url)
    if (withImage?.images?.[0]?.url) return withImage.images[0].url
    const anyImage = recentProducts.find((item) => item.images?.[0]?.url)
    return anyImage?.images?.[0]?.url || '/background/hero-futuristic-store.jpg'
  }, [activeCategory, recentProducts])

  const categoryBrowseHref = useMemo(() => {
    if (activeCategory === 'all') return '/products'
    return `/products?category=${encodeURIComponent(activeCategory)}`
  }, [activeCategory])

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const fetchRecentProducts = async () => {
      try {
        const { data } = await api.get('/products', {
          params: { limit: 40, sort: 'created_at', order: 'desc' },
        })

        if (data.success) {
          setRecentProducts((data.data || []) as Product[])
        }
      } catch {
        setRecentProducts([])
      }
    }

    fetchRecentProducts()
  }, [])

  useEffect(() => {
    if (mobileRecentSlides.length <= 1) return
    if (typeof window === 'undefined') return
    const mediaQuery = window.matchMedia('(max-width: 639px)')
    if (!mediaQuery.matches) return

    const timer = window.setInterval(() => {
      setMobileSlideIndex((prev) => (prev + 1) % mobileRecentSlides.length)
    }, 4200)

    return () => window.clearInterval(timer)
  }, [mobileRecentSlides.length])

  return (
    <>
      <motion.div
        className="pointer-events-none fixed inset-x-0 top-0 z-70 h-0.5 origin-left"
        style={{
          scaleX: scrollYProgress,
          background: 'linear-gradient(90deg, var(--accent-gold), var(--accent-rose), rgba(var(--accent-gold-rgb), 0.72))',
          boxShadow: '0 0 20px rgba(var(--accent-gold-rgb), 0.42)',
        }}
      />

      <main className="home-ambient relative min-h-screen overflow-x-clip" style={{ background: 'var(--bg-base)' }}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -left-20 top-1 h-112 w-md rounded-none"
            style={{ background: 'radial-gradient(circle, rgba(var(--accent-gold-rgb), 0.18), transparent 70%)', filter: 'blur(26px)' }}
            animate={shouldReduceMotion ? undefined : { x: [0, 50, 0], y: [0, 24, 0] }}
            transition={shouldReduceMotion ? undefined : { duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -right-28 top-20 h-136 w-136 rounded-none"
            style={{ background: 'radial-gradient(circle, rgba(var(--accent-rose-rgb), 0.18), transparent 72%)', filter: 'blur(28px)' }}
            animate={shouldReduceMotion ? undefined : { x: [0, -40, 0], y: [0, 24, 0] }}
            transition={shouldReduceMotion ? undefined : { duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <section className="relative z-10 min-h-screen pb-0">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="relative w-full min-h-screen overflow-hidden"
          >
            <div className="absolute inset-x-0 top-0 z-20 overflow-hidden py-2" style={{ background: 'rgba(8,10,15,0.36)', backdropFilter: 'blur(8px)' }}>
              <div className="marquee-track">
                {[...promoItems, ...promoItems, ...promoItems].map((item, index) => (
                  <span key={`${item}-${index}`} className="mr-6 flex items-center gap-3 whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: 'rgba(244,240,232,0.92)' }}>
                    <Sparkles size={11} style={{ color: 'var(--accent-gold)' }} />
                    {item}
                  </span>
                ))}
              </div>
            </div>

              <div className="relative min-h-screen">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeSlide.image}
                    initial={{ opacity: 0, scale: 1.08 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.9, ease: 'easeOut' }}
                    className="absolute inset-0"
                    style={{ scale: heroImageScale, y: heroImageY }}
                  >
                    <Image
                      src={activeSlide.image}
                      alt={activeSlide.title}
                      fill
                      loading="eager"
                      sizes="100vw"
                      className="object-cover"
                    />
                  </motion.div>
                </AnimatePresence>

                <motion.div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    opacity: heroGlowOpacity,
                    background: 'radial-gradient(circle at 20% 18%, rgba(var(--accent-gold-rgb),0.2), transparent 44%), radial-gradient(circle at 82% 80%, rgba(var(--accent-rose-rgb),0.18), transparent 48%)',
                  }}
                />

                <div className="absolute inset-0 bg-linear-to-b from-black/80 via-black/55 to-black/40" />

                <div className="absolute inset-0 z-10 flex items-center justify-center px-4 pt-24 pb-12 sm:px-8 sm:pt-28 sm:pb-16 lg:px-12 lg:pt-32 lg:pb-20">
                  <div className="w-full max-w-4xl text-center">
                    <motion.div
                      key={`${activeIndex}-tag`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45 }}
                      className="inline-flex rounded-full px-4 py-2 text-[11px] sm:text-xs uppercase tracking-[0.2em]"
                      style={{ background: 'rgba(255,255,255,0.2)', color: '#F5F1E6', backdropFilter: 'blur(10px)' }}
                    >
                      {activeSlide.tag}
                    </motion.div>

                    <AnimatePresence mode="wait">
                      <motion.h1
                        key={`${activeIndex}-title`}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.55 }}
                        className="mx-auto mt-5 max-w-[14ch] text-[clamp(2.6rem,9.8vw,6.4rem)] sm:text-6xl lg:text-7xl xl:text-[6.4rem] font-bold leading-[0.95]"
                        style={{
                          background: 'linear-gradient(92deg, rgb(255,99,132) 0%, rgb(255,255,255) 45%, rgb(99,255,170) 73%, rgb(111,166,255) 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          textShadow: '0 10px 35px rgba(0,0,0,0.22)',
                        }}
                      >
                        {activeSlide.title}
                      </motion.h1>
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                      <motion.p
                        key={`${activeIndex}-subtitle`}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.5, delay: 0.05 }}
                        className="mx-auto mt-6 max-w-2xl px-2 text-sm sm:text-base lg:text-[1.04rem] leading-7 sm:leading-8"
                        style={{ color: 'rgba(245,243,238,0.9)' }}
                      >
                        {activeSlide.subtitle}
                      </motion.p>
                    </AnimatePresence>

                    <motion.div
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.15 }}
                      className="mt-9 flex flex-wrap items-center justify-center gap-3"
                    >
                      <motion.div whileHover={{ y: -2, scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                        <Link
                          href="/products"
                          id="hero-shop-btn"
                          className="group inline-flex items-center gap-2 rounded-full px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-semibold transition-all duration-300 hover:shadow-[0_18px_40px_rgba(0,0,0,0.38)]"
                          style={{ background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-rose))', color: '#0A0A0F', boxShadow: '0 12px 30px rgba(0,0,0,0.28)' }}
                        >
                          Shop Collection
                          <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                        </Link>
                      </motion.div>

                      <motion.div whileHover={{ y: -2, scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                        <Link
                          href="/products?featured=true"
                          className="group inline-flex items-center gap-2 rounded-full px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-semibold border transition-all duration-300 hover:shadow-[0_14px_36px_rgba(0,0,0,0.34)]"
                          style={{ borderColor: 'rgba(255,255,255,0.35)', color: '#F9F7F2', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}
                        >
                          <Play size={14} className="transition-transform duration-300 group-hover:scale-110" />
                          View Lookbook
                        </Link>
                      </motion.div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, delay: 0.28 }}
                      className="mt-6 flex flex-wrap items-center justify-center gap-2"
                    >
                      {[{ label: 'Secure checkout', icon: ShieldCheck }, { label: 'Express shipping', icon: Truck }, { label: 'Easy returns', icon: RotateCcw }].map(({ label, icon: Icon }) => (
                        <span
                          key={label}
                          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em]"
                          style={{ background: 'rgba(255,255,255,0.13)', color: '#F9F7F2' }}
                        >
                          <Icon size={12} />
                          {label}
                        </span>
                      ))}
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.32 }}
                      className="mt-9 flex items-center justify-center gap-2"
                    >
                      {slides.map((_, index) => (
                        <button
                          key={`dot-${index}`}
                          type="button"
                          aria-label={`Go to slide ${index + 1}`}
                          onClick={() => setActiveIndex(index)}
                          className="h-2.5 rounded-full transition-all"
                          style={{
                            width: activeIndex === index ? '2.05rem' : '0.6rem',
                            background: activeIndex === index ? 'var(--accent-gold)' : 'rgba(245,243,238,0.48)',
                          }}
                        />
                      ))}
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
        </section>

        <section className="w-full pb-10 sm:pb-14">
          <div className="mx-auto w-full max-w-screen-2xl px-3 sm:px-5 lg:px-6">
            <div className="w-full rounded-3xl border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <div className="relative mx-3 mt-3 h-52 sm:mx-5 sm:mt-5 sm:h-64 lg:h-72 rounded-2xl overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={categoryCoverImage}
                  initial={{ opacity: 0.35, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0.35, scale: 0.98 }}
                  transition={{ duration: 0.42, ease: 'easeOut' }}
                  className="absolute inset-0"
                >
                  <Image
                    src={categoryCoverImage}
                    alt="Category cover"
                    fill
                    sizes="100vw"
                    className="object-cover"
                  />
                </motion.div>
              </AnimatePresence>
              <div className="absolute inset-0 bg-linear-to-b from-black/30 via-black/50 to-black/78" />

              <div className="absolute left-4 right-4 top-4 sm:left-6 sm:right-6 sm:top-6 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em]" style={{ color: 'var(--accent-gold)' }}>Recently added</p>
                  <h2 className="mt-2 text-2xl sm:text-3xl font-bold" style={{ color: '#F4F1E8' }}>Fresh Drops by Category</h2>
                </div>
              </div>

              <div className="absolute left-4 right-4 bottom-4 sm:left-6 sm:right-6">
                <div className="relative flex flex-wrap gap-2">
                  {categories.map((category) => {
                    const active = activeCategory === category
                    const isGlowing = hoveredCategory === category || (!hoveredCategory && active)
                    return (
                      <div key={category} className="relative">
                        {isGlowing && (
                          <motion.span
                            layoutId="category-chip-glow"
                            className="pointer-events-none absolute -inset-1 rounded-full"
                            style={{
                              background: 'radial-gradient(circle at center, rgba(var(--accent-gold-rgb), 0.42), rgba(var(--accent-rose-rgb), 0.28), transparent 72%)',
                              filter: 'blur(10px)',
                            }}
                            transition={{ duration: 0.24, ease: 'easeOut' }}
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveCategory(category)
                            setMobileSlideIndex(0)
                          }}
                          onMouseEnter={() => setHoveredCategory(category)}
                          onMouseLeave={() => setHoveredCategory(null)}
                          className="relative rounded-full px-4 py-2 text-xs sm:text-sm font-semibold capitalize transition-all duration-300 hover:-translate-y-0.5"
                          style={{
                            background: active ? 'linear-gradient(135deg, var(--accent-gold), var(--accent-rose))' : 'rgba(255,255,255,0.12)',
                            color: active ? '#0A0A0F' : '#F4F1E8',
                            border: active ? '1px solid transparent' : '1px solid rgba(255,255,255,0.24)',
                            boxShadow: active ? '0 10px 24px rgba(0,0,0,0.3)' : 'none',
                          }}
                        >
                          {category}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="px-4 pb-4 sm:px-6 sm:pb-6 lg:px-7">
              <div className="mb-4 mt-4 flex items-center justify-between gap-3 px-2 sm:px-3">
                <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Showing {filteredRecentProducts.length} recent styles
                </p>
                <Link
                  href={categoryBrowseHref}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs sm:text-sm font-semibold border transition-all duration-300 hover:-translate-y-0.5"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-primary)', background: 'var(--bg-elevated)' }}
                >
                  {activeCategory === 'all' ? 'View all products' : `View all in ${activeCategory}`}
                  <ArrowRight size={14} />
                </Link>
              </div>

              {filteredRecentProducts.length === 0 ? (
                <div className="rounded-xl border p-7 text-center" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No recent products in this category yet.</p>
                </div>
              ) : (
                <>
                  <div className="sm:hidden px-2 sm:px-3">
                    <div className="overflow-hidden">
                      <motion.div
                        className="flex"
                        animate={{ x: `-${mobileSlideIndex * 100}%` }}
                        transition={{ duration: 0.45, ease: 'easeOut' }}
                      >
                        {mobileRecentSlides.map((slide, slideIndex) => (
                          <div key={`mobile-slide-${slideIndex}`} className="w-full shrink-0">
                            <div className="grid grid-cols-2 gap-3">
                              {slide.map((product) => (
                                <div key={product.id} className="rounded-2xl p-px" style={{ background: 'linear-gradient(135deg, rgba(var(--accent-gold-rgb),0.38), rgba(var(--accent-rose-rgb),0.22), rgba(255,255,255,0.06))' }}>
                                  <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-surface)' }}>
                                    <div className="scale-[0.96] origin-top">
                                      <ProductCard product={product} index={0} />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    </div>

                    {mobileRecentSlides.length > 1 && (
                      <div className="mt-4 flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setMobileSlideIndex((prev) => (prev - 1 + mobileRecentSlides.length) % mobileRecentSlides.length)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border"
                          style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                          aria-label="Previous products"
                        >
                          <ArrowLeft size={14} />
                        </button>

                        {mobileRecentSlides.map((_, dotIndex) => (
                          <button
                            key={`mobile-dot-${dotIndex}`}
                            type="button"
                            onClick={() => setMobileSlideIndex(dotIndex)}
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: mobileSlideIndex === dotIndex ? '1.7rem' : '0.55rem',
                              background: mobileSlideIndex === dotIndex ? 'var(--accent-gold)' : 'var(--border-strong)',
                            }}
                            aria-label={`Go to product slide ${dotIndex + 1}`}
                          />
                        ))}

                        <button
                          type="button"
                          onClick={() => setMobileSlideIndex((prev) => (prev + 1) % mobileRecentSlides.length)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border"
                          style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                          aria-label="Next products"
                        >
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 px-2 sm:px-3">
                    {filteredRecentProducts.map((product, index) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 14 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.34, delay: index * 0.045 }}
                        className="rounded-2xl p-px"
                        style={{ background: 'linear-gradient(135deg, rgba(var(--accent-gold-rgb),0.4), rgba(var(--accent-rose-rgb),0.24), rgba(255,255,255,0.06))' }}
                      >
                        <div className="rounded-[14px] overflow-hidden" style={{ background: 'var(--bg-surface)' }}>
                          <div className="scale-[0.98] origin-top">
                            <ProductCard product={product} index={0} />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </div>
            </div>
          </div>
        </section>

        <section className="w-full px-3 sm:px-5 lg:px-6 pb-10 sm:pb-14">
          <div className="w-full">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-7 flex items-end justify-between gap-4"
            >
              <div>
                <p className="text-xs uppercase tracking-[0.22em]" style={{ color: 'var(--accent-gold)' }}>Featured edit</p>
                <h2 className="mt-2 text-3xl sm:text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Style Moodboards
                </h2>
              </div>
              <Link href="/products" className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Explore all
                <ArrowRight size={14} />
              </Link>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
              {moodboards.map((board, index) => (
                <motion.article
                  key={board.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                  className="home-lift-card group overflow-hidden rounded-2xl border transition-all duration-300"
                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                >
                  <div className="relative h-56 sm:h-64 overflow-hidden">
                    <Image
                      src={board.image}
                      alt={board.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 380px"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{board.title}</h3>
                    <p className="mt-2 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>{board.desc}</p>
                    <Link href="/products" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold transition-all duration-300 group-hover:gap-2" style={{ color: 'var(--accent-gold)' }}>
                      Shop this vibe
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full px-3 sm:px-5 lg:px-6 pb-10 sm:pb-14">
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {serviceHighlights.map(({ title, desc, icon: Icon }, index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className="home-lift-card home-lift-card-soft group rounded-none border p-4 sm:p-5 transition-all duration-300"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
              >
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-none" style={{ background: 'rgba(var(--accent-gold-rgb),0.12)', color: 'var(--accent-gold)' }}>
                  <Icon size={18} />
                </div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</p>
                <p className="mt-1 text-xs sm:text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="w-full px-3 sm:px-5 lg:px-6 pb-16 sm:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.56 }}
            className="home-glow-surface w-full rounded-2xl border px-5 sm:px-8 lg:px-10 py-7 sm:py-9"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.22em]" style={{ color: 'var(--accent-gold)' }}>Why Wearix</p>
                <h2 className="mt-2 text-3xl sm:text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Designed to feel calm, premium, and easy to shop.
                </h2>
                <p className="mt-4 max-w-xl text-sm sm:text-base leading-7" style={{ color: 'var(--text-secondary)' }}>
                  The home page now highlights the collection in a cleaner editorial rhythm, with larger imagery, smoother transitions, and content blocks that help users browse without visual clutter.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {wearixHighlights.map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.42, delay: index * 0.06 }}
                    className="home-fade-in-card rounded-xl border p-4"
                    style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
                  >
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
                    <p className="mt-1 text-xs sm:text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        <footer className="w-full px-3 sm:px-5 lg:px-6 pb-10 sm:pb-14">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="home-glow-surface w-full rounded-2xl border px-5 sm:px-8 lg:px-10 py-8"
            style={{ background: 'linear-gradient(135deg, rgba(var(--accent-gold-rgb),0.1), rgba(var(--accent-rose-rgb),0.08), var(--bg-surface))', borderColor: 'var(--border)' }}
          >
            <div className="grid gap-7 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
              <div>
                <p className="font-serif text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>FashionForge</p>
                <p className="mt-2 max-w-md text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
                  Premium wardrobe essentials with refined silhouettes, crafted for modern everyday wear.
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--accent-gold)' }}>Shop</p>
                <div className="mt-3 flex flex-col gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <Link href="/products" className="hover:underline">All Products</Link>
                  <Link href="/products?sort=created_at&order=desc" className="hover:underline">New Arrivals</Link>
                  <Link href="/products?sale=true" className="hover:underline">Sale Picks</Link>
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--accent-gold)' }}>Account</p>
                <div className="mt-3 flex flex-col gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <Link href="/profile" className="hover:underline">Profile</Link>
                  <Link href="/orders" className="hover:underline">Orders</Link>
                  <Link href="/wishlist" className="hover:underline">Wishlist</Link>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t pt-4 text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
              © {new Date().getFullYear()} FashionForge. All rights reserved.
            </div>
          </motion.div>
        </footer>
      </main>
    </>
  )
}
