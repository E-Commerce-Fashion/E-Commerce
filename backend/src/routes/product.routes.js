import { Router } from 'express';
import {
  getProducts, getProductById, createProduct, updateProduct,
  deleteProduct, addReview, toggleWishlist, getWishlist,
} from '../controllers/productController.js';
import { protect } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';
import { uploadLimiter } from '../middleware/rateLimit.middleware.js';
import { uploadProductImages } from '../config/cloudinary.js';

const router = Router();

// Public routes
router.get('/', getProducts);
router.get('/:id', getProductById);

// Protected user routes
router.post('/:id/review', protect, addReview);
router.post('/:id/wishlist', protect, toggleWishlist);
router.get('/user/wishlist', protect, getWishlist);

// Admin routes
router.post('/', protect, requireAdmin, uploadLimiter, uploadProductImages, createProduct);
router.put('/:id', protect, requireAdmin, uploadLimiter, uploadProductImages, updateProduct);
router.delete('/:id', protect, requireAdmin, deleteProduct);

export default router;
