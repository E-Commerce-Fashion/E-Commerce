"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import apiClient from "@/lib/apiClient";
import { toast } from "react-hot-toast";

interface ProductDeleteFlowModalProps {
  product: any;
  onClose: () => void;
  onDeleted: () => Promise<void> | void;
}

const STEPS = ["Review", "Verify", "Delete"];

export function ProductDeleteFlowModal({ product, onClose, onDeleted }: ProductDeleteFlowModalProps) {
  const [step, setStep] = useState(0);
  const [confirmWord, setConfirmWord] = useState("");
  const [confirmName, setConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);

  const totalStock = (product?.sizes || []).reduce((sum: number, s: any) => sum + (Number(s.stock) || 0), 0);
  const expectedName = String(product?.name || "").trim().toLowerCase();

  const canContinue = () => {
    if (step === 1) {
      return confirmWord.trim().toUpperCase() === "DELETE" && confirmName.trim().toLowerCase() === expectedName;
    }
    return true;
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiClient.delete(`/admin/products/${product.id}`);
      toast.success("Product deleted successfully");
      await onDeleted();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete product");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-210 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-3xl border border-rose-500/25 bg-[#090b16] shadow-[0_24px_90px_rgba(0,0,0,0.65)] overflow-hidden">
        <div className="relative border-b border-white/10 p-5">
          <div className="absolute -top-12 -right-10 w-44 h-44 rounded-full bg-rose-500/20 blur-3xl pointer-events-none" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-rose-300">Safety Workflow</p>
              <h3 className="text-xl font-extrabold text-white mt-1">Delete Product in 3 Steps</h3>
              <p className="text-sm text-slate-400 mt-1">This action permanently removes the product from your catalog.</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {STEPS.map((item, i) => (
              <div key={item} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/3 px-2.5 py-2">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    i < step
                      ? "bg-emerald-500 text-white"
                      : i === step
                        ? "bg-rose-500 text-white"
                        : "bg-white/10 text-slate-400"
                  }`}
                >
                  {i < step ? "✓" : i + 1}
                </div>
                <span className={`text-[10px] font-semibold uppercase tracking-wide ${i === step ? "text-rose-300" : "text-slate-500"}`}>
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 space-y-4">
          {step === 0 && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-200">Review before continuing</p>
                    <p className="text-xs text-amber-100/80 mt-1">Deleting this product removes it from listings and future orders immediately.</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/3 p-4 grid grid-cols-2 gap-3 text-sm">
                <InfoRow label="Product" value={product?.name || "N/A"} />
                <InfoRow label="Category" value={product?.category || "N/A"} />
                <InfoRow label="Price" value={`₹${Number(product?.price || 0).toLocaleString()}`} />
                <InfoRow label="Total Stock" value={`${totalStock} units`} />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/3 p-4">
                <p className="text-sm text-white font-semibold">Verify deletion request</p>
                <p className="text-xs text-slate-400 mt-1">
                  Type <span className="font-bold text-rose-300">DELETE</span> and product name
                  <span className="font-bold text-white"> {product?.name}</span> to continue.
                </p>

                <div className="grid sm:grid-cols-2 gap-3 mt-4">
                  <input
                    value={confirmWord}
                    onChange={(e) => setConfirmWord(e.target.value)}
                    placeholder="Type DELETE"
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-400/50"
                  />
                  <input
                    value={confirmName}
                    onChange={(e) => setConfirmName(e.target.value)}
                    placeholder="Type exact product name"
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-400/50"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-300 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-rose-200">Final confirmation</p>
                    <p className="text-xs text-rose-100/80 mt-1">
                      This cannot be undone. Product details, image references, and inventory mapping will be removed.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/3 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Product</span>
                  <span className="text-white font-semibold">{product?.name}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-slate-400">Status</span>
                  <span className="inline-flex items-center gap-1 text-rose-300 font-semibold">
                    <CheckCircle2 className="w-4 h-4" /> Ready for deletion
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-white/10 p-5 flex items-center justify-between">
          <button
            onClick={() => setStep((p) => p - 1)}
            disabled={step === 0 || deleting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-slate-300 hover:text-white transition-colors disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep((p) => p + 1)}
              disabled={!canContinue() || deleting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-sm font-semibold text-white transition-colors disabled:opacity-40"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-sm font-semibold text-white transition-colors disabled:opacity-50"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete Permanently
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="text-sm text-white mt-1 font-medium wrap-break-word">{value}</p>
    </div>
  );
}
