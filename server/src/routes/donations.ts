import { Router } from 'express';
import DonationController from '../controllers/DonationController';
// import { authMiddleware, adminMiddleware } from '../middleware/auth'; // TODO: Implement auth middleware

const router = Router();

// Public routes
router.get('/', DonationController.getDonations);
router.get('/recent', DonationController.getRecentDonations);
router.get('/project/:projectId', DonationController.getProjectDonations);
router.get('/statistics', DonationController.getDonationStatistics); 

// Individual donation routes
router.get('/:id', DonationController.getDonation);
router.get('/:id/qr', DonationController.getDonationQR);

// Protected routes (require authentication)
// router.get('/user/:userId', authMiddleware, DonationController.getUserDonations);

// Admin/Creator routes
// router.get('/rewards/pending', authMiddleware, DonationController.getPendingRewards);
// router.post('/:id/redeem', authMiddleware, DonationController.redeemReward);

// Temporary routes for development (remove when auth is integrated)
router.get('/user/:userId', DonationController.getUserDonations);
router.post('/:id/message', DonationController.updateDonorMessage);
router.get('/rewards/pending', DonationController.getPendingRewards);
router.post('/:id/redeem', DonationController.redeemReward);

//re generate donations

// In donation.routes.ts
router.post('/:id/regenerate-qr', DonationController.regenerateQR);

export default router;