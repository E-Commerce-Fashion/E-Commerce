-- FashionForge product seed (safe for reseeding)
-- Run in Supabase SQL Editor after schema setup

begin;

truncate table public.wishlists, public.reviews, public.products restart identity cascade;

insert into public.products (
  name,
  description,
  category,
  price,
  discount_price,
  images,
  sizes,
  colors,
  tags,
  is_featured,
  avg_rating,
  rating_count
)
values
(
  'Classic Oxford Shirt',
  'Crisp breathable cotton shirt for office and casual layering.',
  'shirts',
  1999,
  1499,
  '[{"url":"https://images.unsplash.com/photo-1603252109360-909baaf261c7?q=80&w=1200&auto=format&fit=crop","public_id":"seed-oxford-shirt"}]'::jsonb,
  '[{"size":"S","stock":14},{"size":"M","stock":18},{"size":"L","stock":12},{"size":"XL","stock":8}]'::jsonb,
  array['White','Sky Blue','Navy'],
  array['formal','office','premium'],
  true,
  4.6,
  38
),
(
  'Slim Fit Chinos',
  'Soft-stretch chinos with modern taper and all-day comfort.',
  'pants',
  2199,
  1699,
  '[{"url":"https://images.unsplash.com/photo-1473966968600-fa801b869a1a?q=80&w=1200&auto=format&fit=crop","public_id":"seed-slim-chinos"}]'::jsonb,
  '[{"size":"30","stock":10},{"size":"32","stock":16},{"size":"34","stock":11},{"size":"36","stock":7}]'::jsonb,
  array['Khaki','Olive','Black'],
  array['smart-casual','daily'],
  true,
  4.4,
  25
),
(
  'Floral Midi Dress',
  'Flowy midi dress with lightweight fabric and subtle floral print.',
  'dresses',
  2899,
  2299,
  '[{"url":"https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1200&auto=format&fit=crop","public_id":"seed-midi-dress"}]'::jsonb,
  '[{"size":"S","stock":9},{"size":"M","stock":13},{"size":"L","stock":10}]'::jsonb,
  array['Rose','Cream'],
  array['summer','party'],
  false,
  4.5,
  19
),
(
  'Leather Biker Jacket',
  'Structured biker jacket with polished hardware and clean silhouette.',
  'jackets',
  6499,
  5499,
  '[{"url":"https://images.unsplash.com/photo-1551232864-3f0890e580d9?q=80&w=1200&auto=format&fit=crop","public_id":"seed-biker-jacket"}]'::jsonb,
  '[{"size":"S","stock":5},{"size":"M","stock":8},{"size":"L","stock":6},{"size":"XL","stock":4}]'::jsonb,
  array['Black'],
  array['winter','street'],
  true,
  4.8,
  44
),
(
  'Minimal Gold Bracelet',
  'Lightweight bracelet with a sleek polished finish.',
  'accessories',
  999,
  799,
  '[{"url":"https://images.unsplash.com/photo-1611652022419-a9419f74343d?q=80&w=1200&auto=format&fit=crop","public_id":"seed-gold-bracelet"}]'::jsonb,
  '[{"size":"One Size","stock":30}]'::jsonb,
  array['Gold'],
  array['gift','minimal'],
  false,
  4.3,
  12
),
(
  'Denim Utility Shirt',
  'Mid-weight denim shirt for layered weekend looks.',
  'shirts',
  2499,
  null,
  '[{"url":"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1200&auto=format&fit=crop","public_id":"seed-denim-shirt"}]'::jsonb,
  '[{"size":"S","stock":11},{"size":"M","stock":15},{"size":"L","stock":9},{"size":"XL","stock":5}]'::jsonb,
  array['Denim Blue'],
  array['casual','new-arrival'],
  false,
  4.2,
  9
);

commit;
