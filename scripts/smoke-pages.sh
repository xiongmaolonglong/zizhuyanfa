#!/bin/bash
# 页面冒烟测试 — 用 Playwright 自动打开每个页面，检查控制台错误
# 用法：bash scripts/smoke-pages.sh

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

FRONTEND_URL="http://localhost:5173"
PASS=0
FAIL=0

echo "=========================================="
echo "  页面冒烟测试"
echo "=========================================="
echo ""

# 检查前端是否在运行
if curl -s --max-time 2 "$FRONTEND_URL" > /dev/null 2>&1; then
    echo -e "${GREEN}前端已在运行${NC}"
else
    echo -e "${YELLOW}前端未启动，请先运行: cd admin-web && npm run dev${NC}"
    exit 1
fi

# 创建 Playwright 测试脚本
cat > /tmp/smoke-pages.mjs << 'EOF'
import { chromium } from 'playwright';

const PAGES = [
  { name: '登录页', path: '/login' },
  { name: '数据看板', path: '/dashboard' },
  { name: '工单管理', path: '/work-orders' },
  { name: '申报接收', path: '/declarations' },
  { name: '派单管理', path: '/assignments' },
  { name: '测量审核', path: '/measurements' },
  { name: '设计管理', path: '/designs' },
  { name: '生产管理', path: '/production' },
  { name: '施工管理', path: '/constructions' },
  { name: '费用管理', path: '/finances' },
  { name: '归档管理', path: '/archives' },
  { name: '售后管理', path: '/aftersales' },
  { name: '组织架构', path: '/settings' },
  { name: '甲方管理', path: '/clients' },
];

const results = [];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  locale: 'zh-CN',
  viewport: { width: 1280, height: 720 },
});

for (const page of PAGES) {
  const ctx = await context.newPage();

  // 收集控制台错误
  const errors = [];
  ctx.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text().substring(0, 200));
    }
  });

  // 收集页面请求失败
  const failures = [];
  ctx.on('requestfailed', req => {
    if (req.failure().errorText !== 'net::ERR_ABORTED') {
      failures.push(`${req.failure().errorText}: ${req.url().substring(0, 100)}`);
    }
  });

  try {
    const resp = await ctx.goto(`http://localhost:5173${page.path}`, {
      waitUntil: 'networkidle',
      timeout: 15000,
    });

    const status = resp ? resp.status() : 0;
    const hasErrors = errors.length > 0 || failures.length > 0;

    results.push({
      name: page.name,
      path: page.path,
      status,
      errors: errors,
      failures: failures,
      ok: !hasErrors && status >= 200 && status < 400,
    });
  } catch (err) {
    results.push({
      name: page.name,
      path: page.path,
      status: 0,
      errors: [err.message.substring(0, 200)],
      failures: [],
      ok: false,
    });
  }

  await ctx.close();
}

await browser.close();

// 输出结果
let pass = 0, fail = 0;
for (const r of results) {
  if (r.ok) {
    console.log(`PASS: ${r.name} (${r.path})`);
    pass++;
  } else {
    console.log(`FAIL: ${r.name} (${r.path})`);
    for (const e of r.errors) {
      console.log(`  [error] ${e}`);
    }
    for (const f of r.failures) {
      console.log(`  [network] ${f}`);
    }
    fail++;
  }
}
console.log(`\nSUMMARY: ${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
EOF

# 检查 playwright 是否可用
if node -e "require('playwright')" 2>/dev/null; then
    node /tmp/smoke-pages.mjs
else
    echo -e "${YELLOW}Playwright 未安装，使用浏览器替代方案...${NC}"
    echo ""
    echo "请手动检查以下页面是否可正常访问:"
    echo "  http://localhost:5173/login"
    echo "  http://localhost:5173/dashboard"
    echo "  http://localhost:5173/work-orders"
    echo "  http://localhost:5173/declarations"
    echo "  http://localhost:5173/assignments"
    echo "  http://localhost:5173/measurements"
    echo "  http://localhost:5173/designs"
    echo "  http://localhost:5173/production"
    echo "  http://localhost:5173/constructions"
    echo "  http://localhost:5173/finances"
    echo "  http://localhost:5173/archives"
    echo "  http://localhost:5173/aftersales"
    echo "  http://localhost:5173/settings"
    echo "  http://localhost:5173/clients"
    echo ""
    echo "打开浏览器开发者工具 (F12) 查看 Console 是否有红色错误"
fi
