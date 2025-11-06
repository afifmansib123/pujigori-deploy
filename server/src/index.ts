import 'dotenv/config';
import App from './app';

/**
 * Main server entry point
 */
async function bootstrap(): Promise<void> {
  try {
    console.log('🚀 Starting PujiGori Backend Server...');
    console.log(`📊 Node.js version: ${process.version}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📁 Working directory: ${process.cwd()}`);

    // Validate required environment variables
    validateEnvironment();

    // Create and start the application
    const app = new App();
    await app.start();

  } catch (error) {
    console.error('❌ Failed to start the server:', error);
    process.exit(1);
  }
}

/**
 * Validate required environment variables
 */
function validateEnvironment(): void {
  const required = [
    'MONGODB_URI',
    'JWT_SECRET',
    'SSLCOMMERZ_STORE_ID',
    'SSLCOMMERZ_STORE_PASS',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_S3_BUCKET'
  ];

  const missing: string[] = [];

  for (const variable of required) {
    if (!process.env[variable]) {
      missing.push(variable);
    }
  }

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(variable => {
      console.error(`   - ${variable}`);
    });
    console.error('\n💡 Please check your .env file and ensure all required variables are set.');
    process.exit(1);
  }

  // Validate environment values
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv && !['development', 'production', 'test'].includes(nodeEnv)) {
    console.warn(`⚠️  Warning: Unknown NODE_ENV value: ${nodeEnv}`);
  }

  const port = process.env.PORT;
  if (port && (isNaN(Number(port)) || Number(port) < 1 || Number(port) > 65535)) {
    console.error('❌ Invalid PORT value. Must be a number between 1 and 65535.');
    process.exit(1);
  }

  console.log('✅ Environment validation passed');
}

// Start the application
if (require.main === module) {
  bootstrap().catch((error) => {
    console.error('💥 Bootstrap failed:', error);
    process.exit(1);
  });
}

export default bootstrap;