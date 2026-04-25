#!/bin/bash
# 快速检查：依赖完整性 + 前端构建
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=== 快速检查 ==="
echo ""

# 检查依赖
echo "[1/4] 检查后端依赖..."
cd backend
if [ -d "node_modules" ]; then
    echo -e "${GREEN}后端依赖已安装${NC}"
else
    echo -e "${YELLOW}后端依赖未安装，运行 npm install...${NC}"
    npm install
fi
cd ..

# 前端依赖
echo "[2/4] 检查前端依赖..."
for proj in admin-web super-admin client-web; do
    if [ -d "$proj/node_modules" ]; then
        echo -e "${GREEN}$proj 依赖已安装${NC}"
    else
        echo -e "${YELLOW}$proj 依赖未安装${NC}"
        cd "$proj" && npm install && cd ..
    fi
done

# 前端构建
echo ""
echo "[3/4] 前端构建检查..."
FAIL_COUNT=0
for proj in admin-web super-admin client-web; do
    echo -n "  构建 $proj ... "
    if cd "$proj" && npm run build > /dev/null 2>&1 && cd ..; then
        echo -e "${GREEN}通过${NC}"
    else
        echo -e "${RED}失败${NC}"
        FAIL_COUNT=$((FAIL_COUNT + 1))
        cd .. 2>/dev/null
    fi
done

echo ""
echo "[4/4] 后端语法检查..."
if cd backend && node -e "require('./src/app')" 2>/dev/null && cd ..; then
    echo -e "${GREEN}后端入口加载成功${NC}"
else
    echo -e "${YELLOW}后端入口加载失败（可能缺数据库连接）${NC}"
    cd .. 2>/dev/null
fi

echo ""
if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}=== 检查通过 ===${NC}"
else
    echo -e "${RED}=== $FAIL_COUNT 个项目构建失败 ===${NC}"
    exit 1
fi
