/**
 * PM2 Ecosystem Config for PortalSwap Telegram Bot
 *
 * Usage:
 *   npm install -g pm2
 *   pm2 start ecosystem.config.cjs
 *   pm2 save
 *   pm2 startup
 */

module.exports = {
  apps: [{
    name: 'portalswap-bot',
    script: 'src/index.js',
    interpreter: 'node',
    cwd: __dirname,

    // Auto-restart on crash
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',

    // Environment
    env: {
      NODE_ENV: 'production',
    },

    // Logging
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,

    // Process management
    instances: 1,
    exec_mode: 'fork',

    // Restart policy
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
  }]
};
