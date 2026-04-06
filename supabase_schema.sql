-- ════════════════════════════════════════════════════════════════
-- FashionForge — Supabase SQL Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ════════════════════════════════════════════════════════════════

-- ── PROFILES TABLE ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name        TEXT,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  phone       TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── ADDRESSES TABLE ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.addresses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  label       TEXT DEFAULT 'Home',
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  street      TEXT NOT NULL,
  city        TEXT NOT NULL,
  state       TEXT NOT NULL,
  pincode     TEXT NOT NULL,
  is_default  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── PRODUCTS TABLE ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  description     TEXT,
  category        TEXT NOT NULL CHECK (category IN ('shirts','pants','dresses','jackets','accessories')),
  price           NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  discount_price  NUMERIC(10,2) CHECK (discount_price >= 0),
  images          JSONB NOT NULL DEFAULT '[]',
  sizes           JSONB NOT NULL DEFAULT '[]',
  colors          TEXT[] DEFAULT '{}',
  tags            TEXT[] DEFAULT '{}',
  is_featured     BOOLEAN NOT NULL DEFAULT false,
  avg_rating      NUMERIC(3,2) NOT NULL DEFAULT 0 CHECK (avg_rating BETWEEN 0 AND 5),
  rating_count    INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── ORDERS TABLE ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  items                 JSONB NOT NULL,
  shipping_address      JSONB NOT NULL,
  total_amount          NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
  razorpay_order_id     TEXT,
  razorpay_payment_id   TEXT,
  razorpay_signature    TEXT,
  payment_status        TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed','refunded')),
  order_status          TEXT NOT NULL DEFAULT 'placed' CHECK (order_status IN ('placed','processing','shipped','delivered','cancelled')),
  delivered_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── REVIEWS TABLE ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rating      INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, user_id)
);

-- ── WISHLISTS TABLE ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wishlists (
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id  UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, product_id)
);

-- ════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY POLICIES
-- ════════════════════════════════════════════════════════════════

-- profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile"   ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins view all profiles"     ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- addresses
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own addresses" ON public.addresses USING (auth.uid() = user_id);

-- products — public read, admin write
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read products"    ON public.products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage products"      ON public.products FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- orders — user sees own, admin sees all
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own orders"  ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create orders"   ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage orders"  ON public.orders FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads reviews"    ON public.reviews FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users write own review"  ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own review" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own review" ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- wishlists
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own wishlist" ON public.wishlists USING (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════════
-- HELPER FUNCTIONS
-- ════════════════════════════════════════════════════════════════

-- Decrement product stock after payment
CREATE OR REPLACE FUNCTION public.decrement_stock(p_product_id UUID, p_size TEXT, p_qty INT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.products
  SET sizes = (
    SELECT jsonb_agg(
      CASE
        WHEN elem->>'size' = p_size
        THEN jsonb_set(elem, '{stock}', to_jsonb(GREATEST(0, (elem->>'stock')::int - p_qty)))
        ELSE elem
      END
    )
    FROM jsonb_array_elements(sizes) AS elem
  )
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── INDEXES FOR PERFORMANCE ───────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_category    ON public.products (category);
CREATE INDEX IF NOT EXISTS idx_products_price       ON public.products (price);
CREATE INDEX IF NOT EXISTS idx_products_featured    ON public.products (is_featured);
CREATE INDEX IF NOT EXISTS idx_products_created_at  ON public.products (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_id       ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status        ON public.orders (order_status);
CREATE INDEX IF NOT EXISTS idx_reviews_product      ON public.reviews (product_id);

-- ════════════════════════════════════════════════════════════════
-- SUCCESS
-- ════════════════════════════════════════════════════════════════
-- Schema created successfully! Next steps:
-- 1. Set your admin user: UPDATE public.profiles SET role = 'admin' WHERE id = 'your-user-id';
-- 2. Add your first product via the admin dashboard or SQL
-- ════════════════════════════════════════════════════════════════
