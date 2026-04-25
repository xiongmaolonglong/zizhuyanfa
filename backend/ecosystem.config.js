module.exports = {
  apps: [{
    name: 'backend-1.0',
    script: 'src/app.js',
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    restart_delay: 3000,
    env: {
      NODE_ENV: 'production',
    },
    // 日志配置
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    merge_logs: true,
  }],
};
