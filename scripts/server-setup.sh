#!/bin/bash
# ============================================
# 广告工程全流程管理系统 - 服务器一键部署脚本
# ============================================
# 使用方法: bash server-setup.sh
# 适用系统: Ubuntu 20.04 / 22.04 / 24.04
# 域名: bh.fsbhgg.com
# ============================================

set -e

# 配置项
DOMAIN="bh.fsbhgg.com"
REPO_URL="https://github.com/xiongmaolonglong/bangheoa.git"
BRANCH="1552"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}广告工程全流程管理系统 - 服务器部署${NC}"
echo -e "${GREEN}域名: ${DOMAIN}${NC}"
echo -e "${GREEN}============================================${NC}"

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then
  echo -e "${YELLOW}请使用 root 用户或 sudo 执行此脚本${NC}"
  exit 1
fi

# ============================================
# 第一步: 更新系统
# ============================================
echo -e "\n${GREEN}[1/9] 更新系统...${NC}"
apt update && apt upgrade -y

# ============================================
# 第二步: 安装基础工具
# ============================================
echo -e "\n${GREEN}[2/9] 安装基础工具...${NC}"
apt install -y curl wget git unzip software-properties-common

# ============================================
# 第三步: 安装 Node.js 20
# ============================================
echo -e "\n${GREEN}[3/9] 安装 Node.js 20...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi
echo "Node.js 版本: $(node -v)"
echo "npm 版本: $(npm -v)"

# 安装 PM2
npm install -g pm2

# ============================================
# 第四步: 安装 MySQL 8.0
# ============================================
echo -e "\n${GREEN}[4/9] 安装 MySQL 8.0...${NC}"
if ! command -v mysql &> /dev/null; then
    echo -e "${YELLOW}MySQL 安装过程中会要求设置 root 密码，建议设为空（直接回车）${NC}"
    DEBIAN_FRONTEND=noninteractive apt install -y mysql-server
    systemctl enable mysql
    systemctl start mysql
fi
echo "MySQL 版本: $(mysql --version)"

# ============================================
# 第五步: 安装 Nginx
# ============================================
echo -e "\n${GREEN}[5/9] 安装 Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    systemctl enable nginx
    systemctl start nginx
fi
echo "Nginx 版本: $(nginx -v 2>&1)"

# ============================================
# 第六步: 克隆项目代码
# ============================================
echo -e "\n${GREEN}[6/9] 克隆项目代码...${NC}"

PROJECT_DIR="/var/www/ad-workflow"

if [ -d "$PROJECT_DIR" ]; then
    echo -e "${YELLOW}项目目录已存在，更新代码...${NC}"
    cd $PROJECT_DIR
    git fetch origin
    git checkout $BRANCH
    git pull origin $BRANCH
else
    mkdir -p /var/www
    cd /var/www
    git clone $REPO_URL ad-workflow
    cd ad-workflow
    git checkout $BRANCH
fi

# 创建必要目录
mkdir -p /var/log/ad-workflow
mkdir -p $PROJECT_DIR/backend/uploads

# ============================================
# 第七步: 配置数据库
# ============================================
echo -e "\n${GREEN}[7/9] 配置数据库...${NC}"

# 创建数据库
mysql -u root -e "CREATE DATABASE IF NOT EXISTS ad_workflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# ============================================
# 第八步: 安装依赖和构建
# ============================================
echo -e "\n${GREEN}[8/9] 安装依赖和构建...${NC}"

# 后端
cd $PROJECT_DIR/backend
npm install

# 前端
cd $PROJECT_DIR/admin-web
npm install
npm run build

# ============================================
# 第九步: 配置 Nginx 和 SSL
# ============================================
echo -e "\n${GREEN}[9/9] 配置 Nginx...${NC}"

# 创建 Nginx 配置
cat > /etc/nginx/sites-available/ad-workflow << 'NGINX_CONF'
# 后端 API 上游
upstream backend_api {
    server 127.0.0.1:3000;
    keepalive 64;
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER;
    return 301 https://$server_name$request_uri;
}

# HTTPS 主服务器配置
server {
    listen 443 ssl http2;
    server_name DOMAIN_PLACEHOLDER;

    # SSL 配置 (由 certbot 自动生成)
    ssl_certificate /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # 访问日志
    access_log /var/log/nginx/ad-workflow.access.log;
    error_log /var/log/nginx/ad-workflow.error.log;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml;
    gzip_comp_level 6;

    # 客户端上传限制
    client_max_body_size 500M;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 管理后台前端
    location / {
        root /var/www/ad-workflow/admin-web/dist;
        index index.html;
        try_files $uri $uri/ /index.html;

        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # 后端 API 代理
    location /api {
        proxy_pass http://backend_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # 上传文件访问
    location /uploads {
        alias /var/www/ad-workflow/backend/uploads;

        location ~* \.(php|pl|py|jsp|asp|sh|cgi)$ {
            deny all;
        }

        location ~* \.(jpg|jpeg|png|gif|ico|webp|svg)$ {
            expires 30d;
            add_header Cache-Control "public";
        }
    }

    # 健康检查
    location /health {
        proxy_pass http://backend_api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # 禁止访问隐藏文件
    location ~ /\. {
        deny all;
    }
}
NGINX_CONF

# 替换域名
sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" /etc/nginx/sites-available/ad-workflow

# 启用站点
ln -sf /etc/nginx/sites-available/ad-workflow /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# ============================================
# 申请 SSL 证书
# ============================================
echo -e "\n${GREEN}申请 SSL 证书...${NC}"

# 安装 certbot
if ! command -v certbot &> /dev/null; then
    apt install -y certbot python3-certbot-nginx
fi

# 临时配置 HTTP 用于证书申请
cat > /etc/nginx/sites-available/ad-workflow-temp << EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        root /var/www/ad-workflow/admin-web/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF

ln -sf /etc/nginx/sites-available/ad-workflow-temp /etc/nginx/sites-enabled/ad-workflow-temp
rm -f /etc/nginx/sites-enabled/ad-workflow
nginx -t && systemctl reload nginx

# 启动后端（证书申请需要后端运行）
cd $PROJECT_DIR/backend
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.production.js --env production

# 申请证书
echo -e "${YELLOW}正在申请 SSL 证书...${NC}"
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN --redirect || {
    echo -e "${YELLOW}SSL 证书申请失败，继续使用 HTTP${NC}"
}

# 启用完整配置
rm -f /etc/nginx/sites-enabled/ad-workflow-temp
ln -sf /etc/nginx/sites-available/ad-workflow /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# ============================================
# 保存 PM2 配置
# ============================================
pm2 save
pm2 startup | tail -1 | bash

# ============================================
# 完成
# ============================================
echo -e "\n${GREEN}============================================${NC}"
echo -e "${GREEN}部署完成！${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "访问地址: ${YELLOW}https://${DOMAIN}${NC}"
echo -e "演示账号: ${YELLOW}13800000001 / 123456${NC}"
echo ""
echo -e "常用命令:"
echo "  查看后端状态:  pm2 status"
echo "  查看后端日志:  pm2 logs backend"
echo "  重启后端:      pm2 restart backend"
echo "  更新代码后:    cd /var/www/ad-workflow && git pull origin 1552"
echo "  重启所有服务:  pm2 restart backend && cd /var/www/ad-workflow/admin-web && npm run build"
