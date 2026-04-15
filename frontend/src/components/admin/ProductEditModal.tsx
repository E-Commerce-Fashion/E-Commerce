"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ChevronRight, ChevronLeft, Check, Loader2, Plus, Trash2,
  Upload, ImageOff, Star
} from "lucide-react";
import apiClient from "@/lib/apiClient";
import { toast } from "react-hot-toast";

/* ─── Types ────────────────────────────────────────────────────── */
interface SizeEntry { size: string; stock: number }

interface ProductForm {
  name: string;
  description: string;
  price: string;
  discount_price: string;
  category: string;
  tags: string;
  sizes: SizeEntry[];
  is_featured: boolean;
}

interface ImageItem {
  url: string;              // preview / existing
  public_id?: string;
  file?: File;              // local file to upload
}

interface ProductEditModalProps {
  product?: any;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}

/* ─── Constants ────────────────────────────────────────────────── */
const STEPS = ["Basic Info", "Inventory", "Images", "Review"];
const CATEGORIES = [
  "Tops / Men", "Bottoms / Men", "Tops / Women", "Bottoms / Women",
  "Outerwear", "Streetwear", "Ethnic / Women", "Ethnic / Men", "Accessories",
];
const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"];

/* ─── Helpers ──────────────────────────────────────────────────── */
function normalizeImages(raw: any[]): ImageItem[] {
  if (!raw?.length) return [];
  return raw.map(img => {
    if (typeof img === "string") return { url: img };
    return { url: img.url || "", public_id: img.public_id };
  });
}

function initForm(product?: any): ProductForm {
  return {
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price ? String(product.price) : "",
    discount_price: product?.discount_price ? String(product.discount_price) : "",
    category: product?.category || "",
    tags: (product?.tags || []).join(", "),
    sizes: product?.sizes?.length ? product.sizes : [{ size: "M", stock: 10 }],
    is_featured: product?.is_featured ?? false,
  };
}

/* ─── Sub-components ───────────────────────────────────────────── */
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>
        {label}{required && <span style={{ color: "var(--accent-gold)" }}> *</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass = "w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all duration-200 placeholder:opacity-40 focus:ring-0";
const inputStyle = { background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" };
const focusStyle = "var(--accent-gold)";

function LuxInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`${inputClass} ${props.className || ""}`}
      style={inputStyle}
      onFocus={e => (e.currentTarget.style.borderColor = focusStyle)}
      onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
    />
  );
}

function LuxTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`${inputClass} resize-none ${props.className || ""}`}
      style={inputStyle}
      onFocus={e => (e.currentTarget.style.borderColor = focusStyle)}
      onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
    />
  );
}

function LuxSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`${inputClass} ${props.className || ""}`}
      style={{ ...inputStyle, color: props.value ? "var(--text-primary)" : "var(--text-muted)" }}
      onFocus={e => (e.currentTarget.style.borderColor = focusStyle)}
      onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
    />
  );
}

