import { Request, Response, NextFunction } from 'express';
import Donation from '../models/Donation';
import Project from '../models/Project';
import qrService from '../services/QRService';
import { PaymentStatus, RewardRedemptionStatus } from '../types';
import { ResponseUtils, ValidationUtils, DateUtils } from '../utils';

class DonationController {

  /**
   * GET /api/donations
   * Get donations with filtering and pagination
   */

  async getDonations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        page = 1,
        limit = 20,
        projectId,
        status,
        minAmount,
        maxAmount,
        startDate,
        endDate,
        hasReward,
        sort = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Build query
      const query: any = {};

      // Project filter
      if (projectId) {
        if (!ValidationUtils.isValidObjectId(projectId as string)) {
          res.status(400).json(ResponseUtils.error('Invalid project ID'));
          return;
        }
        query.project = projectId;
      }

      // Status filter
      if (status) {
        query.paymentStatus = status;
      }

      // Amount filters
      if (minAmount) {
        query.amount = { ...query.amount, $gte: Number(minAmount) };
      }
      if (maxAmount) {
        query.amount = { ...query.amount, $lte: Number(maxAmount) };
      }

      // Date range filter
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate as string);
        if (endDate) query.createdAt.$lte = new Date(endDate as string);
      }

      // Reward filter
      if (hasReward !== undefined) {
        if (hasReward === 'true') {
          query.rewardValue = { $gt: 0 };
        } else {
          query.rewardValue = { $eq: 0 };
        }
      }

      // Build sort object
      const sortObj: any = {};
      sortObj[sort as string] = sortOrder === 'desc' ? -1 : 1;

      // Execute query
      const skip = (Number(page) - 1) * Number(limit);
      const [donations, total] = await Promise.all([
        Donation.find(query)
          .populate('project', 'title slug category')
          .sort(sortObj)
          .skip(skip)
          .limit(Number(limit))
          .select('-__v'),
        Donation.countDocuments(query)
      ]);

      const meta = ResponseUtils.createPaginationMeta(total, Number(page), Number(limit));

      res.json(ResponseUtils.success(
        'Donations retrieved successfully',
        donations,
        meta
      ));

    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/donations/:id
   * Get single donation details
   */

// In DonationController.ts - getDonation method

