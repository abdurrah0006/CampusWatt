import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { idParamsSchema, scheduleBodySchema, scheduleQuerySchema } from '../validators/crudSchemas.js';
import {
  createSchedule,
  deleteSchedule,
  listSchedules,
  updateSchedule,
} from '../controllers/scheduleController.js';

const router = Router();

router.get('/', validate({ query: scheduleQuerySchema }), asyncHandler(listSchedules));
router.post('/', validate({ body: scheduleBodySchema }), asyncHandler(createSchedule));
router.put('/:id', validate({ params: idParamsSchema, body: scheduleBodySchema }), asyncHandler(updateSchedule));
router.delete('/:id', validate({ params: idParamsSchema }), asyncHandler(deleteSchedule));

export default router;
