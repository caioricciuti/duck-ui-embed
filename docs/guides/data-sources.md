# Data Sources

## Overview

Duck-UI loads data into an in-browser DuckDB-WASM instance through **source configs**. There are three primary source types:

| Type | Description |
|------|-------------|
| `file` | Load data from an in-memory `ArrayBuffer`, `Uint8Array`, or `File` object |
| `url` | Fetch a remote file by URL and load it into DuckDB |
| `gateway` | Query a backend API that proxies a database and returns data over HTTP |

Four additional types -- `postgres`, `mysql`, `clickhouse`, and `bigquery` -- are semantic aliases for `gateway`. They use the exact same HTTP mechanism; the `type` field serves as a hint about the upstream database.

All sources are configured in the `DuckProvider` config:

```tsx
import { DuckProvider } from '@duck_ui/core'

<DuckProvider config={{ sources: [
  { type: 'url', name: 'sales', url: '/data/sales.parquet' },
  { type: 'gateway', name: 'users', endpoint: '/api/query', query: 'SELECT * FROM users' },
] }}>
  {children}
</DuckProvider>
```

Each source creates a DuckDB table whose name is taken from the `name` property, unless overridden by `tableName`.

---

## File Sources (`type: 'file'`)

Use file sources when you already have data in memory -- for example from a file input, a `fetch` response, or generated programmatically.

### FileSourceConfig

```ts
interface FileSourceConfig {
  type: 'file'
  name: string                       // Registered source name (becomes the table name)
  data: ArrayBuffer | Uint8Array | File
  format: FileFormat                 // 'parquet' | 'csv' | 'json' | 'arrow'
  tableName?: string                 // Override the table name (defaults to name)
  maxRows?: number                   // LIMIT applied during table creation
  csvOptions?: CsvOptions            // CSV-specific options (only used when format is 'csv')
}
```

### CsvOptions

```ts
interface CsvOptions {
  delimiter?: string    // Column delimiter (default: auto-detect)
  header?: boolean      // Whether the file has a header row (default: true)
  quote?: string        // Quote character (default: '"')
}
```

When no `csvOptions` are provided (or none of the individual options are set), DuckDB's `read_csv_auto` is used, which auto-detects delimiters, headers, and types. When any option is specified, `read_csv` is used with explicit parameters.

### Examples

#### 1. Loading a File from an input element

```tsx
function FileUploader() {
  const { db, conn } = useDuck()

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const format = SchemaInference.detectFormat(file.name) ?? 'csv'
    const tableName = SchemaInference.suggestTableName(file.name)

    await SourceLoader.load(db, conn, {
      type: 'file',
      name: tableName,
      data: file,
      format,
    })
  }

  return <input type="file" onChange={handleFile} accept=".csv,.parquet,.json,.arrow" />
}
```

#### 2. Loading an ArrayBuffer from a fetch response

```ts
const response = await fetch('/data/products.parquet')
const buffer = await response.arrayBuffer()

const source: FileSourceConfig = {
  type: 'file',
  name: 'products',
  data: buffer,
  format: 'parquet',
}
```

#### 3. Using csvOptions for TSV files

```ts
const source: FileSourceConfig = {
  type: 'file',
  name: 'logs',
  data: tsvBuffer,
  format: 'csv',
  csvOptions: {
    delimiter: '\t',
    header: true,
  },
}
```

#### 4. Using maxRows to limit large files

```ts
const source: FileSourceConfig = {
  type: 'file',
  name: 'events',
  data: largeParquetBuffer,
  format: 'parquet',
  maxRows: 10_000,  // Only load the first 10,000 rows
}
```

---

## URL Sources (`type: 'url'`)

URL sources fetch a remote file over HTTP and load it into DuckDB. The file is downloaded entirely into memory, registered as a file buffer, then read with the appropriate DuckDB reader function.

### URLSourceConfig

```ts
interface URLSourceConfig {
  type: 'url'
  name: string                       // Registered source name (becomes the table name)
  url: string                        // URL to fetch the file from
  format?: FileFormat                // Auto-detected from URL or Content-Type if omitted
  tableName?: string                 // Override the table name
  maxRows?: number                   // LIMIT applied during table creation
  csvOptions?: CsvOptions            // CSV-specific options
}
```

### Format Detection

When `format` is not explicitly provided, Duck-UI uses a 3-tier detection strategy:

1. **Explicit `format`** in the config -- always wins if provided
2. **URL extension** -- parsed from the URL pathname (before any query string)
3. **HTTP `Content-Type` header** from the fetch response
4. **Fallback**: `'csv'`

#### Extension Mapping

| Extension | Format |
|-----------|--------|
| `.parquet` | `parquet` |
| `.csv` | `csv` |
| `.tsv` | `csv` |
| `.json` | `json` |
| `.jsonl` | `json` |
| `.ndjson` | `json` |
| `.arrow` | `arrow` |
| `.ipc` | `arrow` |

#### Content-Type Mapping

