import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from "../models/User"
import { ResponseUtils, ValidationUtils } from '../utils';

interface DecodedToken {
  sub: string;
  'custom:role'?: string;
  email?: string;
  username?: string;
}

// Add interface for error response data
interface ErrorResponseData {
  cognitoId: string;
  needsRegistration: boolean;
  tokenInfo: {
    role: string;
    email?: string;
    username?: string;
  };
}

class AuthController {
  /**
   * POST /api/auth/create-user
   * Create user in database after Cognito signup
   */
  async createUserInDatabase(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { cognitoId, name, email, phoneNumber, role } = req.body;

      // Validate required fields
      if (!cognitoId || !name || !email) {
        res.status(400).json(ResponseUtils.error(
          'Missing required fields: cognitoId, name, email'
        ));
        return;
      }

      // Validate email format
      if (!ValidationUtils.isValidEmail(email)) {
        res.status(400).json(ResponseUtils.error('Invalid email format'));
        return;
      }

      // Validate phone number if provided
      if (phoneNumber && !ValidationUtils.isValidBDPhone(phoneNumber)) {
        res.status(400).json(ResponseUtils.error('Invalid phone number format'));
        return;
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ cognitoId }, { email }]
      });

      if (existingUser) {
        res.status(409).json(ResponseUtils.error('User already exists'));
        return;
      }

      // Determine user role - default to 'user', allow 'creator' and 'admin'
      let userRole = 'user';
      if (role && ['user', 'creator', 'admin'].includes(role.toLowerCase())) {
        userRole = role.toLowerCase();
      }

      // Create user
      const user = new User({
        cognitoId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phoneNumber: phoneNumber?.trim() || '',
        role: userRole,
        isVerified: true, // Cognito handles verification
        avatar: '',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await user.save();

      // Return user data (exclude sensitive info)
      const userData = {
        _id: user._id,
        cognitoId: user.cognitoId,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        isVerified: user.isVerified,
        avatar: user.avatar,
        createdAt: user.createdAt
      };

      res.status(201).json(ResponseUtils.success(
        'User created successfully',
        userData
      ));

    } catch (error) {
      console.error('Create user error:', error);
      next(error);
    }
  }

  /**
   * GET /api/auth/verify-token
   * Verify JWT token and return user info
   */
  async verifyToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        res.status(401).json(ResponseUtils.error('No token provided'));
        return;
      }

      // Decode token (Cognito tokens are pre-verified)
      const decoded = jwt.decode(token) as DecodedToken;

      if (!decoded || !decoded.sub) {
        res.status(401).json(ResponseUtils.error('Invalid token'));
        return;
      }

      // Get user from database using cognitoId
      const user = await User.findOne({ cognitoId: decoded.sub });

      if (!user) {
        // User exists in Cognito but not in our database
        // Fix: Create properly typed error response data
        const errorData: ErrorResponseData = {
          cognitoId: decoded.sub,
          needsRegistration: true,
          tokenInfo: {
            role: decoded['custom:role'] || 'user',
            email: decoded.email,
            username: decoded.username
          }
        };

        res.status(404).json(ResponseUtils.error(
          'User not found in database. Please complete registration.',
          [errorData]
        ));
        return;
      }

      // Return user data with token info
      const userData = {
        _id: user._id,
        cognitoId: user.cognitoId,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        isVerified: user.isVerified,
        avatar: user.avatar,
        createdAt: user.createdAt,
        tokenInfo: {
          role: decoded['custom:role'] || user.role,
          email: decoded.email,
          username: decoded.username
        }
      };

      res.json(ResponseUtils.success(
        'Token verified successfully',
        userData
      ));

    } catch (error) {
      console.error('Token verification error:', error);
      next(error);
    }
  }

  /**
   * GET /api/auth/profile/:userId
   * Get user profile
   */

async getUserProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.params;
    
    console.log('getUserProfile called with userId:', userId);

    let user;
    
    // Always try both search methods for better reliability
    try {
      // First try by MongoDB ObjectId if it looks like one
      if (ValidationUtils.isValidObjectId(userId)) {
        console.log('Trying search by MongoDB ObjectId first');
        user = await User.findById(userId).select('-__v');
      }
      
      // If not found and not a valid ObjectId, or if ObjectId search failed, try cognitoId
      if (!user) {
        console.log('Searching by cognitoId');
        user = await User.findOne({ cognitoId: userId }).select('-__v');
      }
    } catch (searchError) {
      console.error('Search error:', searchError);
      // If search fails, try the other method
      if (!user) {
        console.log('Fallback: searching by cognitoId after error');
        user = await User.findOne({ cognitoId: userId }).select('-__v');
      }
    }

    if (!user) {
      console.log('User not found in database');
      res.status(404).json(ResponseUtils.error(
        'User not found in database. Please complete registration.',
        [{
          cognitoId: userId,
          needsRegistration: true,
          error: 'USER_NOT_IN_DB'
        }]
      ));
      return;
    }

    console.log('User found in database:', user._id);

    // Return public user data
    const userData = {
      _id: user._id,
      cognitoId: user.cognitoId,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      isVerified: user.isVerified,
      avatar: user.avatar,
      createdAt: user.createdAt
    };

    res.json(ResponseUtils.success(
      'User profile retrieved successfully',
      userData
    ));

  } catch (error) {
    console.error('getUserProfile error:', error);
    next(error);
  }
}
  /**
   * PUT /api/auth/profile/:userId
   * Update user profile (requires authentication)
   */
  async updateUserProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const { name, phoneNumber, avatar } = req.body;

      if (!ValidationUtils.isValidObjectId(userId)) {
        res.status(400).json(ResponseUtils.error('Invalid user ID'));
        return;
      }

      // Check if user owns this profile or is admin
      if (req.user?.id !== userId && req.user?.role !== 'admin') {
        res.status(403).json(ResponseUtils.error('Access denied'));
        return;
      }

      // Validate phone number if provided
      if (phoneNumber && !ValidationUtils.isValidBDPhone(phoneNumber)) {
        res.status(400).json(ResponseUtils.error('Invalid phone number format'));
        return;
      }

      // Update user
      const updateData: any = { updatedAt: new Date() };
      if (name) updateData.name = name.trim();
      if (phoneNumber) updateData.phoneNumber = phoneNumber.trim();
      if (avatar) updateData.avatar = avatar.trim();

      const user = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      ).select('-__v');

      if (!user) {
        res.status(404).json(ResponseUtils.error('User not found'));
        return;
      }

      res.json(ResponseUtils.success(
        'Profile updated successfully',
        user
      ));

    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/auth/profile/:userId
   * Delete user account (requires authentication)
   */
  async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;

      if (!ValidationUtils.isValidObjectId(userId)) {
        res.status(400).json(ResponseUtils.error('Invalid user ID'));
        return;
      }

      // Check if user owns this profile or is admin
      if (req.user?.id !== userId && req.user?.role !== 'admin') {
        res.status(403).json(ResponseUtils.error('Access denied'));
        return;
      }

      const user = await User.findByIdAndDelete(userId);

      if (!user) {
        res.status(404).json(ResponseUtils.error('User not found'));
        return;
      }

      res.json(ResponseUtils.success('User deleted successfully'));

    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/users
   * Get all users (admin only)
   */
  async getAllUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        page = 1,
        limit = 20,
        role,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Build query
      const query: any = {};
      if (role) {
        query.role = role;
      }
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      // Build sort
      const sortObj: any = {};
      sortObj[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

      const skip = (Number(page) - 1) * Number(limit);
      const [users, total] = await Promise.all([
        User.find(query)
          .sort(sortObj)
          .skip(skip)
          .limit(Number(limit))
          .select('-__v'),
        User.countDocuments(query)
      ]);

      const meta = ResponseUtils.createPaginationMeta(total, Number(page), Number(limit));

      res.json(ResponseUtils.success(
        'Users retrieved successfully',
        users,
        meta
      ));

    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/auth/users/:userId/role
   * Update user role (admin only)
   */
  async updateUserRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      if (!ValidationUtils.isValidObjectId(userId)) {
        res.status(400).json(ResponseUtils.error('Invalid user ID'));
        return;
      }

      if (!role || !['user', 'creator', 'admin'].includes(role.toLowerCase())) {
        res.status(400).json(ResponseUtils.error('Invalid role. Must be: user, creator, or admin'));
        return;
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { 
          role: role.toLowerCase(),
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      ).select('-__v');

      if (!user) {
        res.status(404).json(ResponseUtils.error('User not found'));
        return;
      }

      res.json(ResponseUtils.success(
        'User role updated successfully',
        user
      ));

    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();