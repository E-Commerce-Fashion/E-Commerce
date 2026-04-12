'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, CreditCard, Check, ChevronRight, Loader2, ShieldCheck,
  Package, ArrowLeft, Truck
} from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useUserStore } from '@/store/userStore'
import { formatCurrency } from '@/utils'
import { toast } from 'react-hot-toast'
import api from '@/lib/axios'
import axios from 'axios'

type AddressState = {
  name: string
  phone: string
  street: string
  city: string
  state: string
  pincode: string
}

type RazorpaySuccessResponse = {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

type RazorpayCheckoutOptions = {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  handler: (response: RazorpaySuccessResponse) => Promise<void>
  prefill: {
    name: string
    contact: string
    email?: string
  }
  theme: { color: string }
  modal: { ondismiss: () => void }
}

const steps = [
  { id: 'address', label: 'Shipping', icon: MapPin },
  { id: 'payment', label: 'Payment',  icon: CreditCard },
  { id: 'confirm', label: 'Confirm',  icon: Check },
]

declare global {
  interface Window {
    Razorpay: new (options: RazorpayCheckoutOptions) => { open: () => void }
  }
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, totalPrice, clearCart } = useCartStore()
  const { user, isAuthenticated, hasHydrated } = useUserStore()
  const [mounted, setMounted] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)

  const [address, setAddress] = useState<AddressState>({
    name: user?.name || '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
  })

  const loadRazorpayScript = async () => {
    if (typeof window === 'undefined') return false
    if (window.Razorpay) return true

    const existing = document.querySelector<HTMLScriptElement>('script[data-razorpay="checkout"]')
    if (existing) {
      return new Promise((resolve) => {
        existing.addEventListener('load', () => resolve(true), { once: true })
        existing.addEventListener('error', () => resolve(false), { once: true })
      })
    }

    return new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.setAttribute('data-razorpay', 'checkout')
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirect if not logged in or empty cart
  useEffect(() => {
    if (!hasHydrated || !mounted) return
    if (!isAuthenticated) router.push('/login')
    if (items.length === 0) router.push('/products')
  }, [hasHydrated, isAuthenticated, items.length, mounted, router])

  const [coupon, setCoupon] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount_type: string; discount_value: number } | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)

  const handleApplyCoupon = async () => {
    if (!coupon.trim()) return
    setCouponLoading(true)
    try {
      const { data } = await api.post('/coupons/validate', { 
        code: coupon, 
        cartTotal: totalPrice() 
      })
      if (data.success) {
        setAppliedCoupon(data.data)
        toast.success('Coupon applied! 🎉')
      }
    } catch (err) {
      toast.error(axios.isAxiosError(err) ? err.response?.data?.message : 'Invalid coupon')
    } finally {
      setCouponLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!address.name || !address.phone || !address.street || !address.city || !address.state || !address.pincode) {
      toast.error('Please fill all address fields')
      setCurrentStep(0)
      return
    }

    setLoading(true)
    try {
      // 1. Create order on backend
      const { data } = await api.post('/payments/create-order', {
        items: items.map((i) => ({
          product_id: i.product_id,
          size: i.size,
          color: i.color,
          qty: i.qty,
        })),
        shippingAddress: address,
        couponCode: appliedCoupon?.code
      })

      if (!data.success) throw new Error(data.message)

      const { orderId, razorpayOrderId, amount, currency, keyId } = data.data

      // 2. Open Razorpay checkout
      const options: RazorpayCheckoutOptions = {
        key: keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount,
        currency,
        name: 'FashionForge',
        description: `Order #${orderId.slice(0, 8).toUpperCase()}`,
        order_id: razorpayOrderId,
        handler: async (response: RazorpaySuccessResponse) => {
          try {
            // 3. Verify payment
            const verifyRes = await api.post('/payments/verify-payment', {
              orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            })

            if (verifyRes.data.success) {
              clearCart()
              toast.success('Payment successful! 🎉')
              router.push(`/orders?success=${orderId}`)
            } else {
              toast.error('Payment verification failed')
            }
          } catch {
            toast.error('Payment verification error')
          }
        },
        prefill: {
          name: address.name,
          contact: address.phone,
          email: user?.email,
        },
        theme: { color: '#C9A84C' },
        modal: {
          ondismiss: () => {
            setLoading(false)
            toast.error('Payment cancelled')
          },
        },
      }

      const scriptReady = await loadRazorpayScript()
      if (!scriptReady || !window.Razorpay) {
        toast.error('Payment gateway failed to load. Please refresh and try again.')
        return
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || 'Failed to initiate payment'
        : 'Failed to initiate payment'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const safeItems = mounted ? items : []
  const subtotal = mounted ? totalPrice() : 0
  const shipping = subtotal >= 999 ? 0 : 99
  const tax = Math.round(subtotal * 0.18)
  const discount = !appliedCoupon ? 0 : 
    appliedCoupon.discount_type === 'percentage' 
      ? Math.round(subtotal * (appliedCoupon.discount_value / 100))
      : appliedCoupon.discount_value

  const grandTotal = Math.max(0, subtotal - discount + shipping + tax)

  return (
    <>
      <main className="page-with-navbar-offset relative min-h-screen pb-20 px-3 sm:px-6 lg:px-8" style={{ background: 'var(--bg-base)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 60% 35% at 50% -15%, rgba(var(--accent-gold-rgb), 0.08), transparent)',
        }} />

        <div className="relative w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold font-serif" style={{ color: 'var(--text-primary)' }}>
              Checkout
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Complete your shipping details and secure payment.
            </p>
          </motion.div>

          {/* Progress Steps */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            {steps.map((step, i) => {
              const Icon = step.icon
              const isActive = i === currentStep
              const isDone = i < currentStep
              return (
                <div key={step.id} className="flex items-center gap-2">
                  <button
                    onClick={() => i < currentStep && setCurrentStep(i)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300"
                    style={{
                      background: isActive
                        ? 'linear-gradient(135deg, var(--accent-gold), var(--accent-rose))'
                        : isDone ? 'rgba(34,197,94,0.1)' : 'var(--bg-elevated)',
                      color: isActive ? '#0A0A0F' : isDone ? '#22c55e' : 'var(--text-muted)',
                      border: `1px solid ${isDone ? 'rgba(34,197,94,0.3)' : isActive ? 'transparent' : 'var(--border)'}`,
                    }}
                  >
                    {isDone ? <Check size={14} /> : <Icon size={14} />}
                    <span className="hidden sm:inline">{step.label}</span>
                  </button>
                  {i < steps.length - 1 && (
                    <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                  )}
                </div>
              )
            })}
          </div>

          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 items-start">
            {/* Left — Step content */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                {currentStep === 0 && (
                  <motion.div
                    key="address"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="p-6 rounded-2xl space-y-5"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                  >
                    <h2 className="text-xl font-bold font-serif flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      <MapPin size={18} style={{ color: 'var(--accent-gold)' }} />
                      Shipping Address
                    </h2>

                    <div className="grid sm:grid-cols-2 gap-4">
                      {([
                        { label: 'Full Name', key: 'name', placeholder: 'John Doe', type: 'text', full: false },
                        { label: 'Phone', key: 'phone', placeholder: '+91 98765 43210', type: 'tel', full: false },
                        { label: 'Street', key: 'street', placeholder: '123 Fashion Ave', type: 'text', full: true },
                        { label: 'City', key: 'city', placeholder: 'Mumbai', type: 'text', full: false },
                        { label: 'State', key: 'state', placeholder: 'Maharashtra', type: 'text', full: false },
                        { label: 'Pincode', key: 'pincode', placeholder: '400001', type: 'text', full: false },
                      ] as const).map(({ label, key, placeholder, type, full }) => (
                        <div key={key} className={full ? 'sm:col-span-2' : ''}>
                          <label className="block text-xs font-semibold mb-2.5" style={{ color: 'var(--text-secondary)' }}>{label}</label>
                          <input
                            type={type}
                            placeholder={placeholder}
                            value={address[key]}
                            onChange={(e) => setAddress({ ...address, [key]: e.target.value })}
                            className="w-full px-4 py-3.5 rounded-xl bg-transparent outline-none text-sm transition-colors"
                            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                            required
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => {
                          if (!address.name || !address.phone || !address.street || !address.city || !address.state || !address.pincode) {
                            toast.error('Please fill all fields')
                            return
                          }
                          setCurrentStep(1)
                        }}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 hover:gap-3"
                        style={{ background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-rose))', color: '#0A0A0F' }}
                      >
                        Continue to Payment
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </motion.div>
                )}

                {currentStep === 1 && (
                  <motion.div
                    key="payment"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="p-6 rounded-2xl space-y-5"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                  >
                    <h2 className="text-xl font-bold font-serif flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      <CreditCard size={18} style={{ color: 'var(--accent-gold)' }} />
                      Payment Method
                    </h2>

                    <div className="rounded-2xl p-5" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(var(--accent-gold-rgb), 0.1)' }}>
                          <ShieldCheck size={20} style={{ color: 'var(--accent-gold)' }} />
                        </div>
                        <div>
                          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Razorpay Secure Checkout</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            UPI · Cards · Netbanking · Wallets — All supported
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                      <Check size={16} style={{ color: '#22c55e' }} />
                      <p className="text-xs" style={{ color: '#22c55e' }}>Your payment is encrypted and 100% secured by Razorpay</p>
                    </div>

                    <div className="flex justify-between pt-2">
                      <button
                        onClick={() => setCurrentStep(0)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <ArrowLeft size={14} /> Back
                      </button>
                      <button
                        onClick={() => setCurrentStep(2)}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 hover:gap-3"
                        style={{ background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-rose))', color: '#0A0A0F' }}
                      >
                        Review Order
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="p-6 rounded-2xl space-y-5"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                  >
                    <h2 className="text-xl font-bold font-serif flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      <Package size={18} style={{ color: 'var(--accent-gold)' }} />
                      Order Review
                    </h2>

                    {/* Address summary */}
                    <div className="rounded-xl p-4" style={{ background: 'var(--bg-elevated)' }}>
                      <p className="text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--accent-gold)' }}>Shipping to</p>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{address.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{address.street}, {address.city} — {address.pincode}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{address.phone}</p>
                    </div>

                    {/* Items */}
                    <div className="space-y-3">
                      {safeItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                          <div className="w-12 h-14 rounded-lg shrink-0 flex items-center justify-center" style={{ background: 'var(--bg-surface)' }}>
                            <span className="text-2xl opacity-30">👔</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{item.name}</p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Size: {item.size}{item.color ? ` · Color: ${item.color}` : ''} · Qty: {item.qty}</p>
                          </div>
                          <p className="text-sm font-bold" style={{ color: 'var(--accent-gold)' }}>{formatCurrency(item.price * item.qty)}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between pt-2">
                      <button
                        onClick={() => setCurrentStep(1)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <ArrowLeft size={14} /> Back
                      </button>
                      <motion.button
                        onClick={handlePayment}
                        disabled={loading}
                        whileTap={{ scale: 0.97 }}
                        className="flex items-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 disabled:opacity-60"
                        style={{ background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-rose))', color: '#0A0A0F' }}
                        id="pay-now-btn"
                      >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <><ShieldCheck size={16} /> Pay {formatCurrency(grandTotal)}</>}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right — Order Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <div className="p-6 rounded-2xl sticky top-32" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <h3 className="text-lg font-bold font-serif mb-4" style={{ color: 'var(--text-primary)' }}>Order Summary</h3>

                {/* Coupon UI */}
                <div className="mb-6">
                  <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Have a Coupon?</p>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="e.g. FIRST10"
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                      className="flex-1 px-3 py-2 rounded-xl bg-transparent border text-xs focus:border-(--accent-gold) outline-none transition-all"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    />
                    <button 
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !coupon}
                      className="px-4 py-2 rounded-xl bg-white/5 border text-[10px] font-bold uppercase tracking-wider transition-all hover:bg-white/10 disabled:opacity-30"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    >
                      {couponLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                  {appliedCoupon && (
                    <div className="mt-2 flex items-center justify-between px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
                      <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">{appliedCoupon.code} Applied</span>
                      <button onClick={() => setAppliedCoupon(null)} className="text-[10px] text-green-500 hover:underline">Remove</button>
                    </div>
                  )}
                </div>

                <div className="space-y-3 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
                  {[
                    { label: `Subtotal (${safeItems.length} items)`, value: formatCurrency(subtotal) },
                    ...(discount > 0 ? [{ label: `Discount (${appliedCoupon?.code})`, value: `-${formatCurrency(discount)}`, color: '#22c55e' }] : []),
                    { label: 'Shipping', value: shipping === 0 ? 'Free' : formatCurrency(shipping) },
                    { label: 'Tax (18% GST)', value: formatCurrency(tax) },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                      <span style={{ color: color || (value === 'Free' ? '#22c55e' : 'var(--text-primary)') }} className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between pt-4 mb-4">
                  <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Total</span>
                  <span className="text-xl font-bold font-serif" style={{ color: 'var(--accent-gold)' }}>{formatCurrency(grandTotal)}</span>
                </div>

                {shipping === 0 && (
                  <div className="flex items-center gap-2 p-3 rounded-xl text-xs" style={{ background: 'rgba(34,197,94,0.08)', color: '#22c55e' }}>
                    <Truck size={14} />
                    You qualify for free shipping! 🎉
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </>
  )
}
