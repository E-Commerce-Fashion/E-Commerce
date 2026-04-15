"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Loader2, Trash2, X, ShieldAlert } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { toast } from "react-hot-toast";

interface ProductDeleteFlowModalProps {
  product: any;
  onClose: () => void;
  onDeleted: () => Promise<void> | void;
}

const STEPS = ["Review", "Verify", "Confirm"];

export function ProductDeleteFlowModal({ product, onClose, onDeleted }: ProductDeleteFlowModalProps) {
  const [step, setStep] = useState(0);
  const [confirmWord, setConfirmWord] = useState("");
  const [confirmName, setConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const totalStock = (product?.sizes || []).reduce((s: number, e: any) => s + (Number(e.stock) || 0), 0);
  const expectedName = String(product?.name || "").trim().toLowerCase();

  const canContinue = () => {
    if (step === 1)
      return confirmWord.trim().toUpperCase() === "DELETE" && confirmName.trim().toLowerCase() === expectedName;
    return true;
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiClient.delete(`/admin/products/${product.id}`);
      toast.success("Product deleted");
      await onDeleted();
      setDeleted(true);
      setTimeout(onClose, 1200);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const inputStyle = {
    background: "var(--bg-elevated)",
    borderColor: "var(--border)",
    color: "var(--text-primary)",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-210 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-lg overflow-hidden rounded-3xl border"
        style={{ background: "var(--bg-surface)", borderColor: "rgba(239,68,68,0.2)", boxShadow: "0 40px 100px rgba(0,0,0,0.6)" }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#f87171" }}>Safety Workflow</p>
              <h3 className="mt-1 text-xl font-serif font-bold" style={{ color: "var(--text-primary)" }}>
                Delete Product
              </h3>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                This is a permanent, irreversible action.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl transition-all"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-primary)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
            >
              <X size={17} />
            </button>
          </div>

          {/* Step indicators */}
          <div className="mt-5 flex gap-2">
            {STEPS.map((item, i) => (
              <div key={item} className="flex-1 flex flex-col gap-1.5">
                <div
                  className="h-0.5 rounded-full transition-all duration-500"
                  style={{ background: i <= step ? "#f87171" : "var(--border-strong)" }}
                />
                <span
                  className="text-[9px] font-bold uppercase tracking-widest"
                  style={{ color: i === step ? "#f87171" : "var(--text-muted)" }}
                >
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* Step 0: Review */}
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.22 }} className="space-y-4">
                <div className="rounded-2xl border px-4 py-4 flex items-start gap-3"
                  style={{ background: "rgba(251,191,36,0.07)", borderColor: "rgba(251,191,36,0.2)" }}>
                  <ShieldAlert size={18} style={{ color: "#fbbf24", marginTop: 1 }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#fbbf24" }}>Review before proceeding</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      Deleting removes this product from all listings, cart references, and future orders.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Product", value: product?.name },
                    { label: "Category", value: product?.category },
                    { label: "Price", value: `₹${Number(product?.price || 0).toLocaleString("en-IN")}` },
                    { label: "Total Stock", value: `${totalStock} units` },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-xl border px-3 py-2.5" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{label}</p>
                      <p className="text-sm font-semibold mt-0.5 wrap-break-word" style={{ color: "var(--text-primary)" }}>{value}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 1: Verify */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.22 }} className="space-y-4">
                <div className="rounded-2xl border px-4 py-4" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Identity verification</p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    Type <strong style={{ color: "#f87171" }}>DELETE</strong> and then the exact product name{" "}
                    <strong style={{ color: "var(--text-primary)" }}>&ldquo;{product?.name}&rdquo;</strong> to unlock deletion.
                  </p>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-muted)" }}>
                      Confirmation Word
                    </label>
                    <input
                      value={confirmWord}
                      onChange={e => setConfirmWord(e.target.value)}
                      placeholder="Type DELETE"
                      className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all"
                      style={{
                        ...inputStyle,
                        borderColor: confirmWord.toUpperCase() === "DELETE" ? "#34d399" : "var(--border)"
                      }}
                      onFocus={e => (e.currentTarget.style.borderColor = "#f87171")}
                      onBlur={e => (e.currentTarget.style.borderColor = confirmWord.toUpperCase() === "DELETE" ? "#34d399" : "var(--border)")}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-muted)" }}>
                      Product Name
                    </label>
                    <input
                      value={confirmName}
                      onChange={e => setConfirmName(e.target.value)}
                      placeholder="Type exact product name"
                      className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all"
                      style={{
                        ...inputStyle,
                        borderColor: confirmName.toLowerCase() === expectedName && confirmName ? "#34d399" : "var(--border)"
                      }}
                      onFocus={e => (e.currentTarget.style.borderColor = "#f87171")}
                      onBlur={e => (e.currentTarget.style.borderColor = confirmName.toLowerCase() === expectedName && confirmName ? "#34d399" : "var(--border)")}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Confirm */}
            {step === 2 && !deleted && (
              <motion.div key="s2" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.22 }} className="space-y-4">
                <div className="rounded-2xl border px-4 py-4 flex items-start gap-3"
                  style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.25)" }}>
                  <AlertTriangle size={18} style={{ color: "#f87171", marginTop: 1 }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#f87171" }}>Irreversible action</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      All product data, image references, and stock mapping will be permanently removed.
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border px-4 py-4 space-y-2" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>Product</span>
                    <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{product?.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>Status</span>
                    <span className="flex items-center gap-1.5 text-sm font-bold" style={{ color: "#f87171" }}>
                      <CheckCircle2 size={14} /> Ready for deletion
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Deleted success */}
            {deleted && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-6 gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(52,211,153,0.15)" }}>
                  <CheckCircle2 size={28} style={{ color: "#34d399" }} />
                </div>
                <p className="text-base font-bold" style={{ color: "#34d399" }}>Product Deleted</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Closing…</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {!deleted && (
          <div className="flex items-center justify-between px-6 py-5 border-t" style={{ borderColor: "var(--border)" }}>
            <button
              onClick={() => setStep(p => p - 1)}
              disabled={step === 0 || deleting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all disabled:opacity-30"
              style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
            >
              <ChevronLeft size={15} /> Back
            </button>

            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(p => p + 1)}
                disabled={!canContinue()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                style={{ background: "#ef4444", color: "#fff" }}
              >
                Continue <ChevronRight size={15} />
              </button>
            ) : (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                style={{ background: "#dc2626", color: "#fff" }}
              >
                {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                Delete Permanently
              </button>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
