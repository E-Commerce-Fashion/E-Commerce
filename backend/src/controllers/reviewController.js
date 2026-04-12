import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse, createdResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';

// ── GET REVIEWS FOR A PRODUCT ──────────────────────────────────────
export const getProductReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select('*, profiles(name, avatar_url)')
      .eq('product_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return successResponse(res, data || []);
  } catch (err) {
    logger.error('getProductReviews error', { error: err.message });
    return errorResponse(res, 'Failed to fetch reviews', 500);
  }
};

// ── GET RECENT HIGH-RATED REVIEWS (HOME PAGE) ──────────────────────
export const getRecentHighRatedReviews = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select('*, profiles(name, avatar_url), products(name, images)')
      .gte('rating', 4)
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) throw error;
    return successResponse(res, data || []);
  } catch (err) {
    logger.error('getRecentHighRatedReviews error', { error: err.message });
    return errorResponse(res, 'Failed to fetch high-rated reviews', 500);
  }
};

// ── ADD/UPDATE REVIEW ──────────────────────────────────────────────
export const upsertReview = async (req, res) => {
  try {
    const { id: product_id } = req.params;
    const { rating, comment } = req.body;
    const user_id = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
      return errorResponse(res, 'Valid rating (1-5) is required', 400);
    }

    // Upsert review
    const { data: review, error } = await supabaseAdmin
      .from('reviews')
      .upsert({
        product_id,
        user_id,
        rating,
        comment,
        created_at: new Date().toISOString()
      }, { onConflict: 'product_id, user_id' })
      .select()
      .single();

    if (error) throw error;

    // Recalculate product rating summary
    const { data: allReviews } = await supabaseAdmin
      .from('reviews')
      .select('rating')
      .eq('product_id', product_id);

    const count = allReviews?.length || 0;
    const sum = allReviews?.reduce((acc, r) => acc + r.rating, 0) || 0;
    const avg = count > 0 ? (sum / count) : 0;

    await supabaseAdmin
      .from('products')
      .update({
        avg_rating: avg,
        rating_count: count
      })
      .eq('id', product_id);

    return successResponse(res, review, 'Review submitted successfully');
  } catch (err) {
    logger.error('upsertReview error', { error: err.message });
    return errorResponse(res, 'Failed to submit review', 500);
  }
};

// ── DELETE REVIEW ──────────────────────────────────────────────────
export const deleteReview = async (req, res) => {
  try {
    const { id: reviewId } = req.params;
    const user_id = req.user.id;

    // Check ownership
    const { data: existing } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .eq('id', reviewId)
      .single();

    if (!existing) return errorResponse(res, 'Review not found', 404);
    if (existing.user_id !== user_id && req.user.role !== 'admin') {
      return errorResponse(res, 'Access denied', 403);
    }

    const productId = existing.product_id;

    const { error } = await supabaseAdmin
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (error) throw error;

    // Recalculate summary
    const { data: allReviews } = await supabaseAdmin
      .from('reviews')
      .select('rating')
      .eq('product_id', productId);

    const count = allReviews?.length || 0;
    const sum = allReviews?.reduce((acc, r) => acc + r.rating, 0) || 0;
    const avg = count > 0 ? (sum / count) : 0;

    await supabaseAdmin
      .from('products')
      .update({ avg_rating: avg, rating_count: count })
      .eq('id', productId);

    return successResponse(res, null, 'Review deleted');
  } catch (err) {
    logger.error('deleteReview error', { error: err.message });
    return errorResponse(res, 'Failed to delete review', 500);
  }
};
