import { test, expect } from '@playwright/test'

const phone = '13800001001'
const password = '123456'

async function login(page) {
  await page.goto('/login')
  await page.getByRole('textbox', { name: '手机号' }).fill(phone)
  await page.getByRole('textbox', { name: '密码' }).fill(password)
  await page.getByRole('button', { name: '登 录' }).click()
  await page.waitForURL('**/dashboard')
}

test.describe('甲方申报流程', () => {
  test('登录后能进入我的申报页面', async ({ page }) => {
    await login(page)
    await expect(page.locator('.page-title')).toBeVisible()
  })

  test('新建申报对话框有图片上传组件', async ({ page }) => {
    await login(page)

    await page.getByText('我的申报').click()
    await page.getByRole('button', { name: '新建申报' }).click()

    const dialog = page.locator('.el-dialog:has-text("新建申报")')
    await expect(dialog).toBeVisible()

    const uploadBtn = dialog.locator('.el-upload--picture-card').first()
    await expect(uploadBtn).toBeVisible()
  })
})

test.describe('导航和 404', () => {
  test('访问不存在的路由跳转 404', async ({ page }) => {
    await login(page)

    await page.goto('/non-existent-page')
    await expect(page.locator('h1', { hasText: '404' })).toBeVisible()
    await expect(page.getByRole('button', { name: '返回首页' })).toBeVisible()
  })
})

test.describe('页面标题', () => {
  test('进入工作台后页面标题包含 "工作台"', async ({ page }) => {
    await login(page)
    await expect(page).toHaveTitle(/工作台/)
  })
})