async getDonation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    if (!ValidationUtils.isValidObjectId(id)) {
      res.status(400).json(ResponseUtils.error('Invalid donation ID'));
      return;
    }

    const donation = await Donation.findById(id)
      .populate('project', 'title slug category creator rewardTiers')
      .select('-__v');

    if (!donation) {
      res.status(404).json(ResponseUtils.error('Donation not found'));
      return;
    }

    // ✅ Add reward tier details if applicable
    let rewardTierDetails = null;
    if (donation.rewardTier && (donation.project as any)?.rewardTiers) {
      const project = donation.project as any;
      rewardTierDetails = project.rewardTiers.id(donation.rewardTier);
    }

    const donationWithDetails = {
      ...donation.toObject(),
      rewardTierDetails
    };

    res.json(ResponseUtils.success(
      'Donation retrieved successfully',
      donationWithDetails
    ));

  } catch (error) {
    next(error);
  }
}

  /**
   * GET /api/donations/project/:projectId
   * Get donations for a specific project
   */

  async getProjectDonations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId } = req.params;
      const { 
        page = 1, 
        limit = 20, 
        status = PaymentStatus.SUCCESS,
        includeAnonymous = true
      } = req.query;

      if (!ValidationUtils.isValidObjectId(projectId)) {
        res.status(400).json(ResponseUtils.error('Invalid project ID'));
        return;
      }

      // Check if project exists
      const project = await Project.findById(projectId);
      if (!project) {
        res.status(404).json(ResponseUtils.error('Project not found'));
        return;
      }

      // Build query
      const query: any = { 
        project: projectId,
        paymentStatus: status 
      };

      // Filter anonymous donations if requested
      if (includeAnonymous === 'false') {
        query.isAnonymous = false;
      }

      const skip = (Number(page) - 1) * Number(limit);
      const [donations, total] = await Promise.all([
        Donation.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .select('amount donorDisplayName message createdAt isAnonymous rewardValue'),
        Donation.countDocuments(query)
      ]);

      const meta = ResponseUtils.createPaginationMeta(total, Number(page), Number(limit));

      res.json(ResponseUtils.success(
        'Project donations retrieved successfully',
        donations,
        meta
      ));

    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/donations/user/:userId
   * Get donations by user (requires authentication)
   */

  async getUserDonations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20, status } = req.query;

      // TODO: Verify user authentication and authorization
      // if (req.user?.id !== userId && !req.user?.isAdmin) {
      //   res.status(403).json(ResponseUtils.error('Access denied'));
      //   return;
      // }

      const query: any = { donor: userId };
      if (status) {
        query.paymentStatus = status;
      }

      const skip = (Number(page) - 1) * Number(limit);
      const [donations, total] = await Promise.all([
        Donation.find(query)
          .populate('project', 'title slug category status')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .select('-__v'),
        Donation.countDocuments(query)
      ]);

      const meta = ResponseUtils.createPaginationMeta(total, Number(page), Number(limit));

      res.json(ResponseUtils.success(
        'User donations retrieved successfully',
        donations,
        meta
      ));

    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/donations/recent
   * Get recent successful donations for homepage/feed
   */
  async getRecentDonations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { limit = 10, includeAnonymous = true } = req.query;

      const query: any = { 
        paymentStatus: PaymentStatus.SUCCESS
      };

      if (includeAnonymous === 'false') {
        query.isAnonymous = false;
      }

      const donations = await Donation.find(query)
        .populate('project', 'title slug category')
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .select('amount donorDisplayName message createdAt project rewardValue');

      res.json(ResponseUtils.success(
        'Recent donations retrieved successfully',
        donations
      ));

    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/donations/:id/qr
   * Get QR code for donation reward
   */
  async getDonationQR(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { format = 'url' } = req.query; // 'url' or 'base64'

      if (!ValidationUtils.isValidObjectId(id)) {
        res.status(400).json(ResponseUtils.error('Invalid donation ID'));
        return;
      }

      const donation = await Donation.findById(id)
        .populate('project', 'title slug');

      if (!donation) {
        res.status(404).json(ResponseUtils.error('Donation not found'));
        return;
      }

      if (!donation.isSuccessful()) {
        res.status(400).json(ResponseUtils.error(
          'QR code is only available for successful donations'
        ));
        return;
      }

      if (donation.rewardValue === 0) {
        res.status(400).json(ResponseUtils.error(
          'This donation does not have an associated reward'
        ));
        return;
      }

      // Generate new QR code if not exists
      if (!donation.qrCodeData || !donation.qrCodeUrl) {
        const project = donation.project as any;
        const qrResult = await qrService.generateDonationQR(donation, project);
        
        donation.qrCodeData = qrResult.qrCodeData;
        donation.qrCodeUrl = qrResult.qrCodeUrl;
        await donation.save();
      }

      if (format === 'base64') {
        // Generate base64 QR code
        const base64QR = await qrService.generateQRDataURL(donation.qrCodeData!);
        
        res.json(ResponseUtils.success(
          'QR code retrieved successfully',
          {
            donationId: donation._id,
            format: 'base64',
            qrCode: base64QR,
            rewardValue: donation.rewardValue,
            rewardStatus: donation.rewardStatus
          }
        ));
      } else {
        // Return S3 URL
        res.json(ResponseUtils.success(
          'QR code retrieved successfully',
          {
            donationId: donation._id,
            format: 'url',
            qrCodeUrl: donation.qrCodeUrl,
            rewardValue: donation.rewardValue,
            rewardStatus: donation.rewardStatus
          }
        ));
      }

    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/donations/:id/redeem
   * Redeem donation reward (manual process)
   */

  async redeemReward(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { notes, redeemedBy } = req.body;

      if (!ValidationUtils.isValidObjectId(id)) {
        res.status(400).json(ResponseUtils.error('Invalid donation ID'));
        return;
      }

      const donation = await Donation.findById(id);
      
      if (!donation) {
        res.status(404).json(ResponseUtils.error('Donation not found'));
        return;
      }

      if (!donation.canRedeemReward()) {
        res.status(400).json(ResponseUtils.error(
          'This reward cannot be redeemed at this time'
        ));
        return;
      }

      // Redeem the reward
      await donation.redeemReward();

      // Log the redemption (you might want to create a separate redemption log model)
      console.log('Reward redeemed:', {
        donationId: id,
        rewardValue: donation.rewardValue,
        redeemedBy: redeemedBy || 'system',
        notes,
        timestamp: new Date()
      });

      res.json(ResponseUtils.success(
        'Reward redeemed successfully',
        {
          donationId: donation._id,
          rewardValue: donation.rewardValue,
          rewardStatus: donation.rewardStatus,
          redeemedAt: new Date()
        }
      ));

    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/donations/rewards/pending
   * Get pending rewards for redemption (admin/creator view)
   */

  async getPendingRewards(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { 
        page = 1, 
        limit = 20, 
        projectId,
        minValue,
        createdAfter 
      } = req.query;

      let query: any = {
        paymentStatus: PaymentStatus.SUCCESS,
        rewardValue: { $gt: 0 },
        rewardStatus: RewardRedemptionStatus.PENDING
      };

      // Project filter
      if (projectId) {
        if (!ValidationUtils.isValidObjectId(projectId as string)) {
          res.status(400).json(ResponseUtils.error('Invalid project ID'));
          return;
        }
        query.project = projectId;
      }

      // Minimum value filter
      if (minValue) {
        query.rewardValue.$gte = Number(minValue);
      }

      // Date filter
      if (createdAfter) {
        query.createdAt = { $gte: new Date(createdAfter as string) };
      }

      const skip = (Number(page) - 1) * Number(limit);
      const [rewards, total] = await Promise.all([
        Donation.find(query)
          .populate('project', 'title slug creator')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .select('amount rewardValue rewardTier donorDisplayName createdAt qrCodeUrl project'),
        Donation.countDocuments(query)
      ]);

      const meta = ResponseUtils.createPaginationMeta(total, Number(page), Number(limit));

      res.json(ResponseUtils.success(
        'Pending rewards retrieved successfully',
        rewards,
        meta
      ));

    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/donations/statistics
   * Get donation statistics
   */

  async getDonationStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { 
        projectId,
        startDate,
        endDate,
        groupBy = 'day' // day, week, month
      } = req.query;

      const start = startDate ? new Date(startDate as string) : DateUtils.addDays(new Date(), -30);
      const end = endDate ? new Date(endDate as string) : new Date();

      // Base match stage
      const matchStage: any = {
        createdAt: { $gte: start, $lte: end },
        paymentStatus: PaymentStatus.SUCCESS
      };

      if (projectId) {
        if (!ValidationUtils.isValidObjectId(projectId as string)) {
          res.status(400).json(ResponseUtils.error('Invalid project ID'));
          return;
        }
        matchStage.project = projectId;
      }

      // Group by time period
      const groupId: any = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' }
      };

      if (groupBy === 'day') {
        groupId.day = { $dayOfMonth: '$createdAt' };
      } else if (groupBy === 'week') {
        groupId.week = { $week: '$createdAt' };
      }

      const [timeSeriesData, overallStats] = await Promise.all([
        Donation.aggregate([
          { $match: matchStage },
          {
            $group: {
              _id: groupId,
              totalAmount: { $sum: '$amount' },
              totalNetAmount: { $sum: '$netAmount' },
              totalAdminFee: { $sum: '$adminFee' },
              count: { $sum: 1 },
              averageAmount: { $avg: '$amount' }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
        ]),
        Donation.getStatistics(start, end)
      ]);

      const statistics = {
        period: {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          groupBy
        },
        overview: overallStats[0] || {
          totalAmount: 0,
          totalNetAmount: 0,
          totalAdminFee: 0,
          donationCount: 0,
          averageDonation: 0,
          uniqueProjectCount: 0
        },
        timeSeries: timeSeriesData
      };

      res.json(ResponseUtils.success(
        'Donation statistics retrieved successfully',
        statistics
      ));

    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/donations/:id/message
   * Add/update donor message (for the donor only)
   */
  
  async updateDonorMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { message } = req.body;

      if (!ValidationUtils.isValidObjectId(id)) {
        res.status(400).json(ResponseUtils.error('Invalid donation ID'));
        return;
      }

      const donation = await Donation.findById(id);
      
      if (!donation) {
        res.status(404).json(ResponseUtils.error('Donation not found'));
        return;
      }

      // TODO: Check if user owns this donation
      // if (donation.donor !== req.user?.id && !donation.isAnonymous) {
      //   res.status(403).json(ResponseUtils.error('Access denied'));
      //   return;
      // }

      if (message && message.length > 500) {
        res.status(400).json(ResponseUtils.error(
          'Message cannot exceed 500 characters'
        ));
        return;
      }

      donation.message = message ? message.trim() : undefined;
      await donation.save();

      res.json(ResponseUtils.success(
        'Donor message updated successfully',
        { message: donation.message }
      ));

    } catch (error) {
      next(error);
    }
  }

  /*
  for existing rewards that we already created regenerate the rewards
  */

  // In DonationController.ts - temporary endpoint
async regenerateQR(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const donation = await Donation.findById(id);
    if (!donation) {
      res.status(404).json(ResponseUtils.error('Donation not found'));
      return;
    }

    const project = await Project.findById(donation.project);
    if (!project) {
      res.status(404).json(ResponseUtils.error('Project not found'));
      return;
    }

    // Generate new QR with URL
    const qrResult = await qrService.generateDonationQR(donation, project);
    donation.qrCodeData = qrResult.qrCodeData;
    donation.qrCodeUrl = qrResult.qrCodeUrl;
    await donation.save();

    res.json(ResponseUtils.success('QR code regenerated', {
      qrCodeUrl: donation.qrCodeUrl
    }));
  } catch (error) {
    next(error);
  }
}
}

export default new DonationController();