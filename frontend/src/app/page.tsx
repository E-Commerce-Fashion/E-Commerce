'use client'

import { type MouseEvent, type ReactNode, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { AnimatePresence, motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion'
import { ArrowRight, Play, Sparkles, ShieldCheck, Truck, RotateCcw, Star, User } from 'lucide-react'
import api from '@/lib/axios'
import { type Product } from '@/components/product/ProductCard'
import { ThreeDCarousel, RecentProductsSection } from '@/components/home/HomeComponents'

const carouselItems = [
  {
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1020&auto=format&fit=crop',
    title: 'Avant-Garde Silhouette',
    category: 'Editorial',
    price: '₹14,999',
    link: '/products'
  },
  {
    image: 'https://images.unsplash.com/photo-1550614000-4895a10e1bfd?q=80&w=1000&auto=format&fit=crop',
    title: 'Monochrome Minimalist',
    category: 'High Street',
    price: '₹8,499',
    link: '/products'
  },
  {
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1000&auto=format&fit=crop',
    title: 'Urban Nomads',
    category: 'Streetwear',
    price: '₹6,999',
    link: '/products'
  },
  {
    image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1000&auto=format&fit=crop',
    title: 'Ethereal Layers',
    category: 'Couture',
    price: '₹18,499',
    link: '/products'
  },
  {
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=988&auto=format&fit=crop',
    title: 'Crimson Edge',
    category: 'Evening',
    price: '₹12,999',
    link: '/products'
  }
]

const promoItems = ['Black Friday sale 50% off', 'Members get free express shipping', 'New outerwear drop is live']

const slides = [
  {
    title: 'Premium wear for modern living',
    subtitle: 'Discover our curated line of sharp silhouettes, soft textures, and confident layers for every season.',
    tag: 'Soft warm winter layers',
    image: '/Background/hero-futuristic-store.jpg',
    thumb: '/Background/hero-futuristic-store.jpg',
  },
  {
    title: 'Minimal cuts. Maximum presence.',
    subtitle: 'Tailored pieces and clean details built to move from day shifts to city nights.',
    tag: 'Urban essentials',
    image: '/Background/color-rack.jpg',
    thumb: '/Background/color-rack.jpg',
  },
  {
    title: 'Layered textures, refined attitude',
    subtitle: 'From oversized coats to slim basics, create looks that feel modern but effortless.',
    tag: 'Street luxe',
    image: '/Background/hero-futuristic-store-alt.jpg',
    thumb: '/Background/hero-futuristic-store-alt.jpg',
  },
  {
    title: 'Sharp classics for every edit',
    subtitle: 'New-season palettes, premium fabric, and silhouettes that age well in your wardrobe.',
    tag: 'Signature edits',
    image: '/Background/hoodie-set.jpg',
    thumb: '/Background/hoodie-set.jpg',
  },
]

const moodboards = [
  {
    title: 'Everyday Tailoring',
    desc: 'Streamlined layers in neutral shades for work and weekend.',
    image: '/Background/color-rack.jpg',
  },
  {
    title: 'After-Hours Edit',
    desc: 'Crisp textures and deeper tones for evening looks.',
    image: '/Background/neon-sale.jpg',
  },
  {
    title: 'Weekend Street Set',
    desc: 'Relaxed proportions with premium comfort fabrics.',
    image: '/Background/hero-futuristic-store.jpg',
  },
]

const serviceHighlights = [
  { title: 'White-glove quality', desc: 'Premium materials and strict quality checks in every drop.', icon: ShieldCheck },
  { title: '48-hour dispatch', desc: 'Fast movement from warehouse to your doorstep.', icon: Truck },
  { title: 'Hassle-free returns', desc: 'Simple return flow with transparent status updates.', icon: RotateCcw },
]

const forgeHighlights = [
  { title: 'Curated drops', desc: 'New pieces selected for layered, modern looks.' },
  { title: 'Fast navigation', desc: 'Editorial layout with clear paths to product pages.' },
  { title: 'Responsive flow', desc: 'Spacing and composition adapt cleanly across screens.' },
  { title: 'Premium finish', desc: 'Balanced motion, typography, and dark luxury styling.' },
]

const heroMetrics = [
  { value: '150+', label: 'Curated Drops' },
  { value: '24h', label: 'Dispatch Rhythm' },
  { value: '4.9', label: 'Style Rating' },
]

const runwayNotes = [
  {
    title: 'Material First',
    desc: 'Soft-touch premium fabrics with structured drape for all-day confidence.',
  },
  {
    title: 'Tailored Motion',
    desc: 'Editorial layouts with cleaner hierarchy and smoother section transitions.',
  },
  {
    title: 'Built To Layer',
    desc: 'Looks designed to pair across seasons, palettes, and everyday occasions.',
  },
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

function usePerformanceMode(reducedMotion: boolean) {
  const [performanceMode, setPerformanceMode] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      setPerformanceMode(reducedMotion)
      return
    }

    const nav = navigator as Navigator & {
      deviceMemory?: number
      connection?: { saveData?: boolean }
    }

    const lowCoreCount = typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency <= 4
    const lowMemory = typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4
    const saveDataEnabled = Boolean(nav.connection?.saveData)
    const shortViewport = window.innerHeight <= 760

    setPerformanceMode(reducedMotion || lowCoreCount || lowMemory || saveDataEnabled || shortViewport)
  }, [reducedMotion])

  return performanceMode
}

