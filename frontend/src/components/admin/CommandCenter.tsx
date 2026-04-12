"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { 
  Search, Command, Package, ShoppingBag, Users, 
  Settings, Plus, Download, ArrowRight, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const COMMANDS = [
  { id: "add-product", label: "Add New Product", icon: Plus, group: "Common Actions", href: "/admin/products?action=add" },
  { id: "view-products", label: "View All Products", icon: Package, group: "Navigation", href: "/admin/products" },
  { id: "view-orders", label: "View Recent Orders", icon: ShoppingBag, group: "Navigation", href: "/admin/orders" },
  { id: "view-customers", label: "Customer Management", icon: Users, group: "Navigation", href: "/admin/users" },
  { id: "view-analytics", label: "System Analytics", icon: Zap, group: "Navigation", href: "/admin/analytics" },
  { id: "export-orders", label: "Export Orders CSV", icon: Download, group: "Tools", action: () => alert("Exporting data...") },
  { id: "settings", label: "Admin Settings", icon: Settings, group: "System", href: "/admin/settings" },
];

export function CommandCenter() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCommands = COMMANDS.filter(cmd => 
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.group.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSelect = useCallback((cmd: typeof COMMANDS[0]) => {
    setOpen(false);
    if (cmd.href) {
      router.push(cmd.href);
    } else if (cmd.action) {
      cmd.action();
    }
  }, [router]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => (i + 1) % filteredCommands.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => (i - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        handleSelect(filteredCommands[selectedIndex]);
      }
    }
  };

  return (
    <>
      {/* Keyboard Shortcut Indicator in Navbar or Sidebar */}
      <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 group hover:border-violet-500/30 transition-colors cursor-pointer" onClick={() => setOpen(true)}>
        <Search className="w-3.5 h-3.5 text-slate-500 group-hover:text-violet-400 transition-colors" />
        <span className="text-[11px] font-medium text-slate-500 group-hover:text-slate-300 transition-colors mr-4">Quick Search</span>
        <div className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[9px] font-bold text-slate-500 font-sans tracking-widest uppercase">Ctrl</kbd>
          <kbd className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[9px] font-bold text-slate-500 font-sans tracking-widest uppercase">K</kbd>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-200 flex items-start justify-center pt-[15vh] px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-xl bg-[#0a0c18]/90 border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-2xl"
            >
              <div className="p-4 border-b border-white/5 flex items-center gap-3">
                <Command className="w-5 h-5 text-violet-500" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="What are you looking for?"
                  className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-slate-600 text-sm"
                />
                <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] text-slate-500 uppercase font-bold tracking-tighter">
                  ESC
                </div>
              </div>

              <div className="max-h-[60vh] overflow-y-auto py-2">
                {filteredCommands.length > 0 ? (
                  <div className="space-y-4 px-2">
                    {/* Groups */}
                    {Array.from(new Set(filteredCommands.map(c => c.group))).map(group => (
                      <div key={group} className="space-y-1">
                        <h4 className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                          {group}
                        </h4>
                        {filteredCommands.filter(c => c.group === group).map((cmd, idx) => {
                          const absoluteIdx = filteredCommands.indexOf(cmd);
                          const isActive = absoluteIdx === selectedIndex;
                          return (
                            <div
                              key={cmd.id}
                              onMouseEnter={() => setSelectedIndex(absoluteIdx)}
                              onClick={() => handleSelect(cmd)}
                              className={cn(
                                "flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150",
                                isActive ? "bg-violet-600/20 text-white" : "text-slate-400 hover:text-slate-200"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-8 h-8 rounded-lg flex items-center justify-center transition-colors border",
                                  isActive ? "bg-violet-600 border-violet-500/50" : "bg-white/5 border-white/5"
                                )}>
                                  <cmd.icon className={cn("w-4 h-4", isActive ? "text-white" : "text-slate-500")} />
                                </div>
                                <span className={cn("text-sm font-medium", isActive ? "text-violet-300" : "text-slate-300")}>
                                  {cmd.label}
                                </span>
                              </div>
                              {isActive && (
                                <motion.div layoutId="arrow" initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}>
                                  <ArrowRight className="w-4 h-4 text-violet-400" />
                                </motion.div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-slate-500 text-sm">No results found for &quot;{query}&quot;</p>
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-white/5 flex items-center justify-between bg-white/2">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-0.5">
                      <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] text-slate-500">↑</kbd>
                      <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] text-slate-500">↓</kbd>
                    </div>
                    <span className="text-[10px] text-slate-600">to navigate</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] text-slate-500">Enter</kbd>
                    <span className="text-[10px] text-slate-600">to select</span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-700 font-medium italic">
                  Powered by FashionForge AI
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
