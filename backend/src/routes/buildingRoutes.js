import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import {
  buildingBodySchema,
  deleteBuildingQuerySchema,
  idParamsSchema,
} from '../validators/crudSchemas.js';
import {
  createBuilding,
  deleteBuilding,
  getBuilding,
  listBuildings,
  updateBuilding,
} from '../controllers/buildingController.js';

const router = Router();

router.get('/', asyncHandler(listBuildings));
router.post('/', validate({ body: buildingBodySchema }), asyncHandler(createBuilding));
router.get('/:id', validate({ params: idParamsSchema }), asyncHandler(getBuilding));
router.put('/:id', validate({ params: idParamsSchema, body: buildingBodySchema }), asyncHandler(updateBuilding));
router.delete(
  '/:id',
  validate({ params: idParamsSchema, query: deleteBuildingQuerySchema }),
  asyncHandler(deleteBuilding),
);

export default router;
