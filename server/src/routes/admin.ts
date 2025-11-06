import { Router } from 'express';
import AdminController from '../controllers/AdminController';
import { adminMiddleware } from '../middleware/auth';

const router = Router();

// All admin routes require admin authentication
router.use(adminMiddleware);

// Dashboard and overview
router.get('/dashboard', AdminController.getDashboard);
router.get('/analytics', AdminController.getAnalytics);

// Payment request management
router.get('/payment-requests', AdminController.getPaymentRequests);
router.post('/payment-requests/:id/approve', AdminController.approvePaymentRequest);
router.post('/payment-requests/:id/reject', AdminController.rejectPaymentRequest);
router.post('/payment-requests/:id/mark-paid', AdminController.markPaymentAsPaid);

// Project management
router.get('/projects', AdminController.getProjects);
router.put('/projects/:id/status', AdminController.updateProjectStatus);

// Donation management
router.get('/donations', AdminController.getDonations);

// Reports
router.get('/reports/financial', AdminController.getFinancialReport);

//delete users 
router.delete('/users/:userId', AdminController.deleteUser);

export default router;