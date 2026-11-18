import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { requireApiKey } from '../middleware/requireApiKey.js';
import { ingestLimiter } from '../middleware/rateLimiter.js';
import { buildingIdParams, energyQuery, ingestBody } from '../validators/schemas.js';
import { getBuildingEnergy, ingestReadings } from '../controllers/energyController.js';

const router = Router();
router.get('/building/:id', validate({ params: buildingIdParams, query: energyQuery }), asyncHandler(getBuildingEnergy));
router.post('/ingest', ingestLimiter, requireApiKey, validate({ body: ingestBody }), asyncHandler(ingestReadings));
export default router;
