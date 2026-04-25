#!/bin/bash

# ============================================
# 广告工程全流程管理系统 - 部署脚本
# ============================================
# 用途：在 Ubuntu 服务器上自动部署前后端
#
# 使用方法:
#   1. 将项目上传到服务器 /var/www/ad-workflow/
#   2. 修改 backend/.env.production 中的数据库密码和 JWT_SECRET
#   3. cd /var/www/ad-workflow && bash scripts/deploy.sh
#
# 前置条件：已安装 Node.js 18+、MySQL 8.0、Nginx

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_DIR/backend"
ADMIN_DIR="$PROJECT_DIR/admin-web"
SUPER_DIR="$PROJECT_DIR/super-admin"
CLIENT_DIR="$PROJECT_DIR/client-web"

echo "========================================"
echo "广告工程全流程管理系统 - 部署"
echo "========================================"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "错误: 未安装 Node.js"
    exit 1
fi
echo "Node 版本: $(node -v)"
echo "NPM 版本: $(npm -v)"

# 1. 安装后端依赖
echo ""
echo "[1/8] 安装后端依赖..."
cd "$BACKEND_DIR"
npm install --production

# 2. 构建三个前端
echo ""
echo "[2/8] 构建管理后台..."
cd "$ADMIN_DIR"
npm install --production
npm run build

echo "[3/8] 构建超级管理后台..."
cd "$SUPER_DIR"
npm install --production
npm run build

echo "[4/8] 构建甲方客户端..."
cd "$CLIENT_DIR"
npm install --production
npm run build

# 5. 数据库迁移和种子数据
echo ""
echo "[5/8] 执行数据库迁移..."
cd "$BACKEND_DIR"
mkdir -p uploads logs
npx sequelize-cli db:migrate

echo "[6/8] 填充初始数据..."
npx sequelize-cli db:seed:all 2>/dev/null || echo "种子数据已存在，跳过"

# 7. 部署 Nginx 配置（如果以 root 运行）
echo "[7/8] 配置 Nginx..."
if [ "$EUID" -eq 0 ]; then
    cp "$PROJECT_DIR/docs/nginx.conf" /etc/nginx/sites-available/ad-workflow
    ln -sf /etc/nginx/sites-available/ad-workflow /etc/nginx/sites-enabled/ad-workflow
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && nginx -s reload
    echo "  Nginx 配置已更新"
else
    echo "  非 root 用户，跳过 Nginx 配置（请手动部署 docs/nginx.conf）"
fi

# 8. PM2 启动后端
echo "[8/8] 启动后端服务..."
pm2 delete backend-1.0 2>/dev/null || true
pm2 start ecosystem.config.js --env production
pm2 save

echo ""
echo "========================================"
echo "部署完成！"
echo "========================================"
echo ""
echo "访问地址:"
echo "  管理后台:   http://你的域名/"
echo "  超级管理:   http://你的域名/super-admin/"
echo "  甲方客户端: http://你的域名/client/"
echo ""
echo "默认账号:"
echo "  广告商管理员: 13800138000 / Admin@123456"
echo "  甲方用户:     13900000001 / Client@123456"
echo ""
echo "常用命令:"
echo "  pm2 status         查看服务状态"
echo "  pm2 logs backend-1.0 查看后端日志"
echo "  pm2 restart backend-1.0 重启服务"
echo ""
