/**
 * PM2 Process Manager Configuration
 * Used for production deployment on EC2
 *
 * Commands:
 * - Start: pm2 start ecosystem.config.js
 * - Stop: pm2 stop pujigori-backend
 * - Restart: pm2 restart pujigori-backend
 * - Logs: pm2 logs pujigori-backend
 * - Monitor: pm2 monit
 */

module.exports = {
  apps: [{
    name: 'pujigori-backend',
    script: './dist/index.js',
    instances: 1, // Change to 'max' for cluster mode
    exec_mode: 'fork', // Change to 'cluster' for multiple instances

    // Environment variables
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },

    // Restart behavior
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',

    // Logging
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

    // Advanced features
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,

    // Graceful shutdown
    kill_timeout: 5000,
    listen_timeout: 3000,
    shutdown_with_message: true
  }]
};
