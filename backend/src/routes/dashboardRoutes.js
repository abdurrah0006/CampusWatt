import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { dashboardQuery, forecastQuery } from '../validators/schemas.js';
import { getAlerts, getForecast, getSummary } from '../controllers/dashboardController.js';

const router = Router();
router.get('/summary', validate({ query: dashboardQuery }), asyncHandler(getSummary));
router.get('/forecast', validate({ query: forecastQuery }), asyncHandler(getForecast));
router.get('/alerts', validate({ query: dashboardQuery }), asyncHandler(getAlerts));
export default router;
