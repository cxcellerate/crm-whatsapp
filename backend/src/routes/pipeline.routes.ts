import { Router } from 'express';
import {
  getPipelines,
  createPipeline,
  updatePipeline,
  deletePipeline,
  createStage,
  updateStage,
  deleteStage,
} from '../controllers/pipeline.controller';
import { authenticate } from '../middleware/auth.middleware';

export const pipelineRoutes = Router();

pipelineRoutes.use(authenticate);
pipelineRoutes.get('/', getPipelines);
pipelineRoutes.post('/', createPipeline);
pipelineRoutes.put('/:id', updatePipeline);
pipelineRoutes.delete('/:id', deletePipeline);
pipelineRoutes.post('/:id/stages', createStage);
pipelineRoutes.put('/:id/stages/:stageId', updateStage);
pipelineRoutes.delete('/:id/stages/:stageId', deleteStage);
