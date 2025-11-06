import { Request, Response, NextFunction } from "express";
import PaymentRequest from "../models/PaymentRequest";
import Project from "../models/Project";
import Donation from "../models/Donation";
import User from "../models/User";
import { ResponseUtils, ValidationUtils } from "../utils";
import { PaymentRequestStatus, PaymentStatus } from "../types";
import mongoose from "mongoose";

class PaymentRequestController {
  /**
   * POST /api/payment-requests
   * Create payment request (creator only)
   * this payment request is the creator of the project sending a request to the masteradmin for withdrawal of money
   */
async createPaymentRequest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { projectId, requestedAmount, bankDetails } = req.body;
    const cognitoId = req.user?.id;

    if (!cognitoId) {
      res.status(401).json(ResponseUtils.error("Authentication required"));
      return;
    }

    const user = await User.findOne({ cognitoId });
    if (!user) {
      res.status(404).json(ResponseUtils.error("User not found"));
      return;
    }

    if (!ValidationUtils.isValidObjectId(projectId)) {
      res.status(400).json(ResponseUtils.error("Invalid project ID"));
      return;
    }

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json(ResponseUtils.error("Project not found"));
      return;
    }

    if (project.creator.toString() !== user._id.toString()) {
      res
        .status(403)
        .json(ResponseUtils.error("You do not own this project"));
      return;
    }

    // ✅ FIXED: Get total raised and available amount
    const donationStats = await Donation.aggregate([
      {
        $match: {
          project: projectId.toString(),  // ✅ Convert to string
          paymentStatus: "success",
        },
      },
      {
        $group: {
          _id: "$project",
          totalRaised: { $sum: "$amount" },
          totalNetAmount: { $sum: "$netAmount" },
          totalAdminFee: { $sum: "$adminFee" },
          donationCount: { $sum: 1 },
        },
      },
    ]);

    const totalNetAmount = donationStats[0]?.totalNetAmount || 0;

    // ✅ Check existing payment requests
    const existingRequests = await PaymentRequest.aggregate([
      {
        $match: {
          project: projectId.toString(),  // ✅ Convert to string
          status: {
            $in: [PaymentRequestStatus.APPROVED, PaymentRequestStatus.PAID],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalRequested: { $sum: "$requestedAmount" },
        },
      },
    ]);

    const alreadyRequested = existingRequests[0]?.totalRequested || 0;
    const availableAmount = Math.max(0, totalNetAmount - alreadyRequested);

    // Validate requested amount
    if (requestedAmount <= 0) {
      res
        .status(400)
        .json(ResponseUtils.error("Requested amount must be greater than 0"));
      return;
    }

    if (requestedAmount > availableAmount) {
      res
        .status(400)
        .json(
          ResponseUtils.error(
            `Requested amount (BDT ${requestedAmount}) exceeds available funds (BDT ${availableAmount})`
          )
        );
      return;
    }

    // Check for pending requests
    const pendingRequest = await PaymentRequest.findOne({
      project: projectId,
      status: PaymentRequestStatus.PENDING,
    });

    if (pendingRequest) {
      res
        .status(400)
        .json(
          ResponseUtils.error(
            "You already have a pending payment request for this project"
          )
        );
      return;
    }

    // Validate bank details
    if (
      !bankDetails.accountHolder ||
      !bankDetails.bankName ||
      !bankDetails.accountNumber ||
      !bankDetails.branchName
    ) {
      res
        .status(400)
        .json(
          ResponseUtils.error(
            "Complete bank details required: accountHolder, bankName, accountNumber, branchName"
          )
        );
      return;
    }

    const adminFeeDeducted = donationStats[0]?.totalAdminFee || 0;

    // Create payment request
    const paymentRequest = new PaymentRequest({
      creator: user._id,
      project: projectId,
      requestedAmount,
      adminFeeDeducted,
      netAmount: requestedAmount,
      status: PaymentRequestStatus.PENDING,
      bankDetails: {
        accountHolder: bankDetails.accountHolder.trim(),
        bankName: bankDetails.bankName.trim(),
        accountNumber: bankDetails.accountNumber.trim(),
        routingNumber: bankDetails.routingNumber?.trim() || "",
        branchName: bankDetails.branchName.trim(),
      },
    });

    await paymentRequest.save();

    res.status(201).json(
      ResponseUtils.success(
        "Payment request submitted successfully. Admin will review your request.",
        {
          paymentRequest: paymentRequest.toObject(),
          availableAmount,
        }
      )
    );
  } catch (error) {
    console.error("Create payment request error:", error);
    next(error);
  }
}

  /**
   * GET /api/payment-requests/project/:projectId
   * Get payment requests for a project (creator only)  ----->>> project wise payment requests for withdraw
   */
  async getProjectPaymentRequests(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { projectId } = req.params;
      const cognitoId = req.user?.id;

      if (!cognitoId) {
        res.status(401).json(ResponseUtils.error("Authentication required"));
        return;
      }

      const user = await User.findOne({ cognitoId });
      if (!user) {
        res.status(404).json(ResponseUtils.error("User not found"));
        return;
      }

      if (!ValidationUtils.isValidObjectId(projectId)) {
        res.status(400).json(ResponseUtils.error("Invalid project ID"));
        return;
      }

      // Verify ownership
      const project = await Project.findById(projectId);
      if (!project) {
        res.status(404).json(ResponseUtils.error("Project not found"));
        return;
      }

      if (project.creator.toString() !== user._id.toString()) {
        res.status(403).json(ResponseUtils.error("Access denied"));
        return;
      }

      const paymentRequests = await PaymentRequest.find({ project: projectId })
        .sort({ createdAt: -1 })
        .populate("project", "title slug");

      res.json(
        ResponseUtils.success(
          "Payment requests retrieved successfully",
          paymentRequests
        )
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/payment-requests/creator
   * Get all payment requests for logged-in creator   ------>>> all withdrawal requests of creator
   */
  async getCreatorPaymentRequests(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const cognitoId = req.user?.id;

      if (!cognitoId) {
        res.status(401).json(ResponseUtils.error("Authentication required"));
        return;
      }

      const user = await User.findOne({ cognitoId });
      if (!user) {
        res.status(404).json(ResponseUtils.error("User not found"));
        return;
      }

      const { page = 1, limit = 20, status } = req.query;

      const query: any = { creator: user._id };
      if (status) {
        query.status = status;
      }

      const skip = (Number(page) - 1) * Number(limit);
      const [requests, total] = await Promise.all([
        PaymentRequest.find(query)
          .populate("project", "title slug")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        PaymentRequest.countDocuments(query),
      ]);

      const meta = ResponseUtils.createPaginationMeta(
        total,
        Number(page),
        Number(limit)
      );

      res.json(
        ResponseUtils.success(
          "Payment requests retrieved successfully",
          requests,
          meta
        )
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/payment-requests/:id
   * Get single payment request details ----->>> single withdrawal request of creators
   */
  async getPaymentRequest(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const cognitoId = req.user?.id;

      if (!cognitoId) {
        res.status(401).json(ResponseUtils.error("Authentication required"));
        return;
      }

      if (!ValidationUtils.isValidObjectId(id)) {
        res.status(400).json(ResponseUtils.error("Invalid payment request ID"));
        return;
      }

      const paymentRequest = await PaymentRequest.findById(id).populate(
        "project",
        "title slug currentAmount"
      );

      if (!paymentRequest) {
        res.status(404).json(ResponseUtils.error("Payment request not found"));
        return;
      }

      res.json(
        ResponseUtils.success(
          "Payment request retrieved successfully",
          paymentRequest
        )
      );
    } catch (error) {
      next(error);
    }
  }

  // Add these methods to your PaymentRequestController class

  /**
   * GET /api/payment-requests/project/:projectId/balance
   * Get available balance for a specific project
   */
  async getProjectBalance(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { projectId } = req.params;
      const cognitoId = req.user?.id;

      if (!cognitoId) {
        res.status(401).json(ResponseUtils.error("Authentication required"));
        return;
      }

      if (!ValidationUtils.isValidObjectId(projectId)) {
        res.status(400).json(ResponseUtils.error("Invalid project ID"));
        return;
      }

      const user = await User.findOne({ cognitoId });
      if (!user) {
        res.status(404).json(ResponseUtils.error("User not found"));
        return;
      }

      // Verify project ownership
      const project = await Project.findById(projectId);
      if (!project) {
        res.status(404).json(ResponseUtils.error("Project not found"));
        return;
      }

      if (project.creator.toString() !== user._id.toString()) {
        res.status(403).json(ResponseUtils.error("Access denied"));
        return;
      }

      // Calculate total raised and net amount from successful donations
      const donationStats = await Donation.aggregate([
        {
          $match: {
            project: project._id,
            paymentStatus: "success",
          },
        },
        {
          $group: {
            _id: null,
            totalRaised: { $sum: "$amount" },
            totalNetAmount: { $sum: "$netAmount" },
            totalAdminFee: { $sum: "$adminFee" },
            donationCount: { $sum: 1 },
          },
        },
      ]);

      // Calculate total already requested (approved + paid requests)
      const requestStats = await PaymentRequest.aggregate([
        {
          $match: {
            project: project._id,
            status: {
              $in: [PaymentRequestStatus.APPROVED, PaymentRequestStatus.PAID],
            },
          },
        },
        {
          $group: {
            _id: null,
            totalRequested: { $sum: "$requestedAmount" },
            totalApproved: { $sum: "$netAmount" },
          },
        },
      ]);

      const totalRaised = donationStats[0]?.totalRaised || 0;
      const totalNetAmount = donationStats[0]?.totalNetAmount || 0;
      const totalAdminFee = donationStats[0]?.totalAdminFee || 0;
      const donationCount = donationStats[0]?.donationCount || 0;
      const alreadyRequested = requestStats[0]?.totalRequested || 0;

      // Available = Net Amount - Already Requested
      const availableAmount = Math.max(0, totalNetAmount - alreadyRequested);

      const balanceData = {
        projectId: project._id,
        projectTitle: project.title,
        totalRaised,
        totalNetAmount,
        totalAdminFee,
        donationCount,
        alreadyRequested,
        availableAmount,
        lastUpdated: new Date(),
      };

      res.json(
        ResponseUtils.success(
          "Project balance retrieved successfully",
          balanceData
        )
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/payment-requests/creator/balances
   * Get available balances for all creator's projects
   */
  async getCreatorBalances(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const cognitoId = req.user?.id;

      if (!cognitoId) {
        res.status(401).json(ResponseUtils.error("Authentication required"));
        return;
      }

      const user = await User.findOne({ cognitoId });
      if (!user) {
        res.status(404).json(ResponseUtils.error("User not found"));
        return;
      }

      console.log("👤 User found:", user._id);

      // Get all creator's projects
      const projects = await Project.find({
        creator: user._id,
        isActive: true,
      }).select("_id title slug currentAmount");

      console.log("📁 Projects found:", projects.length);
      console.log(
        "📁 Project IDs:",
        projects.map((p) => p._id)
      );

      if (projects.length === 0) {
        res.json(
          ResponseUtils.success("No projects found", {
            totalAvailable: 0,
            projects: [],
          })
        );
        return;
      }

      const projectIds = projects.map(p => p._id.toString());

      console.log("🔍 Searching for donations with query:", {
        project: { $in: projectIds },
        paymentStatus: "success",
      });

      // Get donation stats for all projects
      const donationStats = await Donation.aggregate([
        {
          $match: {
            project: { $in: projectIds },
            paymentStatus: "success",
          },
        },
        {
          $group: {
            _id: "$project",
            totalRaised: { $sum: "$amount" },
            totalNetAmount: { $sum: "$netAmount" },
            totalAdminFee: { $sum: "$adminFee" },
            donationCount: { $sum: 1 },
          },
        },
      ]);

      console.log(
        "💰 Donation stats result:",
        JSON.stringify(donationStats, null, 2)
      );
      console.log(
        "💰 Number of projects with donations:",
        donationStats.length
      );

      // Also check ALL donations for debugging
      // Also check ALL donations for debugging
      const allDonations = await Donation.find({
        project: { $in: projectIds },
      })
        .select("project amount paymentStatus netAmount adminFee")
        .lean(); // ✅ Add .lean()

      console.log(
        "🔍 ALL donations RAW (for debugging):",
        JSON.stringify(allDonations, null, 2)
      );

      // Get payment request stats for all projects
      const requestStats = await PaymentRequest.aggregate([
        {
          $match: {
            project: { $in: projectIds },
            status: {
              $in: [PaymentRequestStatus.APPROVED, PaymentRequestStatus.PAID],
            },
          },
        },
        {
          $group: {
            _id: "$project",
            totalRequested: { $sum: "$requestedAmount" },
          },
        },
      ]);

      // Create maps for easy lookup
      const donationMap = new Map();
      donationStats.forEach((stat) => {
        donationMap.set(stat._id.toString(), stat);
      });

      const requestMap = new Map();
      requestStats.forEach((stat) => {
        requestMap.set(stat._id.toString(), stat);
      });

      // Calculate balance for each project
      const projectBalances = projects.map((project) => {
        const projectIdStr = project._id.toString();
        const donations = donationMap.get(projectIdStr) || {
          totalRaised: 0,
          totalNetAmount: 0,
          totalAdminFee: 0,
          donationCount: 0,
        };
        const requests = requestMap.get(projectIdStr) || {
          totalRequested: 0,
        };

        const availableAmount = Math.max(
          0,
          donations.totalNetAmount - requests.totalRequested
        );

        return {
          projectId: project._id,
          projectTitle: project.title,
          projectSlug: project.slug,
          totalRaised: donations.totalRaised,
          totalNetAmount: donations.totalNetAmount,
          totalAdminFee: donations.totalAdminFee,
          donationCount: donations.donationCount,
          alreadyRequested: requests.totalRequested,
          availableAmount,
        };
      });

      // Calculate total available across all projects
      const totalAvailable = projectBalances.reduce(
        (sum, p) => sum + p.availableAmount,
        0
      );

      console.log("✅ Final result - Total available:", totalAvailable);

      res.json(
        ResponseUtils.success("Creator balances retrieved successfully", {
          totalAvailable,
          projectCount: projects.length,
          projects: projectBalances,
          lastUpdated: new Date(),
        })
      );
    } catch (error) {
      console.error("❌ Error in getCreatorBalances:", error);
      next(error);
    }
  }
}

export default new PaymentRequestController();
