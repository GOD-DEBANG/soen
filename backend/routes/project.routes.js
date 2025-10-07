import { Router } from 'express';
import * as projectController from '../controllers/project.controller.js';

const router = Router();

// Simplified routes - authentication and database operations removed
router.get('/all', projectController.getAllProject);
router.get('/get-project/:projectId', projectController.getProjectById);

export default router;