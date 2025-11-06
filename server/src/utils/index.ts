import crypto from 'crypto';
import { IApiResponse, IValidationError } from '../types';

/**
 * Date/Time utilities
 */
export class DateUtils {
  /**
   * Format date for display
   */
  static formatDate(date: Date, format: 'short' | 'long' | 'datetime' = 'short'): string {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Dhaka'
    };

    switch (format) {
      case 'short':
        options.year = 'numeric';
        options.month = 'short';
        options.day = 'numeric';
        break;
      case 'long':
        options.year = 'numeric';
        options.month = 'long';
        options.day = 'numeric';
        options.weekday = 'long';
        break;
      case 'datetime':
        options.year = 'numeric';
        options.month = 'short';
        options.day = 'numeric';
        options.hour = '2-digit';
        options.minute = '2-digit';
        break;
    }

    return new Intl.DateTimeFormat('en-BD', options).format(date);
  }

  /**
   * Calculate days remaining
   */
  static getDaysRemaining(endDate: Date): number {
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  /**
   * Check if date is in the past
   */
  static isPast(date: Date): boolean {
    return date < new Date();
  }

  /**
   * Check if date is today
   */
  static isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  /**
   * Get time ago string
   */
  static getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

    return this.formatDate(date, 'short');
  }

  /**
   * Add days to date
   */
  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}

/**
 * String utilities
 */
export class StringUtils {
  /**
   * Generate slug from title
   */
  static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .substring(0, 50); // Limit length
  }

  /**
   * Truncate text with ellipsis
   */
  static truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Capitalize first letter
   */
  static capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  /**
   * Convert to title case
   */
  static toTitleCase(text: string): string {
    return text
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Clean and sanitize text
   */
  static sanitize(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single
      .replace(/[<>]/g, ''); // Remove potential HTML tags
  }

  /**
   * Generate random string
   */
  static generateRandomString(length: number = 8): string {
    return crypto.randomBytes(length).toString('hex').substring(0, length);
  }

  /**
   * Mask sensitive information (like phone numbers)
   */
  static maskPhone(phone: string): string {
    if (phone.length < 4) return phone;
    const visible = phone.slice(-4);
    const masked = '*'.repeat(phone.length - 4);
    return masked + visible;
  }

  /**
   * Mask email address
   */
  static maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!domain) return email;
    
    const maskedLocal = local.length > 2 
      ? local[0] + '*'.repeat(local.length - 2) + local.slice(-1)
      : local;
    
    return `${maskedLocal}@${domain}`;
  }
}

/**
 * Currency formatting utilities
 */
export class CurrencyUtils {
  /**
   * Format amount in BDT currency
   */
  static formatBDT(amount: number): string {
    return `৳${amount.toLocaleString('en-BD')}`;
  }

  /**
   * Format amount for display with proper decimals
   */
  static formatAmount(amount: number, decimals: number = 2): string {
    return amount.toFixed(decimals);
  }

  /**
   * Parse amount from string, handling commas
   */
  static parseAmount(amountStr: string): number {
    const cleaned = amountStr.replace(/[,৳\s]/g, '');
    return parseFloat(cleaned) || 0;
  }

  /**
   * Calculate percentage
   */
  static calculatePercentage(current: number, target: number): number {
    if (target === 0) return 0;
    return Math.round((current / target) * 100);
  }

  /**
   * Calculate admin fee (3%)
   */
  static calculateAdminFee(amount: number): number {
    return Math.round(amount * 0.03);
  }
}

/**
 * Security utilities
 */
export class SecurityUtils {
  /**
   * Generate secure hash
   */
  static generateHash(data: string, algorithm: string = 'sha256'): string {
    return crypto.createHash(algorithm).update(data).digest('hex');
  }

  /**
   * Generate HMAC
   */
  static generateHMAC(data: string, secret: string, algorithm: string = 'sha256'): string {
    return crypto.createHmac(algorithm, secret).update(data).digest('hex');
  }

  /**
   * Generate secure random token
   */
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Sanitize input to prevent XSS
   */
  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim();
  }

  /**
   * Rate limiting helper
   */
  static createRateLimitKey(identifier: string, action: string): string {
    return `rate_limit:${action}:${identifier}`;
  }

  /**
   * Mask sensitive data in logs
   */
  static maskSensitiveData(obj: any): any {
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    const masked = { ...obj };

    for (const field of sensitiveFields) {
      if (masked[field]) {
        masked[field] = '***masked***';
      }
    }

    return masked;
  }
}

/**
 * File utilities
 */
export class FileUtils {
  /**
   * Get file extension
   */
  static getExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Check if file is image
   */
  static isImage(mimetype: string): boolean {
    return mimetype.startsWith('image/');
  }

  /**
   * Check if file is video
   */
  static isVideo(mimetype: string): boolean {
    return mimetype.startsWith('video/');
  }

  /**
   * Format file size
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Generate unique filename
   */
  static generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const random = StringUtils.generateRandomString(6);
    const extension = this.getExtension(originalName);
    const baseName = originalName.replace(/\.[^/.]+$/, '').substring(0, 20);

    return `${timestamp}_${random}_${baseName}.${extension}`;
  }

  /**
   * Validate file type
   */
  static isAllowedFileType(mimetype: string): boolean {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'application/pdf',
      'text/plain'
    ];

    return allowedTypes.includes(mimetype);
  }
}

