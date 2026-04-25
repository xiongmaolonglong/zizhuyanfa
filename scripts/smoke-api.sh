#!/bin/bash
# API 冒烟测试 — 启动后端后逐个调用所有 API，报告错误
# 用法：bash scripts/smoke-api.sh

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BASE_URL="http://localhost:3010/api/v1"
PASS=0
FAIL=0
WARN=0

log() { echo -e "${BLUE}[INFO]${NC} $1"; }
ok()  { echo -e "${GREEN}[PASS]${NC} $1"; PASS=$((PASS+1)); }
fail() { echo -e "${RED}[FAIL]${NC} $1 — $2"; FAIL=$((FAIL+1)); }
warn() { echo -e "${YELLOW}[WARN]${NC} $1 — $2"; WARN=$((WARN+1)); }

echo "=========================================="
echo "  API 冒烟测试"
echo "=========================================="
echo ""

# 检查后端是否已在运行
if curl -s --max-time 2 "$BASE_URL/health" > /dev/null 2>&1; then
    ok "后端健康检查通过"
else
    log "后端未运行，正在启动..."
    cd "$(dirname "$0")/../backend"
    node src/app.js > /tmp/backend-smoke.log 2>&1 &
    BACKEND_PID=$!
    log "等待后端启动 (5秒)..."
    sleep 5

    if ! curl -s --max-time 2 "$BASE_URL/health" > /dev/null 2>&1; then
        echo -e "${RED}后端启动失败:${NC}"
        cat /tmp/backend-smoke.log | tail -20
        exit 1
    fi
    ok "后端启动成功"
    cd - > /dev/null
fi

# 登录获取 token（租户登录）
echo ""
log "租户登录..."
LOGIN_RESP=$(curl -s -X POST "$BASE_URL/auth/tenant/login" \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800000001","password":"123456"}')

TOKEN=$(echo "$LOGIN_RESP" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);console.log(j.data?.token||j.token||'');}catch(e){console.log('');}})")

if [ -z "$TOKEN" ]; then
    FAIL_REASON=$(echo "$LOGIN_RESP" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);console.log(j.message||j.error||JSON.stringify(j));}catch(e){console.log(d.substring(0,100));}})" 2>/dev/null)
    warn "租户登录失败: $FAIL_REASON"
    TOKEN=""
else
    ok "租户登录成功"
fi

# 辅助函数
test_api() {
    local method="${1:-GET}"
    local label="$2"
    local path="$3"

    local result
    if [ -n "$TOKEN" ]; then
        result=$(curl -s -o /tmp/api_result.json -w "%{http_code}" \
          --max-time 5 \
          -H "Authorization: Bearer $TOKEN" \
          -H "Content-Type: application/json" \
          -X "$method" \
          "$BASE_URL$path" 2>/dev/null)
    else
        result=$(curl -s -o /tmp/api_result.json -w "%{http_code}" \
          --max-time 5 \
          -X "$method" \
          "$BASE_URL$path" 2>/dev/null)
    fi

    case "$result" in
        200|201|204)
            # 检查响应体是否有错误
            local body_code
            body_code=$(node -e "try{const j=JSON.parse(require('fs').readFileSync('/tmp/api_result.json','utf8'));console.log(j.code||0);}catch(e){console.log(0);}" 2>/dev/null)
            if [ "$body_code" = "0" ]; then
                ok "$label (HTTP $result)"
            else
                local msg
                msg=$(node -e "try{const j=JSON.parse(require('fs').readFileSync('/tmp/api_result.json','utf8'));console.log(j.message||'');}catch(e){}" 2>/dev/null)
                if [ -n "$msg" ]; then
                    fail "$label (code=$body_code)" "$msg"
                else
                    ok "$label (HTTP $result)"
                fi
            fi
            ;;
        401)
            warn "$label (HTTP 401)" "未授权（可能token无效）"
            ;;
        403)
            warn "$label (HTTP 403)" "权限不足"
            ;;
        404)
            fail "$label (HTTP 404)" "路由不存在"
            ;;
        500)
            local msg
            msg=$(node -e "try{const j=JSON.parse(require('fs').readFileSync('/tmp/api_result.json','utf8'));console.log(j.message||j.error||'');}catch(e){}" 2>/dev/null)
            fail "$label (HTTP 500)" "${msg:-内部错误}"
            ;;
        000)
            fail "$label" "连接超时"
            ;;
        *)
            warn "$label (HTTP $result)"
            ;;
    esac
}

# ========== 接口测试 ==========
echo ""
echo "--- 认证 ---"
test_api POST "租户登录" "/auth/tenant/login"
test_api GET "健康检查" "/health"

echo ""
echo "--- 管理后台 ---"
test_api GET "租户Dashboard" "/admin/dashboard"
test_api GET "租户Dashboard趋势" "/admin/dashboard/trend"
test_api GET "超管-租户列表" "/admin/tenants"
test_api GET "超管-工单列表" "/admin/work-orders"
test_api GET "超管-甲方列表" "/admin/clients"
test_api GET "超管-申报列表" "/admin/declarations"

echo ""
echo "--- 工单 ---"
test_api GET "工单列表" "/work-orders"
test_api GET "工单统计" "/work-orders/stats"

echo ""
echo "--- 申报 ---"
test_api GET "申报列表" "/declarations"

echo ""
echo "--- 派单/测量 ---"
test_api GET "派单列表" "/assignments"
test_api GET "推荐测量员" "/assignments/recommended-measurers"
test_api GET "测量任务列表" "/measurements/tasks"
test_api POST "测量批量审核" "/tenant/measurements/batch-review"

echo ""
echo "--- 设计 ---"
test_api GET "设计任务列表" "/designs/tasks"

echo ""
echo "--- 生产 ---"
test_api GET "生产任务列表" "/production/tasks"

echo ""
echo "--- 施工 ---"
test_api GET "施工任务列表" "/construction/tasks"

echo ""
echo "--- 财务 ---"
test_api GET "报价列表" "/finance/quotes"

echo ""
echo "--- 归档 ---"
test_api GET "归档列表" "/archives"

echo ""
echo "--- 售后 ---"
test_api GET "售后列表" "/aftersales"

echo ""
echo "--- 系统 ---"
test_api GET "地址列表" "/addresses"
test_api GET "通知列表" "/notifications"
test_api GET "租户-部门列表" "/tenants/departments"
test_api GET "租户-人员列表" "/tenants/users"

# ========== 汇总 ==========
echo ""
echo "=========================================="
echo -e "  ${GREEN}通过: $PASS${NC}  ${RED}失败: $FAIL${NC}  ${YELLOW}警告: $WARN${NC}"
echo "=========================================="

if [ -n "$BACKEND_PID" ]; then
    log "关闭后端进程"
    kill $BACKEND_PID 2>/dev/null
fi

[ $FAIL -gt 0 ] && exit 1
