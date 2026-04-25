#!/bin/bash
# 仅检查所有前端项目构建
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

FAIL_COUNT=0
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== 前端构建检查 ==="
echo ""

for proj in admin-web super-admin client-web; do
    if [ ! -d "$ROOT/$proj" ]; then
        echo -e "${YELLOW}$proj 不存在，跳过${NC}"
        continue
    fi

    if [ ! -d "$ROOT/$proj/node_modules" ]; then
        echo -e "${YELLOW}$proj 依赖未安装，正在安装...${NC}"
        cd "$ROOT/$proj" && npm install
    fi

    echo -n "$proj ... "
    cd "$ROOT/$proj"
    if npm run build > /dev/null 2>&1; then
        echo -e "${GREEN}通过${NC}"
    else
        echo -e "${RED}失败${NC}"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
done

echo ""
if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}全部通过${NC}"
else
    echo -e "${RED}$FAIL_COUNT 个项目构建失败${NC}"
    exit 1
fi
