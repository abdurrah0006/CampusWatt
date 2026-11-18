import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { idParamsSchema, roomBodySchema } from '../validators/crudSchemas.js';
import { roomsQuery } from '../validators/schemas.js';
import {
  createRoom,
  deleteRoom,
  getRoom,
  listRooms,
  updateRoom,
} from '../controllers/roomController.js';

const router = Router();

router.get('/', validate({ query: roomsQuery }), asyncHandler(listRooms));
router.post('/', validate({ body: roomBodySchema }), asyncHandler(createRoom));
router.get('/:id', validate({ params: idParamsSchema }), asyncHandler(getRoom));
router.put('/:id', validate({ params: idParamsSchema, body: roomBodySchema }), asyncHandler(updateRoom));
router.delete('/:id', validate({ params: idParamsSchema }), asyncHandler(deleteRoom));

export default router;
