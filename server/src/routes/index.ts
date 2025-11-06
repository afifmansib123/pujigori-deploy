import { Router } from 'express';
import projectRoutes from './projects';
import donationRoutes from './donations';
import paymentRoutes from './payments';
import adminRoutes from './admin';
import uploadRoutes from './upload';
import authRoutes from './auth';
import paymentrequestRoutes from './paymentRequest'

const router = Router();

// API version info
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'PujiGori Crowdfunding API v1',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      projects: '/api/projects',
      donations: '/api/donations',
      payments: '/api/payments',
      admin: '/api/admin',
      upload: '/api/upload'
    },
    documentation: '/api/docs', // TODO: Add API documentation
    timestamp: new Date().toISOString()
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/donations', donationRoutes);
router.use('/payments', paymentRoutes);
router.use('/admin', adminRoutes);
router.use('/upload', uploadRoutes);
router.use('/payment-requests', paymentrequestRoutes);


export default router;