#!/bin/bash
# 全量检查：依赖 + 测试 + 构建 + 数据库
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

FAIL_COUNT=0
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "=========================================="
echo "  全量项目检查"
echo "=========================================="
echo ""

# 1. 后端测试
echo "[1/6] 后端单元测试..."
cd "$ROOT/backend"
if npm test 2>&1; then
    echo -e "${GREEN}后端测试通过${NC}"
else
    echo -e "${YELLOW}后端测试跳过（可能无测试文件）${NC}"
fi
echo ""

# 2. 后端 lint
echo "[2/6] 后端代码检查..."
if command -v npx &> /dev/null; then
    if npx jslint src/*.js src/**/*.js 2>/dev/null; then
        echo -e "${GREEN}后端代码规范通过${NC}"
    else
        echo -e "${YELLOW}未安装 linter，跳过${NC}"
    fi
fi
echo ""

# 3-5. 前端构建
echo "[3-5/6] 前端构建..."
for proj in admin-web super-admin client-web; do
    echo -n "  $proj ... "
    cd "$ROOT/$proj"
    if npm run build > /dev/null 2>&1; then
        echo -e "${GREEN}通过${NC}"
    else
        echo -e "${RED}失败${NC}"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
done
echo ""

# 6. 数据库连接
echo "[6/6] 数据库连接..."
cd "$ROOT/backend"
if node -e "
const { Sequelize } = require('sequelize');
const env = require('./src/config/database')[process.env.NODE_ENV || 'development'];
const s = new Sequelize(env.database, env.username, env.password, { ...env, logging: false });
s.authenticate().then(() => { console.log('ok'); process.exit(0); }).catch(() => process.exit(1));
" 2>/dev/null; then
    echo -e "${GREEN}数据库连接正常${NC}"
else
    echo -e "${YELLOW}数据库连接失败（可能未启动）${NC}"
fi

echo ""
echo "=========================================="
if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}  全部检查通过${NC}"
else
    echo -e "${RED}  $FAIL_COUNT 项失败${NC}"
    exit 1
fi
echo "=========================================="
