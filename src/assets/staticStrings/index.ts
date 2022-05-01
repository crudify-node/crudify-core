export const indexString = `
import { Router } from 'express'
import { ce } from '~/lib/captureError'
import {
  handleCreateEntity,
  handleDeleteEntity,
  handleGetAllEntities,
  handleGetEntityById,
  handleUpdateEntityById,
} from './controller'

const router = Router()

router.get('/', ce(handleGetAllEntities))
router.get('/:id', ce(handleGetEntityById))
router.post('/', ce(handleCreateEntity))
router.patch('/:id', ce(handleUpdateEntityById))
router.delete('/:id', ce(handleDeleteEntity))

export default router
`;