| Content-Type | Format |
|-------------|--------|
| `text/csv`, `text/tab-separated-values` | `csv` |
| `application/json` | `json` |
| Contains `parquet` or `application/vnd.apache.parquet` | `parquet` |
| Contains `arrow` or `application/vnd.apache.arrow` | `arrow` |

### Examples

#### 1. Loading a Parquet file from URL

The `.parquet` extension is detected automatically -- no need to set `format`:

```tsx
<DuckProvider config={{ sources: [
  {
    type: 'url',
    name: 'sales',
    url: 'https://data.example.com/datasets/sales.parquet',
  },
] }}>
```

#### 2. Loading CSV with explicit format override

If your URL does not have a file extension (or has a misleading one), set `format` explicitly:

```tsx
<DuckProvider config={{ sources: [
  {
    type: 'url',
    name: 'transactions',
    url: 'https://api.example.com/export/latest',
    format: 'csv',
    csvOptions: {
      delimiter: ';',
    },
  },
] }}>
```

#### 3. Loading from an API endpoint (JSON response, no extension)

When fetching from an API that returns JSON, the `application/json` Content-Type header will be detected automatically:

```tsx
<DuckProvider config={{ sources: [
  {
    type: 'url',
    name: 'customers',
    url: 'https://api.example.com/v1/customers',
    // format is auto-detected from Content-Type: application/json
  },
] }}>
```

If the API does not set a standard Content-Type header, specify the format explicitly:

```ts
{
  type: 'url',
  name: 'customers',
  url: 'https://api.example.com/v1/customers',
  format: 'json',
}
```

---

## Gateway Sources

DuckDB-WASM runs entirely in the browser. It cannot open direct TCP connections to databases like PostgreSQL or MySQL. The **gateway pattern** solves this: your backend acts as a proxy that executes a query against the real database and returns the results over HTTP. Duck-UI fetches that response and loads it into the in-browser DuckDB instance.

### BaseGatewayConfig

All gateway source types share this interface:

```ts
interface BaseGatewayConfig {
  name: string                          // Registered source name (becomes the table name)
  endpoint: string                      // Your API endpoint URL
  query?: string                        // Query or command to send to the backend
  format?: FileFormat                   // Expected response format (default: 'json')
  headers?: Record<string, string>      // Custom HTTP headers (e.g., Authorization)
  method?: 'GET' | 'POST'              // HTTP method (default: 'POST')
  tableName?: string                    // Override the table name
  maxRows?: number                      // LIMIT applied during table creation
}
```

### Source Types

| Type | Intended Database |
|------|-------------------|
| `'gateway'` | Generic (any backend) |
| `'postgres'` | PostgreSQL |
| `'mysql'` | MySQL / MariaDB |
| `'clickhouse'` | ClickHouse |
| `'bigquery'` | Google BigQuery |

All five types use the exact same HTTP mechanism. The `type` field is a semantic discriminator -- it does not change the request behavior. Use whichever type best describes your backend for clarity in your config.

### HTTP Behavior

**POST (default)**:
- Sends `{ query: "..." }` as a JSON body
- Sets `Content-Type: application/json` (unless overridden in `headers`)
- Sets `Accept: application/json, text/csv, application/octet-stream`

**GET**:
- Sends no request body
- The `query` property is not sent automatically with GET -- pass it as a URL parameter if your backend expects it
- Sets `Accept: application/json, text/csv, application/octet-stream`

The response format is detected from the response `Content-Type` header, using the same mapping as URL sources. If detection fails, the fallback is `'json'`. You can override this by setting `format` explicitly.

### Examples

#### 1. Generic gateway with POST

```tsx
<DuckProvider config={{ sources: [
  {
    type: 'gateway',
    name: 'orders',
    endpoint: 'https://api.example.com/query',
    query: 'SELECT * FROM orders WHERE created_at > NOW() - INTERVAL 30 DAY',
  },
] }}>
```

#### 2. Postgres alias with auth header

```tsx
<DuckProvider config={{ sources: [
  {
    type: 'postgres',
    name: 'users',
    endpoint: 'https://api.example.com/pg/query',
    query: 'SELECT id, email, plan, created_at FROM users WHERE active = true',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  },
] }}>
```

#### 3. ClickHouse with GET method

```tsx
<DuckProvider config={{ sources: [
  {
    type: 'clickhouse',
    name: 'events',
    endpoint: 'https://ch-proxy.example.com/query?query=SELECT+*+FROM+events+LIMIT+5000',
    method: 'GET',
    format: 'json',
  },
] }}>
```

#### 4. Setting format explicitly

If your backend returns Parquet bytes, tell Duck-UI to expect that format:

```tsx
<DuckProvider config={{ sources: [
  {
    type: 'gateway',
    name: 'metrics',
    endpoint: 'https://api.example.com/export/metrics',
    query: 'SELECT * FROM system_metrics',
    format: 'parquet',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  },
] }}>
```

For detailed backend implementation examples (Express, FastAPI, etc.), see the [Gateway Pattern guide](./gateway-pattern.md).

---

## Multiple Sources

You can combine any number and type of sources in a single config. Each source creates its own DuckDB table, and you can query across them with standard SQL JOINs.

