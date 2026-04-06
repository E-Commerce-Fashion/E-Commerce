'use client'

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2, Plus, PencilLine, Trash2, Upload, ShieldCheck, ChevronRight, ImagePlus, FileText, Coins, Palette, CheckCircle2 } from 'lucide-react'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import api from '@/lib/axios'
import { useUserStore } from '@/store/userStore'
import { formatCurrency } from '@/utils'
import type { Product } from '@/components/product/ProductCard'

type SizeCode = '28' | '30' | '32' | '34' | '36' | '38' | '40' | 'S' | 'M' | 'L' | 'XL' | 'XXL'

const ALL_SIZE_OPTIONS: SizeCode[] = ['28', '30', '32', '34', '36', '38', '40', 'S', 'M', 'L', 'XL', 'XXL']
const ALPHA_SIZE_OPTIONS: SizeCode[] = ['S', 'M', 'L', 'XL', 'XXL']
const PANTS_SIZE_OPTIONS: SizeCode[] = ['28', '30', '32', '34', '36', '38', '40']
const DEFAULT_CATEGORIES = ['shirts', 'pants', 'dresses', 'jackets', 'accessories']

type ColorVariantForm = {
  id: string
  color: string
  imageFile: File | null
  imagePreview: string
  sizes: Record<SizeCode, string>
}

type ProductFormState = {
  name: string
  description: string
  category: string
  price: string
  discount_price: string
  tags: string
  is_featured: boolean
}

type ManagedProduct = Product & {
  description?: string
  tags?: string[]
}

const emptyForm: ProductFormState = {
  name: '',
  description: '',
  category: 'shirts',
  price: '',
  discount_price: '',
  tags: '',
  is_featured: false,
}

const getSizeOptionsByCategory = (category: string): SizeCode[] => {
  return String(category || '').toLowerCase() === 'pants' ? PANTS_SIZE_OPTIONS : ALPHA_SIZE_OPTIONS
}

const buildEmptySizes = (): Record<SizeCode, string> =>
  ALL_SIZE_OPTIONS.reduce((acc, size) => {
    acc[size] = ''
    return acc
  }, {} as Record<SizeCode, string>)

const createVariant = (seed = Date.now()): ColorVariantForm => ({
  id: `variant-${seed}-${Math.random().toString(36).slice(2, 7)}`,
  color: '',
  imageFile: null,
  imagePreview: '',
  sizes: buildEmptySizes(),
})

function parseVariantPayload(product: ManagedProduct | null, sizeOptions: SizeCode[]): ColorVariantForm[] {
  if (!product) return [createVariant()]

  const colorSet = new Set<string>()
  ;(product.colors || []).forEach((color) => colorSet.add(String(color).trim()))
  ;(product.images || []).forEach((image) => {
    if (image?.color) colorSet.add(String(image.color).trim())
  })

  const colors = Array.from(colorSet)
  if (!colors.length) {
    return [
      {
        ...createVariant(),
        imagePreview: product.images?.[0]?.url || '',
      },
    ]
  }

  return colors.map((color, index) => {
    const matchingImage = (product.images || []).find((img) => img.color === color) || (product.images || [])[index]
    const sizesForColor = (product.sizes || []).filter((size) => !size.color || size.color === color)

    const mappedSizes = buildEmptySizes()
    sizesForColor.forEach((entry) => {
      const code = String(entry.size || '').toUpperCase() as SizeCode
      if (sizeOptions.includes(code)) mappedSizes[code] = String(entry.stock)
    })

    return {
      ...createVariant(index + 1),
      color,
      imagePreview: matchingImage?.url || '',
      sizes: mappedSizes,
      imageFile: null,
    }
  })
}

