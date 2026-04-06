'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { LayoutDashboard, PackageSearch, ShoppingBag, Users } from 'lucide-react'

const adminLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Product Management', icon: PackageSearch },
  { href: '/admin/orders', label: 'Order Management', icon: ShoppingBag },
  { href: '/admin/users', label: 'User Management', icon: Users },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="lg:sticky lg:top-30">
      <div
        className="rounded-2xl border p-4"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <p className="text-xs uppercase tracking-[0.22em]" style={{ color: 'var(--accent-gold)' }}>
          Admin Panel
        </p>
        <h2 className="mt-2 text-xl font-bold font-serif" style={{ color: 'var(--text-primary)' }}>
          Management
        </h2>

        <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar lg:flex-col">
          {adminLinks.map((link) => {
            const Icon = link.icon
            const active = pathname === link.href

            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative inline-flex min-w-fit items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-250"
                style={{
                  background: active ? 'rgba(var(--accent-gold-rgb), 0.14)' : 'var(--bg-elevated)',
                  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                  border: `1px solid ${active ? 'rgba(var(--accent-gold-rgb), 0.45)' : 'var(--border)'}`,
                }}
              >
                <Icon size={16} style={{ color: active ? 'var(--accent-gold)' : 'var(--text-muted)' }} />
                <span>{link.label}</span>
                {active && (
                  <motion.span
                    layoutId="admin-sidebar-active"
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    style={{ boxShadow: 'inset 0 0 0 1px rgba(var(--accent-gold-rgb), 0.24)' }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