```tsx
<DuckProvider config={{ sources: [
  // Public Parquet file
  {
    type: 'url',
    name: 'products',
    url: 'https://data.example.com/products.parquet',
  },
  // CSV pricing data
  {
    type: 'url',
    name: 'pricing',
    url: 'https://data.example.com/pricing.csv',
  },
  // Live order data from PostgreSQL via gateway
  {
    type: 'postgres',
    name: 'orders',
    endpoint: 'https://api.example.com/pg/query',
    query: 'SELECT id, product_id, quantity, total, created_at FROM orders',
    headers: { 'Authorization': `Bearer ${token}` },
  },
] }}>
```

Once all sources are loaded, you can join across tables in your queries:

```sql
SELECT
  o.id AS order_id,
  p.name AS product_name,
  pr.unit_price,
  o.quantity,
  o.total,
  o.created_at
FROM orders o
JOIN products p ON o.product_id = p.id
JOIN pricing pr ON p.id = pr.product_id
ORDER BY o.created_at DESC
```

---

## maxRows

The `maxRows` option is available on all source types. It appends a `LIMIT` clause to the `CREATE TABLE` statement:

```sql
CREATE OR REPLACE TABLE "sales" AS SELECT * FROM read_parquet('sales.parquet') LIMIT 10000
```

This limits the number of rows loaded into the in-browser DuckDB table, not the amount of data downloaded. The full file is still fetched and registered; `maxRows` controls how many rows are read from it.

**Use cases:**

- **Preview mode** -- let users preview a large dataset before committing to a full load
- **Large datasets** -- cap memory usage in the browser for datasets that would otherwise be too large
- **Development** -- speed up iteration by working with a subset of data

```ts
{
  type: 'url',
  name: 'events',
  url: 'https://data.example.com/events-2024.parquet',
  maxRows: 50_000,
}
```

---

## Runtime Source Management

The `DataSourceRegistry` lets you manage source configs programmatically at runtime. Access it through `useDuck().registry`.

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `register` | `register(config: SourceConfig): void` | Add a source config to the registry |
| `remove` | `remove(name: string): boolean` | Remove a source config by name; returns `true` if it existed |
| `get` | `get(name: string): SourceConfig \| undefined` | Retrieve a source config by name |
| `list` | `list(): SourceConfig[]` | Return all registered source configs |
| `has` | `has(name: string): boolean` | Check whether a source config exists |
| `clear` | `clear(): void` | Remove all source configs |

### Example

```tsx
function AddDataSource() {
  const { registry, db, conn } = useDuck()

  async function addSource(url: string, name: string) {
    const config: URLSourceConfig = {
      type: 'url',
      name,
      url,
    }

    // Register the config
    registry.register(config)

    // Actually load the data into DuckDB
    await SourceLoader.load(db, conn, config)
  }

  return (
    <button onClick={() => addSource('/data/sales.parquet', 'sales')}>
      Load Sales Data
    </button>
  )
}
```

> **Note:** The registry only manages source configs (metadata). Registering a config does **not** create a DuckDB table. You must call `SourceLoader.load()` separately to fetch the data and create the table.

---

## SchemaInference Utilities

The `SchemaInference` class provides two static helper methods for working with files, useful when building file-upload UIs or dynamically determining source configs.

### `SchemaInference.detectFormat(fileName, mimeType?)`

Detects the file format from a file name (by extension) or MIME type. Returns `null` if the format cannot be determined.

```ts
SchemaInference.detectFormat('data.parquet')           // 'parquet'
SchemaInference.detectFormat('export.csv')              // 'csv'
SchemaInference.detectFormat('events.tsv')              // 'csv'
SchemaInference.detectFormat('records.jsonl')            // 'json'
SchemaInference.detectFormat('table.ipc')               // 'arrow'
SchemaInference.detectFormat('unknown.bin')              // null
SchemaInference.detectFormat('noext', 'application/json') // 'json'
SchemaInference.detectFormat('noext', 'text/csv')       // 'csv'
```

The method first checks the file extension, then falls back to the MIME type. Extension detection uses the same mapping as URL sources.

### `SchemaInference.suggestTableName(fileName)`

Generates a clean table name from a file name by removing the extension, replacing non-alphanumeric characters with underscores, trimming leading/trailing underscores, and lowercasing the result.

```ts
SchemaInference.suggestTableName('Sales Data.csv')      // 'sales_data'
SchemaInference.suggestTableName('2024-events.parquet')  // '2024_events'
SchemaInference.suggestTableName('My Report (v2).json')  // 'my_report__v2_'
SchemaInference.suggestTableName('__test__.csv')         // 'test'
```

### Combined usage for file uploads

```tsx
function handleFile(file: File) {
  const format = SchemaInference.detectFormat(file.name, file.type)
  const tableName = SchemaInference.suggestTableName(file.name)

  if (!format) {
    alert('Unsupported file format')
    return
  }

  return {
    type: 'file' as const,
    name: tableName,
    data: file,
    format,
  }
}
```
