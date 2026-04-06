'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, CheckCircle2, Clock, Truck, XCircle, ChevronDown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { formatCurrency, formatDate } from '@/utils'
import { toast } from 'react-hot-toast'
import api from '@/lib/axios'
import { useUserStore } from '@/store/userStore'
import { AccountShell } from '@/components/account/AccountShell'

const statusConfig: Record<string, { icon: LucideIcon; color: string; label: string }> = {
  placed:     { icon: Clock,         color: '#f59e0b', label: 'Placed' },
  processing: { icon: Package,       color: '#3b82f6', label: 'Processing' },
  shipped:    { icon: Truck,         color: '#8b5cf6', label: 'Shipped' },
  delivered:  { icon: CheckCircle2,  color: '#22c55e', label: 'Delivered' },
  cancelled:  { icon: XCircle,       color: '#ef4444', label: 'Cancelled' },
}

interface Order {
  id: string
  items: { name: string; size: string; qty: number; price: number; image?: string }[]
  total_amount: number
  payment_status: string
  order_status: string
  created_at: string
  delivered_at?: string
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <main className="page-with-navbar-offset min-h-screen pb-20 px-3 sm:px-6 lg:px-8 w-full" style={{ background: 'var(--bg-base)' }}>
          <div className="w-full">
            <div className="h-10 w-48 skeleton rounded-2xl" />
          </div>
        </main>
      }
    >
      <OrdersPageContent />
    </Suspense>
  )
}

function OrdersPageContent() {
  const router = useRouter()
  const { isAuthenticated, hasHydrated } = useUserStore()
  const searchParams = useSearchParams()
  const successId = searchParams.get('success')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(successId)

  useEffect(() => {
    if (successId) toast.success('Order placed successfully! 🎉', { duration: 5000 })
  }, [successId])

  useEffect(() => {
    if (!hasHydrated) return

    if (!isAuthenticated) {
      router.replace('/login')
      return
    }

    const fetchOrders = async () => {
      try {
        const { data } = await api.get('/payments/orders')
        if (data.success) setOrders(data.data || [])
      } catch {
        setOrders([])
        toast.error('Failed to load order details')
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [hasHydrated, isAuthenticated, router])

  return (
    <AccountShell
      title="Order Details"
      subtitle="Track your purchases and view item-level details."
    >
      <div className="w-full">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-3xl font-bold font-serif mb-6"
            style={{ color: 'var(--text-primary)' }}
          >
            Recent Orders
          </motion.h1>

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 skeleton rounded-2xl" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 rounded-none border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <p className="text-5xl mb-4">📦</p>
              <p className="text-lg font-serif font-bold" style={{ color: 'var(--text-primary)' }}>No orders yet</p>
              <p style={{ color: 'var(--text-muted)' }}>Start shopping to see your orders here.</p>
            </motion.div>
          ) : (
              <div className="space-y-4">
              {orders.map((order, i) => {
                const status = statusConfig[order.order_status] || statusConfig.placed
                const StatusIcon = status.icon
                const isExpanded = expandedId === order.id
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="rounded-none overflow-hidden border transition-all duration-300 hover:-translate-y-0.5"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                  >
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : order.id)}
                      className="w-full flex items-center justify-between p-5 text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${status.color}18` }}>
                          <StatusIcon size={18} style={{ color: status.color }} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                            #{order.id.slice(0, 8).toUpperCase()}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {formatDate(order.created_at)} · {order.items.length} items
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-bold" style={{ color: 'var(--accent-gold)' }}>{formatCurrency(order.total_amount)}</p>
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${status.color}18`, color: status.color }}>
                            {status.label}
                          </span>
                        </div>
                        <ChevronDown size={16} style={{ color: 'var(--text-muted)', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
                            {order.items.map((item, j) => (
                              <div key={j} className="flex items-center justify-between pt-3 text-sm">
                                <div>
                                  <p style={{ color: 'var(--text-primary)' }}>{item.name}</p>
                                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Size: {item.size} · Qty: {item.qty}</p>
                                </div>
                                <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(item.price * item.qty)}</p>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>
          )}
      </div>
    </AccountShell>
  )
}
