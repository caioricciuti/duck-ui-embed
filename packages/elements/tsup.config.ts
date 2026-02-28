import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  treeshake: true,
  clean: true,
  external: ['@duckdb/duckdb-wasm', '@duck_ui/core'],
  sourcemap: true,
})
