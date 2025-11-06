import { Request, Response, NextFunction } from "express";
import Project from "../models/Project";
import Donation from "../models/Donation";
import {
  IProject,
  ProjectStatus,
  ProjectCategory,
  IPagination,
  PaymentStatus,
} from "../types";
import {
  ResponseUtils,
  StringUtils,
  DateUtils,
  ValidationUtils,
  ErrorUtils,
} from "../utils";
import User from "../models/User";

class ProjectController {
  /**
   * GET /api/projects
   * Get all projects with filtering, pagination, and sorting
   */

  async getProjects(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const {
        page = 1,
        limit = 12,
        category,
        status = ProjectStatus.ACTIVE,
        division,
        search,
        sort = "createdAt",
        sortOrder = "desc",
        featured = false,
      } = req.query;

      // Build query
      const query: any = {};

      // Status filter
      if (status) {
        query.status = status;
        query.isActive = true;
      }

      // Category filter
      if (
        category &&
        Object.values(ProjectCategory).includes(category as ProjectCategory)
      ) {
        query.category = category;
      }

      // Location filter
      if (division) {
        query["location.division"] = division;
      }

      // Search filter
      if (search) {
        query.$text = { $search: search as string };
      }

      // Date range for active projects
      if (status === ProjectStatus.ACTIVE) {
        const now = new Date();
        query.startDate = { $lte: now };
        query.endDate = { $gte: now };
      }

      // Build sort object
      const sortObj: any = {};
      if (search) {
        sortObj.score = { $meta: "textScore" };
      }
      sortObj[sort as string] = sortOrder === "desc" ? -1 : 1;

      // Execute query with pagination
      const skip = (Number(page) - 1) * Number(limit);
      const [projects, total] = await Promise.all([
        Project.find(query)
          .sort(sortObj)
          .skip(skip)
          .limit(Number(limit))
          .select("-__v"),
        Project.countDocuments(query),
      ]);

      // Add funding stats to each project
      const projectIds = projects.map((p) => p._id);

      // Get stats for all projects in one query
      const allStats = await Donation.aggregate([
        {
          $match: {
            project: { $in: projectIds },
            paymentStatus: PaymentStatus.SUCCESS,
          },
        },
        {
          $group: {
            _id: "$project",
            totalAmount: { $sum: "$amount" },
            totalNetAmount: { $sum: "$netAmount" },
            totalAdminFee: { $sum: "$adminFee" },
            donationCount: { $sum: 1 },
          },
        },
      ]);

      // Create a map for easy lookup
      const statsMap = new Map();
      allStats.forEach((stat) => {
        statsMap.set(stat._id.toString(), stat);
      });

      // Add stats to projects
      const projectsWithStats = projects.map((project) => {
        const stats = statsMap.get(project._id.toString()) || {
          totalAmount: 0,
          totalNetAmount: 0,
          totalAdminFee: 0,
          donationCount: 0,
        };

        return {
          ...project.toObject(),
          stats,
        };
      });

      const meta = ResponseUtils.createPaginationMeta(
        total,
        Number(page),
        Number(limit)
      );

      res.json(
        ResponseUtils.success(
          "Projects retrieved successfully",
          projectsWithStats,
          meta
        )
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/projects/trending
   * Get trending projects
   */

  async getTrendingProjects(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { limit = 6 } = req.query;

      const projects = await Project.find({
        status: ProjectStatus.ACTIVE,
        isActive: true,
      })
        .sort({ backerCount: -1, currentAmount: -1 }) // Sort by popularity metrics
        .limit(Number(limit))
        .select("-__v");

      res.json(
        ResponseUtils.success(
          "Trending projects retrieved successfully",
          projects
        )
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/projects/categories
   * Get projects grouped by category
   */

  async getProjectsByCategory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const categories = Object.values(ProjectCategory);
      const result: Record<string, any[]> = {};

      for (const category of categories) {
        const projects = await Project.find({
          category: category,
          status: ProjectStatus.ACTIVE,
          isActive: true,
        })
          .limit(6)
          .select("-__v");
        result[category] = projects;
      }

      res.json(
        ResponseUtils.success(
          "Projects by category retrieved successfully",
          result
        )
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/projects/:slug
   * Get single project by slug with full details
   */

  async getProject(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { slug } = req.params;

      const project = await Project.findOne({
        slug,
        isActive: true,
      }).select("-__v");

      if (!project) {
        res.status(404).json(ResponseUtils.error("Project not found", [], 404));
        return;
      }

      // Get donation statistics
      const [donationStats, recentDonations] = await Promise.all([
        Donation.aggregate([
          {
            $match: {
              project: project._id,
              paymentStatus: PaymentStatus.SUCCESS,
            },
          },
          {
            $group: {
              _id: "$project",
              totalAmount: { $sum: "$amount" },
              totalNetAmount: { $sum: "$netAmount" },
              totalAdminFee: { $sum: "$adminFee" },
              donationCount: { $sum: 1 },
            },
          },
        ]),
        Donation.find({
          project: project._id,
          paymentStatus: "success",
        })
          .sort({ createdAt: -1 })
          .limit(10)
          .select("amount donorDisplayName message createdAt isAnonymous"),
      ]);

      const projectWithStats = {
        ...project.toObject(),
        stats: donationStats[0] || {
          totalAmount: 0,
          totalNetAmount: 0,
          totalAdminFee: 0,
          donationCount: 0,
        },
        recentDonations,
      };

      res.json(
        ResponseUtils.success(
          "Project retrieved successfully",
          projectWithStats
        )
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/projects
   * Create new project (requires authentication)
   */

  async createProject(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // TODO: Get creator ID from authentication middleware
      // const creatorId = req.user?.id;
      const cognitoId = req.user?.id;
      if (!cognitoId) {
        res.status(401).json(ResponseUtils.error("Authentication required"));
        return;
      }

      // Get the MongoDB ObjectId for the creator
      const user = await User.findOne({ cognitoId });
      if (!user) {
        res.status(404).json(ResponseUtils.error("User not found"));
        return;
      }

      const projectData = {
        ...req.body,
        creator: user._id,
        slug: StringUtils.generateSlug(req.body.title),
        status: "active",
      };

      // Validate dates
      if (new Date(projectData.endDate) <= new Date(projectData.startDate)) {
        res
          .status(400)
          .json(ResponseUtils.error("End date must be after start date"));
        return;
      }

      // Ensure unique slug
      let baseSlug = projectData.slug;
      let counter = 1;
      while (await Project.findOne({ slug: projectData.slug })) {
        projectData.slug = `${baseSlug}-${counter}`;
        counter++;
      }

      const project = new Project(projectData);
      await project.save();

      res
        .status(201)
        .json(ResponseUtils.success("Project created successfully", project));
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/projects/:id
   * Update project (requires authentication and ownership)
   */

  async updateProject(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      // TODO: Get creator ID from authentication middleware
      // const creatorId = req.user?.id;

      if (!ValidationUtils.isValidObjectId(id)) {
        res.status(400).json(ResponseUtils.error("Invalid project ID"));
        return;
      }

      const project = await Project.findById(id);

      if (!project) {
        res.status(404).json(ResponseUtils.error("Project not found"));
        return;
      }

      // TODO: Check ownership
      // if (project.creator !== creatorId) {
      //   res.status(403).json(ResponseUtils.error('Access denied'));
      //   return;
      // }

      // Don't allow updates to funded projects
      if (project.status === ProjectStatus.FUNDED) {
        res
          .status(400)
          .json(ResponseUtils.error("Cannot update funded projects"));
        return;
      }

      // Update slug if title changed
      if (req.body.title && req.body.title !== project.title) {
        req.body.slug = StringUtils.generateSlug(req.body.title);
      }

      const updatedProject = await Project.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
      });

      res.json(
        ResponseUtils.success("Project updated successfully", updatedProject)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/projects/:id
   * Delete/deactivate project (requires authentication and ownership)
   */

async deleteProject(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    if (!ValidationUtils.isValidObjectId(id)) {
      res.status(400).json(ResponseUtils.error("Invalid project ID"));
      return;
    }

    const project = await Project.findById(id);

    if (!project) {
      res.status(404).json(ResponseUtils.error("Project not found"));
      return;
    }

    // ✅ ALWAYS PERMANENTLY DELETE - No soft delete anymore
    await Project.findByIdAndDelete(id);

    res.json(
      ResponseUtils.success("Project deleted permanently", {
        deletedId: id,
      })
    );
  } catch (error) {
    next(error);
  }
}

  /**
   * POST /api/projects/:id/updates
   * Add project update (requires authentication and ownership)
   */
  async addProjectUpdate(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { title, content, images } = req.body;

      if (!ValidationUtils.isValidObjectId(id)) {
        res.status(400).json(ResponseUtils.error("Invalid project ID"));
        return;
      }

      const project = await Project.findById(id);

      if (!project) {
        res.status(404).json(ResponseUtils.error("Project not found"));
        return;
      }

      const update = {
        title,
        content,
        images: images || [],
        createdAt: new Date(),
      };

      project.updates.push(update);
      await project.save();

      res
        .status(201)
        .json(
          ResponseUtils.success("Project update added successfully", update)
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/projects/:id/updates
   * Get project updates
   */
  async getProjectUpdates(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      if (!ValidationUtils.isValidObjectId(id)) {
        res.status(400).json(ResponseUtils.error("Invalid project ID"));
        return;
      }

      const project = await Project.findById(id).select("updates");

      if (!project) {
        res.status(404).json(ResponseUtils.error("Project not found"));
        return;
      }

      const updates = project.updates.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );

      res.json(
        ResponseUtils.success("Project updates retrieved successfully", updates)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/projects/:id/stats
   * Get detailed project statistics
   */

  async getProjectStats(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      if (!ValidationUtils.isValidObjectId(id)) {
        res.status(400).json(ResponseUtils.error("Invalid project ID"));
        return;
      }

      const project = await Project.findById(id);

      if (!project) {
        res.status(404).json(ResponseUtils.error("Project not found"));
        return;
      }

      // Get comprehensive statistics
      const [totalStats, dailyStats, rewardStats] = await Promise.all([
        Donation.aggregate([
          {
            $match: {
              project: project._id,
              paymentStatus: PaymentStatus.SUCCESS,
            },
          },
          {
            $group: {
              _id: "$project",
              totalAmount: { $sum: "$amount" },
              totalNetAmount: { $sum: "$netAmount" },
              totalAdminFee: { $sum: "$adminFee" },
              donationCount: { $sum: 1 },
            },
          },
        ]),
        ProjectController.getDailyDonationStats(id),
        ProjectController.getRewardTierStats(id),
      ]);

      const stats = {
        project: {
          title: project.title,
          status: project.status,
          targetAmount: project.targetAmount,
          currentAmount: project.currentAmount,
          fundingProgress:
            project.targetAmount > 0
              ? (project.currentAmount / project.targetAmount) * 100
              : 0,
          daysRemaining: Math.max(
            0,
            Math.ceil(
              (new Date(project.endDate).getTime() - new Date().getTime()) /
                (1000 * 60 * 60 * 24)
            )
          ),
          backerCount: totalStats[0]?.donationCount || 0,
        },
        donations: totalStats[0] || {
          totalAmount: 0,
          totalNetAmount: 0,
          totalAdminFee: 0,
          donationCount: 0,
        },
        dailyTrend: dailyStats,
        rewardTiers: rewardStats,
      };

      res.json(
        ResponseUtils.success(
          "Project statistics retrieved successfully",
          stats
        )
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/projects/creator/:creatorId
   * Get projects by creator (requires authentication)
   */

  // REPLACE THE ENTIRE METHOD WITH:
  async getProjectsByCreator(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { creatorId } = req.params;
      const { page = 1, limit = 10, status } = req.query;

      // Handle both MongoDB ObjectId and Cognito ID
      let actualCreatorId;

      if (ValidationUtils.isValidObjectId(creatorId)) {
        actualCreatorId = creatorId;
      } else {
        const user = await User.findOne({ cognitoId: creatorId });
        if (!user) {
          res.status(404).json(ResponseUtils.error("Creator not found"));
          return;
        }
        actualCreatorId = user._id;
      }

      const query: any = { creator: actualCreatorId };
      if (status) {
        query.status = status;
      }

      const skip = (Number(page) - 1) * Number(limit);
      const [projects, total] = await Promise.all([
        Project.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        Project.countDocuments(query),
      ]);

      const meta = ResponseUtils.createPaginationMeta(
        total,
        Number(page),
        Number(limit)
      );

      res.json(
        ResponseUtils.success(
          "Creator projects retrieved successfully",
          projects,
          meta
        )
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Helper: Get daily donation statistics
   */
  private static async getDailyDonationStats(projectId: string) {
    const thirtyDaysAgo = DateUtils.addDays(new Date(), -30);

    return await Donation.aggregate([
      {
        $match: {
          project: projectId,
          paymentStatus: "success",
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          amount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
      },
    ]);
  }

  /**
   * Helper: Get reward tier statistics
   */

  private static async getRewardTierStats(projectId: string) {
    return await Donation.aggregate([
      {
        $match: {
          project: projectId,
          paymentStatus: "success",
          rewardTier: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$rewardTier",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);
  }
}

export default new ProjectController();
