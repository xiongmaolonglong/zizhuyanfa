#!/bin/bash
# ============================================
# 日常更新脚本 - 在服务器上执行
# ============================================
# 使用方法: bash server-update.sh
# ============================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_DIR="/var/www/ad-workflow"
BRANCH="1552"

echo -e "${GREEN}开始更新...${NC}"

# 拉取最新代码
cd $PROJECT_DIR
echo -e "${YELLOW}拉取代码...${NC}"
git pull origin $BRANCH

# 检查后端依赖是否变化
if git diff --name-only HEAD@{1} | grep -q "backend/package.json"; then
    echo -e "${YELLOW}后端依赖有变化，安装中...${NC}"
    cd $PROJECT_DIR/backend
    npm install
fi

# 检查前端依赖是否变化
if git diff --name-only HEAD@{1} | grep -q "admin-web/package.json"; then
    echo -e "${YELLOW}前端依赖有变化，安装中...${NC}"
    cd $PROJECT_DIR/admin-web
    npm install
fi

# 检查后端代码是否变化
if git diff --name-only HEAD@{1} | grep -q "backend/src/"; then
    echo -e "${YELLOW}后端代码有变化，重启中...${NC}"
    pm2 restart backend
fi

# 检查前端代码是否变化
if git diff --name-only HEAD@{1} | grep -q "admin-web/src/"; then
    echo -e "${YELLOW}前端代码有变化，重新构建...${NC}"
    cd $PROJECT_DIR/admin-web
    npm run build
fi

echo -e "${GREEN}更新完成！${NC}"
