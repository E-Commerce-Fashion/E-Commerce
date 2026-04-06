import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, createdResponse, errorResponse, paginatedResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';

const parseJsonSafe = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') return value;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const normalizeSizeCode = (size) => String(size || '').trim().toUpperCase();

const parseImageColors = (rawValue) => {
  if (!rawValue) return [];
  if (Array.isArray(rawValue)) return rawValue.map((value) => String(value || '').trim());
  return String(rawValue)
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
};

const getAllowedSizesByCategory = (category) => {
  const normalized = String(category || '').trim().toLowerCase();
  if (normalized === 'pants') return ['28', '30', '32', '34', '36', '38', '40'];
  return ['S', 'M', 'L', 'XL', 'XXL'];
};

const buildVariantPayload = ({ body, files, currentImages = [] }) => {
  const variants = parseJsonSafe(body.color_variants, []);
  if (!Array.isArray(variants) || !variants.length) return null;

  const allowedSizes = getAllowedSizesByCategory(body.category);

  const normalizedVariants = variants
    .map((variant) => {
      const color = String(variant?.color || '').trim();
      if (!color) return null;

      const rawSizes = Array.isArray(variant?.sizes) ? variant.sizes : [];
      const sizes = rawSizes
        .map((entry) => ({
          size: normalizeSizeCode(entry?.size),
          stock: Number(entry?.stock) || 0,
          color,
        }))
        .filter((entry) => allowedSizes.includes(entry.size));

      return { color, sizes };
    })
    .filter(Boolean);

  const colors = [...new Set(normalizedVariants.map((variant) => variant.color))];
  const sizes = normalizedVariants.flatMap((variant) => variant.sizes);

  const imageColors = parseImageColors(body.image_colors);
  const uploadedImages = (files || []).map((file, index) => ({
    url: file.path,
    public_id: file.filename,
    color: imageColors[index] || null,
  }));

  const existingImages = parseJsonSafe(body.existing_images, currentImages);
  const existingList = Array.isArray(existingImages) ? existingImages : [];

  const replacedColors = new Set(uploadedImages.map((img) => img.color).filter(Boolean));
  const retainedExisting = existingList.filter((img) => {
    if (!img?.color) return false;
    if (!colors.includes(img.color)) return false;
    return !replacedColors.has(img.color);
  });

  const images = [...retainedExisting, ...uploadedImages].filter((img) => img?.url);

  return { colors, sizes, images };
};

