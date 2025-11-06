import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import { authMiddleware, userMiddleware } from '../middleware/auth';

const router = Router();

// Public auth routes
router.post('/create-user', AuthController.createUserInDatabase);
router.get('/verify-token', AuthController.verifyToken);
router.get('/profile/:userId', userMiddleware, AuthController.getUserProfile);

// Protected routes
router.put('/profile/:userId', userMiddleware, AuthController.updateUserProfile);
router.delete('/profile/:userId', userMiddleware, AuthController.deleteUser);

// Admin routes
router.get('/users', authMiddleware(['admin']), AuthController.getAllUsers);
router.put('/users/:userId/role', authMiddleware(['admin']), AuthController.updateUserRole);

export default router;