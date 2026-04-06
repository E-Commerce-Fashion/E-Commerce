'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Loader2, ShieldCheck, ShoppingBag, Users, IndianRupee, PackagePlus, ArrowRight } from 'lucide-react'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import api from '@/lib/axios'
import { useUserStore } from '@/store/userStore'
import { formatCurrency } from '@/utils'

type DashboardStats = {
  totalOrders: number
  totalProducts: number
  totalUsers: number
  totalRevenue: number
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const { isAuthenticated, hasHydrated, user } = useUserStore()

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    if (!hasHydrated) return

    if (!isAuthenticated) {
      router.replace('/login')
      return
    }

    if (user?.role !== 'admin') {
      router.replace('/profile')
      toast.error('Admin access required')
      return
    }

    const fetchDashboard = async () => {
      try {
        const { data } = await api.get('/admin/dashboard')
        if (data.success) {
          setStats(data.data)
        }
      } catch (err: unknown) {
        const message = axios.isAxiosError(err)
          ? err.response?.data?.message || 'Failed to load admin dashboard'
          : 'Failed to load admin dashboard'

        if (axios.isAxiosError(err) && err.response?.status === 403) {
          router.replace('/profile')
        }
        toast.error(message)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [hasHydrated, isAuthenticated, router, user?.role])

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 rounded-none border p-5 sm:p-6"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--accent-gold)' }}>Operations overview</p>
        <h1 className="mt-2 text-3xl font-bold font-serif" style={{ color: 'var(--text-primary)' }}>
          Admin Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Revenue, catalog, and user activity in one control center.
        </p>
      </motion.div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          <Loader2 size={16} className="animate-spin" />
          Loading dashboard...
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-5">
            <StatCard title="Total Orders" value={stats?.totalOrders ?? 0} icon={ShoppingBag} />
            <StatCard title="Total Products" value={stats?.totalProducts ?? 0} icon={ShieldCheck} />
            <StatCard title="Total Users" value={stats?.totalUsers ?? 0} icon={Users} />
            <StatCard title="Total Revenue" value={stats?.totalRevenue ?? 0} icon={IndianRupee} currency />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <ActionCard
              title="Product Management"
              description="Create, update, and remove catalog items with variants and pricing."
              href="/admin/products"
              icon={PackagePlus}
            />
            <ActionCard
              title="Order Management"
              description="Track incoming orders and update order statuses from placed to delivered."
              href="/admin/orders"
              icon={ShoppingBag}
            />
            <ActionCard
              title="User Management"
              description="View customer accounts and update user roles with admin safeguards."
              href="/admin/users"
              icon={Users}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  title,
  value,
  icon: Icon,
  currency = false,
}: {
  title: string
  value: number
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>
  currency?: boolean
}) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const target = Number(value) || 0
    const duration = 700
    const start = performance.now()

    let frame = 0
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayValue(Math.round(target * eased))

      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value])

  const formattedValue = currency ? formatCurrency(displayValue) : String(displayValue)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-none border p-5 transition-all duration-300 hover:-translate-y-1"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
    >
      <div className="w-10 h-10 rounded-none flex items-center justify-center mb-3" style={{ background: 'rgba(var(--accent-gold-rgb), 0.12)' }}>
        <Icon size={18} style={{ color: 'var(--accent-gold)' }} />
      </div>
      <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{title}</p>
      <p className="text-2xl font-bold font-serif mt-1" style={{ color: 'var(--text-primary)' }}>{formattedValue}</p>
    </motion.div>
  )
}

function ActionCard({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string
  description: string
  href: string
  icon: typeof PackagePlus
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-none border p-5 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-1"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
    >
      <div className="w-10 h-10 rounded-none flex items-center justify-center" style={{ background: 'rgba(var(--accent-gold-rgb), 0.12)' }}>
        <Icon size={18} style={{ color: 'var(--accent-gold)' }} />
      </div>
      <div>
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{description}</p>
      </div>
      <Link
        href={href}
        className="group inline-flex w-fit items-center justify-center gap-2 px-4 py-2 rounded-none text-sm font-semibold transition-all duration-300 hover:gap-3"
        style={{ background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-rose))', color: '#0A0A0F' }}
      >
        Open
        <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5" />
      </Link>
    </motion.div>
  )
}
