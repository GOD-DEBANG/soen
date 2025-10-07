import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';

const router = Router();

// Only keeping the users endpoint for now - authentication removed
router.get('/all', userController.getAllUsersController);

export default router;
