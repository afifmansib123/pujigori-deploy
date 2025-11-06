import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { IApiResponse, IErrorResponse } from './types';
import { ResponseUtils, LogUtils, ErrorUtils, EnvUtils } from './utils';

// Import route handlers
import apiRoutes from "./routes"

class App {
  public app: Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '5000', 10);

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  /**
   * Initialize middleware
   */
  private initializeMiddlewares(): void {
    // Trust proxy (for deployment behind reverse proxy)
    this.app.set('trust proxy', 1);

    // Security middleware
    this.app.use(helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false // Disable CSP for API
    }));

    // CORS configuration
    this.app.use(cors({
      origin: this.getAllowedOrigins(),
      credentials: true,
      optionsSuccessStatus: 200,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'Cache-Control',
        'Pragma'
      ]
    }));

    // Compression middleware
    this.app.use(compression());

    // Body parsing middleware
    this.app.use(express.json({ 
      limit: '10mb',
      verify: (req: any, res, buf) => {
        // Store raw body for webhook verification
        if (req.originalUrl?.includes('/webhook')) {
          req.rawBody = buf;
        }
      }
    }));
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: '10mb' 
    }));

    // Logging middleware
    if (EnvUtils.isDevelopment()) {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined', {
        stream: {
          write: (message: string) => {
            LogUtils.logRequest(
              'HTTP',
              message.trim(),
              200,
              0
            );
          }
        }
      }));
    }

    // Custom request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        LogUtils.logRequest(
          req.method,
          req.originalUrl,
          res.statusCode,
          responseTime,
          req.get('User-Agent')
        );
      });

      next();
    });

    // Request ID middleware
    this.app.use((req: any, res: Response, next: NextFunction) => {
      req.requestId = require('crypto').randomBytes(16).toString('hex');
      res.set('X-Request-ID', req.requestId);
      next();
    });

    // Rate limiting would go here (implement with express-rate-limit if needed)
    // this.app.use('/api/', rateLimitMiddleware);
  }

  /**
   * Initialize routes
   */
  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/health', this.healthCheck);
    this.app.get('/api/health', this.healthCheck);

    // API version endpoint
    this.app.get('/api/version', this.getVersion);

    // Root endpoint
    this.app.get('/', (req: Request, res: Response) => {
      res.json(ResponseUtils.success(
        'PujiGori Crowdfunding API',
        {
          version: '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          timestamp: new Date().toISOString(),
          endpoints: [
            '/api/health',
            '/api/version',
            '/api/projects',
            '/api/donations',
            '/api/payments',
            '/api/admin',
            '/api/upload'
          ]
        }
      ));
    });

    // API routes
    this.app.use('/api', apiRoutes);

    // 404 handler for unmatched routes
    this.app.use('*', this.notFoundHandler);
  }

  /**
   * Initialize error handling
   */
  private initializeErrorHandling(): void {
    // Global error handler
    this.app.use(this.globalErrorHandler);
  }

  /**
   * Health check endpoint
   */
  private async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      // Import database here to avoid circular dependency
      const Database = await import('./config/database');
      const db = Database.default;
      
      const dbHealth = await db.healthCheck();
      
      // Import S3 service
      const S3Service = await import('./services/S3Service');
      const s3Health = await S3Service.default.healthCheck();

      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0',
        services: {
          database: {
            status: dbHealth.status,
            connected: dbHealth.status === 'connected',
            database: dbHealth.database,
            host: dbHealth.host,
            collections: dbHealth.collections
          },
          storage: {
            status: s3Health.status,
            bucketExists: s3Health.bucketExists,
            canWrite: s3Health.canWrite,
            region: s3Health.region
          },
          memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            external: Math.round(process.memoryUsage().external / 1024 / 1024)
          }
        }
      };

      const overallHealthy = 
        dbHealth.status === 'connected' && 
        s3Health.status === 'healthy';

      if (overallHealthy) {
        res.status(200).json(ResponseUtils.success('Service is healthy', health));
      } else {
        res.status(503).json(ResponseUtils.error('Service is unhealthy', [], 503));
      }

    } catch (error) {
      res.status(503).json(ResponseUtils.error(
        'Health check failed',
        [ErrorUtils.extractMessage(error)],
        503
      ));
    }
  }

  /**
   * Version endpoint
   */
  private getVersion(req: Request, res: Response): void {
    const version = {
      version: '1.0.0',
      apiVersion: 'v1',
      buildDate: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      features: [
        'Project Management',
        'Payment Processing',
        'Donation Tracking',
        'Reward System',
        'QR Code Generation',
        'File Upload',
        'Admin Panel'
      ]
    };

    res.json(ResponseUtils.success('API Version Information', version));
  }

  /**
   * 404 handler
   */
  private notFoundHandler(req: Request, res: Response): void {
    res.status(404).json(ResponseUtils.error(
      `Route ${req.method} ${req.originalUrl} not found`,
      [],
      404
    ));
  }

  /**
   * Global error handler
   */
  private globalErrorHandler(
    error: any,
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    // Log the error
    console.error('Global error handler:', {
      error: error.message,
      stack: EnvUtils.isDevelopment() ? error.stack : undefined,
      url: req.originalUrl,
      method: req.method,
      requestId: (req as any).requestId,
      timestamp: new Date().toISOString()
    });

    // Default error response
    let statusCode = error.statusCode || 500;
    let message = error.message || 'Internal server error';
    let errors: any[] = [];

    // Handle specific error types
    if (error.name === 'ValidationError') {
      // Mongoose validation error
      statusCode = 400;
      message = 'Validation failed';
      errors = Object.values(error.errors).map((err: any) => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
    } else if (error.name === 'CastError') {
      // MongoDB cast error
      statusCode = 400;
      message = 'Invalid ID format';
    } else if (error.code === 11000) {
      // MongoDB duplicate key error
      statusCode = 409;
      message = 'Duplicate entry found';
      const field = Object.keys(error.keyPattern || {})[0];
      if (field) {
        errors = [{ field, message: `${field} already exists` }];
      }
    } else if (error.name === 'JsonWebTokenError') {
      // JWT error
      statusCode = 401;
      message = 'Invalid authentication token';
    } else if (error.name === 'TokenExpiredError') {
      // JWT expired error
      statusCode = 401;
      message = 'Authentication token has expired';
    } else if (error.name === 'MulterError') {
      // File upload error
      statusCode = 400;
      message = `File upload error: ${error.message}`;
    }

    // Create error response
    const errorResponse: IErrorResponse = {
      message,
      statusCode,
      errors: errors.length > 0 ? errors : undefined
    };

    // Add stack trace in development
    if (EnvUtils.isDevelopment()) {
      errorResponse.stack = error.stack;
    }

    res.status(statusCode).json(ResponseUtils.error(message, errors, statusCode));
  }

  /**
   * Get allowed CORS origins
   */
  private getAllowedOrigins(): string[] {
    const origins = [
      'http://localhost:3000', // Next.js development
      'http://localhost:3001', // Alternative development port
      process.env.FRONTEND_URL || 'http://localhost:3000'
    ];

    // Add production origins if available
    if (process.env.ALLOWED_ORIGINS) {
      origins.push(...process.env.ALLOWED_ORIGINS.split(','));
    }

    return origins.filter(Boolean);
  }

  /**
   * Get Express app instance
   */
  public getApp(): Application {
    return this.app;
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    try {
      // Initialize database connection
      const Database = await import('./config/database');
      const db = Database.default;
      await db.connect();

      // Create database indexes
      await db.createIndexes();

      // Start the server
      this.app.listen(this.port, () => {
        console.log('🚀 PujiGori Backend Server Started');
        console.log(`📡 Server running on port ${this.port}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 API URL: http://localhost:${this.port}/api`);
        console.log(`❤️  Health Check: http://localhost:${this.port}/health`);
        console.log('✅ Server is ready to accept connections');
      });

      // Graceful shutdown handlers
      this.setupGracefulShutdown();

    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Setup graceful shutdown handlers
   */
  private setupGracefulShutdown(): void {
    const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

    signals.forEach(signal => {
      process.on(signal, async () => {
        console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
        
        try {
          // Close database connection
          const Database = await import('./config/database');
          const db = Database.default;
          await db.disconnect();

          console.log('✅ Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }
}

export default App;