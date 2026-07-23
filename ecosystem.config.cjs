// NOTJUST Watr — PM2 Process Manager Configuration for Plesk
// Plesk can use PM2 for Node.js process management via its Node.js extension.
// Usage: pm2 start ecosystem.config.cjs
// See: https://pm2.keymetrics.io/docs/usage/application-declaration/

module.exports = {
  apps: [
    {
      name: 'notjust-watr',

      // The startup script — our Plesk-compatible server.js
      script: 'server.js',

      // Node.js interpreter path (adjust for your Plesk server's Node.js installation)
      // Default: use the system's node binary
      // interpreter: '/opt/plesk/node/18/bin/node',

      // Working directory (the project root on the Plesk server)
      // cwd: '/var/www/vhosts/yourdomain.com/httpdocs',

      // Number of instances. For a stateful app (SQLite), use 1 instance.
      // If using an external database (e.g., PostgreSQL), you can increase this.
      instances: 1,

      // Run in cluster mode for multiple instances, fork mode for single
      exec_mode: 'fork',

      // Auto restart on crash
      autorestart: true,

      // Maximum memory before auto-restart (256MB for a wellness shot app)
      max_memory_restart: '256M',

      // Watch for file changes (disable in production)
      watch: false,

      // Environment variables for production
      env: {
        NODE_ENV: 'production',
        // PORT is set by Plesk automatically — do not override here
        // HOSTNAME is set by server.js to 0.0.0.0 — do not override here
        // DATABASE_URL must point to the production SQLite path on the server
        // Set these in Plesk's Node.js environment settings instead
      },

      // Environment variables for staging (optional)
      env_staging: {
        NODE_ENV: 'staging',
      },

      // Logging configuration
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Graceful shutdown timeout (milliseconds)
      kill_timeout: 5000,

      // Wait before restarting after a crash (milliseconds)
      restart_delay: 3000,

      // Maximum restarts within min_uptime before marking as stopped
      max_restarts: 10,
      min_uptime: '10s',

      // Time to wait before considering the app as started successfully
      listen_timeout: 10000,
    },
  ],
};
