import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

// ── VALIDATE COUPON ───────────────────────────────────────────────
export const validateCoupon = async (req, res) => {
  try {
    const { code, cartTotal } = req.body;

    if (!code) return errorResponse(res, 'Coupon code is required', 400);

    // For demonstration/initial setup, we can use some hardcoded ones 
    // OR fetch from Supabase if the table exists.
    // I'll try to fetch from Supabase 'coupons' table.
    const { data: coupon, error } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !coupon) {
      // Fallback for demo if table doesn't exist yet
      if (code.toUpperCase() === 'FIRST10') {
         return successResponse(res, {
           code: 'FIRST10',
           discount_type: 'percentage',
           discount_value: 10,
           min_order_value: 500
         }, 'Coupon applied!');
      }
      return errorResponse(res, 'Invalid or expired coupon', 404);
    }

    // Check expiration
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return errorResponse(res, 'Coupon has expired', 400);
    }

    // Check min order value
    if (cartTotal < (coupon.min_order_value || 0)) {
      return errorResponse(res, `Minimum order value of ${coupon.min_order_value} required`, 400);
    }

    // Check usage limit
    if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
      return errorResponse(res, 'Coupon usage limit reached', 400);
    }

    return successResponse(res, coupon, 'Coupon applied!');
  } catch (err) {
    return errorResponse(res, 'Error validating coupon', 500);
  }
};
