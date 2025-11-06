import { Router } from "express";
import PaymentController from "../controllers/PaymentController";
import { adminMiddleware } from "../middleware/auth";
import { userMiddleware } from "../middleware/auth";
// import { validatePaymentInitiate } from '../middleware/validation'; // TODO: Implement validation

const router = Router();

// Public payment routes
router.post('/initiate', userMiddleware, PaymentController.initiatePayment);
router.get("/methods", PaymentController.getPaymentMethods);
router.get("/:transactionId/status", PaymentController.getPaymentStatus);

// SSLCommerz callback routes (webhooks)
router.post("/success", PaymentController.handlePaymentSuccess);
router.post("/fail", PaymentController.handlePaymentFail);
router.post("/cancel", PaymentController.handlePaymentCancel);
router.post("/webhook", PaymentController.handleWebhook);

// Admin routes (require admin authentication)
router.get(
  "/statistics",
  adminMiddleware,
  PaymentController.getPaymentStatistics
);
 router.post('/:transactionId/refund', adminMiddleware, PaymentController.initiateRefund);

export default router;
