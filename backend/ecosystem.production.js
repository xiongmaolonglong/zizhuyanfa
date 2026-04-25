module.exports = {
  apps: [{
    name: 'backend-1.0',
    script: 'src/app.js',
    cwd: '/var/www/ad-workflow/backend',

    // 生产环境配置
    instances: 2,             // 多实例，利用多核
    exec_mode: 'cluster',     // 集群模式

    // 自动重启
    autorestart: true,
    max_memory_restart: '1G', // 内存超限自动重启
    min_uptime: '10s',        // 最少运行 10s 才算稳定
    max_restarts: 10,         // 最大重启次数

    // 监控
    watch: false,             // 生产环境不监听文件变化
    listen_timeout: 3000,
    kill_timeout: 5000,

    // 环境变量
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
    },

    // 日志配置
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: '/var/log/ad-workflow/error.log',
    out_file: '/var/log/ad-workflow/out.log',
    merge_logs: true,

    // 优雅关闭
    wait_ready: true,
    timeout: 10000,
  }],
};