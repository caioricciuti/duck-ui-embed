import { build } from 'esbuild'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

await build({
  entryPoints: [resolve(__dirname, 'src/index.ts')],
  bundle: true,
  minify: true,
  format: 'iife',
  globalName: 'DuckUI',
  outfile: resolve(__dirname, 'dist/duck-ui.min.js'),
  // @duckdb/duckdb-wasm must be loaded separately by the user
  external: ['@duckdb/duckdb-wasm'],
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  sourcemap: true,
  target: 'es2020',
})

console.log('CDN bundle built → dist/duck-ui.min.js')
