import { Router } from 'express';
import {
  getDashboardStats,
  getAdminProducts,
  getAllOrders,
  updateOrderStatus,
  getAllUsers,
  updateUserRole,
} from '../controllers/adminController.js';
import { protect } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';

const router = Router();

// All admin routes require auth + admin role
router.use(protect, requireAdmin);

router.get('/dashboard', getDashboardStats);
router.get('/products', getAdminProducts);
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);

export default router;
