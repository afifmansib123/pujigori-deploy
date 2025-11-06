import { Router } from "express";
import PaymentRequestController from '../controllers/PaymentRequestController';
import { creatorMiddleware } from '../middleware/auth';
import { validateObjectId } from '../middleware/validation';

const router = Router();

// All routes require creator authentication
router.post(
  '/',
  creatorMiddleware,
  PaymentRequestController.createPaymentRequest
);

router.get(
  '/creator',
  creatorMiddleware,
  PaymentRequestController.getCreatorPaymentRequests
);

// 🆕 ADD THESE TWO NEW ROUTES
router.get(
  '/creator/balances',
  creatorMiddleware,
  PaymentRequestController.getCreatorBalances
);

router.get(
  '/project/:projectId/balance',
  creatorMiddleware,
  validateObjectId('projectId'),
  PaymentRequestController.getProjectBalance
);

router.get(
  '/project/:projectId',
  creatorMiddleware,
  validateObjectId('projectId'),
  PaymentRequestController.getProjectPaymentRequests
);

router.get(
  '/:id',
  creatorMiddleware,
  validateObjectId('id'),
  PaymentRequestController.getPaymentRequest
);

export default router;