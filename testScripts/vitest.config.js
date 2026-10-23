import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  root: fileURLToPath(new URL('..', import.meta.url)),
  test: {
    environment: 'node',
    include: ['testScripts/tests/**/*.test.js'],
    setupFiles: ['testScripts/tests/helpers/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // Only the three modules under test (+ the helpers they depend on)
      include: [
        'backend/express/src/routes/auth.js',
        'backend/express/src/routes/staffDirectory.js',
        'backend/express/src/routes/staffAttendance.js',
        'backend/express/src/middleware/auth.js',
        'backend/express/src/middleware/requireFlag.js',
        'backend/express/src/lib/entitlements.js',
        'backend/express/src/lib/staffHelpers.js',
        'backend/express/src/lib/attendanceHelpers.js',
        'backend/express/src/lib/asyncHandler.js',
      ],
    },
  },
})
