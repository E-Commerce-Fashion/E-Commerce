import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

// ── DASHBOARD STATS ───────────────────────────────────────────────
export const getDashboardStats = async (req, res) => {
  try {
    const [
      { count: totalOrders },
      { count: totalProducts },
      { count: totalUsers },
    ] = await Promise.all([
      supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('products').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
    ]);

    const { data: revenueData } = await supabaseAdmin
      .from('orders')
      .select('total_amount')
      .eq('payment_status', 'paid');

    const totalRevenue = revenueData?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;

    // Recent 7 days revenue per day
    const { data: recentOrders } = await supabaseAdmin
      .from('orders')
      .select('total_amount, created_at')
      .eq('payment_status', 'paid')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true });

    return successResponse(res, {
      totalOrders,
      totalProducts,
      totalUsers,
      totalRevenue,
      recentOrders: recentOrders || [],
    });
  } catch (err) {
    logger.error('getDashboardStats error', { error: err.message });
    return errorResponse(res, 'Failed to load dashboard', 500);
  }
};

// ── GET ADMIN PRODUCTS ────────────────────────────────────────────
export const getAdminProducts = async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 20);
    const offset = (page - 1) * limit;
    const category = String(req.query.category || '').trim().toLowerCase();
    const search = String(req.query.search || '').trim();

    let query = supabaseAdmin
      .from('products')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) query = query.eq('category', category);
    if (search) query = query.ilike('name', `%${search}%`);

    const { data, error, count } = await query;
    if (error) throw error;

    return paginatedResponse(res, data || [], page, limit, count || 0);
  } catch (err) {
    logger.error('getAdminProducts error', { error: err.message });
    return errorResponse(res, 'Failed to fetch products', 500);
  }
};

// ── GET ALL ORDERS (Admin) ────────────────────────────────────────
export const getAllOrders = async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 20);
    const offset = (page - 1) * limit;
    const status = String(req.query.status || '').trim();
    const paymentStatus = String(req.query.payment_status || '').trim();

    let query = supabaseAdmin
      .from('orders')
      .select('id, user_id, items, shipping_address, total_amount, payment_status, order_status, created_at, updated_at, delivered_at, profiles(name, avatar_url, phone)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('order_status', status);
    if (paymentStatus) query = query.eq('payment_status', paymentStatus);

    const { data, error, count } = await query;
    if (error) throw error;

    return paginatedResponse(res, data || [], page, limit, count || 0);
  } catch (err) {
    logger.error('getAllOrders error', { error: err.message });
    return errorResponse(res, 'Failed to fetch orders', 500);
  }
};

// ── UPDATE ORDER STATUS (Admin) ───────────────────────────────────
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { order_status } = req.body;

    const validStatuses = ['placed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(order_status)) {
      return errorResponse(res, 'Invalid order status', 400);
    }

    const updates = { order_status };
    if (order_status === 'delivered') updates.delivered_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    logger.info('Order status updated', { orderId: id, status: order_status });
    return successResponse(res, data, 'Order status updated');
  } catch (err) {
    return errorResponse(res, 'Failed to update order', 500);
  }
};

// ── GET ALL USERS (Admin) ─────────────────────────────────────────
export const getAllUsers = async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 20);
    const offset = (page - 1) * limit;
    const role = String(req.query.role || '').trim().toLowerCase();
    const search = String(req.query.search || '').trim();

    let usersQuery = supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (role) usersQuery = usersQuery.eq('role', role);
    if (search) usersQuery = usersQuery.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);

    const { data, error, count } = await usersQuery;

    if (error) throw error;

    const users = data || [];
    const userIds = users.map((item) => item.id).filter(Boolean);

    const orderStatsByUser = new Map();
    if (userIds.length) {
      const { data: ordersData, error: ordersError } = await supabaseAdmin
        .from('orders')
        .select('user_id, total_amount, payment_status')
        .in('user_id', userIds);

      if (ordersError) throw ordersError;

      (ordersData || []).forEach((order) => {
        const key = order.user_id;
        if (!key) return;
        const current = orderStatsByUser.get(key) || { order_count: 0, total_spent: 0 };
        current.order_count += 1;
        if (order.payment_status === 'paid') {
          current.total_spent += Number(order.total_amount || 0);
        }
        orderStatsByUser.set(key, current);
      });
    }

    const emailByUser = new Map();
    await Promise.all(userIds.map(async (id) => {
      try {
        const { data: authData } = await supabaseAdmin.auth.admin.getUserById(id);
        emailByUser.set(id, authData?.user?.email || null);
      } catch (innerErr) {
        logger.warn('Failed to fetch auth user email', { userId: id, error: innerErr.message });
        emailByUser.set(id, null);
      }
    }));

    const enrichedUsers = users.map((item) => {
      const stats = orderStatsByUser.get(item.id) || { order_count: 0, total_spent: 0 };
      return {
        ...item,
        email: emailByUser.get(item.id) || null,
        order_count: stats.order_count,
        total_spent: stats.total_spent,
      };
    });

    return paginatedResponse(res, enrichedUsers, page, limit, count || 0);
  } catch (err) {
    logger.error('getAllUsers error', { error: err.message });
    return errorResponse(res, 'Failed to fetch users', 500);
  }
};

// ── UPDATE USER ROLE (Admin) ─────────────────────────────────────
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const role = String(req.body?.role || '').trim().toLowerCase();

    if (!['user', 'admin'].includes(role)) {
      return errorResponse(res, 'Invalid role', 400);
    }

    if (req.user?.id === id && role !== 'admin') {
      return errorResponse(res, 'You cannot remove your own admin access', 400);
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    return successResponse(res, data, 'User role updated');
  } catch (err) {
    logger.error('updateUserRole error', { error: err.message, userId: req.params?.id });
    return errorResponse(res, 'Failed to update user role', 500);
  }
};
