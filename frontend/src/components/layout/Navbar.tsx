'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Search, User, Heart, Menu, X, ChevronDown, LogOut, Sparkles, ArrowRight } from 'lucide-react'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import api from '@/lib/axios'
import { useCartStore } from '@/store/cartStore'
import { useUserStore } from '@/store/userStore'

const navLinks = [
  { label: 'Home', href: '/' },
  {
    label: 'Shop',
    href: '/products',
    children: [
      { label: 'Shirts', href: '/products?category=shirts' },
      { label: 'Pants', href: '/products?category=pants' },
      { label: 'Dresses', href: '/products?category=dresses' },
      { label: 'Jackets', href: '/products?category=jackets' },
      { label: 'Accessories', href: '/products?category=accessories' },
    ],
  },
  { label: 'New Arrivals', href: '/products?sort=created_at&order=desc' },
  { label: 'Sale', href: '/products?sale=true' },
]

function isProductsRoute(pathname: string) {
  return pathname === '/products' || pathname.startsWith('/products/')
}

function isLinkActive(pathname: string, href: string) {
  const [basePath] = href.split('?')

  if (basePath === '/') return pathname === '/'
  if (basePath === '/products') return isProductsRoute(pathname)
  if (basePath === '/wishlist') return pathname === '/wishlist'
  if (basePath === '/profile') return pathname === '/profile'
  if (basePath === '/login') return pathname === '/login'
  if (basePath === '/register') return pathname === '/register'
  if (basePath === '/checkout') return pathname === '/checkout'
  if (basePath === '/orders') return pathname === '/orders'
  return pathname === basePath
}

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const totalItems = useCartStore((s) => s.totalItems)
  const toggleCart = useCartStore((s) => s.toggleCart)
  const { user, isAuthenticated, clearUser } = useUserStore()

  const cartCount = mounted ? totalItems() : 0
  const authed = mounted ? isAuthenticated : false
  const isHome = pathname === '/'
  const primaryText = isHome ? '#F7F1E8' : 'var(--text-primary)'
  const secondaryText = isHome ? 'rgba(247,241,232,0.84)' : 'var(--text-secondary)'
  const softText = isHome ? 'rgba(247,241,232,0.65)' : 'var(--text-muted)'

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || 'Logout failed')
      } else {
        toast.error('Logout failed')
      }
    } finally {
      clearUser()
      setMobileOpen(false)
      router.push('/')
      router.refresh()
    }
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mobileOpen) {
      document.body.style.overflow = ''
      return
    }

    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdown(null)
      }
    }

    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    setActiveDropdown(null)
    setMobileOpen(false)
  }, [pathname])

  return (
    <>
      <header className="fixed top-4 left-3 right-3 z-50 pointer-events-none">
        <motion.div
          initial={{ y: -36, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full pt-3 sm:pt-4"
        >
          <div
            className="pointer-events-auto w-full border"
            style={{
              background: 'transparent',
              borderColor: 'transparent',
              boxShadow: 'none',
              backdropFilter: 'none',
            }}
          >
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-3 sm:px-5 lg:px-7 py-3 sm:py-3.5">
              <Link href="/" className="flex items-center gap-3 min-w-0 group">
                <div
                  className="relative flex h-11 w-11 items-center justify-center rounded-xl overflow-hidden transition-transform duration-300 group-hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-rose))', color: '#0A0A0F' }}
                >
                  <span className="text-sm font-black tracking-[0.18em]">FF</span>
                  <Sparkles size={10} className="absolute right-1 top-1 opacity-70" />
                </div>
                <div className="hidden sm:block min-w-0">
                  <p className="font-serif text-[1.05rem] font-bold leading-none" style={{ color: primaryText, textShadow: isHome ? '0 1px 8px rgba(0,0,0,0.5)' : 'none' }}>
                    FashionForge
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: softText }}>
                    Premium wardrobe
                  </p>
                </div>
              </Link>

              <nav ref={dropdownRef} className="hidden lg:flex items-center justify-center">
                <div
                  className="flex items-center gap-1 rounded-xl px-1.5 py-1"
                  style={{
                    background: 'transparent',
                    border: '1px solid transparent',
                  }}
                >
                  {navLinks.map((link) => {
                    const active = isLinkActive(pathname, link.href)

                    if (link.children) {
                      return (
                        <div key={link.label} className="relative">
                          <button
                            type="button"
                            onClick={() => setActiveDropdown(activeDropdown === link.label ? null : link.label)}
                            className="relative flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200"
                            style={{
                              color: active ? primaryText : secondaryText,
                              background: 'transparent',
                              textShadow: isHome ? '0 1px 8px rgba(0,0,0,0.45)' : 'none',
                            }}
                          >
                            {link.label}
                            <ChevronDown size={14} className={activeDropdown === link.label ? 'rotate-180 transition-transform duration-200' : 'transition-transform duration-200'} />
                            <motion.span
                              className="absolute bottom-1 left-3 right-3 h-0.5 origin-left"
                              style={{ background: 'var(--accent-gold)' }}
                              initial={false}
                              animate={{ scaleX: active ? 1 : 0, opacity: active ? 1 : 0 }}
                              transition={{ duration: 0.22, ease: 'easeOut' }}
                            />
                          </button>

                          <AnimatePresence>
                            {activeDropdown === link.label && (
                              <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                                transition={{ duration: 0.16 }}
                                className="absolute left-1/2 top-full mt-3 w-60 -translate-x-1/2 overflow-hidden rounded-xl border"
                                style={{
                                  background: isHome
                                    ? 'linear-gradient(180deg, rgba(14,18,30,0.96), rgba(11,13,22,0.94))'
                                    : 'var(--bg-surface)',
                                  borderColor: isHome ? 'rgba(255,255,255,0.16)' : 'var(--border)',
                                  boxShadow: isHome
                                    ? '0 26px 72px rgba(0,0,0,0.46), inset 0 0 0 1px rgba(var(--accent-gold-rgb),0.15)'
                                    : '0 24px 70px rgba(0,0,0,0.22)',
                                }}
                              >
                                <div
                                  className="pointer-events-none absolute inset-x-0 -top-12 h-24"
                                  style={{ background: 'radial-gradient(circle, rgba(var(--accent-gold-rgb),0.18), transparent 65%)' }}
                                />
                                <div className="relative px-4 py-3 border-b" style={{ borderColor: isHome ? 'rgba(255,255,255,0.12)' : 'var(--border)' }}>
                                  <p className="text-xs uppercase tracking-[0.24em]" style={{ color: softText }}>
                                    Shop by category
                                  </p>
                                </div>
                                {link.children.map((child, idx) => (
                                  <motion.div
                                    key={child.label}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.18, delay: idx * 0.035 }}
                                  >
                                    <Link
                                      href={child.href}
                                      onClick={() => setActiveDropdown(null)}
                                      className="group flex items-center justify-between px-4 py-3 text-sm transition-all duration-200"
                                      style={{ color: secondaryText }}
                                    >
                                      <span className="transition-transform duration-200 group-hover:translate-x-0.5">{child.label}</span>
                                      <ArrowRight size={14} style={{ color: softText }} />
                                    </Link>
                                  </motion.div>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    }

                    return (
                      <Link
                        key={link.label}
                        href={link.href}
                        className="relative rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200"
                        style={{
                          color: active
                            ? (isHome ? '#F7D585' : 'var(--accent-gold)')
                            : (isHome ? secondaryText : 'var(--text-secondary)'),
                          background: 'transparent',
                          textShadow: isHome ? '0 1px 8px rgba(0,0,0,0.45)' : 'none',
                        }}
                      >
                        {link.label}
                        <motion.span
                          className="absolute bottom-1 left-3 right-3 h-0.5 origin-left"
                          style={{ background: active ? 'rgba(10,10,15,0.5)' : 'var(--accent-gold)' }}
                          initial={false}
                          animate={{ scaleX: active ? 1 : 0, opacity: active ? 1 : 0 }}
                          transition={{ duration: 0.22, ease: 'easeOut' }}
                        />
                      </Link>
                    )
                  })}
                </div>
              </nav>

              <div className="flex items-center justify-end gap-1.5 sm:gap-2">

                <Link
                  href="/products"
                  className="hidden sm:flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    background: 'transparent',
                    borderColor: isHome ? 'rgba(255,255,255,0.18)' : 'var(--border)',
                    color: secondaryText,
                  }}
                >
                  <Search size={16} />
                  Search catalog
                </Link>

                <Link
                  href={authed ? '/wishlist' : '/login'}
                  className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    background: 'transparent',
                    borderColor: isHome ? 'rgba(255,255,255,0.18)' : 'var(--border)',
                    color: secondaryText,
                  }}
                  aria-label="Wishlist"
                >
                  <Heart size={17} />
                </Link>

                <button
                  type="button"
                  onClick={toggleCart}
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    background: 'transparent',
                    borderColor: isHome ? 'rgba(255,255,255,0.18)' : 'var(--border)',
                    color: secondaryText,
                  }}
                  aria-label={`Shopping cart — ${cartCount} items`}
                >
                  <ShoppingBag size={17} />
                  {cartCount > 0 && (
                    <span
                      className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-none px-1 text-[10px] font-bold"
                      style={{ background: 'var(--accent-gold)', color: '#0A0A0F' }}
                    >
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </button>

                <Link
                  href={authed ? '/profile' : '/login'}
                  className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    background: 'transparent',
                    borderColor: isHome ? 'rgba(255,255,255,0.18)' : 'var(--border)',
                    color: secondaryText,
                  }}
                  aria-label={authed ? `Profile — ${user?.name}` : 'Login'}
                >
                  {authed && user?.avatar_url ? (
                    <Image
                      src={user.avatar_url}
                      alt={user.name || 'Profile avatar'}
                      width={28}
                      height={28}
                      className="rounded-none object-cover"
                    />
                  ) : (
                    <User size={17} />
                  )}
                </Link>

                {authed && (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      background: 'transparent',
                      borderColor: isHome ? 'rgba(255,255,255,0.18)' : 'var(--border)',
                      color: secondaryText,
                    }}
                    aria-label="Logout"
                  >
                    <LogOut size={17} />
                  </button>
                )}

                <button
                  type="button"
                  className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200"
                  style={{
                    background: 'transparent',
                    borderColor: isHome ? 'rgba(255,255,255,0.18)' : 'var(--border)',
                    color: primaryText,
                  }}
                  onClick={() => setMobileOpen((value) => !value)}
                  aria-label="Toggle mobile menu"
                >
                  {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />

            <motion.aside
              initial={{ y: -24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -24, opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 260 }}
              className="fixed left-2 right-2 top-2 z-50 rounded-[28px] border lg:hidden"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-lg)' }}
            >
              <div className="flex items-center justify-between border-b px-4 py-4" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <p className="font-serif text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    FashionForge
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.24em]" style={{ color: 'var(--text-muted)' }}>
                    Menu and account
                  </p>
                </div>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-none border"
                  style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="px-4 py-4 space-y-4">
                <Link
                  href="/products"
                  className="flex items-center gap-2 rounded-none border px-4 py-3 text-sm font-medium"
                  style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                  onClick={() => setMobileOpen(false)}
                >
                  <Search size={16} />
                  Search catalog
                </Link>

                <div className="grid grid-cols-2 gap-3">
                  {navLinks.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="rounded-none border px-4 py-4"
                      style={{
                        background: isLinkActive(pathname, link.href) ? 'linear-gradient(135deg, var(--accent-gold), var(--accent-rose))' : 'var(--bg-elevated)',
                        borderColor: 'var(--border)',
                        color: isLinkActive(pathname, link.href) ? '#0A0A0F' : 'var(--text-primary)',
                      }}
                      onClick={() => setMobileOpen(false)}
                    >
                      <p className="text-sm font-semibold">{link.label}</p>
                      <p className="mt-1 text-[11px]" style={{ color: isLinkActive(pathname, link.href) ? 'rgba(10,10,15,0.75)' : 'var(--text-muted)' }}>
                        {link.children ? 'Browse categories' : 'Open page'}
                      </p>
                    </Link>
                  ))}
                </div>

                <div className="rounded-none border p-4" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
                  <p className="text-xs uppercase tracking-[0.24em]" style={{ color: 'var(--text-muted)' }}>
                    Quick actions
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <Link
                      href={authed ? '/wishlist' : '/login'}
                      className="flex h-10 w-10 items-center justify-center rounded-none border"
                      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                      onClick={() => setMobileOpen(false)}
                      aria-label="Wishlist"
                    >
                      <Heart size={17} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        toggleCart()
                        setMobileOpen(false)
                      }}
                      className="relative flex h-10 w-10 items-center justify-center rounded-none border"
                      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                      aria-label={`Shopping cart — ${cartCount} items`}
                    >
                      <ShoppingBag size={17} />
                      {cartCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-none px-1 text-[10px] font-bold" style={{ background: 'var(--accent-gold)', color: '#0A0A0F' }}>
                          {cartCount > 9 ? '9+' : cartCount}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                <div className="rounded-none border p-4" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-none" style={{ background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-rose))', color: '#0A0A0F' }}>
                      {authed && user?.avatar_url ? (
                        <Image src={user.avatar_url} alt={user.name || 'Profile avatar'} width={48} height={48} className="h-12 w-12 rounded-none object-cover" />
                      ) : (
                        <User size={18} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium" style={{ color: 'var(--text-primary)' }}>
                        {authed ? user?.name || 'Your account' : 'Guest shopper'}
                      </p>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {authed ? 'Signed in' : 'Sign in to sync your cart'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-3">
                    <Link
                      href={authed ? '/profile' : '/login'}
                      className="flex flex-1 items-center justify-center gap-2 rounded-none px-4 py-3 text-sm font-semibold"
                      style={{ background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-rose))', color: '#0A0A0F' }}
                      onClick={() => setMobileOpen(false)}
                    >
                      <User size={15} />
                      {authed ? 'Profile' : 'Sign in'}
                    </Link>

                    {authed && (
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="inline-flex items-center justify-center rounded-none border px-4 py-3 text-sm font-semibold"
                        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                      >
                        <LogOut size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
