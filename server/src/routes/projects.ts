import { Router } from 'express';
import ProjectController from '../controllers/ProjectController';
 import { userMiddleware } from '../middleware/auth';
// import { validateProjectCreate, validateProjectUpdate } from '../middleware/validation'; // TODO: Implement validation 

const router = Router();

// Public routes - no authentication required
router.get('/', ProjectController.getProjects);
router.get('/trending', ProjectController.getTrendingProjects);
router.get('/categories', ProjectController.getProjectsByCategory);
router.get('/:slug', ProjectController.getProject);
router.get('/:id/updates',userMiddleware, ProjectController.getProjectUpdates);
router.get('/:id/stats',userMiddleware, ProjectController.getProjectStats);
router.post('/',userMiddleware, ProjectController.createProject);
router.put('/:id', userMiddleware, ProjectController.updateProject);
router.delete('/:id',userMiddleware, ProjectController.deleteProject);
router.post('/:id/updates',userMiddleware, ProjectController.addProjectUpdate);
router.get('/creator/:creatorId', userMiddleware, ProjectController.getProjectsByCreator);


// Protected routes - require authentication (uncomment when auth middleware is ready)
// router.post('/', authMiddleware, validateProjectCreate, ProjectController.createProject);
// router.delete('/:id', authMiddleware, ProjectController.deleteProject);
// router.post('/:id/updates', authMiddleware, ProjectController.addProjectUpdate);
// router.get('/creator/:creatorId', authMiddleware, ProjectController.getProjectsByCreator);

export default router;