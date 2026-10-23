// Regenerates tests/TEST_CASES.md from a real run of the suite.
// Usage (from the repo root): npm run test:cases --workspace backend/express
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')
const tmp = mkdtempSync(path.join(tmpdir(), 'test-cases-'))
const jsonPath = path.join(tmp, 'results.json')

try {
  execFileSync(
    'npx',
    ['vitest', 'run', '--config', path.join(here, 'vitest.config.js'), '--reporter=json', `--outputFile=${jsonPath}`],
    { cwd: root, stdio: ['ignore', 'ignore', 'inherit'] },
  )
} catch {
  // A failing run still writes the JSON; the FAIL rows make the problem visible.
}

const results = JSON.parse(readFileSync(jsonPath, 'utf8'))
rmSync(tmp, { recursive: true, force: true })

// Tests in knownDefects.test.js are `it.fails`: "passed" means the defect is still there.
const resultLabel = (file, status) => {
  if (status !== 'passed') return status === 'failed' ? 'FAIL' : status.toUpperCase()
  return file.includes('knownDefects') ? 'XFAIL (known defect)' : 'PASS'
}

const files = results.testResults
  .map((f) => ({ rel: path.relative(here, f.name), tests: f.assertionResults }))
  .sort((a, b) => a.rel.localeCompare(b.rel))

const total = files.reduce((n, f) => n + f.tests.length, 0)
const out = [
  '# Test case register (auto-generated from the last run)',
  '',
  'Regenerate with `npm run test:cases --workspace backend/express`.',
  '',
  'Result column: PASS = behaviour matches expectation. XFAIL = known defect, test asserts the correct behaviour and is expected to fail until the code is fixed.',
  '',
  `Total test cases: **${total}**`,
  '',
]

for (const [heading, dir] of [['Black-box tests', 'tests/blackbox/'], ['White-box tests', 'tests/whitebox/']]) {
  out.push('', `## ${heading}`, '')
  for (const f of files.filter((x) => x.rel.startsWith(dir))) {
    out.push('', `### \`${f.rel}\``, '', '| # | Test case | Result |', '|---|---|---|')
    f.tests.forEach((t, i) => {
      const name = [...t.ancestorTitles, t.title].join(' ').replace(/\|/g, '\\|')
      out.push(`| ${i + 1} | ${name} | ${resultLabel(f.rel, t.status)} |`)
    })
  }
}

writeFileSync(path.join(here, 'tests', 'TEST_CASES.md'), out.join('\n') + '\n')
console.log(`TEST_CASES.md written: ${total} test cases in ${files.length} files`)
