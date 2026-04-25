import { test, expect } from '../fixtures'

// 数据看板
test('数据看板页面正常加载', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { name: '数据看板' })).toBeVisible({ timeout: 10000 })
  // 统计卡片应该显示
  await expect(page.locator('.stats-row')).toBeVisible()
})

// 工单管理
test('工单管理页面正常加载', async ({ page }) => {
  await page.goto('/work-orders')
  await expect(page.getByRole('heading', { name: '工单管理' })).toBeVisible({ timeout: 10000 })
})

// 申报接收
test('申报接收页面正常加载', async ({ page }) => {
  await page.goto('/declarations')
  await expect(page.getByRole('heading', { name: '申报接收' })).toBeVisible({ timeout: 10000 })
})

// 派单管理
test('派单管理页面正常加载', async ({ page }) => {
  await page.goto('/dispatch')
  await expect(page.getByRole('heading', { name: '派单管理' })).toBeVisible({ timeout: 10000 })
})

// 设计管理
test('设计管理页面正常加载', async ({ page }) => {
  await page.goto('/designs')
  await expect(page.getByRole('heading', { name: '设计管理' })).toBeVisible({ timeout: 10000 })
})

// 生产管理
test('生产管理页面正常加载', async ({ page }) => {
  await page.goto('/production')
  await expect(page.getByRole('heading', { name: '生产管理' })).toBeVisible({ timeout: 10000 })
})

// 施工管理
test('施工管理页面正常加载', async ({ page }) => {
  await page.goto('/construction')
  await expect(page.getByRole('heading', { name: '施工管理' })).toBeVisible({ timeout: 10000 })
})

// 费用管理
test('费用管理页面正常加载', async ({ page }) => {
  await page.goto('/finance')
  await expect(page.getByRole('heading', { name: '费用管理' })).toBeVisible({ timeout: 10000 })
})

// 审核中心
test('审核中心页面正常加载', async ({ page }) => {
  await page.goto('/audit')
  await expect(page.getByRole('heading', { name: '审核中心' })).toBeVisible({ timeout: 10000 })
})

// 组织架构
test('组织架构页面正常加载', async ({ page }) => {
  await page.goto('/organization')
  await expect(page.getByRole('heading', { name: '组织架构' })).toBeVisible({ timeout: 10000 })
})

// 系统配置
test('系统配置页面正常加载', async ({ page }) => {
  await page.goto('/settings')
  await expect(page.getByRole('heading', { name: '系统配置' })).toBeVisible({ timeout: 10000 })
})
