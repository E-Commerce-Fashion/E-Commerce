"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Bell, Moon, Search, User, Menu, Sun } from "lucide-react";

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDarkTheme = mounted ? resolvedTheme !== "light" : true;

  const toggleTheme = () => {
    setTheme(isDarkTheme ? "light" : "dark");
  };

  return (
    <header className="admin-topbar h-14 sm:h-16 border-b border-white/5 flex items-center justify-between px-3 sm:px-4 lg:px-6 bg-[#07080e]/92 backdrop-blur-xl sticky top-16 z-40">
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        <button
          onClick={onMenuClick}
          className="p-1.5 sm:p-2 text-slate-400 hover:text-white lg:hidden transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full max-w-xs lg:max-w-sm hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search analytics, orders..."
            className="w-full bg-white/5 border border-white/10 rounded-md py-1.5 sm:py-2 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/40 transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button className="p-1.5 sm:p-2 text-slate-400 hover:text-white transition-colors relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-violet-500 rounded-full" />
        </button>
        <button
          onClick={toggleTheme}
          className="p-1.5 sm:p-2 text-slate-400 hover:text-white transition-colors"
          aria-label={isDarkTheme ? "Switch to light theme" : "Switch to dark theme"}
          title={isDarkTheme ? "Light theme" : "Dark theme"}
        >
          {isDarkTheme ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="hidden md:flex items-center gap-3 ml-2 pl-3 border-l border-white/10">
          <div className="text-right">
            <p className="text-sm font-semibold text-white leading-none">Admin Profile</p>
            <p className="text-[10px] text-violet-400 uppercase font-medium mt-0.5">Superuser</p>
          </div>
          <div className="w-8 h-8 rounded-md bg-violet-600 flex items-center justify-center">
            <User className="text-white w-4 h-4" />
          </div>
        </div>
      </div>
    </header>
  );
}
