import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ProjectCategory, ProjectStatus, PaymentStatus } from '../types';
import { ResponseUtils, ValidationUtils } from '../utils';

/**
 * Generic validation middleware factory
 */
const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      res.status(400).json(ResponseUtils.validationError(errors));
      return;
    }

    req.body = value;
    next();
  };
};

/**
 * Project validation schemas
 */
const projectCreateSchema = Joi.object({
  title: Joi.string()
    .min(5)
    .max(100)
    .required()
    .messages({
      'string.min': 'Title must be at least 5 characters long',
      'string.max': 'Title cannot exceed 100 characters',
      'any.required': 'Title is required'
    }),

  description: Joi.string()
    .min(50)
    .required()
    .messages({
      'string.min': 'Description must be at least 50 characters long',
      'any.required': 'Description is required'
    }),

  shortDescription: Joi.string()
    .max(200)
    .required()
    .messages({
      'string.max': 'Short description cannot exceed 200 characters',
      'any.required': 'Short description is required'
    }),

  category: Joi.string()
    .valid(...Object.values(ProjectCategory))
    .required()
    .messages({
      'any.only': 'Invalid category',
      'any.required': 'Category is required'
    }),

  targetAmount: Joi.number()
    .min(1000)
    .max(10000000)
    .required()
    .messages({
      'number.min': 'Target amount must be at least 1000 BDT',
      'number.max': 'Target amount cannot exceed 10,000,000 BDT',
      'any.required': 'Target amount is required'
    }),

  startDate: Joi.date()
    .iso()
    .required()
    .messages({
      'date.format': 'Start date must be in ISO format',
      'any.required': 'Start date is required'
    }),

  endDate: Joi.date()
    .iso()
    .greater(Joi.ref('startDate'))
    .required()
    .messages({
      'date.format': 'End date must be in ISO format',
      'date.greater': 'End date must be after start date',
      'any.required': 'End date is required'
    }),

  location: Joi.object({
    district: Joi.string().required(),
    division: Joi.string().required()
  }).required(),

  story: Joi.string()
    .min(100)
    .required()
    .messages({
      'string.min': 'Story must be at least 100 characters long',
      'any.required': 'Story is required'
    }),

  risks: Joi.string()
    .min(50)
    .required()
    .messages({
      'string.min': 'Risks description must be at least 50 characters long',
      'any.required': 'Risks description is required'
    }),

  images: Joi.array()
    .items(Joi.string().uri())
    .max(10)
    .default([]),

  videoUrl: Joi.string()
    .uri()
    .optional(),

  rewardTiers: Joi.array()
    .items(Joi.object({
      title: Joi.string().max(100).required(),
      description: Joi.string().max(500).required(),
      minimumAmount: Joi.number().min(10).required(),
      maxBackers: Joi.number().min(1).optional(),
      estimatedDelivery: Joi.date().iso().required(),
      items: Joi.array().items(Joi.string().max(200)).default([])
    }))
    .max(20)
    .default([]),

  tags: Joi.array()
    .items(Joi.string().max(30))
    .max(10)
    .default([])
});

const projectUpdateSchema = projectCreateSchema.fork([
  'title', 'description', 'shortDescription', 'category', 
  'targetAmount', 'startDate', 'endDate', 'location', 
  'story', 'risks'
], (schema) => schema.optional());

/**
 * Payment validation schemas
 */
const paymentInitiateSchema = Joi.object({
  projectId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid project ID format',
      'any.required': 'Project ID is required'
    }),

  amount: Joi.number()
    .min(10)
    .max(500000)
    .required()
    .messages({
      'number.min': 'Minimum donation amount is 10 BDT',
      'number.max': 'Maximum donation amount is 500,000 BDT',
      'any.required': 'Amount is required'
    }),

  rewardTierId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Invalid reward tier ID format'
    }),

  customerName: Joi.string()
    .max(100)
    .required()
    .messages({
      'string.max': 'Name cannot exceed 100 characters',
      'any.required': 'Customer name is required'
    }),

  customerEmail: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Invalid email format',
      'any.required': 'Customer email is required'
    }),

  customerPhone: Joi.string()
    .pattern(/^(\+880|880|0)?1[3-9]\d{8}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Invalid Bangladeshi phone number'
    }),

  customerAddress: Joi.string()
    .max(200)
    .optional(),

  isAnonymous: Joi.boolean()
    .default(false),

  message: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Message cannot exceed 500 characters'
    })
});

