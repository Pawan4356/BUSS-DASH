// Runs before every test file: deterministic env + no real database.
process.env.JWT_SECRET = 'test-secret'
process.env.TZ = 'UTC'
