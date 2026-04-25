import { test as setup, expect } from '@playwright/test'

setup('authenticate', async ({ page }) => {
  await page.goto('/login')
  await page.getByPlaceholder('手机号').fill('13800000001')
  await page.getByPlaceholder('密码').fill('123456')
  await page.getByRole('button', { name: '登 录' }).click()

  // Wait for navigation to dashboard
  await page.waitForURL('**/dashboard', { timeout: 10000 })
  await expect(page.getByRole('heading', { name: '数据看板' })).toBeVisible()

  // Save auth state
  await page.context().storageState({ path: 'tests/.auth/state.json' })
})