/**
 * Donation validation schemas
 */
const donationMessageSchema = Joi.object({
  message: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Message cannot exceed 500 characters'
    })
});

/**
 * Admin validation schemas
 */
const paymentRequestApprovalSchema = Joi.object({
  notes: Joi.string()
    .max(1000)
    .optional()
    .messages({
      'string.max': 'Notes cannot exceed 1000 characters'
    })
});

const paymentRequestRejectionSchema = Joi.object({
  reason: Joi.string()
    .min(10)
    .max(1000)
    .required()
    .messages({
      'string.min': 'Rejection reason must be at least 10 characters',
      'string.max': 'Rejection reason cannot exceed 1000 characters',
      'any.required': 'Rejection reason is required'
    })
});

const projectStatusUpdateSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(ProjectStatus))
    .required()
    .messages({
      'any.only': 'Invalid project status',
      'any.required': 'Status is required'
    }),

  reason: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Reason cannot exceed 500 characters'
    })
});

/**
 * Upload validation schemas
 */
const presignedUrlSchema = Joi.object({
  fileName: Joi.string()
    .max(255)
    .required()
    .messages({
      'string.max': 'File name cannot exceed 255 characters',
      'any.required': 'File name is required'
    }),

  fileType: Joi.string()
    .valid(
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'application/pdf', 'text/plain'
    )
    .required()
    .messages({
      'any.only': 'Invalid file type',
      'any.required': 'File type is required'
    }),

  folder: Joi.string()
    .max(50)
    .default('uploads'),

  expiresIn: Joi.number()
    .min(60)
    .max(86400)
    .default(3600)
    .messages({
      'number.min': 'Expiration time must be at least 60 seconds',
      'number.max': 'Expiration time cannot exceed 24 hours'
    })
});

/**
 * Query parameter validation middleware
 */
const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: false // Keep unknown query parameters
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      res.status(400).json(ResponseUtils.validationError(errors));
      return;
    }

    req.query = value;
    next();
  };
};

/**
 * Pagination query schema
 */
const paginationSchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(20),
  sort: Joi.string().optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  search: Joi.string().max(100).optional()
});

// Export validation middleware functions
export const validateProjectCreate = validate(projectCreateSchema);
export const validateProjectUpdate = validate(projectUpdateSchema);
export const validatePaymentInitiate = validate(paymentInitiateSchema);
export const validateDonationMessage = validate(donationMessageSchema);
export const validatePaymentRequestApproval = validate(paymentRequestApprovalSchema);
export const validatePaymentRequestRejection = validate(paymentRequestRejectionSchema);
export const validateProjectStatusUpdate = validate(projectStatusUpdateSchema);
export const validatePresignedUrl = validate(presignedUrlSchema);
export const validatePagination = validateQuery(paginationSchema);

/**
 * MongoDB ObjectId validation middleware
 */
export const validateObjectId = (paramName: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const id = req.params[paramName];
    
    if (!ValidationUtils.isValidObjectId(id)) {
      res.status(400).json(ResponseUtils.error(`Invalid ${paramName} format`));
      return;
    }
    
    next();
  };
};

/**
 * Custom validation middleware for specific use cases
 */
export const validateFileUpload = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.file && !req.files) {
    res.status(400).json(ResponseUtils.error('No file uploaded'));
    return;
  }

  next();
};

export const validateDateRange = (req: Request, res: Response, next: NextFunction): void => {
  const { startDate, endDate } = req.query;

  if (startDate && endDate) {
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json(ResponseUtils.error('Invalid date format'));
      return;
    }

    if (start >= end) {
      res.status(400).json(ResponseUtils.error('Start date must be before end date'));
      return;
    }

    // Limit date range to 1 year
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    if (end.getTime() - start.getTime() > oneYear) {
      res.status(400).json(ResponseUtils.error('Date range cannot exceed 1 year'));
      return;
    }
  }

  next();
};