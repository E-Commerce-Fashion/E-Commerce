'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface PremiumButtonProps {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

export function PremiumButton({ variant = 'primary', children, className = '', onClick, type = 'button', disabled }: PremiumButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      className={`
        relative overflow-hidden rounded-full font-semibold px-8 py-4 sm:px-10 sm:py-5 uppercase tracking-widest text-xs sm:text-sm
        transition-all duration-300 ease-in-out group
        ${isPrimary
          ? 'bg-[#0A0A0F] text-white hover:shadow-[0_15px_40px_rgba(0,0,0,0.4)] dark:bg-white dark:text-black dark:hover:shadow-[0_15px_40px_rgba(255,255,255,0.4)]'
          : 'bg-transparent border border-current text-[#0A0A0F] hover:text-white hover:border-transparent dark:text-white dark:hover:text-black'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {/* Shine / Fill Animation Layer */}
      {isPrimary ? (
        <span className="absolute inset-0 w-full h-full bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />
      ) : (
        <span className="absolute inset-0 w-full h-full bg-[#0A0A0F] dark:bg-white scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-500 ease-out z-0 pointer-events-none" />
      )}

      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
}
