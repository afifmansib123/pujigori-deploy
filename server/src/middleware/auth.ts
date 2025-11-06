import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { ResponseUtils } from "../utils";

interface DecodedToken extends JwtPayload {
  sub: string;
  "custom:role"?: string;
  email?: string;
  username?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        email?: string;
        username?: string;
      };
    }
  }
}

/**
 * Role-based authentication middleware for AWS Cognito JWT tokens
 */
export const authMiddleware = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      res.status(401).json(ResponseUtils.error("Unauthorized - No token provided", [], 401));
      return;
    }

    try {
      const decoded = jwt.decode(token) as DecodedToken;

      if (!decoded || !decoded.sub) {
        res.status(401).json(ResponseUtils.error("Invalid token format", [], 401));
        return;
      }

      // For Google OAuth users, handle role assignment differently
      let userRole = decoded["custom:role"] || "user";
      
      // If this is a Google OAuth user (check token issuer or other OAuth indicators)
      const isOAuthUser = decoded.iss?.includes('cognito') && !decoded["custom:role"];
      if (isOAuthUser) {
        userRole = "user"; // Default OAuth users to 'user' role
      }

      req.user = {
        id: decoded.sub,
        role: userRole,
        email: decoded.email,
        username: decoded.username,
      };

      const hasAccess = allowedRoles.includes(userRole.toLowerCase());
      if (!hasAccess) {
        res.status(403).json(
          ResponseUtils.error(
            `Access Denied - Insufficient permissions. Required: ${allowedRoles.join(', ')}, Got: ${userRole}`,
            [],
            403
          )
        );
        return;
      }

      next();
    } catch (err) {
      console.error("Failed to decode token:", err);
      res.status(401).json(ResponseUtils.error("Invalid token", [], 401));
      return;
    }
  };
};
/**
 * Admin authentication middleware zw
 */
export const adminMiddleware = authMiddleware(["admin"]);

/**
 * Creator authentication middleware (for project creators)
 */
export const creatorMiddleware = authMiddleware(["creator", "admin"]);

/**
 * User authentication middleware (any authenticated user)
 */
export const userMiddleware = authMiddleware(["user", "creator", "admin"]);

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export const optionalAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    // No token provided, continue without user
    next();
    return;
  }

  try {
    const decoded = jwt.decode(token) as DecodedToken;

    if (decoded && decoded.sub) {
      const userRole = decoded["custom:role"] || "user";
      req.user = {
        id: decoded.sub,
        role: userRole,
        email: decoded.email,
        username: decoded.username,
      };
    }
  } catch (err) {
    // Invalid token, continue without user
    console.warn("Invalid token in optional auth:", err);
  }

  next();
};

/**
 * Resource ownership middleware
 */
export const ownershipMiddleware = (resourceParam: string = "id") => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res
        .status(401)
        .json(ResponseUtils.error("Authentication required", [], 401));
      return;
    }

    const resourceId = req.params[resourceParam];
    const userId = req.user.id;

    // Admin can access any resource
    if (req.user.role === "admin") {
      next();
      return;
    }

    // For project ownership, check creator field (implement based on your needs)
    // This is a placeholder - you'll need to implement actual ownership checking
    if (resourceId === userId) {
      next();
      return;
    }

    res
      .status(403)
      .json(
        ResponseUtils.error(
          "Access denied - You do not own this resource",
          [],
          403
        )
      );
  };
};
