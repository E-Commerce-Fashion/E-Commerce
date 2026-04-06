import { supabaseAdmin } from '../config/supabase.js';
import { errorResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';

/**
 * Role-based access control — checks profiles.role in Supabase
 */
export const requireRole = (roles = ['admin']) => {
  return async (req, res, next) => {
    try {
      if (!req.user?.id) {
        return errorResponse(res, 'Authentication required', 401);
      }

      const authRole = req.user?.app_metadata?.role;
      const adminEmails = (process.env.ADMIN_EMAILS || '')
        .split(',')
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
      const normalizedEmail = (req.user?.email || '').trim().toLowerCase();
      const isAdminEmail = adminEmails.includes(normalizedEmail);

      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', req.user.id)
        .single();

      if (error && !authRole) {
        logger.warn('Profile fetch failed in admin middleware', { userId: req.user.id });
        return errorResponse(res, 'User profile not found', 404);
      }

      const effectiveRole = profile?.role === 'admin' || authRole === 'admin' || isAdminEmail ? 'admin' : 'user';

      if (!roles.includes(effectiveRole)) {
        logger.warn('Unauthorized admin access attempt', { userId: req.user.id, role: effectiveRole });
        return errorResponse(res, 'Access denied. Insufficient permissions.', 403);
      }

      req.userProfile = { ...(profile || {}), role: effectiveRole };
      next();
    } catch (err) {
      logger.error('Admin middleware error', { error: err.message });
      return errorResponse(res, 'Authorization check failed', 500);
    }
  };
};

export const requireAdmin = requireRole(['admin']);
