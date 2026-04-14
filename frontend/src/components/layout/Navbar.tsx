'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Bell, User, ChevronDown, X, Menu,
  ShoppingBag, LogOut, Sparkles, Sun, Moon
} from 'lucide-react'
import api from '@/lib/axios'
import { useCartStore } from '@/store/cartStore'
import { useUserStore } from '@/store/userStore'

const navLinks = [
  { label: 'Home', href: '/' },
  {
    label: 'Shop',
    href: '/products',
    children: [
      { label: 'All Products', href: '/products' },
      { label: 'Shirts', href: '/products?category=shirts' },
      { label: 'Pants', href: '/products?category=pants' },
      { label: 'Dresses', href: '/products?category=dresses' },
      { label: 'Jackets', href: '/products?category=jackets' },
      { label: 'Accessories', href: '/products?category=accessories' },
    ],
  },
  { label: 'New In', href: '/products?sort=created_at&order=desc' },
]

// ── Outer shell: pure passthrough — zero hooks, always safe ──────
export function Navbar() {
  return <NavbarInner />
}

// ── Inner component: all hooks live here, no conditional returns ──
function NavbarInner() {
  const pathname = usePathname()
  const router = useRouter()
  const dropRef = useRef<HTMLDivElement>(null)

  const [mounted, setMounted] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const totalItems = useCartStore((s) => s.totalItems)
  const toggleCart = useCartStore((s) => s.toggleCart)
  const { user, isAuthenticated, clearUser } = useUserStore()
  const { resolvedTheme, setTheme } = useTheme()

  const cartCount = mounted ? totalItems() : 0
  const authed = mounted ? isAuthenticated : false
  const activeTheme = mounted ? resolvedTheme : 'dark'
  const isDarkTheme = activeTheme !== 'light'
  const navActiveClass = isDarkTheme ? 'text-white bg-white/10' : 'text-slate-900 bg-slate-900/8'
  const navIdleClass = isDarkTheme ? 'text-white/55 hover:text-white hover:bg-white/8' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-900/6'
  const iconButtonClass = isDarkTheme ? 'text-white/55 hover:text-white hover:bg-white/7' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-900/6'
  const scrolledShellClass = isDarkTheme
    ? 'bg-[rgba(7,6,20,0.92)] backdrop-blur-2xl border-b border-white/[0.07] shadow-[0_2px_24px_rgba(0,0,0,0.5)]'
    : 'bg-[rgba(255,255,255,0.92)] backdrop-blur-2xl border-b border-slate-900/10 shadow-[0_2px_24px_rgba(15,23,42,0.08)]'
  const dropdownShellClass = isDarkTheme
    ? 'bg-[#11102b]/96 border-white/10'
    : 'bg-[rgba(255,255,255,0.96)] border-slate-900/12'
  const dropdownItemClass = isDarkTheme
    ? 'text-white/65 hover:text-white hover:bg-white/7'
    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-900/6'

  const toggleTheme = () => {
    setTheme(isDarkTheme ? 'light' : 'dark')
  }

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node))
        setActiveDropdown(null)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  useEffect(() => {
    setActiveDropdown(null)
    setMobileOpen(false)
    setMobileExpanded(null)
    setSearchOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const handleLogout = async () => {
    try { await api.post('/auth/logout') } catch { /* silent */ }
    finally {
      clearUser()
      setMobileOpen(false)
      router.push('/')
      router.refresh()
    }
  }

  const isActive = (href: string) => {
    const base = href.split('?')[0]
    return base === '/' ? pathname === '/' : pathname.startsWith(base)
  }

  return (
    <>
      {/* ── Fixed Header ──────────────────────────────────────── */}
      <header className="site-navbar fixed top-0 left-0 right-0 w-full z-50">
        <motion.div
          initial={{ y: -64, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] as const }}
          className={`w-full transition-all duration-500 ${scrolled
              ? scrolledShellClass
              : isDarkTheme
                ? 'bg-transparent'
                : 'bg-[rgba(255,255,255,0.78)] backdrop-blur-xl border-b border-slate-900/8'
            }`}
        >
          {/* 3-zone: [Logo] ── [Nav centered] ── [Actions] */}
          <div className="mx-auto flex items-center justify-between h-16 px-4 sm:px-6 lg:px-10 gap-2 w-full ">

            {/* ① Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0 group mr-2">
              <div className="relative w-8 h-8 rounded-xl bg-linear-to-br from-violet-600 to-purple-800 flex items-center justify-center shadow-md group-hover:shadow-violet-500/40 transition-shadow">
                <span className="text-white font-black text-[11px] leading-none">FF</span>
                <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-violet-300 opacity-80" />
              </div>
              <span className={`hidden sm:block font-bold text-sm tracking-tight whitespace-nowrap ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                FashionForge
              </span>
            </Link>

            {/* ② Nav links — flex-1 centers them with generous spacing */}
            <nav className="hidden sm:flex items-center justify-center flex-1 gap-1.5 lg:gap-4 xl:gap-6">
              {navLinks.map((link) => {
                const active = isActive(link.href)
                if (link.children) {
                  return (
                    <div key={link.label} className="relative">
                      <button
                        onClick={() => setActiveDropdown(activeDropdown === link.label ? null : link.label)}
                        className={`flex items-center gap-1.5 px-2 sm:px-2.5 lg:px-4 xl:px-5 py-2 rounded-xl text-[12px] lg:text-[13px] font-semibold tracking-wide transition-all whitespace-nowrap ${active ? navActiveClass : navIdleClass
                          }`}
                      >
                        {link.label}
                        <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${activeDropdown === link.label ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {activeDropdown === link.label && (
                          <motion.div
                            initial={{ opacity: 0, y: 6, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 6, scale: 0.97 }}
                            transition={{ duration: 0.13 }}
                            className={`absolute left-1/2 -translate-x-1/2 top-full mt-2 min-w-42 backdrop-blur-2xl border rounded-2xl overflow-hidden shadow-2xl z-50 ${dropdownShellClass}`}
                          >
                            {(
                              link.label === 'Account' && authed && user?.role === 'admin'
                                ? [...link.children, { label: 'Admin Dashboard', href: '/admin' }, { label: 'Product Management', href: '/admin/products' }]
                                : link.children
                            ).map((child) => (
                              <Link
                                key={child.label}
                                href={child.href}
                                className={`flex items-center px-4 py-2.5 text-[13px] transition-colors ${dropdownItemClass}`}
                              >
                                {child.label}
                              </Link>
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
                    className={`px-2 sm:px-2.5 lg:px-4 xl:px-5 py-2 rounded-xl text-[12px] lg:text-[13px] font-semibold tracking-wide transition-all whitespace-nowrap ${active ? navActiveClass : navIdleClass
                      }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </nav>

            {/* ③ Right actions */}
            <div className="flex items-center gap-1 shrink-0 min-w-0">

              {/* Search — desktop */}
              <div className="hidden xl:flex items-center relative group">
                <Search className={`absolute left-5 w-3.5 h-3.5 transition-colors pointer-events-none z-10 ${isDarkTheme ? 'text-white/40 group-focus-within:text-violet-400' : 'text-slate-500 group-focus-within:text-violet-600'}`} />
                <input
                  type="text"
                  placeholder="Search products…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '52px' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
                      setSearchQuery('')
                    }
                  }}
                  className={`h-8 w-36 xl:w-44 rounded-xl pr-3 text-[13px] focus:outline-none focus:border-violet-500/50 focus:w-52 transition-all duration-300 ${isDarkTheme ? 'bg-white/7 border border-white/10 text-white placeholder:text-white/30 focus:bg-white/10' : 'bg-slate-900/6 border border-slate-900/15 text-slate-900 placeholder:text-slate-500 focus:bg-white'}`}
                />
              </div>

              {/* Search toggle — below md */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className={`xl:hidden w-9 h-9 rounded-md sm:rounded-lg flex items-center justify-center transition-all ${iconButtonClass}`}
                aria-label="Search"
              >
                <Search className="w-4.5 h-4.5" />
              </button>

              {/* Bell */}
              <button className={`hidden sm:flex relative w-9 h-9 rounded-md sm:rounded-lg items-center justify-center transition-all ${iconButtonClass}`} aria-label="Notifications">
                <Bell className="w-4.5 h-4.5" />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse" />
              </button>

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className={`w-9 h-9 rounded-md sm:rounded-lg flex items-center justify-center transition-all ${iconButtonClass}`}
                aria-label={isDarkTheme ? 'Switch to light theme' : 'Switch to dark theme'}
                title={isDarkTheme ? 'Light theme' : 'Dark theme'}
              >
                {isDarkTheme ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
              </button>

              {/* Cart */}
              <button
                onClick={toggleCart}
                className={`relative w-9 h-9 rounded-md sm:rounded-lg flex items-center justify-center transition-all ${iconButtonClass}`}
                aria-label="Cart"
              >
                <ShoppingBag className="w-4.5 h-4.5" />
                <AnimatePresence>
                  {cartCount > 0 && (
                    <motion.span
                      key="badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-0.75 bg-violet-600 rounded-full text-[9px] font-bold text-white flex items-center justify-center leading-none"
                    >
                      {cartCount > 9 ? '9+' : cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              {/* Auth */}
              {authed ? (
                <div className="flex items-center gap-1 ml-1">
                  <Link
                    href="/profile"
                    className={`flex w-8 h-8 rounded-md sm:rounded-lg overflow-hidden border hover:border-violet-500/60 transition-colors shrink-0 ${isDarkTheme ? 'border-white/15' : 'border-slate-900/15'}`}
                    aria-label="Profile"
                  >
                    {user?.avatar_url ? (
                      <Image src={user.avatar_url} alt={user.name || 'Avatar'} width={32} height={32} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full bg-linear-to-br from-violet-600 to-purple-700 flex items-center justify-center">
                        <span className="text-white text-[11px] font-bold leading-none">
                          {(user?.name || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </Link>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="hidden sm:flex items-center gap-1.5 h-8 px-4 ml-1 bg-violet-600 hover:bg-violet-500 text-white text-[13px] font-semibold rounded-xl transition-all shadow-md shadow-violet-600/30 whitespace-nowrap"
                >
                  <User className="w-3.5 h-3.5" />
                  Sign In
                </Link>
              )}

              {/* Hamburger */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className={`sm:hidden w-9 h-9 rounded-md sm:rounded-lg flex items-center justify-center transition-all ml-0.5 ${iconButtonClass}`}
                aria-label="Menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile search slide-in */}
          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className={`xl:hidden overflow-hidden border-t backdrop-blur-xl px-4 py-3 ${isDarkTheme ? 'border-white/8 bg-[rgba(7,6,20,0.94)]' : 'border-slate-900/12 bg-[rgba(255,255,255,0.94)]'}`}
              >
                <div className="relative">
                  <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkTheme ? 'text-white/35' : 'text-slate-500'}`} />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search products…"
                    style={{ paddingLeft: '44px' }}
                    className={`w-full h-10 rounded-xl pr-4 text-sm focus:outline-none focus:border-violet-500/50 ${isDarkTheme ? 'bg-white/7 border border-white/10 text-white placeholder:text-white/30' : 'bg-slate-900/6 border border-slate-900/15 text-slate-900 placeholder:text-slate-500'}`}
                    onKeyDown={(e) => {
                      const val = (e.target as HTMLInputElement).value.trim()
                      if (e.key === 'Enter' && val) {
                        router.push(`/products?search=${encodeURIComponent(val)}`)
                        setSearchOpen(false)
                      }
                    }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </header>

      {/* ── Mobile drawer ─────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className={`glassmorphic-sidebar fixed inset-y-0 left-0 z-50 w-72 backdrop-blur-2xl border-r flex flex-col lg:hidden ${isDarkTheme ? 'bg-[#0b0920]/98 border-white/10' : 'bg-[rgba(255,255,255,0.98)] border-slate-900/12'}`}
            >
              <div className={`flex items-center justify-between px-5 h-16 border-b shrink-0 ${isDarkTheme ? 'border-white/8' : 'border-slate-900/12'}`}>
                <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-linear-to-br from-violet-600 to-purple-800 flex items-center justify-center">
                    <span className="text-white font-black text-[10px]">FF</span>
                  </div>
                  <span className={`font-bold text-sm ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>FashionForge</span>
                </Link>
                <button onClick={() => setMobileOpen(false)} className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${isDarkTheme ? 'bg-white/7 text-white/55 hover:text-white' : 'bg-slate-900/6 text-slate-500 hover:text-slate-900'}`}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Inline search */}
              <div className="px-4 pt-4 pb-2">
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkTheme ? 'text-white/30' : 'text-slate-500'}`} />
                  <input
                    type="text"
                    placeholder="Search products…"
                    className={`w-full h-9 rounded-xl pl-9 pr-3 text-sm focus:outline-none focus:border-violet-500/50 ${isDarkTheme ? 'bg-white/6 border border-white/10 text-white placeholder:text-white/25' : 'bg-slate-900/6 border border-slate-900/15 text-slate-900 placeholder:text-slate-500'}`}
                    onKeyDown={(e) => {
                      const val = (e.target as HTMLInputElement).value.trim()
                      if (e.key === 'Enter' && val) {
                        router.push(`/products?search=${encodeURIComponent(val)}`)
                        setMobileOpen(false)
                      }
                    }}
                  />
                </div>
              </div>

              <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
                {navLinks.map((link) => {
                  if (link.children) {
                    const open = mobileExpanded === link.label
                    return (
                      <div key={link.label}>
                        <button
                          onClick={() => setMobileExpanded(open ? null : link.label)}
                          className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive(link.href) ? 'bg-violet-600/15 text-violet-400' : isDarkTheme ? 'text-white/60 hover:text-white hover:bg-white/7' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-900/6'
                            }`}
                        >
                          <span>{link.label}</span>
                          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                          {open && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.18 }}
                              className="overflow-hidden"
                            >
                              <div className="pl-3 pt-0.5 pb-1 space-y-0.5">
                                {(
                                  link.label === 'Account' && authed && user?.role === 'admin'
                                    ? [...link.children, { label: 'Admin Dashboard', href: '/admin' }, { label: 'Product Management', href: '/admin/products' }]
                                    : link.children
                                ).map((child) => (
                                  <Link
                                    key={child.label}
                                    href={child.href}
                                    onClick={() => setMobileOpen(false)}
                                    className={`flex px-4 py-2 rounded-xl text-[13px] transition-colors ${isActive(child.href) ? 'bg-violet-600/10 text-violet-400' : isDarkTheme ? 'text-white/45 hover:text-white hover:bg-white/6' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-900/6'
                                      }`}
                                  >
                                    {child.label}
                                  </Link>
                                ))}
                              </div>
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
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive(link.href) ? 'bg-violet-600/15 text-violet-400' : isDarkTheme ? 'text-white/60 hover:text-white hover:bg-white/7' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-900/6'
                        }`}
                    >
                      {link.label}
                    </Link>
                  )
                })}
              </nav>

              <div className={`p-4 border-t space-y-2 shrink-0 ${isDarkTheme ? 'border-white/8' : 'border-slate-900/12'}`}>
                <button
                  onClick={toggleTheme}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors ${isDarkTheme ? 'text-white/60 hover:text-white hover:bg-white/7' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-900/6'}`}
                  aria-label={isDarkTheme ? 'Switch to light theme' : 'Switch to dark theme'}
                >
                  {isDarkTheme ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
                  {isDarkTheme ? 'Light Theme' : 'Dark Theme'}
                </button>

                {authed ? (
                  <>
                    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${isDarkTheme ? 'bg-white/4 border-white/8' : 'bg-slate-900/5 border-slate-900/12'}`}>
                      <div className={`w-8 h-8 rounded-lg overflow-hidden border shrink-0 ${isDarkTheme ? 'border-white/10' : 'border-slate-900/12'}`}>
                        {user?.avatar_url ? (
                          <Image src={user.avatar_url} alt={user.name || ''} width={32} height={32} className="object-cover" />
                        ) : (
                          <div className="w-full h-full bg-linear-to-br from-violet-600 to-purple-700 flex items-center justify-center">
                            <span className="text-white text-[11px] font-bold">{(user?.name || 'U').charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{user?.name || 'My Account'}</p>
                        <p className={`text-[11px] truncate ${isDarkTheme ? 'text-white/40' : 'text-slate-500'}`}>{user?.email || ''}</p>
                      </div>
                    </div>
                    <Link href="/profile" onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors ${isDarkTheme ? 'text-white/60 hover:text-white hover:bg-white/7' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-900/6'}`}>
                      <User className="w-4 h-4 shrink-0" />
                      My Profile
                    </Link>
                    {user?.role === 'admin' && (
                      <>
                        <Link href="/profile/products" onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors ${isDarkTheme ? 'text-white/60 hover:text-white hover:bg-white/7' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-900/6'}`}>
                          <ShoppingBag className="w-4 h-4 shrink-0" />
                          Product Management
                        </Link>
                      </>
                    )}
                    <button onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-rose-400 hover:bg-rose-500/10 transition-colors">
                      <LogOut className="w-4 h-4 shrink-0" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link href="/login" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-2 w-full h-10 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm font-semibold text-white transition-colors">
                    <User className="w-4 h-4" />
                    Sign In
                  </Link>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
