import * as esbuild from 'esbuild'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const testFiles = [
  'src/utils/parseTarea.test.ts',
  'src/utils/dashboardMetrics.test.ts',
  'src/utils/getMetricDetail.test.ts',
  'src/utils/dashboardFilters.test.ts',
  'src/utils/cuadroQr.test.ts',
  'src/utils/cuadroTareas.test.ts',
  'src/data/fincaData.test.ts',
  'src/utils/dashboardState.test.ts',
  'src/utils/firestoreError.test.ts',
  'src/utils/mobileTaskPayloads.test.ts',
  'src/utils/vineyardMapLabels.test.ts',
  'src/utils/tareaProgress.test.ts',
  'src/utils/buildParteDeLaboresPayload.test.ts',
  'src/utils/parteLabores.test.ts',
  'src/modules/ordenesCura/utils/ocNumber.test.ts',
  'src/validation/tareaCreate.test.ts',
  'src/validation/accidentReport.test.ts',
]

const outDir = mkdtempSync(join(tmpdir(), 'gestion-campo-tests-'))

try {
  const built = []

  for (const file of testFiles) {
    const outFile = join(outDir, file.replace(/^src\//, '').replace(/\.ts$/, '.mjs'))
    mkdirSync(join(outFile, '..'), { recursive: true })
    await esbuild.build({
      entryPoints: [file],
      outfile: outFile,
      bundle: true,
      platform: 'node',
      format: 'esm',
      sourcemap: 'inline',
      define: {
        'import.meta.env.DEV': 'false',
        'import.meta.env.PROD': 'true',
      },
    })
    built.push(outFile)
  }

  const result = spawnSync(process.execPath, ['--test', ...built], {
    stdio: 'inherit',
    cwd: process.cwd(),
  })

  process.exit(result.status ?? 1)
} finally {
  rmSync(outDir, { recursive: true, force: true })
}
