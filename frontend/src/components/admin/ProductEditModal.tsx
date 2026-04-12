"use client";

import { useState } from "react";
import { X, ChevronRight, ChevronLeft, Check, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import apiClient from "@/lib/apiClient";
import { toast } from "react-hot-toast";

interface SizeEntry {
  size: string;
  stock: number;
}

interface ProductForm {
  name: string;
  description: string;
  price: string;
  category: string;
  tags: string;
  sizes: SizeEntry[];
  images: string[];
}

interface ProductEditModalProps {
  product?: any; // existing product for edit, undefined for add
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}

const STEPS = ["Basic Info", "Inventory", "Images", "Review"];
const CATEGORIES = ["Tops / Men", "Bottoms / Men", "Tops / Women", "Bottoms / Women", "Outerwear", "Streetwear", "Ethnic / Women", "Ethnic / Men", "Accessories"];
const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"];

function createFormState(product?: any): ProductForm {
  return {
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price ? String(product.price) : "",
    category: product?.category || "",
    tags: (product?.tags || []).join(", "),
    sizes: product?.sizes?.length > 0 ? product.sizes : [{ size: "M", stock: 10 }],
    images: product?.images || [],
  };
}

export function ProductEditModal({ product, onClose, onSaved }: ProductEditModalProps) {
  const isEdit = !!product;
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedAt, setSavedAt] = useState("");

  const [form, setForm] = useState<ProductForm>(createFormState(product));

  const [imageUrl, setImageUrl] = useState("");

  const update = (key: keyof ProductForm, val: any) => setForm((p) => ({ ...p, [key]: val }));

  const updateSize = (idx: number, key: keyof SizeEntry, val: string | number) => {
    const updated = form.sizes.map((s, i) => i === idx ? { ...s, [key]: val } : s);
    update("sizes", updated);
  };

  const addSize = () => {
    const usedSizes = form.sizes.map((s) => s.size);
    const available = SIZE_OPTIONS.find((s) => !usedSizes.includes(s));
    update("sizes", [...form.sizes, { size: available || "S", stock: 0 }]);
  };

  const removeSize = (idx: number) => {
    if (form.sizes.length === 1) return;
    update("sizes", form.sizes.filter((_, i) => i !== idx));
  };

  const addImage = () => {
    if (imageUrl.trim() && !form.images.includes(imageUrl.trim())) {
      update("images", [...form.images, imageUrl.trim()]);
      setImageUrl("");
    }
  };

  const removeImage = (idx: number) => update("images", form.images.filter((_, i) => i !== idx));

  const canNext = () => {
    if (step === 0) return form.name.trim() && form.price && form.category;
    if (step === 1) return form.sizes.every((s) => s.size && s.stock >= 0);
    return true;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        category: form.category,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        sizes: form.sizes.map((s) => ({ size: s.size, stock: Number(s.stock) })),
        images: form.images,
      };

      if (isEdit) {
        await apiClient.put(`/admin/products/${product.id}`, payload);
        toast.success("Product updated successfully!");
      } else {
        await apiClient.post("/admin/products", payload);
        toast.success("Product created successfully!");
      }
      await onSaved();
      setSaved(true);
      setSavedAt(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-200 p-4">
      <div className="bg-[#0a0c18] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white">{isEdit ? "Edit Product" : "Add New Product"}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {saved ? "All steps completed" : `Step ${step + 1} of ${STEPS.length} — ${STEPS[step]}`}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-1 px-5 pt-4 shrink-0">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 flex flex-col gap-1">
              <div className={cn(
                "h-1 rounded-full transition-all duration-300",
                saved || i < step ? "bg-violet-500" : i === step ? "bg-violet-500/70" : "bg-white/10"
              )} />
              <span className={cn("text-[9px] font-semibold uppercase tracking-wider", saved || i === step ? "text-violet-400" : "text-slate-600")}>
                {s}
              </span>
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {saved && (
            <>
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-emerald-300" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-200">{isEdit ? "Product updated successfully" : "Product created successfully"}</p>
                    <p className="text-xs text-emerald-100/80 mt-1">Your product workflow completed and catalog data has been refreshed.</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-500 mb-2">Completed Timeline</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {STEPS.map((item, idx) => (
                    <div key={item} className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-2.5 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </span>
                      <div>
                        <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-widest">Step {idx + 1}</p>
                        <p className="text-xs text-white font-semibold">{item}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 mt-2">Completed at {savedAt}</p>
              </div>
            </>
          )}

          {/* Step 0: Basic Info */}
          {!saved && step === 0 && (
            <>
              <Field label="Product Name *">
                <input
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="e.g. Neon Slim Fit Shirt"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/40"
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Price (₹) *">
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => update("price", e.target.value)}
                    placeholder="e.g. 3499"
                    min={0}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/40"
                  />
                </Field>
                <Field label="Category *">
                  <select
                    value={form.category}
                    onChange={(e) => update("category", e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-violet-500/40"
                  >
                    <option value="" className="bg-[#0a0c18]">Select category…</option>
                    {CATEGORIES.map((c) => <option key={c} value={c} className="bg-[#0a0c18]">{c}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="Product details, materials, features..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/40 resize-none"
                />
              </Field>
              <Field label="Tags (comma-separated)">
                <input
                  value={form.tags}
                  onChange={(e) => update("tags", e.target.value)}
                  placeholder="e.g. summer, casual, cotton"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/40"
                />
              </Field>
            </>
          )}

          {/* Step 1: Inventory */}
          {!saved && step === 1 && (
            <>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-white">Size & Stock</p>
                <button onClick={addSize} className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add Size
                </button>
              </div>
              <div className="space-y-3">
                {form.sizes.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5">
                    <select
                      value={s.size}
                      onChange={(e) => updateSize(idx, "size", e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none w-28"
                    >
                      {SIZE_OPTIONS.map((opt) => <option key={opt} value={opt} className="bg-[#0a0c18]">{opt}</option>)}
                    </select>
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-xs text-slate-500">Stock:</span>
                      <input
                        type="number"
                        min={0}
                        value={s.stock}
                        onChange={(e) => updateSize(idx, "stock", Number(e.target.value))}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500/40"
                      />
                    </div>
                    <button
                      onClick={() => removeSize(idx)}
                      disabled={form.sizes.length === 1}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors disabled:opacity-30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-500">
                Total stock: {form.sizes.reduce((sum, s) => sum + Number(s.stock), 0)} units
              </p>
            </>
          )}

          {/* Step 2: Images */}
          {!saved && step === 2 && (
            <>
              <p className="text-sm font-semibold text-white mb-2">Product Images</p>
              <div className="flex gap-2">
                <input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addImage()}
                  placeholder="Paste image URL..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/40"
                />
                <button onClick={addImage} className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap">
                  Add URL
                </button>
              </div>
              {form.images.length > 0 ? (
                <div className="grid grid-cols-3 gap-3 mt-3">
                  {form.images.map((img, idx) => (
                    <div key={idx} className="relative group aspect-3/4 rounded-xl overflow-hidden bg-white/5 border border-white/10">
                      <img src={img} alt="" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = "")} />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute top-2 right-2 p-1.5 bg-rose-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                      {idx === 0 && (
                        <span className="absolute bottom-2 left-2 text-[9px] font-bold text-white bg-violet-600 px-2 py-0.5 rounded-md">Primary</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 border border-dashed border-white/10 rounded-xl p-8 text-center">
                  <Upload className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Add image URLs above to preview them here.</p>
                </div>
              )}
            </>
          )}

          {/* Step 3: Review */}
          {!saved && step === 3 && (
            <>
              <p className="text-sm font-semibold text-white mb-3">Review & Confirm</p>
              <div className="space-y-3">
                <ReviewRow label="Name" value={form.name} />
                <ReviewRow label="Category" value={form.category} />
                <ReviewRow label="Price" value={`₹${Number(form.price).toLocaleString()}`} />
                <ReviewRow label="Sizes" value={form.sizes.map((s) => `${s.size}(${s.stock})`).join(", ")} />
                <ReviewRow label="Images" value={`${form.images.length} image(s) added`} />
                {form.tags && <ReviewRow label="Tags" value={form.tags} />}
                {form.description && (
                  <div className="p-3.5 rounded-xl bg-white/3 border border-white/5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Description</p>
                    <p className="text-sm text-slate-300">{form.description}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-white/5 shrink-0">
          {saved ? (
            <div className="ml-auto flex items-center gap-2">
              {!isEdit && (
                <button
                  onClick={() => {
                    setSaved(false);
                    setStep(0);
                    setImageUrl("");
                    setForm(createFormState());
                  }}
                  className="px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-sm text-slate-300 hover:text-white transition-colors"
                >
                  Add Another
                </button>
              )}
              <button
                onClick={onClose}
                className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <button
              onClick={() => setStep((p) => p - 1)}
              disabled={step === 0}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          )}

          {!saved && (step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep((p) => p + 1)}
              disabled={!canNext()}
              className="flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {isEdit ? "Save Changes" : "Create Product"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start p-3.5 rounded-xl bg-white/3 border border-white/5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      <span className="text-sm text-white font-medium text-right max-w-[60%]">{value}</span>
    </div>
  );
}
