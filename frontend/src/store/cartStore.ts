import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  product_id: string
  name: string
  price: number
  size: string
  color?: string
  qty: number
  image: string
  stock: number
}

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (productId: string, size: string, color?: string) => void
  updateQty: (productId: string, size: string, qty: number, color?: string) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  totalItems: () => number
  totalPrice: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (newItem) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.product_id === newItem.product_id && i.size === newItem.size && (i.color || '') === (newItem.color || '')
          )
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.product_id === newItem.product_id && i.size === newItem.size && (i.color || '') === (newItem.color || '')
                  ? { ...i, qty: Math.min(i.qty + newItem.qty, i.stock) }
                  : i
              ),
            }
          }
          return {
            items: [
              ...state.items,
              { ...newItem, id: `${newItem.product_id}-${newItem.size}-${newItem.color || 'default'}` },
            ],
          }
        })
      },

      removeItem: (productId, size, color) => {
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.product_id === productId && i.size === size && (i.color || '') === (color || ''))
          ),
        }))
      },

      updateQty: (productId, size, qty, color) => {
        if (qty <= 0) {
          get().removeItem(productId, size, color)
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.product_id === productId && i.size === size && (i.color || '') === (color || '')
              ? { ...i, qty: Math.min(qty, i.stock) }
              : i
          ),
        }))
      },

      clearCart: () => set({ items: [] }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      totalItems: () => get().items.reduce((sum, i) => sum + i.qty, 0),
      totalPrice: () =>
        get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
    }),
    {
      name: 'fashionforge-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
)
