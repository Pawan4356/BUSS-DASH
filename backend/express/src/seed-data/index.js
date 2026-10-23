import meridianHealth from './meridianHealth.js'
import bluepeakLogistics from './bluepeakLogistics.js'
import saffronTable from './saffronTable.js'
import lumenStudio from './lumenStudio.js'
import lalaCompany from './lalaCompany.js'

/** Shared sign-in password for every seeded account. */
export const SEED_PASSWORD = 'Parsor@2026'

export const COMPANIES = [meridianHealth, bluepeakLogistics, saffronTable, lumenStudio, lalaCompany]

/** Businesses created by earlier versions of the seed; removed on every run. */
export const LEGACY_BUSINESS_IDS = ['demo-business']
