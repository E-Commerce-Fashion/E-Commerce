'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Package, CheckCircle2, Clock, Truck, XCircle, 
  MapPin, CreditCard, ChevronLeft, ArrowRight,
  ShieldCheck, HelpCircle, Download
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/utils'
import { toast } from 'react-hot-toast'
import api from '@/lib/axios'
import { useUserStore } from '@/store/userStore'
import { AccountShell } from '@/components/account/AccountShell'

interface OrderItem {
  product_id: string
  name: string
  size: string
  color?: string
  qty: number
  price: number
  image?: string
}

interface Order {
  id: string
  items: OrderItem[]
  total_amount: number
  payment_status: string
  order_status: string
  shipping_address: {
    name: string
    phone: string
    street: string
    city: string
    state: string
    pincode: string
  }
  created_at: string
  delivered_at?: string
}

const statusSteps = [
  { status: 'placed', label: 'Order Placed', desc: 'We have received your order.', icon: Clock },
  { status: 'processing', label: 'Processing', desc: 'Your items are being prepared.', icon: Package },
  { status: 'shipped', label: 'Shipped', desc: 'Your order is on the way.', icon: Truck },
  { status: 'delivered', label: 'Delivered', desc: 'Order reached its destination.', icon: CheckCircle2 },
]

export default function OrderDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const { isAuthenticated, hasHydrated } = useUserStore()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hasHydrated) return
    if (!isAuthenticated) {
      router.replace('/login')
      return
    }

    const fetchOrder = async () => {
      try {
        const { data } = await api.get(`/payments/orders/${id}`)
        if (data.success) {
          setOrder(data.data)
        }
      } catch (err) {
        toast.error('Order not found')
        router.push('/orders')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [id, hasHydrated, isAuthenticated, router])

  if (loading) {
    return (
      <AccountShell title="Loading Order..." subtitle="Please wait while we fetch your details.">
        <div className="w-full flex flex-col gap-6">
          <div className="h-48 w-full skeleton rounded-2xl" />
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-32 skeleton rounded-2xl" />
            <div className="h-32 skeleton rounded-2xl" />
          </div>
        </div>
      </AccountShell>
    )
  }

  if (!order) return null

  const currentStatusIndex = statusSteps.findIndex(s => s.status === order.order_status)
  const isCancelled = order.order_status === 'cancelled'

  return (
    <AccountShell 
      title={`Order Details`} 
      subtitle={`Review your order #${order.id.slice(0, 8).toUpperCase()} tracking and summary.`}
    >
      <div className="w-full space-y-8 pb-10">
        {/* Back Link */}
        <Link href="/orders" className="inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:text-(--accent-gold)" style={{ color: 'var(--text-secondary)' }}>
          <ChevronLeft size={16} />
          Back to all orders
        </Link>

        {/* Order Hero / Status Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border p-6 sm:p-8"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--accent-gold)' }}>
                  {order.payment_status === 'paid' ? 'Paid Securely' : 'Payment Pending'}
                </p>
                <div className="h-1 w-1 rounded-full bg-white/20" />
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{formatDate(order.created_at)}</p>
              </div>
              <h1 className="text-2xl sm:text-4xl font-bold font-serif" style={{ color: 'var(--text-primary)' }}>
                Order #{order.id.slice(0, 8).toUpperCase()}
              </h1>
            </div>
            <div className="text-left md:text-right">
              <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Grand Total</p>
              <p className="text-2xl sm:text-3xl font-bold font-serif" style={{ color: 'var(--accent-gold)' }}>
                {formatCurrency(order.total_amount)}
              </p>
            </div>
          </div>

          <div className="absolute top-0 right-0 p-8 opacity-[0.03] select-none pointer-events-none">
            <Package size={200} />
          </div>
        </motion.div>

        {/* Tracking Timeline */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border p-6 sm:p-8"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <h2 className="text-xl font-bold font-serif mb-8 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Truck size={20} style={{ color: 'var(--accent-gold)' }} />
            Delivery Progress
          </h2>

          {isCancelled ? (
            <div className="flex items-center gap-4 p-5 rounded-xl border border-red-500/20" style={{ background: 'rgba(239, 68, 68, 0.05)' }}>
              <XCircle className="text-red-500" size={24} />
              <div>
                <p className="font-bold text-red-500">Order Cancelled</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>This order was cancelled and will not be fulfilled.</p>
              </div>
            </div>
          ) : (
            <div className="relative flex flex-col sm:flex-row gap-8 sm:gap-0 justify-between">
              {/* Desktop Progress Line */}
              <div className="hidden sm:block absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-(--border) overflow-hidden">
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${(currentStatusIndex / (statusSteps.length - 1)) * 100}%` }}
                   transition={{ duration: 1, ease: "easeOut" }}
                   className="h-full"
                   style={{ background: 'linear-gradient(90deg, var(--accent-gold), var(--accent-rose))' }}
                />
              </div>

              {statusSteps.map((step, idx) => {
                const isActive = idx <= currentStatusIndex
                const isCurrent = idx === currentStatusIndex
                const Icon = step.icon

                return (
                  <div key={step.status} className="relative z-10 flex sm:flex-col items-center sm:items-center text-left sm:text-center group">
                    <div 
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                        isActive ? 'scale-110 shadow-lg' : 'scale-100 opacity-40'
                      }`}
                      style={{ 
                        background: isActive ? 'var(--bg-surface)' : 'var(--bg-elevated)',
                        borderColor: isActive ? 'var(--accent-gold)' : 'var(--border)',
                        boxShadow: isCurrent ? '0 0 20px rgba(var(--accent-gold-rgb), 0.3)' : 'none'
                      }}
                    >
                      <Icon 
                        size={20} 
                        style={{ color: isActive ? 'var(--accent-gold)' : 'var(--text-muted)' }} 
                        className={isCurrent ? 'animate-pulse' : ''}
                      />
                    </div>
                    <div className="ml-4 sm:ml-0 sm:mt-4">
                      <p className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-(--text-primary)' : 'text-(--text-muted)'}`}>
                        {step.label}
                      </p>
                      <p className="text-[10px] sm:max-w-[120px]" style={{ color: 'var(--text-muted)' }}>
                        {isActive ? step.desc : 'TBD'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Order Items */}
          <div className="lg:col-span-3 space-y-4">
            <h2 className="text-xl font-bold font-serif flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Package size={20} style={{ color: 'var(--accent-gold)' }} />
              Shipment Information
            </h2>
            
            <div className="space-y-4">
              {order.items.map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + (idx * 0.1) }}
                  className="flex gap-4 p-4 rounded-xl border group hover:border-(--accent-gold) transition-all"
                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                >
                  <div className="relative w-20 h-24 rounded-lg overflow-hidden shrink-0" style={{ background: 'var(--bg-elevated)' }}>
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover transition-transform group-hover:scale-110" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center opacity-20"><Package size={24} /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-semibold text-sm sm:text-base truncate" style={{ color: 'var(--text-primary)' }}>{item.name}</h4>
                      <p className="font-bold text-(--accent-gold) shrink-0">{formatCurrency(item.price)}</p>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <p><span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Size:</span> {item.size}</p>
                      {item.color && <p><span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Color:</span> {item.color}</p>}
                      <p><span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Quantity:</span> {item.qty}</p>
                    </div>
                    <div className="mt-3">
                      <Link 
                        href={`/products/${item.product_id}`} 
                        className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 hover:text-(--accent-gold)" 
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Details <ArrowRight size={10} />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Pillar: Address & Payment Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address */}
            <div className="p-6 rounded-2xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <h3 className="text-sm font-bold uppercase tracking-[0.15em] mb-4 flex items-center gap-2" style={{ color: 'var(--accent-gold)' }}>
                <MapPin size={16} />
                Shipping To
              </h3>
              <div className="space-y-1">
                <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{order.shipping_address.name}</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {order.shipping_address.street}
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {order.shipping_address.city}, {order.shipping_address.state} — {order.shipping_address.pincode}
                </p>
                <p className="text-sm pt-2" style={{ color: 'var(--text-muted)' }}>
                  {order.shipping_address.phone}
                </p>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="p-6 rounded-2xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <h3 className="text-sm font-bold uppercase tracking-[0.15em] mb-4 flex items-center gap-2" style={{ color: 'var(--accent-gold)' }}>
                <CreditCard size={16} />
                Payment Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>Status</span>
                  <span className="font-bold capitalize" style={{ color: order.payment_status === 'paid' ? '#22c55e' : '#f59e0b' }}>
                    {order.payment_status}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                   <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                   <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(order.total_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                   <span style={{ color: 'var(--text-secondary)' }}>Shipping</span>
                   <span className="text-[#22c55e]">Free</span>
                </div>
                <div className="pt-3 flex justify-between items-end border-t" style={{ borderColor: 'var(--border)' }}>
                   <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Total Charged</span>
                   <span className="text-xl font-bold font-serif" style={{ color: 'var(--accent-gold)' }}>{formatCurrency(order.total_amount)}</span>
                </div>
              </div>

              <button className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all hover:bg-white/5" style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                <Download size={14} />
                Download Invoice
              </button>
            </div>

            {/* Help & Support */}
            <div className="p-6 rounded-2xl border border-dashed text-center" style={{ background: 'rgba(var(--accent-gold-rgb), 0.03)', borderColor: 'var(--border)' }}>
              <HelpCircle size={24} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Need help with this order?</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>If you have issues with your products or delivery, reach out to our concierge.</p>
              <button className="mt-4 text-xs font-bold uppercase tracking-wider decoration-(--accent-gold) underline underline-offset-4" style={{ color: 'var(--accent-gold)' }}>
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </AccountShell>
  )
}
