'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  User, Mail, Phone, ShieldCheck, Save, Loader2,
  ShoppingBag, Heart, Crown, Settings, ChevronRight,
  TrendingUp, Package, LayoutDashboard, Users, BarChart3
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '@/lib/axios'
import { useUserStore } from '@/store/userStore'
import { AccountShell } from '@/components/account/AccountShell'
import { formatCurrency } from '@/utils'
import { cn } from '@/lib/utils'

type ProfileResponse = {
  id: string
  email: string
  name?: string
  phone?: string
  role?: 'user' | 'admin'
  avatar_url?: string
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated, hasHydrated, setUser } = useUserStore()

  const [loading, setLoading] = useState(true)
  const [saving,  setSaving ] = useState(false)
  const [form,    setForm   ] = useState({
    name:  '',
    phone: '',
    email: '',
    role:  'user' as 'user' | 'admin',
  })
  const [stats, setStats] = useState({
    orders:      0,
    wishlist:    0,
    totalSpent:  0,
    recentOrder: null as any,
  })

  const profileCompleteness = useMemo(() => {
    let score = 0
    if (form.name)        score += 40
    if (form.phone)       score += 30
    if (user?.avatar_url) score += 30
    return score
  }, [form.name, form.phone, user?.avatar_url])

  const isAdminProfile = form.role === 'admin'
  const pageTitle = isAdminProfile ? 'Admin Profile' : 'Account Overview'
  const pageSubtitle = isAdminProfile
    ? 'Manage your administrator profile and quick access to control-center pages.'
    : 'Manage your profile and account preferences.'

  useEffect(() => {
    if (!hasHydrated) return
    if (!isAuthenticated) { router.replace('/login'); return }

    const load = async () => {
      try {
        const [profileRes, ordersRes, wishlistRes] = await Promise.all([
          api.get('/auth/me'),
          api.get('/payments/orders').catch(() => ({ data: { success: false, data: [] } })),
          api.get('/products/user/wishlist').catch(() => ({ data: { success: false, data: [] } })),
        ])

        if (profileRes.data.success) {
          const p = profileRes.data.data as ProfileResponse
          const role = p.role || user?.role || 'user'
          setForm({ name: p.name || '', phone: p.phone || '', email: p.email || '', role })
          setUser({ ...user!, id: p.id, email: p.email, name: p.name || user?.name || 'User', role, avatar_url: p.avatar_url, phone: p.phone })
        }

        const orders    = ordersRes.data?.data || []
        const totalSpent = orders.reduce((s: number, o: any) => s + (o.payment_status === 'paid' ? o.total_amount : 0), 0)
        setStats({ orders: orders.length, wishlist: (wishlistRes.data?.data || []).length, totalSpent, recentOrder: orders[0] || null })
      } catch {
        toast.error('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [hasHydrated, isAuthenticated, router, setUser])

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Name is required')
    setSaving(true)
    try {
      const { data } = await api.put('/auth/me', { name: form.name.trim(), phone: form.phone.trim() })
      if (data.success) {
        setUser({ ...user!, name: data.data.name, phone: data.data.phone })
        toast.success('Profile updated!')
      }
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AccountShell title={user?.role === 'admin' ? 'Admin Profile' : 'Account Overview'}>
        <div className="h-[50vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
        </div>
      </AccountShell>
    )
  }

  const quickStats = [
    { label: 'Orders',   value: stats.orders,      icon: ShoppingBag, href: '/orders',   color: 'text-violet-400 bg-violet-500/10' },
    { label: 'Wishlist', value: stats.wishlist,     icon: Heart,       href: '/wishlist', color: 'text-rose-400   bg-rose-500/10'   },
    { label: 'Status',   value: 'Verified',         icon: ShieldCheck, href: '/profile',  color: 'text-emerald-400 bg-emerald-500/10' },
    { label: 'Support',  value: '24/7 Elite',       icon: Phone,       href: '/profile',  color: 'text-blue-400  bg-blue-500/10'   },
  ]

  const portalLinks = form.role === 'admin'
    ? [
      { href: '/profile/products', icon: Package, label: 'Products' },
      { href: '/profile/orders', icon: ShoppingBag, label: 'Orders' },
      { href: '/profile/customers', icon: Users, label: 'Customers' },
      { href: '/profile/analytics', icon: BarChart3, label: 'Analytics' },
      { href: '/profile/settings', icon: Settings, label: 'Settings' },
    ]
    : [
      { href: '/orders', icon: ShoppingBag, label: 'Track My Orders', count: stats.orders },
      { href: '/wishlist', icon: Heart, label: 'Wishlist', count: stats.wishlist },
      { href: '/profile', icon: Settings, label: 'Account Settings' },
    ]

  return (
    <AccountShell title={pageTitle} subtitle={pageSubtitle}>
      <motion.div
        className="space-y-6 pb-12 w-full"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.07 } } }}
      >
        {/* ── Hero Banner ─────────────────────────────────────── */}
        <motion.div variants={fadeUp} className="account-card rounded-2xl border border-white/5 bg-[#0a0c18] p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">

            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
                {user?.avatar_url ? (
                  <Image src={user.avatar_url} alt={user.name || 'Avatar'} fill sizes="80px" className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-linear-to-br from-violet-600 to-purple-800 flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">
                      {(user?.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <span className="absolute -bottom-1.5 -right-1.5 w-5 h-5 bg-emerald-500 rounded-full border-2 border-[#0a0c18] flex items-center justify-center">
                <ShieldCheck className="w-2.5 h-2.5 text-white" />
              </span>
            </div>

            {/* User info */}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <h2 className="text-xl sm:text-2xl font-bold text-white">Hello, {form.name || 'User'}</h2>
                {form.role === 'admin' ? (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-violet-500/10 text-violet-400 border border-violet-500/20">
                    Administrator
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/5 text-slate-400 border border-white/10">
                    <Crown size={9} className="text-amber-400" /> VIP Member
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500">{form.email}</p>

              {/* Completeness bar */}
              <div className="mt-4 max-w-xs mx-auto sm:mx-0">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wider mb-1.5">
                  <span className="text-slate-500">Profile Completeness</span>
                  <span className="text-violet-400 font-semibold">{profileCompleteness}%</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-linear-to-r from-violet-600 to-purple-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${profileCompleteness}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                  />
                </div>
              </div>
            </div>

            {/* Total Spent */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="account-card rounded-xl border border-white/5 bg-white/3 px-5 py-4 text-center shrink-0 w-full sm:w-auto"
            >
              <TrendingUp className="text-violet-400 mx-auto mb-2" size={18} />
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Total Spent</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalSpent)}</p>
              <Link href="/orders" className="text-[10px] font-medium text-slate-500 hover:text-violet-400 transition-colors flex items-center justify-center gap-1 mt-2">
                View Orders <ChevronRight size={10} />
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* ── Quick Stats ─────────────────────────────────────── */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickStats.map((card) => (
            <motion.div key={card.label} whileHover={{ y: -3, scale: 1.02 }} transition={{ duration: 0.2 }}>
              <Link
                href={card.href}
                className="account-card flex flex-col items-center gap-2.5 py-5 px-3 rounded-2xl border border-white/5 bg-[#0a0c18] hover:border-white/10 transition-colors"
              >
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', card.color)}>
                  <card.icon size={18} />
                </div>
                <p className="text-xl font-bold text-white">{card.value}</p>
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{card.label}</p>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Main grid ───────────────────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Edit Form */}
          <motion.div variants={fadeUp} className="lg:col-span-2">
            <div className="account-card rounded-2xl border border-white/5 bg-[#0a0c18] p-5 sm:p-7">
              <h3 className="font-bold text-white text-lg mb-6">Identity Profile</h3>
              <form onSubmit={onSave} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <InputField label="Full Name"     value={form.name}  icon={User}        onChange={(v: string) => setForm({ ...form, name: v })} />
                  <InputField label="Phone Number"  value={form.phone} icon={Phone}       onChange={(v: string) => setForm({ ...form, phone: v })} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <InputField label="Email Address" value={form.email} icon={Mail}        readOnly />
                  <InputField label="Account Role"  value={form.role === 'admin' ? 'Administrator' : 'Verified Member'} icon={ShieldCheck} readOnly />
                </div>
                <motion.button
                  type="submit"
                  disabled={saving}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                  {saving ? 'Saving…' : 'Save Changes'}
                </motion.button>
              </form>
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div variants={fadeUp} className="space-y-4">

            {/* Quick Portal */}
            <div className="account-card rounded-2xl border border-white/5 bg-[#0a0c18] p-5">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-violet-400 mb-4">
                {isAdminProfile ? 'Admin Portal' : 'Quick Portal'}
              </h3>
              <div className="space-y-0.5">
                {portalLinks.map((pl) => (
                  <Link
                    key={pl.href + pl.label}
                    href={pl.href}
                    className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <pl.icon size={15} className="text-slate-500 group-hover:text-violet-400 transition-colors" />
                      <span className="text-sm text-slate-400 group-hover:text-white transition-colors">{pl.label}</span>
                    </div>
                    {pl.count !== undefined && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400 group-hover:text-violet-400 group-hover:border-violet-500/30 transition-all">
                        {pl.count}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>

            {/* Most recent order */}
            {stats.recentOrder && (
              <div className="account-card rounded-2xl border border-white/5 bg-[#0a0c18] p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">Latest Order</p>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-500/10 border border-violet-500/20 shrink-0">
                    <Package size={18} className="text-violet-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white">#{stats.recentOrder.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider truncate">{stats.recentOrder.order_status}</p>
                  </div>
                </div>
                <Link
                  href={`/orders/${stats.recentOrder.id}`}
                  className="w-full inline-flex items-center justify-center py-2.5 rounded-xl bg-white/5 border border-white/5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  View Order Details
                </Link>
              </div>
            )}
          </motion.div>
        </div>

      </motion.div>
    </AccountShell>
  )
}

// ── Shared sub-components ──────────────────────────────────────

function InputField({ label, value, icon: Icon, onChange, readOnly }: {
  label: string
  value: string
  icon: React.ElementType
  onChange?: (v: string) => void
  readOnly?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</label>
      <div className={cn(
        'account-input flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-colors',
        readOnly
          ? 'bg-white/3 border-white/5'
          : 'bg-white/5 border-white/10 focus-within:border-violet-500/50'
      )}>
        <Icon size={15} className={readOnly ? 'text-slate-600 shrink-0' : 'text-violet-400 shrink-0'} />
        <input
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly={readOnly}
          className={cn(
            'flex-1 bg-transparent text-sm outline-none w-full min-w-0',
            readOnly ? 'text-slate-500 cursor-default' : 'text-white'
          )}
        />
      </div>
    </div>
  )
}
