import { Router } from 'express';
import { 
  getProductReviews, upsertReview, deleteReview, getRecentHighRatedReviews 
} from '../controllers/reviewController.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

// Public read reviews
router.get('/:id', getProductReviews);

router.get('/recent/high-rated', getRecentHighRatedReviews);
router.post('/:id', protect, upsertReview);
router.delete('/:id', protect, deleteReview);

export default router;