function MagneticWrap({
  children,
  disabled,
}: {
  children: ReactNode
  disabled?: boolean
}) {
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const x = useSpring(pointerX, { stiffness: 210, damping: 18, mass: 0.35 })
  const y = useSpring(pointerY, { stiffness: 210, damping: 18, mass: 0.35 })

  const handleMove = (event: MouseEvent<HTMLDivElement>) => {
    if (disabled) return
    const rect = event.currentTarget.getBoundingClientRect()
    const offsetX = (event.clientX - rect.left - rect.width / 2) * 0.12
    const offsetY = (event.clientY - rect.top - rect.height / 2) * 0.16
    pointerX.set(offsetX)
    pointerY.set(offsetY)
  }

  const handleLeave = () => {
    pointerX.set(0)
    pointerY.set(0)
  }

  return (
    <motion.div
      className="home-magnetic"
      style={{ x, y }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      {children}
    </motion.div>
  )
}

export default function HomePage() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [recentProducts, setRecentProducts] = useState<Product[]>([])
  const [recentReviews, setRecentReviews] = useState<any[]>([])
  const [activeCategory, setActiveCategory] = useState('all')
  const shouldReduceMotion = useSystemReducedMotion()
  const performanceMode = usePerformanceMode(shouldReduceMotion)
  const { scrollYProgress } = useScroll()
  const activeSlide = useMemo(() => slides[activeIndex], [activeIndex])
  const smoothScrollProgress = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: 0.22 })
  const heroGlowOpacity = useTransform(scrollYProgress, [0, 0.22], [0.8, 0.5])
  const heroParallaxY = useTransform(scrollYProgress, [0, 0.38], [0, 72])
  const heroParallaxScale = useTransform(scrollYProgress, [0, 0.32], [1.08, 1])

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

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length)
    }, performanceMode ? 7200 : 5000)

    return () => clearInterval(timer)
  }, [performanceMode])

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

    const fetchRecentReviews = async () => {
      try {
        const { data } = await api.get('/reviews/recent/high-rated')
        if (data.success) setRecentReviews(data.data || [])
      } catch {
        setRecentReviews([])
      }
    }

    fetchRecentProducts()
    fetchRecentReviews()
  }, [])

  return (
    <>
      <motion.div
        className="pointer-events-none fixed inset-x-0 top-0 z-70 h-0.5 origin-left"
        style={{
          scaleX: smoothScrollProgress,
          background: 'linear-gradient(90deg, var(--accent-gold), var(--accent-rose), rgba(var(--accent-gold-rgb), 0.72))',
        }}
      />

      <main className="home-ambient home-texture-grid relative min-h-screen" style={{ background: 'var(--bg-base)' }}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -left-20 top-1 h-112 w-md rounded-none opacity-40"
            style={{
              background: 'radial-gradient(circle, rgba(var(--accent-gold-rgb), 0.15), transparent 70%)',
              willChange: 'transform'
            }}
            animate={shouldReduceMotion || performanceMode ? undefined : { x: [0, 50, 0], y: [0, 24, 0] }}
            transition={shouldReduceMotion || performanceMode ? undefined : { duration: 18, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute -right-28 top-20 h-136 w-136 rounded-none opacity-40"
            style={{
              background: 'radial-gradient(circle, rgba(var(--accent-rose-rgb), 0.15), transparent 72%)',
              willChange: 'transform'
            }}
            animate={shouldReduceMotion || performanceMode ? undefined : { x: [0, -40, 0], y: [0, 24, 0] }}
            transition={shouldReduceMotion || performanceMode ? undefined : { duration: 20, repeat: Infinity, ease: 'linear' }}
          />
        </div>

        <section className="relative z-10 min-h-screen pb-0">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="relative w-full min-h-screen overflow-hidden"
          >


            <div className="relative min-h-screen">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSlide.image}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.01 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="absolute inset-0"
                  style={shouldReduceMotion || performanceMode ? undefined : { y: heroParallaxY, scale: heroParallaxScale }}
                >
                  <Image
                    src={activeSlide.image}
                    alt={activeSlide.title}
                    fill
                    priority={activeIndex === 0}
                    loading={activeIndex === 0 ? 'eager' : 'lazy'}
                    sizes="100vw"
                    className="object-cover"
                    quality={85}
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
                      className="mx-auto mt-5 max-w-[15ch] text-[clamp(2.4rem,8.8vw,5.8rem)] sm:text-6xl lg:text-7xl font-serif font-bold leading-none hero-title-gradient"
                      style={{ filter: 'drop-shadow(0 8px 28px rgba(0,0,0,0.3))' }}
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
                    <MagneticWrap disabled={shouldReduceMotion || performanceMode}>
                      <Link
                        href="/products"
                        id="hero-shop-btn"
                        className="group inline-flex items-center gap-2 rounded-full px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-semibold transition-all duration-300 hover:shadow-[0_18px_40px_rgba(0,0,0,0.38)]"
                        style={{ background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-rose))', color: '#0A0A0F', boxShadow: '0 12px 30px rgba(0,0,0,0.28)' }}
                      >
                        Shop Collection
                        <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                      </Link>
                    </MagneticWrap>

                    <MagneticWrap disabled={shouldReduceMotion || performanceMode}>
                      <Link
                        href="/products?featured=true"
                        className="group inline-flex items-center gap-2 rounded-full px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-semibold border transition-all duration-300 hover:shadow-[0_14px_36px_rgba(0,0,0,0.34)]"
                        style={{ borderColor: 'rgba(255,255,255,0.35)', color: '#F9F7F2', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}
                      >
                        <Play size={14} className="transition-transform duration-300 group-hover:scale-110" />
                        View Lookbook
                      </Link>
                    </MagneticWrap>
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
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.48, delay: 0.34 }}
                    className="mx-auto mt-7 grid max-w-3xl grid-cols-3 gap-2.5"
                  >
                    {heroMetrics.map((item) => (
                      <div
                        key={item.label}
                        className="home-premium-chip rounded-2xl border px-4 py-3 text-left"
                        style={{
                          background: 'rgba(14, 15, 23, 0.45)',
                          borderColor: 'rgba(255,255,255,0.16)',
                          backdropFilter: 'blur(10px)'
                        }}
                      >
                        <p className="text-xl sm:text-2xl font-semibold leading-none" style={{ color: '#F8F5EC' }}>
                          {item.value}
                        </p>
                        <p className="mt-1 text-[10px] sm:text-[11px] uppercase tracking-[0.18em]" style={{ color: 'rgba(246,242,232,0.72)' }}>
                          {item.label}
                        </p>
                      </div>
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

        <section className="home-section-divider home-preview-spacing w-full px-3 sm:px-5 lg:px-6 pt-10 sm:pt-14 pb-16 sm:pb-20">
          <div className="mx-auto w-full ">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.28 }}
              transition={{ duration: 0.56 }}
              className="home-glow-surface grid grid-cols-1 gap-3 rounded-3xl border p-4 sm:p-6 lg:grid-cols-3"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
            >
              {runwayNotes.map((note, index) => (
                <motion.article
                  key={note.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={performanceMode ? { duration: 0.24, delay: index * 0.03 } : { duration: 0.38, delay: index * 0.08 }}
                  className="home-fade-in-card rounded-2xl border px-4 py-5 sm:px-5"
                  style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
                >
                  <p className="luxury-label">
                    Runway Note {index + 1}
                  </p>
                  <h3 className="mt-3 text-xl font-serif font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
                    {note.title}
                  </h3>
                  <p className="mt-2 luxury-body text-sm">
                    {note.desc}
                  </p>
                </motion.article>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="home-section-divider w-full px-3 sm:px-5 lg:px-6 py-10 sm:py-14">
          <div className="mx-auto w-full ">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.48 }}
              className="home-glow-surface relative w-full rounded-none border p-5 sm:p-7 lg:p-9 overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, var(--bg-surface), rgba(var(--accent-gold-rgb),0.05) 42%, var(--bg-surface))',
                borderColor: 'var(--border)'
              }}
            >
              <div className="pointer-events-none absolute inset-0 opacity-[0.08]" style={{ background: 'linear-gradient(to right, rgba(var(--accent-gold-rgb),0.16) 1px, transparent 1px)', backgroundSize: '34px 100%' }} />

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={performanceMode ? { duration: 0.2 } : { duration: 0.4 }}
                className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
              >
                <div>
                  <p className="luxury-label">Collection Preview</p>
                  <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl luxury-heading">
                    Signature Looks Before The Spin
                  </h2>
                </div>
                <MagneticWrap disabled={shouldReduceMotion || performanceMode}>
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-2 border px-4 py-2 text-xs sm:text-sm font-semibold uppercase tracking-[0.16em] transition-all duration-300 hover:gap-3"
                    style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
                  >
                    See All Collections
                    <ArrowRight size={14} />
                  </Link>
                </MagneticWrap>
              </motion.div>

              <div className="relative mt-7 -mx-3 px-3 sm:mx-0 sm:px-0">
                <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-proximity sm:grid sm:grid-cols-2 xl:grid-cols-5 sm:overflow-visible sm:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {carouselItems.map((item, index) => (
                    <motion.article
                      key={`${item.title}-${index}`}
                      initial={shouldReduceMotion || performanceMode ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      whileHover={shouldReduceMotion || performanceMode ? undefined : { y: -5, scale: 1.01 }}
                      whileTap={shouldReduceMotion || performanceMode ? undefined : { scale: 0.99 }}
                      viewport={{ once: true, amount: 0.25 }}
                      transition={shouldReduceMotion || performanceMode ? { duration: 0.01 } : { duration: 0.42, delay: index * 0.05 }}
                      className="group relative min-w-[84vw] max-w-[84vw] sm:min-w-0 sm:max-w-none shrink-0 snap-start overflow-hidden rounded-none border px-4 py-5 sm:px-5 sm:py-6 transition-all duration-300"
                      style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
                    >
                      <div
                        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                        style={{ background: 'radial-gradient(circle at 15% 5%, rgba(var(--accent-gold-rgb),0.18), transparent 58%)' }}
                      />

                      <div className="pointer-events-none absolute bottom-0 left-0 h-0.5 w-0 transition-all duration-500 group-hover:w-full" style={{ background: 'var(--accent-gold)' }} />

                      <p className="relative text-[10px] font-black uppercase tracking-[0.26em]" style={{ color: 'var(--accent-gold)' }}>
                        {item.category}
                      </p>
                      <h3 className="relative mt-3 text-xl font-serif font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
                        {item.title}
                      </h3>
                      <p className="relative mt-3 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        {item.price}
                      </p>

                      <Link
                        href={item.link || '/products'}
                        className="relative mt-6 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] transition-all group-hover:gap-3"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        Browse
                        <ArrowRight size={13} />
                      </Link>
                    </motion.article>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="home-carousel-spacing w-full pt-6 sm:pt-10">
          <ThreeDCarousel items={carouselItems} autoplayInterval={performanceMode ? 6800 : 5000} performanceMode={performanceMode} />
        </section>

        <div className="w-full border-y border-(--border) bg-(--bg-elevated)">
          <div className="mx-auto flex w-full  flex-wrap justify-center gap-4 px-3 py-8 sm:px-5 lg:px-6">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat
                  ? 'bg-(--accent-gold) text-black shadow-lg scale-105'
                  : 'bg-(--bg-surface) text-(--text-muted) border border-(--border) hover:border-(--accent-gold)'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <RecentProductsSection
          products={filteredRecentProducts}
          category={activeCategory}
        />

        <section className="home-section-divider w-full px-3 sm:px-5 lg:px-6 pb-12 sm:pb-16">
          <div className="mx-auto w-full ">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={performanceMode ? { duration: 0.24 } : { duration: 0.5 }}
              className="mb-7 flex items-end justify-between gap-4"
            >
              <div>
                <p className="luxury-label">Featured edit</p>
                <h2 className="mt-3 text-3xl sm:text-4xl luxury-heading">
                  Style Moodboards
                </h2>
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  whileInView={{ width: 88, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={performanceMode ? { duration: 0.2 } : { duration: 0.45, delay: 0.08 }}
                  className="mt-3 h-0.5"
                  style={{ background: 'linear-gradient(90deg, var(--accent-gold), transparent)' }}
                />
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
                  transition={performanceMode ? { duration: 0.22, delay: index * 0.03 } : { duration: 0.45, delay: index * 0.08 }}
                  whileHover={shouldReduceMotion || performanceMode ? undefined : { y: -7, scale: 1.01 }}
                  className="luxury-card img-luxury-overlay shine-effect group transition-all duration-500"
                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                >
                  <div className="relative h-60 sm:h-68 overflow-hidden">
                    <Image
                      src={board.image}
                      alt={board.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 380px"
                      className="object-cover transition-transform duration-700 group-hover:scale-108"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-serif font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>{board.title}</h3>
                    <p className="mt-2 luxury-body text-sm">{board.desc}</p>
                    <Link href="/products" className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest transition-all duration-300 group-hover:gap-3" style={{ color: 'var(--accent-gold)' }}>
                      Shop this vibe
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="home-section-divider w-full px-3 sm:px-5 lg:px-6 pb-12 sm:pb-16">
          <div className="mx-auto w-full  grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {serviceHighlights.map(({ title, desc, icon: Icon }, index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className="luxury-card animated-border glass-gold group p-5 sm:p-6 transition-all duration-500"
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: 'rgba(var(--accent-gold-rgb),0.14)', color: 'var(--accent-gold)' }}>
                  <Icon size={20} />
                </div>
                <p className="text-sm font-semibold tracking-wide" style={{ color: 'var(--text-primary)' }}>{title}</p>
                <p className="mt-1.5 luxury-body text-xs sm:text-sm">{desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Recent High-Rated Reviews Section */}
        {recentReviews.length > 0 && (
          <section className="w-full px-3 sm:px-5 lg:px-6 pb-16 sm:pb-20">
            <div className="mx-auto w-full ">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={performanceMode ? { duration: 0.24 } : { duration: 0.5 }}
                className="mb-8"
              >
                <p className="luxury-label">Customer Voices</p>
                <h2 className="mt-3 text-3xl sm:text-4xl luxury-heading">Recent Accolades</h2>
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  whileInView={{ width: 92, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={performanceMode ? { duration: 0.2 } : { duration: 0.45, delay: 0.08 }}
                  className="mt-3 h-0.5"
                  style={{ background: 'linear-gradient(90deg, var(--accent-gold), transparent)' }}
                />
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentReviews.map((rev, idx) => (
                  <motion.div
                    key={rev.id}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={performanceMode ? { duration: 0.22, delay: idx * 0.03 } : { duration: 0.45, delay: idx * 0.08 }}
                    className="p-6 rounded-3xl border relative overflow-hidden group hover:border-(--accent-gold)/30 transition-all duration-300"
                    style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                      <Sparkles size={64} className="text-(--accent-gold)" />
                    </div>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-(--accent-gold)/20 p-0.5">
                        {rev.profiles?.avatar_url ? (
                          <Image
                            src={rev.profiles.avatar_url}
                            alt={rev.profiles.name || 'Reviewer avatar'}
                            fill
                            sizes="48px"
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-white/5 flex items-center justify-center text-(--text-muted)">
                            <User size={20} />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{rev.profiles?.name}</p>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map(i => (
                            <Star key={i} size={10} fill={i <= rev.rating ? 'var(--accent-gold)' : 'none'} stroke="var(--accent-gold)" />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm italic leading-relaxed mb-4 group-hover:text-(--text-primary) transition-colors" style={{ color: 'var(--text-secondary)' }}>
                      "{rev.comment}"
                    </p>
                    <div className="pt-4 border-t border-white/5">
                      <p className="text-[10px] uppercase tracking-widest font-black" style={{ color: 'var(--accent-gold)' }}>
                        On {rev.products?.name}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="w-full px-3 sm:px-5 lg:px-6 pb-16 sm:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.56 }}
            className="home-glow-surface mx-auto w-full  rounded-3xl border px-5 sm:px-8 lg:px-10 py-10 sm:py-14"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.22em]" style={{ color: 'var(--accent-gold)' }}>The Vision</p>
                <h2 className="mt-2 text-3xl sm:text-4xl font-bold font-serif leading-[1.1]" style={{ color: 'var(--text-primary)' }}>
                  Designed to feel calm, premium, and easy to shop.
                </h2>
                <p className="mt-5 max-w-xl text-sm sm:text-base leading-8" style={{ color: 'var(--text-secondary)' }}>
                  At FashionForge, we believe in the precision of the silhouette. Our home collection highlights modern pieces in a cleaner editorial rhythm, using larger imagery and smooth transitions to help you browse without visual clutter.
                </p>
                <div className="mt-8 flex items-center gap-2">
                  <div className="h-0.5 w-12 bg-(--accent-gold)" />
                  <p className="text-xs font-black uppercase tracking-widest text-(--text-primary)">FashionForge Signature</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {forgeHighlights.map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.42, delay: index * 0.06 }}
                    className="group rounded-2xl border p-5 transition-all hover:bg-white/2 premium-card-hover"
                    style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
                  >
                    <p className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      <span className="w-1 h-1 rounded-full bg-(--accent-gold)" />
                      {item.title}
                    </p>
                    <p className="mt-2 text-xs sm:text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
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
            className="home-glow-surface mx-auto w-full  rounded-none border px-5 sm:px-8 lg:px-10 py-8 sm:py-10"
            style={{ background: 'linear-gradient(120deg, rgba(var(--accent-gold-rgb),0.08), rgba(var(--accent-rose-rgb),0.06), var(--bg-surface))', borderColor: 'var(--border)' }}
          >
            <div className="mb-6 h-0.5 w-full" style={{ background: 'linear-gradient(90deg, var(--accent-gold), rgba(var(--accent-rose-rgb),0.8), transparent)' }} />

            <div className="grid gap-7 grid-cols-1 sm:grid-cols-2 md:grid-cols-[1.35fr_0.8fr_0.8fr]">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: 'var(--accent-gold)' }}>Fashion System</p>
                <p className="mt-2 font-serif text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>FashionForge</p>
                <p className="mt-3 max-w-md text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
                  Premium wardrobe essentials with refined silhouettes, crafted for modern everyday wear and effortless day-to-night layering.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {['Secure Checkout', 'Express Shipping', 'Easy Returns'].map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)' }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--accent-gold)' }}>Shop</p>
                <div className="mt-3 flex flex-col gap-2.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <Link href="/products" className="transition-all hover:translate-x-1 hover:text-(--text-primary)">All Products</Link>
                  <Link href="/products?sort=created_at&order=desc" className="transition-all hover:translate-x-1 hover:text-(--text-primary)">New Arrivals</Link>
                  <Link href="/products?sale=true" className="transition-all hover:translate-x-1 hover:text-(--text-primary)">Sale Picks</Link>
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--accent-gold)' }}>Account</p>
                <div className="mt-3 flex flex-col gap-2.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <Link href="/profile" className="transition-all hover:translate-x-1 hover:text-(--text-primary)">Profile</Link>
                  <Link href="/orders" className="transition-all hover:translate-x-1 hover:text-(--text-primary)">Orders</Link>
                  <Link href="/wishlist" className="transition-all hover:translate-x-1 hover:text-(--text-primary)">Wishlist</Link>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-2 border-t pt-4 text-xs sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
              <p>© {new Date().getFullYear()} FashionForge. All rights reserved.</p>
              <div className="flex items-center gap-4">
                <Link href="/products" className="hover:text-(--text-secondary)">Catalog</Link>
                <Link href="/orders" className="hover:text-(--text-secondary)">Track Order</Link>
              </div>
            </div>
          </motion.div>
        </footer>
      </main>
    </>
  )
}
