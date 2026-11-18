import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { wasteQuery } from '../validators/schemas.js';
import { getWaste } from '../controllers/wasteController.js';

const router = Router();
router.get('/', validate({ query: wasteQuery }), asyncHandler(getWaste));
export default router;
