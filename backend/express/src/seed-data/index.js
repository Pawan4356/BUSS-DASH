import meridianHealth from './meridianHealth.js'
import lalaCompany from './lalaCompany.js'

/** Shared sign-in password for every seeded account. */
export const SEED_PASSWORD = 'Parsor@2026'

export const COMPANIES = [meridianHealth, lalaCompany]

/** Businesses created by earlier versions of the seed; removed on every run. */
export const LEGACY_BUSINESS_IDS = ['demo-business', 'biz-bluepeak-logistics', 'biz-saffron-table', 'biz-lumen-studio']
