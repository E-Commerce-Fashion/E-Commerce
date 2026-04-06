'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { User, Mail, Phone, ShieldCheck, Save, Loader2, ShoppingBag, Heart } from 'lucide-react'
import axios from 'axios'
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher'
import { toast } from 'react-hot-toast'
import api from '@/lib/axios'
import { useUserStore } from '@/store/userStore'
import { AccountShell } from '@/components/account/AccountShell'

type ProfileResponse = {
  id: string
  email: string
  name?: string
  phone?: string
  role?: 'user' | 'admin'
  avatar_url?: string
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated, hasHydrated, setUser } = useUserStore()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    role: 'user' as 'user' | 'admin',
  })
  const [counts, setCounts] = useState({ orders: 0, wishlist: 0 })

  useEffect(() => {
    if (!hasHydrated) return

    if (!isAuthenticated) {
      router.replace('/login')
      return
    }

    const fetchProfile = async () => {
      try {
        const [profileRes, ordersRes, wishlistRes] = await Promise.all([
          api.get('/auth/me'),
          api.get('/payments/orders').catch(() => ({ data: { success: false, data: [] } })),
          api.get('/products/user/wishlist').catch(() => ({ data: { success: false, data: [] } })),
        ])

        if (profileRes.data.success) {
          const profile = profileRes.data.data as ProfileResponse
          const resolvedRole = profile.role || user?.role || 'user'
          setForm({
            name: profile.name || '',
            phone: profile.phone || '',
            email: profile.email || '',
            role: resolvedRole,
          })

          setUser({
            id: profile.id,
            email: profile.email,
            name: profile.name || user?.name || 'User',
            role: resolvedRole,
            avatar_url: profile.avatar_url,
            phone: profile.phone,
          })
        }

        setCounts({
          orders: Array.isArray(ordersRes.data?.data) ? ordersRes.data.data.length : 0,
          wishlist: Array.isArray(wishlistRes.data?.data) ? wishlistRes.data.data.length : 0,
        })
      } catch (err: unknown) {
        const message = axios.isAxiosError(err)
          ? err.response?.data?.message || 'Failed to load profile'
          : 'Failed to load profile'
        toast.error(message)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [hasHydrated, isAuthenticated, router, setUser, user?.name, user?.role])

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Name is required')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
      }

      const { data } = await api.put('/auth/me', payload)
      if (data.success) {
        setUser({
          id: user?.id || data.data.id,
          email: form.email,
          name: data.data.name || form.name,
          role: form.role,
          avatar_url: data.data.avatar_url,
          phone: data.data.phone || form.phone,
        })
        toast.success('Profile updated')
      }
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || 'Failed to update profile'
        : 'Failed to update profile'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AccountShell
      title="My Dashboard"
      subtitle="Manage your profile, orders, wishlist, and account preferences."
      actions={<ThemeSwitcher />}
    >
      <div className="space-y-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SummaryCard label="Order Details" value={String(counts.orders)} icon={ShoppingBag} href="/orders" />
          <SummaryCard label="Wishlist Items" value={String(counts.wishlist)} icon={Heart} href="/wishlist" />
          <SummaryCard label="Account Type" value={form.role === 'admin' ? 'Admin' : 'User'} icon={ShieldCheck} href="/profile" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-none border p-5 sm:p-6"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          {loading ? (
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              <Loader2 size={16} className="animate-spin" />
              Loading profile...
            </div>
          ) : (
            <form onSubmit={onSave} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2.5">
                  <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Full Name
                  </label>
                  <div className="flex items-center gap-3 px-4 py-3.5 rounded-none" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                    <User size={15} style={{ color: 'var(--text-muted)' }} />
                    <input
                      value={form.name}
                      onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                      className="bg-transparent outline-none text-sm flex-1 w-full"
                      style={{ color: 'var(--text-primary)' }}
                      placeholder="Your name"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Phone
                  </label>
                  <div className="flex items-center gap-3 px-4 py-3.5 rounded-none" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                    <Phone size={15} style={{ color: 'var(--text-muted)' }} />
                    <input
                      value={form.phone}
                      onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
                      className="bg-transparent outline-none text-sm flex-1 w-full"
                      style={{ color: 'var(--text-primary)' }}
                      placeholder="Phone number"
                    />
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2.5">
                  <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Email
                  </label>
                  <div className="flex items-center gap-3 px-4 py-3.5 rounded-none" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                    <Mail size={15} style={{ color: 'var(--text-muted)' }} />
                    <input value={form.email} readOnly className="bg-transparent outline-none text-sm flex-1 w-full" style={{ color: 'var(--text-muted)' }} />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Account Type
                  </label>
                  <div className="flex items-center gap-3 px-4 py-3.5 rounded-none" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                    <ShieldCheck size={15} style={{ color: 'var(--accent-gold)' }} />
                    <input value={form.role === 'admin' ? 'Admin' : 'User'} readOnly className="bg-transparent outline-none text-sm flex-1 w-full" style={{ color: 'var(--text-primary)' }} />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-none text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-rose))', color: '#0A0A0F' }}
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save Changes
                </button>

                {form.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="inline-flex items-center justify-center px-6 py-3 rounded-none text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  >
                    Open Admin Dashboard
                  </Link>
                )}
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AccountShell>
  )
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  href,
}: {
  label: string
  value: string
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>
  href: string
}) {
  return (
    <Link
      href={href}
      className="rounded-none border p-4 transition-all duration-300 hover:-translate-y-1"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
    >
      <div className="w-9 h-9 rounded-none flex items-center justify-center mb-3" style={{ background: 'rgba(var(--accent-gold-rgb), 0.12)' }}>
        <Icon size={16} style={{ color: 'var(--accent-gold)' }} />
      </div>
      <p className="text-xs uppercase tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="mt-1 text-xl font-bold font-serif" style={{ color: 'var(--text-primary)' }}>{value}</p>
    </Link>
  )
}
