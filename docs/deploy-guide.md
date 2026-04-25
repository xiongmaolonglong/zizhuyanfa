# 部署指南

## 服务器要求

- **系统**: Ubuntu 22.04 LTS（推荐）或 24.04 LTS
- **配置**: 最低 2核4G（小团队足够），建议 4核8G
- **软件**: Node.js 18+、MySQL 8.0、Nginx、PM2

## 快速部署

### 1. 服务器环境准备

```bash
# 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs nginx mysql-server

# 安装 PM2
sudo npm install -g pm2

# 创建数据库
mysql -u root -p -e "CREATE DATABASE ad_workflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 创建专用数据库用户（推荐，替代 root）
mysql -u root -p -e "CREATE USER 'ad_workflow_user'@'localhost' IDENTIFIED BY '你的数据库密码';"
mysql -u root -p -e "GRANT ALL PRIVILEGES ON ad_workflow.* TO 'ad_workflow_user'@'localhost';"
mysql -u root -p -e "FLUSH PRIVILEGES;"
```

### 2. 上传代码

```bash
# 创建部署目录
sudo mkdir -p /var/www/ad-workflow
sudo chown $USER:$USER /var/www/ad-workflow

# 上传代码到该目录（scp/rsync/zip 等方式）
```

### 3. 修改生产配置

编辑 `backend/.env.production`，修改以下必改项：

```env
DB_PASSWORD=你的数据库密码        # 改为实际密码
DB_USER=ad_workflow_user          # 改为专用数据库用户
JWT_SECRET=随机32位以上字符串       # 用 openssl rand -hex 32 生成
CORS_ORIGINS=https://你的域名      # 改为实际域名
```

### 4. 一键部署

```bash
cd /var/www/ad-workflow
bash scripts/deploy.sh
```

脚本自动完成：安装依赖 → 构建3个前端 → 数据库迁移 → 初始数据 → Nginx 配置 → PM2 启动

### 5. SSL 证书（可选但推荐）

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d 你的域名
```

certbot 会自动修改 Nginx 配置并续期。

## 部署后验证

```bash
# 检查服务状态
pm2 status

# 检查后端健康
curl http://localhost:3000/health

# 查看后端日志
pm2 logs backend-1.0

# 验证前端访问
curl -I http://localhost/       # 管理后台
curl -I http://localhost/super-admin/  # 超级管理
curl -I http://localhost/client/       # 甲方客户端
```

## 默认账号

部署后种子数据自动创建：

| 角色 | 手机号 | 密码 | 入口 |
|------|--------|------|------|
| 广告商管理员 | 13800138000 | Admin@123456 | https://你的域名/ |
| 甲方用户 | 13900000001 | Client@123456 | https://你的域名/client/ |

**部署后立即修改默认密码。**

## 日常运维

```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs backend-1.0 --lines 100

# 重启服务
pm2 restart backend-1.0

# 更新代码后重新部署
git pull && bash scripts/deploy.sh

# 数据库备份
bash scripts/backup-db.sh

# 查看 PM2 开机自启
pm2 startup
```

## 文件路径说明

| 路径 | 内容 |
|------|------|
| `/var/www/ad-workflow/admin-web/dist/` | 管理后台静态文件 |
| `/var/www/ad-workflow/super-admin/dist/` | 超级管理后台静态文件 |
| `/var/www/ad-workflow/client-web/dist/` | 甲方客户端静态文件 |
| `/var/www/ad-workflow/backend/uploads/` | 上传文件 |
| `/var/www/ad-workflow/backend/logs/` | 后端日志 |
| `/var/log/nginx/ad-workflow.*` | Nginx 访问/错误日志 |
