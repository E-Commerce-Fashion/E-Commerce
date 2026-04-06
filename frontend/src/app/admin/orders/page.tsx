'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2, PackageCheck, RefreshCw } from 'lucide-react'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import api from '@/lib/axios'
import { useUserStore } from '@/store/userStore'
import { formatCurrency, formatDate } from '@/utils'

type OrderStatus = 'placed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

type OrderProfile = {
  name?: string | null
  avatar_url?: string | null
  phone?: string | null
}

type AdminOrder = {
  id: string
  user_id: string | null
  total_amount: number
  payment_status: PaymentStatus
  order_status: OrderStatus
  created_at: string
  profiles?: OrderProfile | OrderProfile[] | null
}

const ORDER_STATUS_OPTIONS: OrderStatus[] = ['placed', 'processing', 'shipped', 'delivered', 'cancelled']
const PAYMENT_STATUS_OPTIONS: Array<'all' | PaymentStatus> = ['all', 'pending', 'paid', 'failed', 'refunded']

function getOrderProfile(profiles: AdminOrder['profiles']) {
  if (!profiles) return null
  return Array.isArray(profiles) ? profiles[0] : profiles
}

export default function AdminOrdersPage() {
  const router = useRouter()
  const { isAuthenticated, hasHydrated, user } = useUserStore()

  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all')
  const [paymentFilter, setPaymentFilter] = useState<'all' | PaymentStatus>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [draftStatus, setDraftStatus] = useState<Record<string, OrderStatus>>({})

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params: Record<string, string | number> = { limit: 100 }
      if (statusFilter !== 'all') params.status = statusFilter
      if (paymentFilter !== 'all') params.payment_status = paymentFilter

      const { data } = await api.get('/admin/orders', { params })
      if (data.success) {
        setOrders((data.data || []) as AdminOrder[])
      }
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || 'Failed to load orders'
        : 'Failed to load orders'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

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

    fetchOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated, isAuthenticated, router, user?.role, statusFilter, paymentFilter])

  const updateOrder = async (order: AdminOrder) => {
    const nextStatus = draftStatus[order.id] || order.order_status
    if (nextStatus === order.order_status) return

    setUpdatingId(order.id)
    try {
      const { data } = await api.put(`/admin/orders/${order.id}/status`, { order_status: nextStatus })
      if (data.success) {
        setOrders((prev) => prev.map((item) => (
          item.id === order.id ? { ...item, order_status: nextStatus } : item
        )))
        toast.success('Order status updated')
      }
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || 'Failed to update order'
        : 'Failed to update order'
      toast.error(message)
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="w-full space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-none border p-5 sm:p-6"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--accent-gold)' }}>Order management</p>
        <h1 className="mt-2 text-3xl font-bold font-serif" style={{ color: 'var(--text-primary)' }}>
          Manage Orders
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Track order progress and update delivery pipeline.
        </p>
      </motion.div>

      <div className="rounded-2xl border p-4 sm:p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | OrderStatus)}
            className="rounded-xl px-3 py-2 text-sm outline-none"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          >
            <option value="all">All order statuses</option>
            {ORDER_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status} className="capitalize">{status}</option>
            ))}
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as 'all' | PaymentStatus)}
            className="rounded-xl px-3 py-2 text-sm outline-none"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          >
            {PAYMENT_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status} className="capitalize">
                {status === 'all' ? 'All payment statuses' : status}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={fetchOrders}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          <Loader2 size={16} className="animate-spin" />
          Loading orders...
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const profile = getOrderProfile(order.profiles)
            const selectedStatus = draftStatus[order.id] || order.order_status

            return (
              <div
                key={order.id}
                className="rounded-2xl border p-4 sm:p-5"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--accent-gold)' }}>
                      Order #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {profile?.name || 'Unknown user'} • {order.user_id ? order.user_id.slice(0, 8) : 'N/A'}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      Placed on {formatDate(order.created_at)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold font-serif" style={{ color: 'var(--text-primary)' }}>
                      {formatCurrency(Number(order.total_amount || 0))}
                    </p>
                    <p className="text-xs capitalize" style={{ color: order.payment_status === 'paid' ? '#22c55e' : 'var(--text-muted)' }}>
                      Payment: {order.payment_status}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setDraftStatus((prev) => ({ ...prev, [order.id]: e.target.value as OrderStatus }))}
                    className="rounded-xl px-3 py-2 text-sm capitalize outline-none"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  >
                    {ORDER_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status} className="capitalize">{status}</option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => updateOrder(order)}
                    disabled={updatingId === order.id || selectedStatus === order.order_status}
                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-rose))', color: '#0A0A0F' }}
                  >
                    {updatingId === order.id ? <Loader2 size={14} className="animate-spin" /> : <PackageCheck size={14} />}
                    Update Status
                  </button>
                </div>
              </div>
            )
          })}

          {!orders.length && (
            <div className="rounded-2xl border p-6 text-center" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No orders found for the selected filters.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
