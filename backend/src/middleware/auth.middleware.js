import { supabase } from '../config/supabase.js';
import { errorResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';

/**
 * Verify Supabase JWT from Authorization header or HttpOnly cookie
 */
export const protect = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check Authorization header
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // 2. Fall back to HttpOnly cookie
    else if (req.cookies?.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      return errorResponse(res, 'Authentication required. Please log in.', 401);
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.warn('Invalid token attempt', { error: error?.message });
      return errorResponse(res, 'Invalid or expired token. Please log in again.', 401);
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    logger.error('Auth middleware error', { error: err.message });
    return errorResponse(res, 'Authentication failed', 500);
  }
};

/**
 * Optional auth — attaches user if token is present but doesn't block if not
 */
export const optionalAuth = async (req, res, next) => {
  try {
    let token = req.headers.authorization?.split(' ')[1] || req.cookies?.access_token;
    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) req.user = user;
    }
    next();
  } catch {
    next();
  }
};
