import { Router } from 'express';
import { validateCoupon } from '../controllers/couponController.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

// Validate coupon (publicly accessible)
router.post('/validate', protect, validateCoupon);

export default router;
