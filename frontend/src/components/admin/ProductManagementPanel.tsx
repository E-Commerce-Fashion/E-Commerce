"use client";

import { useState, useEffect } from "react";
import {
  Plus, Search, Filter, Download,
  Pencil, Trash2, ChevronLeft, ChevronRight, Loader2,
  Sparkles, ArrowRight, Workflow, ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";
import apiClient from "@/lib/apiClient";
import { toast } from "react-hot-toast";
import { ProductEditModal } from "@/components/admin/ProductEditModal";
import { ProductDeleteFlowModal } from "@/components/admin/ProductDeleteFlowModal";

const tabs = ["All Items", "Men's Fashion", "Women's Collection", "Premium Fabric"];

const mockProducts = [
  { id: "EA-2024-001", name: "Formal White Shirt", category: "Tops / Men", price: 3499, sizes: [{ size: "M", stock: 42 }], images: [] },
  { id: "EA-2024-002", name: "Black Hoodie", category: "Streetwear", price: 4999, sizes: [{ size: "L", stock: 8 }], images: [] },
  { id: "EA-2024-003", name: "Cotton Saree", category: "Ethnic / Women", price: 8500, sizes: [{ size: "Free Size", stock: 15 }], images: [] },
  { id: "EA-2024-004", name: "Raw Denim Jacket", category: "Outerwear", price: 6299, sizes: [{ size: "XL", stock: 0 }], images: [] },
];

export function ProductManagementPanel() {
  const [activeTab, setActiveTab] = useState("All Items");
  const [search, setSearch] = useState("");
  const [productList, setProductList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const category = activeTab === "All Items" ? "" : activeTab.split("'")[0].toLowerCase();
      const response = await apiClient.get("/admin/products", {
        params: { page: pagination.page, limit: pagination.limit, category, search },
      });
      if (response.data.success) {
        setProductList(response.data.data);
        setPagination((prev) => ({ ...prev, total: response.data.pagination.total }));
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        toast.error("Session expired.");
        window.location.href = "/login";
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [activeTab, search, pagination.page]);

  const openAdd = () => { setEditingProduct(null); setModalOpen(true); };
  const openEdit = (product: any) => { setEditingProduct(product); setModalOpen(true); };
  const openDelete = (product: any) => { setDeleteTarget(product); };

  const getStockInfo = (product: any) => {
    const total = (product.sizes || []).reduce((sum: number, s: any) => sum + (Number(s.stock) || 0), 0);
    if (total === 0) return { label: "Out of Stock", color: "text-rose-400", dot: "bg-rose-400", stock: total };
    if (total < 10) return { label: "Low Stock", color: "text-amber-400", dot: "bg-amber-400", stock: total };
    return { label: "In Stock", color: "text-emerald-400", dot: "bg-emerald-400", stock: total };
  };

  const displayProducts = productList.length > 0 ? productList : mockProducts;
  const totalPages = Math.max(1, Math.ceil((pagination.total || displayProducts.length) / pagination.limit));

  return (
    <>
      <div className="space-y-5 pb-10" id="admin-product-management">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Inventory Management</h2>
            <p className="text-slate-500 text-sm">Now supports guided product operations: add and update in 4 steps, delete in a protected 3-step safety flow.</p>
          </div>
          <button
            onClick={openAdd}
            className="flex w-full sm:w-auto items-center justify-center gap-2 px-5 py-2.5 bg-violet-600 rounded-md text-sm font-semibold text-white hover:bg-violet-700 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Add New Product
          </button>
        </div>

        <div className="relative overflow-hidden rounded-none sm:rounded-lg border border-violet-500/25 bg-linear-to-br from-violet-600/10 via-fuchsia-600/5 to-cyan-500/10 p-3.5 sm:p-4 md:p-5">
          <div className="absolute -top-10 -right-8 w-44 h-44 rounded-full bg-violet-500/20 blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3.5">
              <Sparkles className="w-4 h-4 text-violet-300" />
              <h3 className="text-sm font-bold text-white tracking-wide">Step-by-Step Product Workflow</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-none sm:rounded-md border border-white/10 bg-black/20 p-3.5">
                <p className="text-[10px] uppercase tracking-widest text-violet-300 font-bold">Step 1</p>
                <p className="text-sm font-semibold text-white mt-1">Add Product</p>
                <p className="text-xs text-slate-400 mt-1">Use the guided 4-step wizard: Basic Info, Inventory, Images, Review.</p>
                <button
                  onClick={openAdd}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-violet-300 hover:text-white transition-colors"
                >
                  Start Wizard <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="rounded-none sm:rounded-md border border-white/10 bg-black/20 p-3.5">
                <p className="text-[10px] uppercase tracking-widest text-cyan-300 font-bold">Step 2</p>
                <p className="text-sm font-semibold text-white mt-1">Update Product</p>
                <p className="text-xs text-slate-400 mt-1">Click any row edit icon to open the same guided wizard with existing values prefilled.</p>
                <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-300">
                  <Workflow className="w-3.5 h-3.5" /> Row Action Driven
                </div>
              </div>

              <div className="rounded-none sm:rounded-md border border-rose-500/30 bg-rose-500/10 p-3.5">
                <p className="text-[10px] uppercase tracking-widest text-rose-300 font-bold">Step 3</p>
                <p className="text-sm font-semibold text-white mt-1">Delete Product</p>
                <p className="text-xs text-rose-100/80 mt-1">Deletion now requires a 3-step protected flow with explicit verification.</p>
                <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-rose-300">
                  <ShieldAlert className="w-3.5 h-3.5" /> Safety Confirmation
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5">
          <div className="flex w-full md:w-auto gap-1 bg-white/5 p-1 rounded-md overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setPagination((p) => ({ ...p, page: 1 })); }}
                className={cn(
                  "px-3.5 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors",
                  activeTab === tab
                    ? "bg-[#141728] text-violet-400"
                    : "text-slate-500 hover:text-slate-200"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex w-full md:w-auto items-center gap-2 flex-wrap md:flex-nowrap">
            <div className="relative w-full sm:w-auto sm:min-w-52">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
                placeholder="Search..."
                className="w-full bg-white/5 border border-white/10 rounded-md py-2 pl-9 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/40"
              />
            </div>
            <button className="flex items-center gap-1.5 text-xs text-slate-400 bg-white/5 border border-white/10 rounded-md px-3 py-2 hover:text-white transition-colors">
              <Filter className="w-3.5 h-3.5" /> Filters
            </button>
            <button className="flex items-center gap-1.5 text-xs text-slate-400 bg-white/5 border border-white/10 rounded-md px-3 py-2 hover:text-white transition-colors">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>
        </div>

        <div className="admin-glass rounded-none sm:rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-7 h-7 text-violet-500 animate-spin" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] text-slate-500 uppercase tracking-wider border-b border-white/5">
                      <th className="px-5 py-4 font-semibold">Product</th>
                      <th className="px-4 py-4 font-semibold">Category</th>
                      <th className="px-4 py-4 font-semibold">Price</th>
                      <th className="px-4 py-4 font-semibold">Stock Status</th>
                      <th className="px-5 py-4 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {displayProducts.map((product: any) => {
                      const stockInfo = getStockInfo(product);
                      return (
                        <tr key={product.id} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors group">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-12 rounded-lg bg-white/5 border border-white/5 overflow-hidden shrink-0">
                                {product.images?.[0] ? (
                                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-[#141728] flex items-center justify-center">
                                    <span className="text-[8px] text-slate-600">IMG</span>
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="text-white font-medium">{product.name}</p>
                                <p className="text-[10px] text-slate-500">ID: {String(product.id).slice(0, 11)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="bg-white/5 px-2.5 py-1 rounded-md text-[10px] font-medium text-slate-400 border border-white/5 whitespace-nowrap">
                              {product.category}
                            </span>
                          </td>
                          <td className="px-4 py-4 font-semibold text-white">
                            ₹{Number(product.price).toLocaleString()}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <div className={cn("w-1.5 h-1.5 rounded-full", stockInfo.dot)} />
                              <span className={cn("text-xs font-medium", stockInfo.color)}>
                                {stockInfo.stock} {stockInfo.label}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openEdit(product)}
                                className="p-1.5 rounded-md text-slate-500 hover:text-white hover:bg-violet-600/20 transition-colors"
                                title="Edit"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openDelete(product)}
                                className="p-1.5 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {displayProducts.length === 0 && (
                <div className="flex items-center justify-center h-40 text-slate-500 text-sm">
                  No products found
                </div>
              )}
              <div className="px-5 py-4 border-t border-white/5 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  {pagination.total > 0
                    ? `Showing 1 to ${displayProducts.length} of ${pagination.total} products`
                    : `${displayProducts.length} products`}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    className="p-1.5 rounded-md text-slate-500 hover:text-white disabled:opacity-30 transition-colors"
                    disabled={pagination.page === 1}
                    onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPagination((prev) => ({ ...prev, page: p }))}
                      className={cn(
                        "w-7 h-7 rounded-md text-xs font-semibold transition-colors",
                        pagination.page === p ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    className="p-1.5 rounded-md text-slate-500 hover:text-white disabled:opacity-30 transition-colors"
                    disabled={pagination.page >= totalPages}
                    onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

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
    </>
  );
}
