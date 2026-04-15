"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Pencil, Trash2, ChevronLeft, ChevronRight,
  Loader2, Package, TrendingUp, AlertTriangle, ImageOff
} from "lucide-react";
import apiClient from "@/lib/apiClient";
import { toast } from "react-hot-toast";
import { ProductEditModal } from "@/components/admin/ProductEditModal";
import { ProductDeleteFlowModal } from "@/components/admin/ProductDeleteFlowModal";

/* ─── Types ───────────────────────────────────────────────────── */
interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  discount_price?: number;
  sizes: { size: string; stock: number }[];
  images: ({ url: string; public_id?: string } | string)[];
  is_featured?: boolean;
  avg_rating?: number;
}

/* ─── Helpers ─────────────────────────────────────────────────── */
function getImageUrl(img: { url: string; public_id?: string } | string): string {
  if (!img) return "";
  if (typeof img === "string") return img;
  return img.url || "";
}

function getStockInfo(product: Product) {
  const total = (product.sizes || []).reduce((s, e) => s + (Number(e.stock) || 0), 0);
  if (total === 0) return { label: "Out of Stock", color: "#f87171", dot: "#f87171", stock: total };
  if (total < 10) return { label: "Low Stock", color: "#fbbf24", dot: "#fbbf24", stock: total };
  return { label: "In Stock", color: "#34d399", dot: "#34d399", stock: total };
}

/* ─── Animation Variants ──────────────────────────────────────── */
const rowVariants = {
  hidden: { opacity: 0, x: -12 },
  show: (i: number) => ({ opacity: 1, x: 0, transition: { duration: 0.35, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } }),
  exit: { opacity: 0, x: 12, transition: { duration: 0.2 } },
};

const TABS = ["All", "Tops / Men", "Tops / Women", "Streetwear", "Outerwear", "Ethnic / Women", "Accessories"];

