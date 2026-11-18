import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { recommendationBody } from '../validators/schemas.js';
import { createRecommendations } from '../controllers/recommendationController.js';

const router = Router();
router.post('/', validate({ body: recommendationBody }), asyncHandler(createRecommendations));
export default router;