// ── GET ALL PRODUCTS ──────────────────────────────────────────────
export const getProducts = async (req, res) => {
  try {
    const {
      page = 1, limit = 12, category, minPrice, maxPrice,
      sizes, colors, sort = 'created_at', order = 'desc',
      search, featured,
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    let query = supabaseAdmin.from('products').select('*', { count: 'exact' });

    if (category) query = query.eq('category', category);
    if (featured === 'true') query = query.eq('is_featured', true);
    if (minPrice) query = query.gte('price', Number(minPrice));
    if (maxPrice) query = query.lte('price', Number(maxPrice));
    if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,tags.cs.{${search}}`);
    if (sizes) {
      const sizeArr = sizes.split(',');
      query = query.contains('sizes', sizeArr.map((s) => ({ size: s })));
    }

    // Validate sort column
    const allowedSort = ['price', 'created_at', 'avg_rating', 'discount_price'];
    const sortCol = allowedSort.includes(sort) ? sort : 'created_at';
    query = query.order(sortCol, { ascending: order === 'asc' }).range(offset, offset + Number(limit) - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return paginatedResponse(res, data, page, limit, count);
  } catch (err) {
    logger.error('getProducts error', { error: err.message });
    return errorResponse(res, 'Failed to fetch products', 500);
  }
};

// ── GET SINGLE PRODUCT ────────────────────────────────────────────
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .select('*, reviews(*, profiles(name, avatar_url))')
      .eq('id', id)
      .single();

    if (error || !product) return errorResponse(res, 'Product not found', 404);

    return successResponse(res, product);
  } catch (err) {
    return errorResponse(res, 'Failed to fetch product', 500);
  }
};

// ── CREATE PRODUCT (Admin) ────────────────────────────────────────
export const createProduct = async (req, res) => {
  try {
    const {
      name, description, category, price, discount_price,
      sizes, colors, tags, is_featured,
    } = req.body;

    const variantPayload = buildVariantPayload({ body: req.body, files: req.files, currentImages: [] });
    const images = variantPayload?.images || req.files?.map((f) => ({ url: f.path, public_id: f.filename })) || [];
    const parsedSizes = variantPayload?.sizes || parseJsonSafe(sizes, []);
    const parsedColors = variantPayload?.colors || (Array.isArray(colors) ? colors : colors?.split(',').map((c) => c.trim()).filter(Boolean) || []);

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert({
        name,
        description,
        category,
        price: Number(price),
        discount_price: discount_price ? Number(discount_price) : null,
        images,
        sizes: parsedSizes,
        colors: parsedColors,
        tags: Array.isArray(tags) ? tags : tags?.split(',').map((t) => t.trim()) || [],
        is_featured: is_featured === 'true',
      })
      .select()
      .single();

    if (error) throw error;

    logger.info('Product created', { productId: data.id, name: data.name });
    return createdResponse(res, data, 'Product created successfully');
  } catch (err) {
    logger.error('createProduct error', { error: err.message });
    return errorResponse(res, 'Failed to create product', 500);
  }
};

// ── UPDATE PRODUCT (Admin) ────────────────────────────────────────
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    delete updates.color_variants;
    delete updates.image_colors;
    delete updates.existing_images;

    const { data: existingProduct } = await supabaseAdmin
      .from('products')
      .select('images, category')
      .eq('id', id)
      .single();

    if (!updates.category && existingProduct?.category) {
      updates.category = existingProduct.category;
    }

    const variantPayload = buildVariantPayload({
      body: req.body,
      files: req.files,
      currentImages: existingProduct?.images || [],
    });

    if (variantPayload) {
      updates.images = variantPayload.images;
      updates.colors = variantPayload.colors;
      updates.sizes = variantPayload.sizes;
    } else if (req.files?.length) {
      updates.images = req.files.map((f) => ({ url: f.path, public_id: f.filename }));
    }
    if (updates.price) updates.price = Number(updates.price);
    if (updates.discount_price) updates.discount_price = Number(updates.discount_price);
    if (updates.sizes && typeof updates.sizes === 'string') updates.sizes = parseJsonSafe(updates.sizes, []);
    if (updates.colors && typeof updates.colors === 'string') updates.colors = updates.colors.split(',').map((c) => c.trim());
    if (updates.tags && typeof updates.tags === 'string') updates.tags = updates.tags.split(',').map((t) => t.trim());
    if (updates.is_featured !== undefined) updates.is_featured = updates.is_featured === 'true';

    const { data, error } = await supabaseAdmin
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return successResponse(res, data, 'Product updated');
  } catch (err) {
    logger.error('updateProduct error', { error: err.message });
    return errorResponse(res, 'Failed to update product', 500);
  }
};

// ── DELETE PRODUCT (Admin) ────────────────────────────────────────
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin.from('products').delete().eq('id', id);
    if (error) throw error;
    return successResponse(res, {}, 'Product deleted');
  } catch (err) {
    return errorResponse(res, 'Failed to delete product', 500);
  }
};

// ── ADD REVIEW ────────────────────────────────────────────────────
export const addReview = async (req, res) => {
  try {
    const { id: product_id } = req.params;
    const { rating, comment } = req.body;
    const user_id = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
      return errorResponse(res, 'Rating must be between 1 and 5', 400);
    }

    // Upsert review (one per user per product)
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .upsert({ product_id, user_id, rating: Number(rating), comment }, { onConflict: 'product_id, user_id' })
      .select()
      .single();

    if (error) throw error;

    // Recalculate average rating
    const { data: reviews } = await supabaseAdmin
      .from('reviews')
      .select('rating')
      .eq('product_id', product_id);

    if (reviews?.length) {
      const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      await supabaseAdmin
        .from('products')
        .update({ avg_rating: Math.round(avg * 10) / 10, rating_count: reviews.length })
        .eq('id', product_id);
    }

    return createdResponse(res, data, 'Review submitted');
  } catch (err) {
    logger.error('addReview error', { error: err.message });
    return errorResponse(res, 'Failed to submit review', 500);
  }
};

// ── TOGGLE WISHLIST ───────────────────────────────────────────────
export const toggleWishlist = async (req, res) => {
  try {
    const user_id = req.user.id;
    const product_id = req.params.id;

    const { data: existing } = await supabaseAdmin
      .from('wishlists')
      .select()
      .eq('user_id', user_id)
      .eq('product_id', product_id)
      .single();

    if (existing) {
      await supabaseAdmin.from('wishlists').delete().eq('user_id', user_id).eq('product_id', product_id);
      return successResponse(res, { wishlisted: false }, 'Removed from wishlist');
    } else {
      await supabaseAdmin.from('wishlists').insert({ user_id, product_id });
      return successResponse(res, { wishlisted: true }, 'Added to wishlist');
    }
  } catch (err) {
    return errorResponse(res, 'Wishlist operation failed', 500);
  }
};

// ── GET WISHLIST ──────────────────────────────────────────────────
export const getWishlist = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('wishlists')
      .select('products(*)')
      .eq('user_id', req.user.id);

    if (error) throw error;
    return successResponse(res, data.map((w) => w.products));
  } catch (err) {
    return errorResponse(res, 'Failed to fetch wishlist', 500);
  }
};
