import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    setupFiles: ['tests/helpers/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // Only the three modules under test (+ the helpers they depend on)
      include: [
        'src/routes/auth.js',
        'src/routes/staffDirectory.js',
        'src/routes/staffAttendance.js',
        'src/middleware/auth.js',
        'src/middleware/requireFlag.js',
        'src/lib/entitlements.js',
        'src/lib/staffHelpers.js',
        'src/lib/attendanceHelpers.js',
        'src/lib/asyncHandler.js',
      ],
    },
  },
})
