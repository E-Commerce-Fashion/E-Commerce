'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Search, ShoppingBag, Heart, User } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useUserStore } from '@/store/userStore'

const navItems = [
  { label: 'Home',     href: '/',         icon: Home },
  { label: 'Explore',  href: '/products', icon: Search },
  { label: 'Cart',     href: '#cart',     icon: ShoppingBag, isCart: true },
  { label: 'Wishlist', href: '/wishlist', icon: Heart },
  { label: 'Account',  href: '/profile',  icon: User, authRequired: true, fallback: '/login' },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const [visible, setVisible]   = useState(true)
  const [mounted, setMounted]   = useState(false)
  const lastScrollY              = useRef(0)

  const totalItems = useCartStore((s) => s.totalItems)
  const toggleCart = useCartStore((s) => s.toggleCart)
  const cartCount  = totalItems()
  const { isAuthenticated: authed } = useUserStore()

  // Only show cart badge after hydration to avoid SSR/client mismatch
  useEffect(() => { setMounted(true) }, [])

  // Hide-on-scroll-down / show-on-scroll-up
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setVisible(y <= lastScrollY.current || y <= 80)
      lastScrollY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isActive = (href: string) => {
    if (href === '#cart') return false
    const base = href.split('?')[0]
    return base === '/' ? pathname === '/' : pathname.startsWith(base)
  }

  // adminCheck for CSS class — still renders the node (avoids hydration mismatch)
  const isAdmin = pathname.startsWith('/admin')

  return (
    <nav
      aria-label="Mobile navigation"
      className="mobile-bottom-nav"
      data-hidden={isAdmin || undefined}
      style={{ transform: visible ? 'translateY(0)' : 'translateY(110%)' }}
    >
      {/* Frosted glass layer */}
      <div className="mobile-bottom-nav__glass" />
      {/* Gold accent line */}
      <div className="mobile-bottom-nav__accent" />

      <div className="mobile-bottom-nav__items">
        {navItems.map((item) => {
          const active = isActive(item.href)
          const href   = item.authRequired && !authed ? (item.fallback ?? '/login') : item.href

          if (item.isCart) {
            return (
              <button
                key={item.label}
                type="button"
                onClick={toggleCart}
                data-active={active || undefined}
                className="mobile-bottom-nav__item"
                aria-label="Open cart"
              >
                <span className="mobile-bottom-nav__icon">
                  <item.icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                  <AnimatePresence>
                    {mounted && cartCount > 0 && (
                      <motion.span
                        key="badge"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="mobile-bottom-nav__badge"
                      >
                        {cartCount > 9 ? '9+' : cartCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
                <span className="mobile-bottom-nav__label">{item.label}</span>
              </button>
            )
          }

          return (
            <Link
              key={item.label}
              href={href}
              data-active={active || undefined}
              className="mobile-bottom-nav__item"
              aria-label={item.label}
            >
              <span className="mobile-bottom-nav__icon">
                <item.icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="mobile-bottom-nav__pill"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
              </span>
              <span className="mobile-bottom-nav__label">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
