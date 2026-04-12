'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useCartStore } from '@/store/cartStore'
import { formatCurrency } from '@/utils'
import { Sparkles } from 'lucide-react'

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQty, totalPrice, totalItems } = useCartStore()

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={closeCart}
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 250, mass: 0.8 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md flex flex-col"
            style={{ background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)' }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-5"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-3">
                <ShoppingBag size={20} style={{ color: 'var(--accent-gold)' }} />
                <h2 className="text-lg font-semibold font-serif" style={{ color: 'var(--text-primary)' }}>
                  Your Cart
                </h2>
                {totalItems() > 0 && (
                  <span
                    className="px-2 py-0.5 rounded-none text-xs font-bold"
                    style={{ background: 'var(--accent-gold)', color: '#0A0A0F' }}
                  >
                    {totalItems()}
                  </span>
                )}
              </div>
              <button
                onClick={closeCart}
                className="w-8 h-8 rounded-none flex items-center justify-center transition-colors duration-150 hover:bg-(--bg-elevated)"
                style={{ color: 'var(--text-muted)' }}
                aria-label="Close cart"
              >
                <X size={18} />
              </button>
            </div>

            {/* Free Shipping Progress */}
            {items.length > 0 && (
              <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-2">
                   <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: 'var(--text-muted)' }}>
                     {totalPrice() >= 5000 
                       ? 'Elite Delivery Unlocked' 
                       : `Add ${formatCurrency(5000 - totalPrice())} for Free Shipping`}
                   </p>
                   <span className="text-[10px] font-bold text-(--accent-gold)">{Math.min(Math.round((totalPrice() / 5000) * 100), 100)}%</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${Math.min((totalPrice() / 5000) * 100, 100)}%` }}
                     className="h-full bg-linear-to-r from-(--accent-gold) to-(--accent-rose)"
                   />
                </div>
                {totalPrice() >= 5000 && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] mt-2 text-(--accent-gold) flex items-center gap-1 font-bold italic">
                    <Sparkles size={10} /> Concierge shipping applied
                  </motion.p>
                )}
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {items.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center h-full gap-4 py-16"
                >
                  <div
                    className="w-20 h-20 rounded-none flex items-center justify-center"
                    style={{ background: 'var(--bg-elevated)' }}
                  >
                    <ShoppingBag size={32} style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <p className="text-center" style={{ color: 'var(--text-secondary)' }}>
                    Your cart is empty
                  </p>
                  <button
                    onClick={closeCart}
                    className="px-6 py-2.5 rounded-none text-sm font-semibold transition-all duration-200 hover:opacity-90"
                    style={{ background: 'var(--accent-gold)', color: '#0A0A0F' }}
                  >
                    Start Shopping
                  </button>
                </motion.div>
              ) : (
                <AnimatePresence initial={false}>
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 30, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="flex gap-4 p-3 rounded-none"
                      style={{ background: 'var(--bg-elevated)' }}
                    >
                      {/* Image */}
                      <div className="relative w-20 h-24 rounded-none overflow-hidden shrink-0">
                        {item.image ? (
                          <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
                        ) : (
                          <div className="w-full h-full skeleton" />
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <p className="text-sm font-medium leading-tight line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                            {item.name}
                          </p>
                          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                            Size: <span style={{ color: 'var(--text-secondary)' }}>{item.size}</span>
                            {item.color ? <span> · Color: <span style={{ color: 'var(--text-secondary)' }}>{item.color}</span></span> : null}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-bold" style={{ color: 'var(--accent-gold)' }}>
                            {formatCurrency(item.price * item.qty)}
                          </span>

                          {/* Qty controls */}
                          <div
                            className="flex items-center gap-1 rounded-none px-1"
                            style={{ border: '1px solid var(--border)' }}
                          >
                            <button
                              onClick={() => updateQty(item.product_id, item.size, item.qty - 1, item.color)}
                              className="w-6 h-6 flex items-center justify-center rounded-none transition-colors"
                              style={{ color: 'var(--text-muted)' }}
                              aria-label="Decrease quantity"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-5 text-center text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                              {item.qty}
                            </span>
                            <button
                              onClick={() => updateQty(item.product_id, item.size, item.qty + 1, item.color)}
                              disabled={item.qty >= item.stock}
                              className="w-6 h-6 flex items-center justify-center rounded transition-colors disabled:opacity-40"
                              style={{ color: 'var(--text-muted)' }}
                              aria-label="Increase quantity"
                            >
                              <Plus size={12} />
                            </button>
                          </div>

                          <button
                            onClick={() => removeItem(item.product_id, item.size, item.color)}
                            className="w-6 h-6 flex items-center justify-center rounded-none transition-colors hover:text-red-400"
                            style={{ color: 'var(--text-muted)' }}
                            aria-label="Remove item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-6 py-5 space-y-4"
                style={{ borderTop: '1px solid var(--border)' }}
              >
                <div className="flex items-center justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                  <span className="text-xl font-bold font-serif" style={{ color: 'var(--text-primary)' }}>
                    {formatCurrency(totalPrice())}
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Shipping & taxes calculated at checkout
                </p>
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-none font-semibold text-sm transition-all duration-200 hover:opacity-90 hover:gap-3"
                  style={{ background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-rose))', color: '#0A0A0F' }}
                >
                  Proceed to Checkout
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/cart"
                  onClick={closeCart}
                  className="flex items-center justify-center w-full py-2.5 rounded-none text-sm font-medium transition-all duration-200 hover:bg-(--bg-elevated)"
                  style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                >
                  View Full Cart
                </Link>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
