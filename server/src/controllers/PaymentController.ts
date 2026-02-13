import { Request, Response, NextFunction } from "express";
import Project from "../models/Project";
import Donation from "../models/Donation";
import User from "../models/User";
import sslCommerzService from "../services/SSLCommerzService";
import qrService from "../services/QRService";
import {
  PaymentStatus,
  ProjectStatus,
  RewardRedemptionStatus,
  IRewardTier,
} from "../types";
import {
  ResponseUtils,
  CurrencyUtils,
  ValidationUtils,
  StringUtils,
} from "../utils";

class PaymentController {
  /**
   * POST /api/payments/initiate
   * Initialize payment with SSLCommerz
   */
async initiatePayment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      projectId,
      amount,
      rewardTierId,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      isAnonymous = false,
      message,
    } = req.body;

    console.log('=== PAYMENT INITIATION STARTED ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    // Validate required fields
    if (!projectId || !amount || !customerName || !customerEmail) {
      res
        .status(400)
        .json(
          ResponseUtils.error(
            "Missing required fields: projectId, amount, customerName, customerEmail"
          )
        );
      return;
    }

    // Validate amount
    if (!sslCommerzService.isValidAmount(amount)) {
      res
        .status(400)
        .json(
          ResponseUtils.error("Amount must be between 10 and 500,000 BDT")
        );
      return;
    }

    // Validate email and phone
    if (!ValidationUtils.isValidEmail(customerEmail)) {
      res.status(400).json(ResponseUtils.error("Invalid email format"));
      return;
    }

    if (customerPhone && !ValidationUtils.isValidBDPhone(customerPhone)) {
      res
        .status(400)
        .json(ResponseUtils.error("Invalid Bangladeshi phone number"));
      return;
    }

    // Find and validate project
    const project = await Project.findById(projectId).populate('creator', 'cognitoId');
    if (!project) {
      res.status(404).json(ResponseUtils.error("Project not found"));
      return;
    }

    if (!project.canReceiveDonations()) {
      res
        .status(400)
        .json(
          ResponseUtils.error(
            "Project is not accepting donations at this time"
          )
        );
      return;
    }

    console.log('Project found:', project._id, project.title);

    // Validate reward tier if specified
    let rewardTier = null;
    let rewardValue = 0;

    if (rewardTierId) {
      rewardTier = project.rewardTiers.find(
        (tier) => tier._id?.toString() === rewardTierId
      );
      if (!rewardTier) {
        res.status(400).json(ResponseUtils.error("Invalid reward tier"));
        return;
      }

      if (amount < rewardTier.minimumAmount) {
        res
          .status(400)
          .json(
            ResponseUtils.error(
              `Minimum amount for this reward is ৳${rewardTier.minimumAmount}`
            )
          );
        return;
      }

      if (
        rewardTier.maxBackers &&
        rewardTier.currentBackers >= rewardTier.maxBackers
      ) {
        res
          .status(400)
          .json(ResponseUtils.error("This reward tier is fully backed"));
        return;
      }

      rewardValue = rewardTier.minimumAmount;
      console.log('Reward tier selected:', rewardTier.title, rewardValue);
    }

    // Generate unique transaction ID
    const transactionId = sslCommerzService.generateTransactionId("PG");
    console.log('Generated transaction ID:', transactionId);

    // ✅ Calculate amounts BEFORE creating donation
    const donationAmount = sslCommerzService.formatAmount(amount);
    const adminFee = Math.round(donationAmount * 0.03);
    const netAmount = donationAmount - adminFee;

    console.log('Amount breakdown:', {
      donationAmount,
      adminFee,
      netAmount,
    });

    // Create donation record
    const cognitoId = req.user?.id;
let actualDonorId: string | null = null;

if (!isAnonymous && cognitoId) {
  console.log('Looking up user with cognitoId:', cognitoId);
  const user = await User.findOne({ cognitoId });
  if (user) {
    actualDonorId = user._id.toString();
    console.log('✅ Found user in database:', user._id);
  } else {
    console.warn('⚠️ User not found in database for cognitoId:', cognitoId);
  }
}

// Find the user by MongoDB _id to get their cognitoId
const creatorUser = await User.findById(project.creator);
if (!creatorUser) {
  res.status(404).json(ResponseUtils.error("Project creator not found"));
  return;
}

// Create donation record
const donationData: any = {
  project: projectId,
  projectCreator: creatorUser.cognitoId, // ✅ Use cognitoId from User
  amount: donationAmount,
  adminFee: adminFee,
  netAmount: netAmount,
  transactionId,
  paymentStatus: PaymentStatus.PENDING,
  paymentMethod: "sslcommerz",
  rewardTier: rewardTierId,
  rewardValue,
  isAnonymous,
  donor: actualDonorId,
  message: message ? StringUtils.sanitize(message) : undefined,
  donorInfo: !isAnonymous
    ? {
        name: StringUtils.sanitize(customerName),
        email: customerEmail.toLowerCase(),
        phone: customerPhone,
      }
    : undefined,
  donorDisplayName: isAnonymous
    ? "Anonymous Donor"
    : StringUtils.sanitize(customerName),
};

    const donation = new Donation(donationData);
    await donation.save();

    console.log('✅ Donation saved successfully:', {
      id: donation._id,
      transactionId: donation.transactionId,
      amount: donation.amount,
      adminFee: donation.adminFee,
      netAmount: donation.netAmount,
      status: donation.paymentStatus,
    });

    // Initialize SSLCommerz payment
    const paymentData = {
      transactionId,
      amount: donationAmount,
      customerName: StringUtils.sanitize(customerName),
      customerEmail,
      customerPhone: customerPhone || "01700000000",
      customerAddress:
        StringUtils.sanitize(customerAddress) || "Dhaka, Bangladesh",
      productName: `Donation to ${project.title}`,
      productCategory: "crowdfunding",
      successUrl: `${process.env.BASE_URL}/api/payments/success`,
      failUrl: `${process.env.BASE_URL}/api/payments/fail`,
      cancelUrl: `${process.env.BASE_URL}/api/payments/cancel`,
      ipnUrl: `${process.env.BASE_URL}/api/payments/webhook`,
    };

    console.log('Calling SSLCommerz with:', JSON.stringify(paymentData, null, 2));

    const sslResponse = await sslCommerzService.initiatePayment(paymentData);

    console.log('SSLCommerz response received:', {
      status: sslResponse.status,
      sessionkey: sslResponse.sessionkey,
      GatewayPageURL: sslResponse.GatewayPageURL,
    });

    // Update donation with session key
    donation.sessionKey = sslResponse.sessionkey;
    await donation.save();

    console.log('✅ Donation updated with session key');
    console.log('=== PAYMENT INITIATION COMPLETED ===\n');

    res.json(
      ResponseUtils.success("Payment initialized successfully", {
        donationId: donation._id,
        transactionId,
        paymentGateway: sslResponse.GatewayPageURL || sslResponse.redirectGatewayURL,
        sessionKey: sslResponse.sessionkey,
        gateways: sslResponse.gw,
      })
    );
  } catch (error) {
    console.error("❌ Payment initiation error:", error);
    next(error);
  }
}

  /**
   * POST /api/payments/success
   * Handle successful payment from SSLCommerz
   * FIXED: Uses correct SSLCommerz response parameters
   */
  async handlePaymentSuccess(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      console.log("Success handler called with body:", req.body);

      // SSLCommerz sends these parameters on success
      const { 
        tran_id: transactionId, 
        amount, 
        bank_tran_id: bankTransactionId,
        status,
        card_type,
        store_amount,
        verify_sign,
        verify_key
      } = req.body;

      if (!transactionId) {
        console.error("No transaction ID provided in success callback");
        res.redirect(
          `${process.env.FRONTEND_FAIL_URL}?error=missing_transaction_id`
        );
        return;
      }

      console.log("Processing success for transaction:", transactionId);

      // Find donation
      const donation = await Donation.findOne({ transactionId });
      if (!donation) {
        console.error("Donation not found for transaction:", transactionId);
        res.redirect(
          `${process.env.FRONTEND_FAIL_URL}?error=donation_not_found`
        );
        return;
      }

      // Basic validation - ensure amounts match
      const receivedAmount = parseFloat(amount);
      if (Math.abs(receivedAmount - donation.amount) > 0.01) {
        console.error("Amount mismatch:", { received: receivedAmount, expected: donation.amount });
        res.redirect(
          `${process.env.FRONTEND_FAIL_URL}?error=amount_mismatch`
        );
        return;
      }

      // Update donation status
      donation.paymentStatus = PaymentStatus.SUCCESS;
      donation.bankTransactionId = bankTransactionId;
      await donation.save();

      // Update project funding
      const project = await Project.findById(donation.project);
      if (project) {
        project.currentAmount += donation.netAmount;
        project.backerCount += 1;

        // Update reward tier if applicable
        if (donation.rewardTier) {
          const rewardTier = project.rewardTiers.find(
            (tier) => tier._id?.toString() === donation.rewardTier
          );
          if (rewardTier) {
            rewardTier.currentBackers += 1;
          }
        }

        await project.save();

        // Generate QR code for reward
        if (donation.rewardValue > 0) {
          try {
            const qrResult = await qrService.generateDonationQR(
              donation,
              project
            );
            donation.qrCodeData = qrResult.qrCodeData;
            donation.qrCodeUrl = qrResult.qrCodeUrl;
            await donation.save();
          } catch (qrError) {
            console.error("QR code generation failed:", qrError);
            // Don't fail the payment for QR code generation issues
          }
        }
      }

      console.log("Payment processed successfully:", transactionId);

      // Redirect to success page
      res.redirect(
        `${process.env.FRONTEND_SUCCESS_URL}?donation=${donation._id}&transaction=${transactionId}`
      );
    } catch (error) {
      console.error("Payment success handling error:", error);
      res.redirect(`${process.env.FRONTEND_FAIL_URL}?error=processing_error`);
    }
  }

  /**
   * POST /api/payments/fail
   * Handle failed payment from SSLCommerz
   */
  async handlePaymentFail(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      console.log("Fail handler called with body:", req.body);
      
      const { tran_id: transactionId, error } = req.body;

      console.log("Payment failed:", { transactionId, error });

      // Update donation status
      const donation = await Donation.findOne({ transactionId });
      if (donation) {
        donation.paymentStatus = PaymentStatus.FAILED;
        await donation.save();
      }

      res.redirect(
        `${
          process.env.FRONTEND_FAIL_URL
        }?error=payment_failed&reason=${encodeURIComponent(error || "unknown")}&transaction=${transactionId}`
      );
    } catch (error) {
      console.error("Payment fail handling error:", error);
      res.redirect(`${process.env.FRONTEND_FAIL_URL}?error=processing_error`);
    }
  }

  /**
   * POST /api/payments/cancel
   * Handle cancelled payment from SSLCommerz
   */
  async handlePaymentCancel(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      console.log("Cancel handler called with body:", req.body);
      
      const { tran_id: transactionId } = req.body;

      console.log("Payment cancelled:", { transactionId });

      // Update donation status
      const donation = await Donation.findOne({ transactionId });
      if (donation) {
        donation.paymentStatus = PaymentStatus.CANCELLED;
        await donation.save();
      }

      res.redirect(`${process.env.FRONTEND_URL}/projects?cancelled=true&transaction=${transactionId}`);
    } catch (error) {
      console.error("Payment cancel handling error:", error);
      res.redirect(`${process.env.FRONTEND_FAIL_URL}?error=processing_error`);
    }
  }

  /**
   * POST /api/payments/webhook
   * Handle SSLCommerz IPN (Instant Payment Notification)
   * FIXED: Simplified webhook without validation ID dependency
   */
  async handleWebhook(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      console.log("Webhook received:", req.body);

      const { 
        tran_id: transactionId, 
        status, 
        amount,
        bank_tran_id: bankTransactionId,
        card_type,
        verify_sign,
        verify_key 
      } = req.body;

      if (!transactionId) {
        console.error("Webhook: Missing transaction ID");
        res.status(400).send("Missing transaction ID");
        return;
      }

      const donation = await Donation.findOne({ transactionId });
      if (!donation) {
        console.error("Webhook: Donation not found for transaction:", transactionId);
        res.status(404).send("Donation not found");
        return;
      }

      // Only process if still pending
      if (donation.paymentStatus !== PaymentStatus.PENDING) {
        console.log("Webhook: Payment already processed:", transactionId);
        res.status(200).send("Already processed");
        return;
      }

      // Basic validation
      const receivedAmount = parseFloat(amount);
      if (Math.abs(receivedAmount - donation.amount) > 0.01) {
        console.error("Webhook: Amount mismatch:", { received: receivedAmount, expected: donation.amount });
        res.status(400).send("Amount mismatch");
        return;
      }

      // Update donation status based on webhook status
      if (status === 'VALID' || status === 'SUCCESS') {
        donation.paymentStatus = PaymentStatus.SUCCESS;
        donation.bankTransactionId = bankTransactionId;
        await donation.save();

        // Update project funding
        const project = await Project.findById(donation.project);
        if (project) {
          project.currentAmount += donation.netAmount;
          project.backerCount += 1;

          // Update reward tier
          if (donation.rewardTier) {
            const rewardTier = project.rewardTiers.find(
              (tier) => tier._id?.toString() === donation.rewardTier
            );
            if (rewardTier) {
              rewardTier.currentBackers += 1;
            }
          }

          await project.save();
        }

        console.log("Webhook: Payment marked as successful:", transactionId);
      } else {
        donation.paymentStatus = PaymentStatus.FAILED;
        await donation.save();
        console.log("Webhook: Payment marked as failed:", transactionId);
      }

      res.status(200).send("OK");
    } catch (error) {
      console.error("Webhook processing error:", error);
      res.status(500).send("Error");
    }
  }

  /**
   * GET /api/payments/:transactionId/status
   * Check payment status
   */
  async getPaymentStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { transactionId } = req.params;

      const donation = await Donation.findOne({ transactionId }).populate(
        "project",
        "title slug"
      );

      if (!donation) {
        res.status(404).json(ResponseUtils.error("Transaction not found"));
        return;
      }

      const response = {
        transactionId,
        donationId: donation._id,
        status: donation.paymentStatus,
        amount: donation.amount,
        project: donation.project,
        createdAt: donation.createdAt,
        bankTransactionId: donation.bankTransactionId,
        qrCodeUrl: donation.qrCodeUrl,
      };

      res.json(
        ResponseUtils.success("Payment status retrieved successfully", response)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/payments/:transactionId/refund
   * Initiate refund (admin only)
   */
  async initiateRefund(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { transactionId } = req.params;
      const { reason } = req.body;

      const donation = await Donation.findOne({ transactionId });

      if (!donation) {
        res.status(404).json(ResponseUtils.error("Transaction not found"));
        return;
      }

      if (!donation.isRefundable()) {
        res
          .status(400)
          .json(ResponseUtils.error("This transaction cannot be refunded"));
        return;
      }

      // Initiate refund with SSLCommerz
      const refundResult = await sslCommerzService.refundTransaction(
        donation.bankTransactionId!,
        donation.amount,
        reason || "Admin refund"
      );

      if (refundResult.success) {
        donation.paymentStatus = PaymentStatus.REFUNDED;
        await donation.save();

        // Update project funding (subtract the refunded amount)
        const project = await Project.findById(donation.project);
        if (project) {
          project.currentAmount = Math.max(
            0,
            project.currentAmount - donation.netAmount
          );
          project.backerCount = Math.max(0, project.backerCount - 1);

          // Update reward tier
          if (donation.rewardTier) {
            const rewardTier = project.rewardTiers.find(
              (tier) => tier._id?.toString() === donation.rewardTier
            );
            if (rewardTier) {
              rewardTier.currentBackers = Math.max(
                0,
                rewardTier.currentBackers - 1
              );
            }
          }

          await project.save();
        }

        res.json(
          ResponseUtils.success("Refund initiated successfully", {
            refundRefId: refundResult.refundRefId,
            message: refundResult.message,
          })
        );
      } else {
        res
          .status(400)
          .json(ResponseUtils.error(`Refund failed: ${refundResult.message}`));
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/payments/statistics
   * Get payment statistics (admin only)
   */
async getPaymentStatistics(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const [donationStats, statusBreakdown] = await Promise.all([
      Donation.getStatistics(start, end),
      PaymentController.getPaymentStatusBreakdown(start, end), // Change this line
    ]);

    const stats = {
      overview: donationStats[0] || {
        totalAmount: 0,
        totalNetAmount: 0,
        totalAdminFee: 0,
        donationCount: 0,
        averageDonation: 0,
        uniqueProjectCount: 0,
      },
      statusBreakdown,
      period: {
        startDate: start?.toISOString(),
        endDate: end?.toISOString(),
      },
    };

    res.json(
      ResponseUtils.success(
        "Payment statistics retrieved successfully",
        stats
      )
    );
  } catch (error) {
    next(error);
  }
}

  /**
   * Helper: Get payment status breakdown
   */
private static async getPaymentStatusBreakdown(startDate?: Date, endDate?: Date) {
  const matchStage: any = {};

  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = startDate;
    if (endDate) matchStage.createdAt.$lte = endDate;
  }

  return await Donation.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: "$paymentStatus",
        count: { $sum: 1 },
        totalAmount: { $sum: "$amount" },
        totalNetAmount: { $sum: "$netAmount" },
        totalAdminFee: { $sum: "$adminFee" },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);
}

  /**
   * GET /api/payments/methods
   * Get available payment methods
   */
  async getPaymentMethods(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const gatewayInfo = sslCommerzService.getGatewayInfo();

      const methods = {
        primary: "SSLCommerz",
        environment: gatewayInfo.environment,
        supportedMethods: [
          "Credit Card",
          "Debit Card",
          "Mobile Banking (bKash, Rocket, Nagad)",
          "Internet Banking",
          "Bank Transfer",
        ],
        currency: "BDT",
        minAmount: 10,
        maxAmount: 500000,
        fees: {
          adminFee: "5%",
          gatewayFee: "As per SSLCommerz rates",
        },
      };

      res.json(
        ResponseUtils.success("Payment methods retrieved successfully", methods)
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new PaymentController();