export default function AdminProductsPage() {
  const router = useRouter()
  const { isAuthenticated, hasHydrated, user } = useUserStore()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [products, setProducts] = useState<ManagedProduct[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [form, setForm] = useState<ProductFormState>(emptyForm)
  const [variants, setVariants] = useState<ColorVariantForm[]>([createVariant()])
  const [step, setStep] = useState(1)
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES)
  const [newCategory, setNewCategory] = useState('')
  const activeSizeOptions = useMemo(() => getSizeOptionsByCategory(form.category), [form.category])

  const selectedProduct = useMemo(
    () => products.find((item) => item.id === selectedId) || null,
    [products, selectedId]
  )

  const fetchCatalogProducts = async () => {
    try {
      const { data } = await api.get('/admin/products', { params: { limit: 100 } })
      if (data.success) return (data.data || []) as ManagedProduct[]
      return []
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        const { data } = await api.get('/products', { params: { limit: 100, sort: 'created_at', order: 'desc' } })
        if (data.success) return (data.data || []) as ManagedProduct[]
      }
      throw err
    }
  }

  const stepItems = [
    { id: 1, label: 'Basics', icon: FileText },
    { id: 2, label: 'Pricing', icon: Coins },
    { id: 3, label: 'Variants', icon: Palette },
    { id: 4, label: 'Submit', icon: CheckCircle2 },
  ]

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

    const fetchProducts = async () => {
      try {
        const fetched = await fetchCatalogProducts()
        setProducts(fetched)
        setSelectedId((current) => current || fetched?.[0]?.id || null)

        const uniqueCategories = Array.from(
          new Set([...DEFAULT_CATEGORIES, ...fetched.map((item) => String(item.category || '').trim()).filter(Boolean)])
        )
        setCategories(uniqueCategories)
      } catch (err: unknown) {
        const message = axios.isAxiosError(err)
          ? err.response?.data?.message || 'Failed to load products'
          : 'Failed to load products'
        toast.error(message)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [hasHydrated, isAuthenticated, router, user?.role])

  useEffect(() => {
    if (!selectedProduct) return

    setForm({
      name: selectedProduct.name || '',
      description: selectedProduct.description || '',
      category: selectedProduct.category || 'shirts',
      price: selectedProduct.price ? String(selectedProduct.price) : '',
      discount_price: selectedProduct.discount_price ? String(selectedProduct.discount_price) : '',
      tags: selectedProduct.tags?.join(', ') || '',
      is_featured: Boolean(selectedProduct.is_featured),
    })

    setVariants(parseVariantPayload(selectedProduct, getSizeOptionsByCategory(selectedProduct.category || '')))
    setStep(1)
  }, [selectedProduct])

  const resetForm = () => {
    setSelectedId(null)
    setForm(emptyForm)
    setVariants([createVariant()])
    setStep(1)
  }

  const refreshProducts = async (focusId?: string) => {
    const fetched = await fetchCatalogProducts()
    setProducts(fetched)
    if (focusId) setSelectedId(focusId)
  }

  const addCategory = () => {
    const normalized = newCategory.trim().toLowerCase()
    if (!normalized) return

    if (!categories.includes(normalized)) {
      setCategories((prev) => [...prev, normalized])
    }

    setForm((prev) => ({ ...prev, category: normalized }))
    setNewCategory('')
  }

  const addColorVariant = () => {
    setVariants((prev) => [...prev, createVariant()])
  }

  const removeColorVariant = (id: string) => {
    setVariants((prev) => (prev.length > 1 ? prev.filter((variant) => variant.id !== id) : prev))
  }

  const updateVariant = (id: string, updater: (current: ColorVariantForm) => ColorVariantForm) => {
    setVariants((prev) => prev.map((variant) => (variant.id === id ? updater(variant) : variant)))
  }

  const handleVariantImage = (id: string, file: File | null) => {
    updateVariant(id, (current) => ({
      ...current,
      imageFile: file,
      imagePreview: file ? URL.createObjectURL(file) : current.imagePreview,
    }))
  }

  const validateStep = (targetStep: number) => {
    if (targetStep === 2) {
      if (!form.name.trim() || !form.description.trim() || !form.category.trim()) {
        toast.error('Step 1: Product name, description and category are required')
        return false
      }
    }

    if (targetStep === 3) {
      if (!form.price.trim()) {
        toast.error('Step 2: Price is required')
        return false
      }
    }

    if (targetStep === 4) {
      const cleanedVariants = variants
        .map((variant) => ({
          ...variant,
          color: variant.color.trim(),
        }))
        .filter((variant) => variant.color)

      if (!cleanedVariants.length) {
        toast.error('Step 3: Add at least one color variant')
        return false
      }

      for (const variant of cleanedVariants) {
        if (!variant.imageFile && !variant.imagePreview) {
          toast.error(`Step 3: Upload image for color ${variant.color}`)
          return false
        }

        const sizeOptions = getSizeOptionsByCategory(form.category)
        const hasStock = sizeOptions.some((size) => Number(variant.sizes[size] || 0) > 0)
        if (!hasStock) {
          toast.error(`Step 3: Add at least one size stock for color ${variant.color}`)
          return false
        }
      }
    }

    return true
  }

  const goToStep = (target: number) => {
    if (target > step && !validateStep(target)) return
    setStep(target)
  }

  const buildFormData = () => {
    const payload = new FormData()
    payload.append('name', form.name.trim())
    payload.append('description', form.description.trim())
    payload.append('category', form.category.trim())
    payload.append('price', form.price.trim())
    if (form.discount_price.trim()) payload.append('discount_price', form.discount_price.trim())
    payload.append('tags', form.tags)
    payload.append('is_featured', String(form.is_featured))

    const variantPayload = variants
      .map((variant) => {
        const color = variant.color.trim()
        if (!color) return null

        const sizeOptions = getSizeOptionsByCategory(form.category)
        const sizes = sizeOptions.map((size) => ({ size, stock: Number(variant.sizes[size] || 0) }))
          .filter((entry) => entry.stock > 0)

        return { id: variant.id, color, sizes }
      })
      .filter(Boolean) as Array<{ id: string; color: string; sizes: Array<{ size: SizeCode; stock: number }> }>

    payload.append('color_variants', JSON.stringify(variantPayload.map(({ color, sizes }) => ({ color, sizes }))))

    if (selectedProduct?.images?.length) {
      payload.append('existing_images', JSON.stringify(selectedProduct.images))
    }

    variantPayload.forEach((variant) => {
      const source = variants.find((item) => item.id === variant.id)
      if (source?.imageFile) {
        payload.append('images', source.imageFile)
        payload.append('image_colors', variant.color)
      }
    })

    return payload
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!validateStep(4)) {
      setStep(3)
      return
    }

    setSaving(true)
    try {
      const body = buildFormData()
      if (selectedProduct) {
        const { data } = await api.put(`/products/${selectedProduct.id}`, body, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        if (data.success) {
          toast.success('Product updated successfully')
          await refreshProducts(selectedProduct.id)
        }
      } else {
        const { data } = await api.post('/products', body, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        if (data.success) {
          toast.success('Product added successfully')
          await refreshProducts(data.data?.id)
          setSelectedId(data.data?.id || null)
        }
      }
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || 'Failed to save product'
        : 'Failed to save product'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return

    setDeletingId(id)
    try {
      const { data } = await api.delete(`/products/${id}`)
      if (data.success) {
        toast.success('Product deleted')
        setProducts((prev) => prev.filter((item) => item.id !== id))
        if (selectedId === id) {
          resetForm()
        }
      }
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || 'Failed to delete product'
        : 'Failed to delete product'
      toast.error(message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="w-full space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-bold font-serif"
                style={{ color: 'var(--text-primary)' }}
              >
                Product Manager
              </motion.h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Step-by-step creation with color-wise photos and sizes.
              </p>
            </div>
          </div>

          <div className="grid xl:grid-cols-[1.1fr_0.9fr] gap-6 items-start">
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-6"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(var(--accent-gold-rgb), 0.12)' }}>
                  <Upload size={18} style={{ color: 'var(--accent-gold)' }} />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-serif" style={{ color: 'var(--text-primary)' }}>
                    {selectedProduct ? 'Edit Product' : 'Upload Product'}
                  </h2>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {selectedProduct ? 'Update the selected item and save changes.' : 'Create a new product in the catalog.'}
                  </p>
                </div>
              </div>

              <div className="mb-6 rounded-xl px-3 py-4 sm:px-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <div className="relative">
                  <div className="absolute left-0 right-0 top-5 h-1 rounded-full" style={{ background: 'var(--border)' }} />
                  <div
                    className="absolute left-0 top-5 h-1 rounded-full transition-all duration-300"
                    style={{
                      width: `${((step - 1) / (stepItems.length - 1)) * 100}%`,
                      background: 'linear-gradient(90deg, var(--accent-gold), var(--accent-rose))',
                    }}
                  />

                  <div className="relative grid grid-cols-4 gap-2 sm:gap-4">
                    {stepItems.map((item) => {
                      const Icon = item.icon
                      const active = step === item.id
                      const complete = step > item.id

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => goToStep(item.id)}
                          className="flex flex-col items-center gap-2 text-center"
                        >
                          <div
                            className="z-10 flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-200"
                            style={{
                              borderColor: complete || active ? 'var(--accent-gold)' : 'var(--border)',
                              background: complete || active ? 'var(--bg-surface)' : 'var(--bg-elevated)',
                              color: complete || active ? 'var(--accent-gold)' : 'var(--text-muted)',
                            }}
                          >
                            <Icon size={17} />
                          </div>
                          <span
                            className="text-[11px] sm:text-xs font-semibold"
                            style={{ color: complete || active ? 'var(--text-primary)' : 'var(--text-muted)' }}
                          >
                            {item.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <Loader2 size={16} className="animate-spin" />
                  Loading products...
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {step === 1 && (
                    <div className="space-y-4">
                      <Field label="Step 1 · Product Name">
                        <input
                          value={form.name}
                          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                          className="w-full bg-transparent outline-none text-sm"
                          style={{ color: 'var(--text-primary)' }}
                          placeholder="Classic Oxford Shirt"
                        />
                      </Field>

                      <Field label="Step 1 · Description">
                        <textarea
                          rows={4}
                          value={form.description}
                          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                          className="w-full bg-transparent outline-none text-sm resize-none"
                          style={{ color: 'var(--text-primary)' }}
                          placeholder="Short description for the product listing"
                        />
                      </Field>

                      <Field label="Step 1 · Category (Select or Add)">
                        <div className="space-y-3">
                          <select
                            value={form.category}
                            onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                            className="w-full bg-transparent outline-none text-sm capitalize"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {categories.map((category) => (
                              <option
                                key={category}
                                value={category}
                                style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                              >
                                {category}
                              </option>
                            ))}
                          </select>

                          <div className="flex gap-2">
                            <input
                              value={newCategory}
                              onChange={(e) => setNewCategory(e.target.value)}
                              placeholder="Add new category"
                              className="w-full bg-transparent outline-none text-sm px-3 py-2 rounded-lg"
                              style={{ color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                            />
                            <button
                              type="button"
                              onClick={addCategory}
                              className="px-4 py-2 rounded-lg text-sm font-semibold"
                              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </Field>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Field label="Step 2 · Price">
                          <input
                            type="number"
                            min="0"
                            value={form.price}
                            onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                            className="w-full bg-transparent outline-none text-sm"
                            style={{ color: 'var(--text-primary)' }}
                            placeholder="1999"
                          />
                        </Field>

                        <Field label="Step 2 · Discount Price">
                          <input
                            type="number"
                            min="0"
                            value={form.discount_price}
                            onChange={(e) => setForm((prev) => ({ ...prev, discount_price: e.target.value }))}
                            className="w-full bg-transparent outline-none text-sm"
                            style={{ color: 'var(--text-primary)' }}
                            placeholder="1499"
                          />
                        </Field>
                      </div>

                      <Field label="Tags (comma separated)">
                        <input
                          value={form.tags}
                          onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))}
                          className="w-full bg-transparent outline-none text-sm"
                          style={{ color: 'var(--text-primary)' }}
                          placeholder="formal, office, premium"
                        />
                      </Field>

                      <Field label="Featured">
                        <label className="flex items-center gap-3 px-4 py-3.5 rounded-xl cursor-pointer" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                          <input
                            type="checkbox"
                            checked={form.is_featured}
                            onChange={(e) => setForm((prev) => ({ ...prev, is_featured: e.target.checked }))}
                          />
                          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Mark as featured</span>
                        </label>
                      </Field>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Step 3 · Colors, Images and Sizes</p>
                        <button
                          type="button"
                          onClick={addColorVariant}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
                          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                        >
                          <Plus size={14} />
                          Add Color
                        </button>
                      </div>

                      <div className="space-y-4">
                        {variants.map((variant, index) => (
                          <div key={variant.id} className="rounded-xl p-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                            <div className="flex items-center justify-between gap-3 mb-3">
                              <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Color Variant {index + 1}</p>
                              {variants.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeColorVariant(variant.id)}
                                  className="text-xs"
                                  style={{ color: '#ef4444' }}
                                >
                                  Remove
                                </button>
                              )}
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4 mb-3">
                              <Field label="Color Name">
                                <input
                                  value={variant.color}
                                  onChange={(e) => updateVariant(variant.id, (current) => ({ ...current, color: e.target.value }))}
                                  className="w-full bg-transparent outline-none text-sm"
                                  style={{ color: 'var(--text-primary)' }}
                                  placeholder="Black"
                                />
                              </Field>

                              <Field label="Upload Photo for this color">
                                <div className="flex items-center gap-3">
                                  <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                                    <ImagePlus size={14} />
                                    Choose file
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => handleVariantImage(variant.id, e.target.files?.[0] || null)}
                                    />
                                  </label>
                                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{variant.imageFile?.name || 'No new file selected'}</span>
                                </div>
                                {variant.imagePreview ? (
                                  <div className="mt-3 h-24 w-24 overflow-hidden rounded-lg" style={{ border: '1px solid var(--border)' }}>
                                    <img src={variant.imagePreview} alt={`${variant.color || 'Color'} preview`} className="h-full w-full object-cover" />
                                  </div>
                                ) : null}
                              </Field>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {activeSizeOptions.map((size) => (
                                <Field key={`${variant.id}-${size}`} label={`Size ${size} Stock`}>
                                  <input
                                    type="number"
                                    min="0"
                                    value={variant.sizes[size]}
                                    onChange={(e) => updateVariant(variant.id, (current) => ({
                                      ...current,
                                      sizes: { ...current.sizes, [size]: e.target.value },
                                    }))}
                                    className="w-full bg-transparent outline-none text-sm"
                                    style={{ color: 'var(--text-primary)' }}
                                    placeholder="0"
                                  />
                                </Field>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {step === 4 && (
                    <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Step 4 · Review and Submit</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Name: {form.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Category: {form.category}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Price: {form.price || '—'} | Discount: {form.discount_price || '—'}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Colors: {variants.filter((variant) => variant.color.trim()).map((variant) => variant.color.trim()).join(', ') || '—'}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    {step > 1 && (
                      <button
                        type="button"
                        onClick={() => setStep((current) => Math.max(1, current - 1))}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold"
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                      >
                        Back
                      </button>
                    )}

                    {step < 4 ? (
                      <button
                        type="button"
                        onClick={() => goToStep(step + 1)}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold"
                        style={{ background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-rose))', color: '#0A0A0F' }}
                      >
                        Continue
                        <ChevronRight size={16} />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold disabled:opacity-60"
                        style={{ background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-rose))', color: '#0A0A0F' }}
                      >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : selectedProduct ? <PencilLine size={16} /> : <Plus size={16} />}
                        {selectedProduct ? 'Save Changes' : 'Upload Product'}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={resetForm}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    >
                      Reset
                    </button>
                  </div>
                </form>
              )}
            </motion.section>

            <motion.aside
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="rounded-2xl p-6 space-y-4"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} style={{ color: 'var(--accent-gold)' }} />
                <h2 className="text-xl font-bold font-serif" style={{ color: 'var(--text-primary)' }}>
                  Existing Products
                </h2>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Select a product to edit it or delete it from the catalog.
              </p>

              <div className="space-y-3 max-h-[70vh] overflow-auto pr-1">
                {products.map((product) => (
                  <div key={product.id} className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{product.name}</p>
                        <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{product.category}</p>
                      </div>
                      <p className="text-sm font-bold" style={{ color: 'var(--accent-gold)' }}>
                        {formatCurrency(product.discount_price || product.price)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedId(product.id)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                      >
                        <PencilLine size={14} />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(product.id)}
                        disabled={deletingId === product.id}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-60"
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444' }}
                      >
                        {deletingId === product.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        Delete
                      </button>
                    </div>
                  </div>
                ))}

                {!products.length && !loading && (
                  <div className="rounded-2xl p-6 text-center" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No products found.</p>
                  </div>
                )}
              </div>
            </motion.aside>
          </div>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="space-y-2 block">
      <span className="block text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <div className="rounded-xl px-4 py-3.5" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
        {children}
      </div>
    </label>
  )
}
