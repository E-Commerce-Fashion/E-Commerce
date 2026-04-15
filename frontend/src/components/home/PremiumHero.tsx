'use client';

import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { PremiumButton } from '../ui/PremiumButton';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function PremiumHero() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 800], [0, 200]);
  const scale = useTransform(scrollY, [0, 800], [1.05, 1.15]);

  return (
    <section className="relative w-full h-[95vh] min-h-[600px] overflow-hidden bg-[#0A0A0F] flex items-center justify-center">
      {/* Background with Parallax */}
      <motion.div
        style={{ y, scale }}
        initial={{ scale: 1.1 }}
        animate={{ scale: 1.05 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        className="absolute inset-0 w-full h-full"
      >
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2000&auto=format&fit=crop)' }}
        />
        <div className="absolute inset-0 bg-linear-to-b from-black/80 via-black/40 to-black/80" />
      </motion.div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-[1200px] px-6 md:px-12 lg:px-20 flex flex-col items-center text-center mt-16">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="uppercase tracking-[0.3em] text-[10px] sm:text-xs text-white/70 mb-6 font-semibold"
        >
          Fall / Winter Collection 2026
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-5xl sm:text-7xl lg:text-8xl font-serif text-white leading-[1.1] mb-8"
        >
          Redefining <br className="hidden sm:block" />
          <span className="italic font-light text-white/90">Modern Elegance</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="max-w-xl text-sm sm:text-base text-white/80 leading-relaxed mb-12 font-sans"
        >
          Discover pieces engineered with absolute precision. A harmonious blend of architectural silhouettes and sumptuously soft fabrics to elevate your everyday rhythm.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full sm:w-auto"
        >
          <Link href="/products" className="w-full sm:w-auto">
            <PremiumButton variant="primary" className="w-full sm:w-auto min-w-[200px]">
              Explore Collection
            </PremiumButton>
          </Link>
          <Link href="/products?category=Editorial" className="w-full sm:w-auto">
            <PremiumButton variant="secondary" className="w-full sm:w-auto min-w-[200px] text-white border-white">
              View Lookbook <ArrowRight size={16} />
            </PremiumButton>
          </Link>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-[9px] uppercase tracking-widest text-white/50">Scroll</span>
        <div className="w-px h-12 bg-linear-to-b from-white/50 to-transparent" />
      </motion.div>
    </section>
  );
}