export function ProductManagementPanel() {
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [productList, setProductList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0 });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 420);
    return () => clearTimeout(t);
  }, [search]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const cat = activeTab === "All" ? "" : activeTab;
      const { data } = await apiClient.get("/admin/products", {
        params: { page: pagination.page, limit: pagination.limit, category: cat, search: debouncedSearch },
      });
      if (data.success) {
        setProductList(data.data || []);
        setPagination((p) => ({ ...p, total: data.pagination?.total ?? 0 }));
      }
    } catch (err: any) {
      if (err.response?.status === 401) { toast.error("Session expired"); window.location.href = "/login"; }
      else toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [activeTab, debouncedSearch, pagination.page, pagination.limit]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const openAdd = () => { setEditingProduct(null); setModalOpen(true); };
  const openEdit = (p: Product) => { setEditingProduct(p); setModalOpen(true); };

  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));

  // Stats summary
  const inStock = productList.filter(p => (p.sizes || []).reduce((s, e) => s + Number(e.stock || 0), 0) > 0).length;
  const outOfStock = productList.length - inStock;

  return (
    <>
      <div className="space-y-6 pb-12" id="admin-product-management">

        {/* ── Header ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
        >
          <div>
            <p className="luxury-label mb-1">Product Catalog</p>
            <h2 className="text-2xl font-serif font-bold" style={{ color: "var(--text-primary)" }}>
              Inventory Management
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Create, edit, and manage your full product catalog with Cloudinary image uploads.
            </p>
          </div>
          <motion.button
            onClick={openAdd}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold uppercase tracking-widest shrink-0 transition-all"
            style={{
              background: "linear-gradient(135deg, var(--accent-gold), var(--accent-rose))",
              color: "#060608",
              boxShadow: "0 8px 24px rgba(var(--accent-gold-rgb), 0.3)"
            }}
          >
            <Plus size={16} /> Add Product
          </motion.button>
        </motion.div>

        {/* ── Stats chips ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="grid grid-cols-3 gap-3"
        >
          {[
            { icon: Package, label: "Total", value: pagination.total || productList.length, color: "var(--accent-gold)" },
            { icon: TrendingUp, label: "In Stock", value: inStock, color: "#34d399" },
            { icon: AlertTriangle, label: "Out of Stock", value: outOfStock, color: "#f87171" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div
              key={label}
              className="rounded-2xl border p-4 flex items-center gap-3"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
            >
              <div className="rounded-xl p-2" style={{ background: `${color}1a` }}>
                <Icon size={16} style={{ color }} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: "var(--text-muted)" }}>{label}</p>
                <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{value}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* ── Filters ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-3"
        >
          {/* Category tabs */}
          <div
            className="flex gap-1 p-1 rounded-xl overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ background: "var(--bg-elevated)" }}
          >
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setPagination(p => ({ ...p, page: 1 })); }}
                className="relative px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200"
                style={{
                  color: activeTab === tab ? "#060608" : "var(--text-muted)",
                  background: activeTab === tab ? "var(--accent-gold)" : "transparent",
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2" size={14} style={{ color: "var(--text-muted)" }} />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
              placeholder="Search products…"
              className="w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm outline-none transition-all"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "var(--accent-gold)")}
              onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
            />
          </div>
        </motion.div>

        {/* ── Table ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="overflow-hidden rounded-2xl border"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <Loader2 size={28} className="animate-spin" style={{ color: "var(--accent-gold)" }} />
              <p className="text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Loading catalog…</p>
            </div>
          ) : productList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <Package size={36} style={{ color: "var(--text-muted)" }} />
              <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>No products found</p>
              <button onClick={openAdd} className="text-xs underline" style={{ color: "var(--accent-gold)" }}>Add your first product</button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr
                      className="text-[10px] uppercase tracking-widest border-b"
                      style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}
                    >
                      <th className="px-5 py-4 font-semibold">Product</th>
                      <th className="px-4 py-4 font-semibold">Category</th>
                      <th className="px-4 py-4 font-semibold">Price</th>
                      <th className="px-4 py-4 font-semibold">Stock</th>
                      <th className="px-5 py-4 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence mode="popLayout">
                      {productList.map((product, i) => {
                        const stockInfo = getStockInfo(product);
                        const imgUrl = getImageUrl(product.images?.[0]);
                        return (
                          <motion.tr
                            key={product.id}
                            custom={i}
                            variants={rowVariants}
                            initial="hidden"
                            animate="show"
                            exit="exit"
                            className="border-b last:border-0 group transition-colors"
                            style={{ borderColor: "var(--border)" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "var(--card-hover)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                          >
                            {/* Product */}
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-10 h-12 rounded-xl overflow-hidden shrink-0 border flex items-center justify-center"
                                  style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
                                >
                                  {imgUrl ? (
                                    <img
                                      src={imgUrl}
                                      alt={product.name}
                                      className="w-full h-full object-cover"
                                      onError={e => { e.currentTarget.style.display = "none"; }}
                                    />
                                  ) : (
                                    <ImageOff size={14} style={{ color: "var(--text-muted)" }} />
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{product.name}</p>
                                  <p className="text-[10px] mt-0.5 font-mono" style={{ color: "var(--text-muted)" }}>
                                    #{String(product.id).slice(0, 8)}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Category */}
                            <td className="px-4 py-4">
                              <span
                                className="px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider border"
                                style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
                              >
                                {product.category}
                              </span>
                            </td>

                            {/* Price */}
                            <td className="px-4 py-4">
                              <div>
                                <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                                  ₹{Number(product.price).toLocaleString("en-IN")}
                                </span>
                                {product.discount_price && (
                                  <span className="ml-1.5 text-[11px] line-through" style={{ color: "var(--text-muted)" }}>
                                    ₹{Number(product.discount_price).toLocaleString("en-IN")}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Stock */}
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ background: stockInfo.dot }}
                                />
                                <span className="text-xs font-semibold" style={{ color: stockInfo.color }}>
                                  {stockInfo.stock} · {stockInfo.label}
                                </span>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="px-5 py-4">
                              <div className="flex items-center justify-end gap-1.5">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => openEdit(product)}
                                  className="p-2 rounded-xl transition-all"
                                  style={{ color: "var(--text-muted)" }}
                                  onMouseEnter={e => {
                                    e.currentTarget.style.color = "var(--accent-gold)";
                                    e.currentTarget.style.background = "rgba(var(--accent-gold-rgb), 0.12)";
                                  }}
                                  onMouseLeave={e => {
                                    e.currentTarget.style.color = "var(--text-muted)";
                                    e.currentTarget.style.background = "transparent";
                                  }}
                                >
                                  <Pencil size={15} />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => setDeleteTarget(product)}
                                  className="p-2 rounded-xl transition-all"
                                  style={{ color: "var(--text-muted)" }}
                                  onMouseEnter={e => {
                                    e.currentTarget.style.color = "#f87171";
                                    e.currentTarget.style.background = "rgba(239,68,68,0.12)";
                                  }}
                                  onMouseLeave={e => {
                                    e.currentTarget.style.color = "var(--text-muted)";
                                    e.currentTarget.style.background = "transparent";
                                  }}
                                >
                                  <Trash2 size={15} />
                                </motion.button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div
                className="flex items-center justify-between px-5 py-4 border-t"
                style={{ borderColor: "var(--border)" }}
              >
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {pagination.total > 0
                    ? `Showing ${(pagination.page - 1) * pagination.limit + 1}–${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total}`
                    : `${productList.length} products`}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    disabled={pagination.page === 1}
                    onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                    className="p-1.5 rounded-lg disabled:opacity-30 transition-colors"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPagination(prev => ({ ...prev, page: p }))}
                      className="w-7 h-7 rounded-lg text-xs font-bold transition-all"
                      style={{
                        background: pagination.page === p ? "var(--accent-gold)" : "transparent",
                        color: pagination.page === p ? "#060608" : "var(--text-muted)",
                      }}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    disabled={pagination.page >= totalPages}
                    onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                    className="p-1.5 rounded-lg disabled:opacity-30 transition-colors"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modalOpen && (
          <ProductEditModal
            product={editingProduct}
            onClose={() => setModalOpen(false)}
            onSaved={fetchProducts}
          />
        )}
        {deleteTarget && (
          <ProductDeleteFlowModal
            product={deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onDeleted={fetchProducts}
          />
        )}
      </AnimatePresence>
    </>
  );
}