/**
 * Array utilities
 */
export class ArrayUtils {
  /**
   * Remove duplicates from array
   */
  static removeDuplicates<T>(array: T[]): T[] {
    return [...new Set(array)];
  }

  /**
   * Chunk array into smaller arrays
   */
  static chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Shuffle array
   */
  static shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Group array by key
   */
  static groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const groupKey = String(item[key]);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }
}

/**
 * Validation utilities
 */
export class ValidationUtils {
  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate Bangladeshi phone number
   */
  static isValidBDPhone(phone: string): boolean {
    const phoneRegex = /^(\+880|880|0)?1[3-9]\d{8}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Validate URL format
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate amount range
   */
  static isValidAmount(amount: number, min: number = 10, max: number = 1000000): boolean {
    return amount >= min && amount <= max;
  }

  /**
   * Validate ObjectId format (MongoDB)
   */
  static isValidObjectId(id: string): boolean {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    return objectIdRegex.test(id);
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length < 8) {
      feedback.push('Password must be at least 8 characters long');
    } else {
      score += 1;
    }

    if (!/[a-z]/.test(password)) {
      feedback.push('Password must contain at least one lowercase letter');
    } else {
      score += 1;
    }

    if (!/[A-Z]/.test(password)) {
      feedback.push('Password must contain at least one uppercase letter');
    } else {
      score += 1;
    }

    if (!/\d/.test(password)) {
      feedback.push('Password must contain at least one number');
    } else {
      score += 1;
    }

    if (!/[!@#$%^&*]/.test(password)) {
      feedback.push('Password must contain at least one special character');
    } else {
      score += 1;
    }

    return {
      isValid: feedback.length === 0,
      score,
      feedback
    };
  }
}

/**
 * Response utilities
 */
export class ResponseUtils {
  /**
   * Create success response
   */
  static success<T>(
    message: string,
    data?: T,
    meta?: any
  ): IApiResponse<T> {
    return {
      success: true,
      message,
      data,
      meta
    };
  }

  /**
   * Create error response
   */
  static error(
    message: string,
    errors?: any[],
    statusCode: number = 400
  ): IApiResponse {
    return {
      success: false,
      message,
      errors
    };
  }

  /**
   * Create validation error response
   */
  static validationError(errors: IValidationError[]): IApiResponse {
    return {
      success: false,
      message: 'Validation failed',
      errors
    };
  }

  /**
   * Create pagination meta
   */
  static createPaginationMeta(
    total: number,
    page: number,
    limit: number
  ): {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  } {
    const totalPages = Math.ceil(total / limit);

    return {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };
  }
}

/**
 * Error handling utilities
 */
export class ErrorUtils {
  /**
   * Create application error
   */
  static createError(
    message: string,
    statusCode: number = 500,
    code?: string
  ): Error & { statusCode: number; code?: string } {
    const error = new Error(message) as Error & { statusCode: number; code?: string };
    error.statusCode = statusCode;
    if (code) error.code = code;
    return error;
  }

  /**
   * Extract error message from various error types
   */
  static extractMessage(error: any): string {
    if (error.message) return error.message;
    if (typeof error === 'string') return error;
    if (error.errors) {
      // Handle validation errors
      if (Array.isArray(error.errors)) {
        return error.errors.map((e: any) => e.message || e).join(', ');
      }
      if (typeof error.errors === 'object') {
        return Object.values(error.errors).map((e: any) => e.message || e).join(', ');
      }
    }
    return 'An unknown error occurred';
  }

  /**
   * Check if error is operational (expected)
   */
  static isOperationalError(error: any): boolean {
    return error.isOperational === true || error.statusCode < 500;
  }
}

/**
 * Logging utilities
 */
export class LogUtils {
  /**
   * Create structured log entry
   */
  static createLogEntry(
    level: 'info' | 'warn' | 'error' | 'debug',
    message: string,
    meta?: any
  ): {
    timestamp: string;
    level: string;
    message: string;
    meta?: any;
  } {
    return {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      meta: meta ? SecurityUtils.maskSensitiveData(meta) : undefined
    };
  }

  /**
   * Log API request
   */
  static logRequest(
    method: string,
    url: string,
    statusCode: number,
    responseTime: number,
    userAgent?: string
  ): void {
    console.log(JSON.stringify({
      type: 'request',
      timestamp: new Date().toISOString(),
      method,
      url,
      statusCode,
      responseTime: `${responseTime}ms`,
      userAgent
    }));
  }
}

/**
 * Environment utilities
 */
export class EnvUtils {
  /**
   * Check if in production
   */
  static isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  /**
   * Check if in development
   */
  static isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  }

  /**
   * Check if in test
   */
  static isTest(): boolean {
    return process.env.NODE_ENV === 'test';
  }

  /**
   * Get required environment variable
   */
  static getRequiredEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Required environment variable ${key} is not set`);
    }
    return value;
  }

  /**
   * Get environment variable with default
   */
  static getEnv(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
  }
}

// Export commonly used functions directly
export const formatBDT = CurrencyUtils.formatBDT;
export const formatDate = DateUtils.formatDate;
export const generateSlug = StringUtils.generateSlug;
export const successResponse = ResponseUtils.success;
export const errorResponse = ResponseUtils.error;
export const validateEmail = ValidationUtils.isValidEmail;
export const sanitizeInput = SecurityUtils.sanitizeInput;