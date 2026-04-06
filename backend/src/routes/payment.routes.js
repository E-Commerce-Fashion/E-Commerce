import { Router } from 'express';
import {
  createOrder, verifyPayment, handleWebhook,
  getUserOrders, getOrderById,
} from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.middleware.js';
import { paymentLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

// Webhook — raw body required (must be BEFORE express.json())
router.post('/webhook', handleWebhook);

// Protected routes
router.post('/create-order', protect, paymentLimiter, createOrder);
router.post('/verify-payment', protect, paymentLimiter, verifyPayment);
router.get('/orders', protect, getUserOrders);
router.get('/orders/:id', protect, getOrderById);

export default router;
