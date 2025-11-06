import { Request, Response, NextFunction } from 'express';
import Project from '../models/Project';
import Donation from '../models/Donation';
import PaymentRequest from '../models/PaymentRequest';
import User from '../models/User';
import { IAdminStats, PaymentRequestStatus, ProjectStatus, IPaymentRequest } from '../types';
import { ResponseUtils, CurrencyUtils, DateUtils, ValidationUtils } from '../utils';

class AdminController {
  /**
   * GET /api/admin/dashboard
   * Get admin dashboard statistics
   */
  async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { period = '30' } = req.query;
      const startDate = DateUtils.addDays(new Date(), -Number(period));
      const endDate = new Date();

      // Helper functions
      const getRecentActivity = async (limit: number) => {
        const [recentDonations, recentPaymentRequests] = await Promise.all([
          Donation.find({ paymentStatus: 'success' })
            .populate('project', 'title slug')
            .sort({ createdAt: -1 })
            .limit(limit / 2)
            .select('amount project donorDisplayName createdAt'),
          PaymentRequest.find()
            .populate('project', 'title slug')
            .sort({ createdAt: -1 })
            .limit(limit / 2)
            .select('requestedAmount project status createdAt')
        ]);

        const activities = [
          ...recentDonations.map(d => ({
            type: 'donation',
            amount: d.amount,
            project: d.project,
            donor: d.donorDisplayName,
            createdAt: d.createdAt
          })),
          ...recentPaymentRequests.map(pr => ({
            type: 'payment_request',
            amount: pr.requestedAmount,
            project: pr.project,
            status: pr.status,
            createdAt: pr.createdAt
          }))
        ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        return activities.slice(0, limit);
      };

      const getTopProjects = async (limit: number) => {
        return await Project.aggregate([
          {
            $match: {
              status: { $in: [ProjectStatus.ACTIVE, ProjectStatus.FUNDED] },
              isActive: true
            }
          },
          {
            $sort: { currentAmount: -1 }
          },
          {
            $limit: limit
          },
          {
            $project: {
              title: 1,
              slug: 1,
              currentAmount: 1,
              targetAmount: 1,
              backerCount: 1,
              fundingProgress: {
                $multiply: [
                  { $divide: ['$currentAmount', '$targetAmount'] },
                  100
                ]
              }
            }
          }
        ]);
      };

      const getMonthlyStats = async () => {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const [projects, donations, revenue] = await Promise.all([
          Project.countDocuments({
            createdAt: { $gte: startOfMonth },
            isActive: true
          }),
          Donation.countDocuments({
            createdAt: { $gte: startOfMonth },
            paymentStatus: 'success'
          }),
          Donation.aggregate([
            {
              $match: {
                createdAt: { $gte: startOfMonth },
                paymentStatus: 'success'
              }
            },
            {
              $group: {
                _id: null,
                totalRaised: { $sum: '$amount' },
                adminFees: { $sum: '$adminFee' }
              }
            }
          ])
        ]);

        return {
          newProjects: projects,
          totalDonations: donations,
          totalRaised: revenue[0]?.totalRaised || 0,
          adminFees: revenue[0]?.adminFees || 0
        };
      };

      const [
        totalProjects,
        activeProjects,
        totalDonations,
        donationStats,
        pendingPaymentRequests,
        totalUsers,
        recentActivity,
        topProjects,
        monthlyStats
      ] = await Promise.all([
        Project.countDocuments({ isActive: true }),
        Project.countDocuments({ 
          status: ProjectStatus.ACTIVE, 
          isActive: true 
        }),
        Donation.countDocuments({ paymentStatus: 'success' }),
        Donation.aggregate([
          { 
            $match: { 
              paymentStatus: 'success',
              createdAt: { $gte: startDate, $lte: endDate }
            } 
          },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: '$amount' },
              totalNetAmount: { $sum: '$netAmount' },
              totalAdminFee: { $sum: '$adminFee' },
              count: { $sum: 1 }
            }
          }
        ]),
        PaymentRequest.countDocuments({ status: PaymentRequestStatus.PENDING }),
        User.countDocuments(),
        getRecentActivity(10),
        getTopProjects(5),
        getMonthlyStats()
      ]);

      const stats: IAdminStats = {
        totalProjects,
        activeProjects,
        totalRaised: donationStats[0]?.totalAmount || 0,
        totalAdminFees: donationStats[0]?.totalAdminFee || 0,
        totalDonations,
        totalUsers,
        pendingPaymentRequests,
        thisMonthStats: monthlyStats
      };

      const dashboard = {
        overview: stats,
        recentActivity,
        topProjects,
        period: {
          days: Number(period),
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      };

      res.json(ResponseUtils.success(
        'Admin dashboard retrieved successfully',
        dashboard
      ));

    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/payment-requests
   * Get payment requests for admin approval
   */
  async getPaymentRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        minAmount,
        maxAmount,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const query: any = {};
      if (status) {
        query.status = status;
      }

      if (minAmount || maxAmount) {
        query.requestedAmount = {};
        if (minAmount) query.requestedAmount.$gte = Number(minAmount);
        if (maxAmount) query.requestedAmount.$lte = Number(maxAmount);
      }

      const sortObj: any = {};
      sortObj[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

      const skip = (Number(page) - 1) * Number(limit);
      const [requests, total] = await Promise.all([
        PaymentRequest.find(query)
          .populate('project', 'title slug currentAmount targetAmount')
          .sort(sortObj)
          .skip(skip)
          .limit(Number(limit)),
        PaymentRequest.countDocuments(query)
      ]);

      const meta = ResponseUtils.createPaginationMeta(total, Number(page), Number(limit));

      res.json(ResponseUtils.success(
        'Payment requests retrieved successfully',
        requests,
        meta
      ));

    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/payment-requests/:id/approve
   * Approve payment request
   */
  async approvePaymentRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const cognitoId = req.user?.id;

      if (!cognitoId) {
        res.status(401).json(ResponseUtils.error('Authentication required'));
        return;
      }

      const admin = await User.findOne({ cognitoId });
      if (!admin) {
        res.status(404).json(ResponseUtils.error('Admin user not found'));
        return;
      }

      if (!ValidationUtils.isValidObjectId(id)) {
        res.status(400).json(ResponseUtils.error('Invalid payment request ID'));
        return;
      }

      const paymentRequest = await PaymentRequest.findById(id);
      
      if (!paymentRequest) {
        res.status(404).json(ResponseUtils.error('Payment request not found'));
        return;
      }

      if (!paymentRequest.canBeApproved()) {
        res.status(400).json(ResponseUtils.error(
          'This payment request cannot be approved'
        ));
        return;
      }

      await paymentRequest.approve(admin._id.toString(), notes);

      res.json(ResponseUtils.success(
        'Payment request approved successfully',
        {
          id: paymentRequest._id,
          status: paymentRequest.status,
          processedBy: paymentRequest.processedBy,
          processedAt: paymentRequest.processedAt,
          adminNotes: paymentRequest.adminNotes
        }
      ));

    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/payment-requests/:id/reject
   * Reject payment request
   */
  async rejectPaymentRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const cognitoId = req.user?.id;

      if (!cognitoId) {
        res.status(401).json(ResponseUtils.error('Authentication required'));
        return;
      }

      const admin = await User.findOne({ cognitoId });
      if (!admin) {
        res.status(404).json(ResponseUtils.error('Admin user not found'));
        return;
      }

      if (!reason || reason.trim().length === 0) {
        res.status(400).json(ResponseUtils.error(
          'Rejection reason is required'
        ));
        return;
      }

      if (!ValidationUtils.isValidObjectId(id)) {
        res.status(400).json(ResponseUtils.error('Invalid payment request ID'));
        return;
      }

      const paymentRequest = await PaymentRequest.findById(id);
      
      if (!paymentRequest) {
        res.status(404).json(ResponseUtils.error('Payment request not found'));
        return;
      }

      if (!paymentRequest.canBeRejected()) {
        res.status(400).json(ResponseUtils.error(
          'This payment request cannot be rejected'
        ));
        return;
      }

      await paymentRequest.reject(admin._id.toString(), reason);

      res.json(ResponseUtils.success(
        'Payment request rejected successfully',
        {
          id: paymentRequest._id,
          status: paymentRequest.status,
          processedBy: paymentRequest.processedBy,
          processedAt: paymentRequest.processedAt,
          adminNotes: paymentRequest.adminNotes
        }
      ));

    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/payment-requests/:id/mark-paid
   * Mark payment request as paid
   */
  async markPaymentAsPaid(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { notes, transactionReference } = req.body;
      const cognitoId = req.user?.id;

      if (!cognitoId) {
        res.status(401).json(ResponseUtils.error('Authentication required'));
        return;
      }

      const admin = await User.findOne({ cognitoId });
      if (!admin) {
        res.status(404).json(ResponseUtils.error('Admin user not found'));
        return;
      }

      if (!ValidationUtils.isValidObjectId(id)) {
        res.status(400).json(ResponseUtils.error('Invalid payment request ID'));
        return;
      }

      const paymentRequest = await PaymentRequest.findById(id);
      
      if (!paymentRequest) {
        res.status(404).json(ResponseUtils.error('Payment request not found'));
        return;
      }

      if (!paymentRequest.canBeMarkedAsPaid()) {
        res.status(400).json(ResponseUtils.error(
          'This payment request cannot be marked as paid'
        ));
        return;
      }

      const finalNotes = [
        notes,
        transactionReference ? `Transaction Reference: ${transactionReference}` : null
      ].filter(Boolean).join('\n');

      await paymentRequest.markAsPaid(admin._id.toString(), finalNotes);

      res.json(ResponseUtils.success(
        'Payment request marked as paid successfully',
        {
          id: paymentRequest._id,
          status: paymentRequest.status,
          processedBy: paymentRequest.processedBy,
          processedAt: paymentRequest.processedAt,
          adminNotes: paymentRequest.adminNotes
        }
      ));

    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/projects
   * Get all projects for admin management
   */
  async getProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        category,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        includeInactive = true
      } = req.query;

      const query: any = {};
      
      if (status) {
        query.status = status;
      }

      if (category) {
        query.category = category;
      }

      if (search) {
        query.$text = { $search: search as string };
      }

      if (includeInactive === 'false') {
        query.isActive = true;
      }

      const sortObj: any = {};
      if (search) {
        sortObj.score = { $meta: 'textScore' };
      }
      sortObj[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

      const skip = (Number(page) - 1) * Number(limit);
      const [projects, total] = await Promise.all([
        Project.find(query)
          .sort(sortObj)
          .skip(skip)
          .limit(Number(limit))
          .select('-story -risks -updates'),
        Project.countDocuments(query)
      ]);

      const projectsWithStats = await Promise.all(
        projects.map(async (project) => {
          const [stats, paymentRequests] = await Promise.all([
            Donation.aggregate([
              { 
                $match: { 
                  project: project._id.toString(),
                  paymentStatus: 'success'
                }
              },
              {
                $group: {
                  _id: null,
                  totalAmount: { $sum: '$amount' },
                  totalNetAmount: { $sum: '$netAmount' },
                  totalAdminFee: { $sum: '$adminFee' },
                  donationCount: { $sum: 1 }
                }
              }
            ]),
            PaymentRequest.countDocuments({ project: project._id })
          ]);

          return {
            ...project.toObject(),
            stats: stats[0] || {
              totalAmount: 0,
              totalNetAmount: 0,
              totalAdminFee: 0,
              donationCount: 0
            },
            paymentRequestCount: paymentRequests
          };
        })
      );

      const meta = ResponseUtils.createPaginationMeta(total, Number(page), Number(limit));

      res.json(ResponseUtils.success(
        'Admin projects retrieved successfully',
        projectsWithStats,
        meta
      ));

    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/admin/projects/:id/status
   * Update project status (admin only)
   */
  async updateProjectStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;

      if (!ValidationUtils.isValidObjectId(id)) {
        res.status(400).json(ResponseUtils.error('Invalid project ID'));
        return;
      }

      if (!Object.values(ProjectStatus).includes(status)) {
        res.status(400).json(ResponseUtils.error('Invalid project status'));
        return;
      }

      const project = await Project.findById(id);
      
      if (!project) {
        res.status(404).json(ResponseUtils.error('Project not found'));
        return;
      }

      const oldStatus = project.status;
      project.status = status;

      if (reason) {
        const update = {
          title: `Status Update: ${oldStatus} → ${status}`,
          content: `Admin updated project status. Reason: ${reason}`,
          createdAt: new Date()
        };
        project.updates.push(update);
      }

      await project.save();

      res.json(ResponseUtils.success(
        'Project status updated successfully',
        {
          id: project._id,
          oldStatus,
          newStatus: status,
          updatedAt: new Date()
        }
      ));

    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/donations
   * Get all donations for admin review
   */
  async getDonations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        projectId,
        minAmount,
        maxAmount,
        flagged = false,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const query: any = {};
      
      if (status) {
        query.paymentStatus = status;
      }

      if (projectId) {
        if (!ValidationUtils.isValidObjectId(projectId as string)) {
          res.status(400).json(ResponseUtils.error('Invalid project ID'));
          return;
        }
        query.project = projectId;
      }

      if (minAmount || maxAmount) {
        query.amount = {};
        if (minAmount) query.amount.$gte = Number(minAmount);
        if (maxAmount) query.amount.$lte = Number(maxAmount);
      }

      const sortObj: any = {};
      sortObj[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

      const skip = (Number(page) - 1) * Number(limit);
      const [donations, total] = await Promise.all([
        Donation.find(query)
          .populate('project', 'title slug creator')
          .sort(sortObj)
          .skip(skip)
          .limit(Number(limit)),
        Donation.countDocuments(query)
      ]);

      const meta = ResponseUtils.createPaginationMeta(total, Number(page), Number(limit));

      res.json(ResponseUtils.success(
        'Admin donations retrieved successfully',
        donations,
        meta
      ));

    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/analytics
   * Get detailed analytics for admin
   */
  async getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { period = '30', groupBy = 'day' } = req.query;
      const days = Number(period);
      const startDate = DateUtils.addDays(new Date(), -days);
      const endDate = new Date();

      // Helper functions
      const getDonationTrends = async (start: Date, end: Date, group: string) => {
        const groupId: any = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };

        if (group === 'day') {
          groupId.day = { $dayOfMonth: '$createdAt' };
        } else if (group === 'week') {
          groupId.week = { $week: '$createdAt' };
        }

        return await Donation.aggregate([
          {
            $match: {
              createdAt: { $gte: start, $lte: end },
              paymentStatus: 'success'
            }
          },
          {
            $group: {
              _id: groupId,
              totalAmount: { $sum: '$amount' },
              count: { $sum: 1 },
              averageAmount: { $avg: '$amount' }
            }
          },
          {
            $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 }
          }
        ]);
      };

      const getProjectAnalytics = async (start: Date, end: Date) => {
        return await Project.aggregate([
          {
            $match: {
              createdAt: { $gte: start, $lte: end }
            }
          },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              totalTargetAmount: { $sum: '$targetAmount' },
              totalCurrentAmount: { $sum: '$currentAmount' }
            }
          }
        ]);
      };

      const getRevenueAnalytics = async (start: Date, end: Date) => {
        return await Donation.aggregate([
          {
            $match: {
              createdAt: { $gte: start, $lte: end },
              paymentStatus: 'success'
            }
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$amount' },
              totalAdminFees: { $sum: '$adminFee' },
              totalNetAmount: { $sum: '$netAmount' },
              averageDonation: { $avg: '$amount' }
            }
          }
        ]);
      };

      const getTopCategories = async (start: Date, end: Date) => {
        return await Donation.aggregate([
          {
            $match: {
              createdAt: { $gte: start, $lte: end },
              paymentStatus: 'success'
            }
          },
          {
            $lookup: {
              from: 'projects',
              localField: 'project',
              foreignField: '_id',
              as: 'projectInfo'
            }
          },
          {
            $unwind: '$projectInfo'
          },
          {
            $group: {
              _id: '$projectInfo.category',
              totalAmount: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          },
          {
            $sort: { totalAmount: -1 }
          }
        ]);
      };

      const getTopProjectsByRevenue = async (start: Date, end: Date, limit: number) => {
        return await Donation.aggregate([
          {
            $match: {
              createdAt: { $gte: start, $lte: end },
              paymentStatus: 'success'
            }
          },
          {
            $group: {
              _id: '$project',
              totalAmount: { $sum: '$amount' },
              donationCount: { $sum: 1 }
            }
          },
          {
            $lookup: {
              from: 'projects',
              localField: '_id',
              foreignField: '_id',
              as: 'projectInfo'
            }
          },
          {
            $unwind: '$projectInfo'
          },
          {
            $project: {
              title: '$projectInfo.title',
              slug: '$projectInfo.slug',
              category: '$projectInfo.category',
              totalAmount: 1,
              donationCount: 1
            }
          },
          {
            $sort: { totalAmount: -1 }
          },
          {
            $limit: limit
          }
        ]);
      };

      const getUserGrowthStats = async (start: Date, end: Date) => {
        const [newUsers, totalUsers] = await Promise.all([
          User.countDocuments({
            createdAt: { $gte: start, $lte: end }
          }),
          User.countDocuments()
        ]);

        return {
          newUsers,
          totalUsers,
          activeUsers: 0
        };
      };

      const [
        donationTrends,
        projectStats,
        revenueStats,
        topCategories,
        topProjects,
        userGrowth
      ] = await Promise.all([
        getDonationTrends(startDate, endDate, groupBy as string),
        getProjectAnalytics(startDate, endDate),
        getRevenueAnalytics(startDate, endDate),
        getTopCategories(startDate, endDate),
        getTopProjectsByRevenue(startDate, endDate, 10),
        getUserGrowthStats(startDate, endDate)
      ]);

      const analytics = {
        period: {
          days,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          groupBy
        },
        donationTrends,
        projectStats,
        revenueStats,
        topCategories,
        topProjects,
        userGrowth
      };

      res.json(ResponseUtils.success(
        'Admin analytics retrieved successfully',
        analytics
      ));

    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/reports/financial
   * Generate financial report
   */
  async getFinancialReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate, format = 'json' } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json(ResponseUtils.error(
          'Start date and end date are required'
        ));
        return;
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      const [
        paymentRequestStats,
        donationStats
      ] = await Promise.all([
        PaymentRequest.aggregate([
          {
            $match: {
              createdAt: { $gte: start, $lte: end }
            }
          },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              totalRequested: { $sum: '$requestedAmount' },
              totalAdminFees: { $sum: '$adminFee' },
              totalNetAmount: { $sum: '$netAmount' }
            }
          }
        ]),
        Donation.aggregate([
          {
            $match: {
              createdAt: { $gte: start, $lte: end },
              paymentStatus: 'success'
            }
          },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: '$amount' },
              totalNetAmount: { $sum: '$netAmount' },
              totalAdminFee: { $sum: '$adminFee' },
              donationCount: { $sum: 1 }
            }
          }
        ])
      ]);

      const report = {
        period: {
          startDate: start.toISOString(),
          endDate: end.toISOString()
        },
        donations: donationStats[0] || {
          totalAmount: 0,
          totalNetAmount: 0,
          totalAdminFee: 0,
          donationCount: 0
        },
        paymentRequests: {
          byStatus: paymentRequestStats,
          totalCount: paymentRequestStats.reduce((sum, stat) => sum + stat.count, 0),
          totalRequested: paymentRequestStats.reduce((sum, stat) => sum + stat.totalRequested, 0)
        },
        generatedAt: new Date().toISOString()
      };

      if (format === 'csv') {
        res.status(501).json(ResponseUtils.error(
          'CSV format not implemented yet'
        ));
        return;
      }

      res.json(ResponseUtils.success(
        'Financial report generated successfully',
        report
      ));

    } catch (error) {
      next(error);
    }
  }

  /**
 * DELETE /api/admin/users/:userId
 * Permanently delete a user
 */
/**
 * DELETE /api/admin/users/:userId
 * Permanently delete a user
 */
async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.params;

    if (!ValidationUtils.isValidObjectId(userId)) {
      res.status(400).json(ResponseUtils.error('Invalid user ID'));
      return;
    }

    const user = await User.findById(userId);
    
    if (!user) {
      res.status(404).json(ResponseUtils.error('User not found'));
      return;
    }

    // Prevent deleting admins
    if (user.role === 'admin') {
      res.status(403).json(ResponseUtils.error('Cannot delete admin users'));
      return;
    }

    // Optional: Check if user has created projects
    const projectCount = await Project.countDocuments({ creator: userId });

    if (projectCount > 0) {
      res.status(400).json(
        ResponseUtils.error(
          `Cannot delete user with ${projectCount} active projects. Please delete or reassign projects first.`
        )
      );
      return;
    }

    // Permanently delete user
    await User.findByIdAndDelete(userId);

    res.json(ResponseUtils.success('User deleted permanently'));
  } catch (error) {
    next(error);
  }
}
}

export default new AdminController();