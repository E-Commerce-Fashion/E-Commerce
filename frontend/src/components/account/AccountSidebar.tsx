'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  UserCircle2,
  PackageSearch,
  Heart,
  CreditCard,
  ShoppingBag,
  Users,
  BarChart3,
  Settings,
  Package,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUserStore } from '@/store/userStore'
import api from '@/lib/axios'

const userLinks = [
  { href: '/profile',  label: 'Account Overview', icon: UserCircle2  },
  { href: '/orders',   label: 'My Orders',         icon: PackageSearch },
  { href: '/wishlist', label: 'Wishlist',           icon: Heart        },
  { href: '/checkout', label: 'Checkout',           icon: CreditCard   },
]

const adminLinks = [
  { href: '/profile', label: 'Account Overview', icon: UserCircle2 },
  { href: '/profile/products', label: 'Products', icon: Package },
  { href: '/profile/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/profile/customers', label: 'Customers', icon: Users },
  { href: '/profile/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/profile/settings', label: 'Settings', icon: Settings },
]

export function AccountSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, clearUser } = useUserStore()
  const links = isAuthenticated && user?.role === 'admin' ? adminLinks : userLinks

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // Proceed with local cleanup even if API logout fails.
    } finally {
      clearUser()
      router.push('/login')
      router.refresh()
    }
  }

  return (
    <aside className="sm:sticky sm:top-28">
      <div className="account-card rounded-2xl border border-white/5 bg-[#0a0c18] p-4">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">Navigation</p>
        <h2 className="text-lg font-bold text-white mb-4">{user?.role === 'admin' ? 'Admin Dashboard' : 'My Account'}</h2>
        <nav className="flex flex-col gap-2 overflow-visible pb-0">
          {links.map((link) => {
            const Icon   = link.icon
            const active = link.href === '/profile'
              ? pathname === link.href
              : pathname === link.href || pathname.startsWith(`${link.href}/`)
            return (
              <Link
                key={`${link.href}-${link.label}`}
                href={link.href}
                className={cn(
                  'inline-flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 border',
                  active
                    ? 'bg-violet-600/10 text-violet-400 border-violet-500/20'
                    : 'text-slate-400 border-transparent hover:text-white hover:bg-white/5'
                )}
              >
                <Icon size={16} className={active ? 'text-violet-400' : 'text-slate-500'} />
                <span>{link.label}</span>
              </Link>
            )
          })}
        </nav>

        {isAuthenticated && (
          <button
            onClick={handleLogout}
            className="mt-3 w-full inline-flex items-center justify-center gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/8 px-3.5 py-2.5 text-sm font-medium text-rose-400 hover:bg-rose-500/14 transition-colors"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        )}
      </div>
    </aside>
  )
}