/* ─── Main Modal ───────────────────────────────────────────────── */
export function ProductEditModal({ product, onClose, onSaved }: ProductEditModalProps) {
  const isEdit = !!product;
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<ProductForm>(initForm(product));
  const [images, setImages] = useState<ImageItem[]>(normalizeImages(product?.images || []));
  const [imageUrl, setImageUrl] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = (key: keyof ProductForm, val: any) => setForm(p => ({ ...p, [key]: val }));

  /* Size helpers */
  const updateSize = (idx: number, key: keyof SizeEntry, val: string | number) =>
    update("sizes", form.sizes.map((s, i) => i === idx ? { ...s, [key]: val } : s));
  const addSize = () => {
    const used = form.sizes.map(s => s.size);
    update("sizes", [...form.sizes, { size: SIZE_OPTIONS.find(s => !used.includes(s)) || "S", stock: 0 }]);
  };
  const removeSize = (idx: number) => { if (form.sizes.length > 1) update("sizes", form.sizes.filter((_, i) => i !== idx)); };

  /* Image helpers */
  const addImageUrl = () => {
    const url = imageUrl.trim();
    if (url && !images.some(i => i.url === url)) {
      setImages(prev => [...prev, { url }]);
      setImageUrl("");
    }
  };

  const addFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const allowed = Array.from(files).filter(f => f.type.startsWith("image/") && f.size <= 5 * 1024 * 1024);
    if (allowed.length < files.length) toast.error("Some files were skipped (>5MB or not images)");
    const newItems: ImageItem[] = allowed.map(file => ({
      url: URL.createObjectURL(file),
      file,
    }));
    setImages(prev => [...prev, ...newItems]);
  }, []);

  const removeImage = (idx: number) => {
    const img = images[idx];
    if (img.file) URL.revokeObjectURL(img.url);
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  /* Validation */
  const canNext = () => {
    if (step === 0) return form.name.trim() && form.price && form.category;
    if (step === 1) return form.sizes.every(s => s.size && s.stock >= 0);
    return true;
  };

  /* Save */
  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append("description", form.description.trim());
      fd.append("price", form.price);
      if (form.discount_price) fd.append("discount_price", form.discount_price);
      fd.append("category", form.category);
      fd.append("is_featured", String(form.is_featured));
      fd.append("tags", form.tags.split(",").map(t => t.trim()).filter(Boolean).join(","));
      fd.append("sizes", JSON.stringify(form.sizes.map(s => ({ size: s.size, stock: Number(s.stock) }))));

      // New file uploads
      const newFiles = images.filter(i => i.file);
      newFiles.forEach(i => fd.append("images", i.file!));

      // Existing images (already-uploaded URLs)
      const existingImages = images.filter(i => !i.file).map(i => ({ url: i.url, public_id: i.public_id }));
      fd.append("existing_images", JSON.stringify(existingImages));

      const config = { headers: { "Content-Type": "multipart/form-data" } };

      if (isEdit) {
        await apiClient.put(`/admin/products/${product.id}`, fd, config);
        toast.success("Product updated!");
      } else {
        await apiClient.post("/admin/products", fd, config);
        toast.success("Product created!");
      }

      await onSaved();
      setSaved(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => { setForm(initForm()); setImages([]); setStep(0); setSaved(false); };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-200 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden rounded-3xl border"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-lg)" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-0 shrink-0">
          <div>
            <p className="luxury-label">{isEdit ? "Edit Product" : "New Product"}</p>
            <h2 className="mt-1 text-xl font-serif font-bold" style={{ color: "var(--text-primary)" }}>
              {saved ? "Saved Successfully" : STEPS[step]}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-colors"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-primary)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress */}
        <div className="flex gap-2 px-6 pt-5 shrink-0">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 flex flex-col gap-1.5 cursor-pointer" onClick={() => !saved && i < step && setStep(i)}>
              <div
                className="h-0.5 rounded-full transition-all duration-500"
                style={{ background: saved || i <= step ? "var(--accent-gold)" : "var(--border-strong)" }}
              />
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: saved || i === step ? "var(--accent-gold)" : "var(--text-muted)" }}>
                {s}
              </span>
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <AnimatePresence mode="wait">
            {saved && (
              <motion.div key="saved" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="rounded-2xl border p-5 flex items-center gap-4"
                  style={{ background: "rgba(52,211,153,0.08)", borderColor: "rgba(52,211,153,0.25)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(52,211,153,0.15)" }}>
                    <Check size={18} style={{ color: "#34d399" }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: "#34d399" }}>
                      {isEdit ? "Product updated successfully" : "Product created successfully"}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      All {STEPS.length} steps completed. Your catalog has been refreshed.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {STEPS.map((item) => (
                    <div key={item} className="rounded-xl border px-3 py-2.5 flex items-center gap-2"
                      style={{ background: "var(--bg-elevated)", borderColor: "rgba(var(--accent-gold-rgb), 0.2)" }}>
                      <Check size={12} style={{ color: "var(--accent-gold)" }} />
                      <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{item}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 0: Basic Info */}
            {!saved && step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }} className="space-y-4">
                <Field label="Product Name" required>
                  <LuxInput value={form.name} onChange={e => update("name", e.target.value)} placeholder="e.g. Neon Slim Fit Shirt" />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Price (₹)" required>
                    <LuxInput type="number" value={form.price} onChange={e => update("price", e.target.value)} placeholder="3499" min={0} />
                  </Field>
                  <Field label="Discount Price (₹)">
                    <LuxInput type="number" value={form.discount_price} onChange={e => update("discount_price", e.target.value)} placeholder="2999" min={0} />
                  </Field>
                </div>
                <Field label="Category" required>
                  <LuxSelect value={form.category} onChange={e => update("category", e.target.value)}>
                    <option value="">Select category…</option>
                    {CATEGORIES.map(c => <option key={c} value={c} style={{ background: "var(--bg-surface)" }}>{c}</option>)}
                  </LuxSelect>
                </Field>
                <Field label="Description">
                  <LuxTextarea value={form.description} onChange={e => update("description", e.target.value)} rows={3} placeholder="Product details, materials, care instructions…" />
                </Field>
                <Field label="Tags (comma-separated)">
                  <LuxInput value={form.tags} onChange={e => update("tags", e.target.value)} placeholder="summer, casual, cotton" />
                </Field>
                <div
                  className="flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-all"
                  style={{ background: "var(--bg-elevated)", borderColor: form.is_featured ? "var(--accent-gold)" : "var(--border)" }}
                  onClick={() => update("is_featured", !form.is_featured)}
                >
                  <div
                    className="w-4 h-4 rounded flex items-center justify-center border transition-all"
                    style={{ background: form.is_featured ? "var(--accent-gold)" : "transparent", borderColor: form.is_featured ? "var(--accent-gold)" : "var(--border-strong)" }}
                  >
                    {form.is_featured && <Check size={10} color="#060608" strokeWidth={3} />}
                  </div>
                  <Star size={14} style={{ color: form.is_featured ? "var(--accent-gold)" : "var(--text-muted)" }} />
                  <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Mark as Featured Product</span>
                </div>
              </motion.div>
            )}

            {/* Step 1: Inventory */}
            {!saved && step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Size & Stock</p>
                  <button
                    onClick={addSize}
                    className="flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5 border transition-all"
                    style={{ color: "var(--accent-gold)", borderColor: "rgba(var(--accent-gold-rgb), 0.3)", background: "rgba(var(--accent-gold-rgb), 0.08)" }}
                  >
                    <Plus size={12} /> Add Size
                  </button>
                </div>
                <div className="space-y-2">
                  {form.sizes.map((s, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 rounded-xl border p-3"
                      style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
                    >
                      <LuxSelect
                        value={s.size}
                        onChange={e => updateSize(idx, "size", e.target.value)}
                        className="w-28 shrink-0"
                        style={inputStyle}
                      >
                        {SIZE_OPTIONS.map(opt => <option key={opt} value={opt} style={{ background: "var(--bg-surface)" }}>{opt}</option>)}
                      </LuxSelect>
                      <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>Stock</span>
                      <LuxInput
                        type="number"
                        min={0}
                        value={s.stock}
                        onChange={e => updateSize(idx, "stock", Number(e.target.value))}
                        className="flex-1"
                      />
                      <button
                        onClick={() => removeSize(idx)}
                        disabled={form.sizes.length === 1}
                        className="p-1.5 rounded-lg transition-colors disabled:opacity-30"
                        style={{ color: "#f87171" }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </motion.div>
                  ))}
                </div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Total stock: <strong style={{ color: "var(--text-primary)" }}>
                    {form.sizes.reduce((s, e) => s + Number(e.stock), 0)} units
                  </strong>
                </p>
              </motion.div>
            )}

            {/* Step 2: Images */}
            {!saved && step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }} className="space-y-4">
                <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Product Images</p>

                {/* Drop zone */}
                <div
                  className="relative rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer"
                  style={{
                    borderColor: dragOver ? "var(--accent-gold)" : "var(--border-strong)",
                    background: dragOver ? "rgba(var(--accent-gold-rgb), 0.05)" : "var(--bg-elevated)",
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
                >
                  <Upload size={28} className="mx-auto mb-2" style={{ color: dragOver ? "var(--accent-gold)" : "var(--text-muted)" }} />
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    Drop images or <span style={{ color: "var(--accent-gold)" }}>click to browse</span>
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>JPG, PNG, WEBP — max 5MB each</p>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => addFiles(e.target.files)} />
                </div>

                {/* URL input */}
                <div className="flex gap-2">
                  <LuxInput
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addImageUrl()}
                    placeholder="Or paste an image URL…"
                    className="flex-1"
                  />
                  <button
                    onClick={addImageUrl}
                    className="px-4 rounded-xl text-sm font-bold shrink-0 transition-all"
                    style={{ background: "var(--bg-elevated)", color: "var(--accent-gold)", border: "1px solid rgba(var(--accent-gold-rgb), 0.3)" }}
                  >
                    Add URL
                  </button>
                </div>

                {/* Image grid */}
                {images.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    <AnimatePresence>
                      {images.map((img, idx) => (
                        <motion.div
                          key={img.url}
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.85 }}
                          className="relative group aspect-3/4 rounded-xl overflow-hidden border"
                          style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
                        >
                          {img.url ? (
                            <img src={img.url} alt="" className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = "none"; }} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageOff size={20} style={{ color: "var(--text-muted)" }} />
                            </div>
                          )}
                          <button
                            onClick={() => removeImage(idx)}
                            className="absolute top-2 right-2 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ background: "#ef4444" }}
                          >
                            <X size={11} color="white" />
                          </button>
                          {idx === 0 && (
                            <span
                              className="absolute bottom-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-md"
                              style={{ background: "var(--accent-gold)", color: "#060608" }}
                            >
                              Primary
                            </span>
                          )}
                          {img.file && (
                            <span
                              className="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                              style={{ background: "rgba(52,211,153,0.9)", color: "#060608" }}
                            >
                              NEW
                            </span>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>No images added yet</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 3: Review */}
            {!saved && step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }} className="space-y-3">
                <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Review & Publish</p>
                {[
                  ["Name", form.name],
                  ["Category", form.category],
                  ["Price", `₹${Number(form.price).toLocaleString("en-IN")}`],
                  ["Sizes", form.sizes.map(s => `${s.size}(${s.stock})`).join(", ")],
                  ["Images", `${images.length} image(s) · ${images.filter(i => i.file).length} new upload(s)`],
                  ["Featured", form.is_featured ? "Yes" : "No"],
                  ...(form.tags ? [["Tags", form.tags]] : []),
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between items-start rounded-xl border px-4 py-3"
                    style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{label}</span>
                    <span className="text-sm font-semibold text-right max-w-[60%] wrap-break-word" style={{ color: "var(--text-primary)" }}>{value}</span>
                  </div>
                ))}
                {form.description && (
                  <div className="rounded-xl border px-4 py-3" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>Description</p>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{form.description}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-5 border-t shrink-0" style={{ borderColor: "var(--border)" }}>
          {saved ? (
            <div className="ml-auto flex gap-2">
              {!isEdit && (
                <button
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all"
                  style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
                >
                  Add Another
                </button>
              )}
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{ background: "linear-gradient(135deg, var(--accent-gold), var(--accent-rose))", color: "#060608" }}
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setStep(p => p - 1)}
                disabled={step === 0}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all disabled:opacity-30"
                style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
              >
                <ChevronLeft size={15} /> Back
              </button>
              {step < STEPS.length - 1 ? (
                <button
                  onClick={() => setStep(p => p + 1)}
                  disabled={!canNext()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, var(--accent-gold), var(--accent-rose))", color: "#060608" }}
                >
                  Next <ChevronRight size={15} />
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, var(--accent-gold), var(--accent-rose))", color: "#060608" }}
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                  {isEdit ? "Save Changes" : "Create Product"}
                </button>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
