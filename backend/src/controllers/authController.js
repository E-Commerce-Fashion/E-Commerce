import { supabaseAdmin } from '../config/supabase.js';
import { supabase } from '../config/supabase.js';
import { successResponse, createdResponse, errorResponse } from '../utils/apiResponse.js';
import { sendWelcomeEmail } from '../utils/sendEmail.js';
import logger from '../utils/logger.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  path: '/',
};

const isMissingProfilesTableError = (error) => {
  const message = error?.message || '';
  return /could not find the table ['"]public\.profiles['"] in the schema cache/i.test(message)
    || /relation ['"]public\.profiles['"] does not exist/i.test(message)
    || /relation ['"]profiles['"] does not exist/i.test(message);
};

const getAdminEmails = () => (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

const resolveRole = (profileRole, authRole, email) => {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const adminEmails = getAdminEmails();

  if (profileRole === 'admin' || authRole === 'admin' || adminEmails.includes(normalizedEmail)) {
    return 'admin';
  }

  return 'user';
};

const getFallbackProfile = (user, overrides = {}) => ({
  name: overrides.name ?? user?.user_metadata?.name ?? null,
  phone: overrides.phone ?? user?.user_metadata?.phone ?? null,
  role: resolveRole(overrides.role, user?.app_metadata?.role, overrides.email ?? user?.email),
  avatar_url: overrides.avatar_url ?? user?.user_metadata?.avatar_url ?? null,
});

// ── REGISTER ──────────────────────────────────────────────────────
export const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password || !phone) {
      return errorResponse(res, 'Name, email, phone and password are required', 400);
    }
    if (password.length < 8) {
      return errorResponse(res, 'Password must be at least 8 characters', 400);
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // auto-confirm for now; set false to require email verification
      user_metadata: { name, phone },
      app_metadata: { role: 'user' },
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return errorResponse(res, 'Email already registered', 409);
      }
      logger.error('Supabase register error', { error: authError.message });
      return errorResponse(res, authError.message, 400);
    }

    // Ensure profile row exists and keep name/role in sync.
    // The DB trigger may have already inserted this row, so use upsert.
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      id: authData.user.id,
      name,
      phone,
      role: 'user',
    }, {
      onConflict: 'id',
    });

    if (profileError) {
      logger.error('Profile creation error', { error: profileError.message });
      if (!isMissingProfilesTableError(profileError)) {
        // Rollback auth user only for unexpected persistence errors.
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return errorResponse(res, 'Failed to create user profile', 500);
      }

      logger.warn('Profiles table is missing; continuing with auth user only', {
        userId: authData.user.id,
        email,
      });
    }

    // Send welcome email (non-blocking)
    sendWelcomeEmail(email, name).catch((err) =>
      logger.warn('Welcome email failed', { error: err.message })
    );

    logger.info('New user registered', { userId: authData.user.id, email });

    return createdResponse(
      res,
      { id: authData.user.id, email, name, phone },
      'Account created successfully. Please log in.'
    );
  } catch (err) {
    logger.error('Register controller error', { error: err.message });
    return errorResponse(res, 'Registration failed', 500);
  }
};

// ── LOGIN ─────────────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 'Email and password are required', 400);
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      logger.warn('Login failed', { email, error: error.message });
      return errorResponse(res, 'Invalid email or password', 401);
    }

    const { session, user } = data;

    // Fetch profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('name, phone, role, avatar_url')
      .eq('id', user.id)
      .single();

    if (profileError && !isMissingProfilesTableError(profileError)) {
      logger.warn('Profile lookup failed during login', { userId: user.id, error: profileError.message });
    }

    const fallbackProfile = getFallbackProfile(user, profile || {});

    // Set tokens in HttpOnly cookies
    res.cookie('access_token', session.access_token, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    res.cookie('refresh_token', session.refresh_token, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    logger.info('User logged in', { userId: user.id });

    return successResponse(res, {
      user: {
        id: user.id,
        email: user.email,
        name: fallbackProfile.name,
        phone: fallbackProfile.phone,
        role: fallbackProfile.role,
        avatar_url: fallbackProfile.avatar_url,
      },
    }, 'Login successful');
  } catch (err) {
    logger.error('Login controller error', { error: err.message });
    return errorResponse(res, 'Login failed', 500);
  }
};

// ── LOGOUT ────────────────────────────────────────────────────────
export const logout = async (req, res) => {
  try {
    if (req.token) {
      await supabase.auth.signOut();
    }
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });
    return successResponse(res, {}, 'Logged out successfully');
  } catch (err) {
    logger.error('Logout error', { error: err.message });
    return errorResponse(res, 'Logout failed', 500);
  }
};

// ── REFRESH TOKEN ─────────────────────────────────────────────────
export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refresh_token;
    if (!token) return errorResponse(res, 'No refresh token', 401);

    const { data, error } = await supabase.auth.refreshSession({ refresh_token: token });

    if (error || !data.session) {
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');
      return errorResponse(res, 'Session expired. Please log in again.', 401);
    }

    res.cookie('access_token', data.session.access_token, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refresh_token', data.session.refresh_token, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return successResponse(res, {}, 'Token refreshed');
  } catch (err) {
    logger.error('Refresh token error', { error: err.message });
    return errorResponse(res, 'Token refresh failed', 500);
  }
};

// ── GET CURRENT USER ──────────────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*, addresses(*)')
      .eq('id', req.user.id)
      .single();

    if (error && !isMissingProfilesTableError(error)) {
      logger.warn('Profile lookup failed for current user', { userId: req.user.id, error: error.message });
    }

    const fallbackProfile = getFallbackProfile(req.user, profile || {});

    return successResponse(res, {
      id: req.user.id,
      email: req.user.email,
      ...profile,
      ...fallbackProfile,
    });
  } catch (err) {
    return errorResponse(res, 'Failed to fetch profile', 500);
  }
};

// ── UPDATE PROFILE ────────────────────────────────────────────────
export const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (req.file) updates.avatar_url = req.file.path;

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) return errorResponse(res, 'Profile update failed', 500);
    return successResponse(res, data, 'Profile updated');
  } catch (err) {
    return errorResponse(res, 'Failed to update profile', 500);
  }
};
