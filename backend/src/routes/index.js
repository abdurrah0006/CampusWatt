import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import buildingRoutes from './buildingRoutes.js';
import roomRoutes from './roomRoutes.js';
import scheduleRoutes from './scheduleRoutes.js';
import energyRoutes from './energyRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import wasteRoutes from './wasteRoutes.js';
import recommendationRoutes from './recommendationRoutes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/buildings', buildingRoutes);
router.use('/rooms', roomRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/energy', energyRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/waste', wasteRoutes);
router.use('/recommendations', recommendationRoutes);

export default router;
