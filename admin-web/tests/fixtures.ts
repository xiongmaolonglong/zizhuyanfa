import { test as base } from '@playwright/test'

export const test = base.extend({
  storageState: 'tests/.auth/state.json',
})

export { expect } from '@playwright/test'
