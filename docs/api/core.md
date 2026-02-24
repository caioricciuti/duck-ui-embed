# @duck_ui/core API Reference

Pure TypeScript package for running DuckDB-WASM in the browser. No framework dependencies.

```
npm install @duck_ui/core
```

---

## Table of Contents

- [Classes](#classes)
  - [DuckDBManager](#duckdbmanager)
  - [ConnectionPool](#connectionpool)
  - [QueryExecutor](#queryexecutor)
  - [QueryCache](#querycache)
  - [FilterInjector](#filterinjector)
  - [SchemaInspector](#schemainspector)
  - [SchemaInference](#schemainference)
  - [DataSourceRegistry](#datasourceregistry)
  - [SourceLoader](#sourceloader)
  - [FileSource](#filesource)
  - [URLSource](#urlsource)
  - [GatewaySource](#gatewaysource)
- [Types](#types)
  - [FileFormat](#fileformat)
  - [CsvOptions](#csvoptions)
  - [FileSourceConfig](#filesourceconfig)
  - [URLSourceConfig](#urlsourceconfig)
  - [BaseGatewayConfig](#basegatewayconfig)
  - [Gateway Type Variants](#gateway-type-variants)
  - [SourceConfig](#sourceconfig)
  - [QueryResult](#queryresult)
  - [ColumnInfo](#columninfo)
  - [TableSchema](#tableschema)
  - [ColumnSchema](#columnschema)
  - [ConnectionHandle](#connectionhandle)
  - [FilterValue](#filtervalue)
  - [FilterState](#filterstate)
- [Errors](#errors)
  - [DuckUIError](#duckuierror)
  - [EngineNotInitializedError](#enginenotinitializederror)
  - [QuerySyntaxError](#querysyntaxerror)
  - [SourceNotFoundError](#sourcenotfounderror)
  - [SourceLoadError](#sourceloaderror)
  - [MemoryError](#memoryerror)
  - [ConnectionError](#connectionerror)

---

## Classes

### DuckDBManager

Manages the DuckDB-WASM lifecycle: WASM bundle selection, Worker creation, database instantiation, and teardown.

#### Constructor

```ts
new DuckDBManager(config?: DuckDBManagerConfig)
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `config` | `DuckDBManagerConfig` | `{}` | Optional configuration object |

##### DuckDBManagerConfig

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `memoryLimit` | `number` | `268435456` (256 MB) | Memory limit in bytes |
| `memoryWarningThreshold` | `number` | `0.8` | Fraction (0-1) at which to log memory warnings |

#### Methods

##### `initialize(): Promise<void>`

Fetches WASM bundles from jsDelivr CDN, selects the best bundle for the current browser (EH or MVP), creates a Web Worker, and instantiates the `AsyncDuckDB` engine.

Must be called before any other method that accesses the database.

```ts
const manager = new DuckDBManager({ memoryLimit: 512 * 1024 * 1024 });
await manager.initialize();
```

##### `getDatabase(): duckdb.AsyncDuckDB`

Returns the initialized `AsyncDuckDB` instance. Throws if `initialize()` has not been called.

```ts
const db = manager.getDatabase();
```

##### `createConnection(): Promise<duckdb.AsyncDuckDBConnection>`

Creates and returns a new database connection.

```ts
const conn = await manager.createConnection();
const result = await conn.query('SELECT 42 AS answer');
await conn.close();
```

##### `terminate(): Promise<void>`

Terminates the database and its Web Worker, releasing all resources. After calling this, the manager cannot be used until `initialize()` is called again.

```ts
await manager.terminate();
```

##### `isInitialized(): boolean`

Returns `true` if the database has been initialized and is ready for use.

```ts
if (!manager.isInitialized()) {
  await manager.initialize();
}
```

#### Full Example

```ts
import { DuckDBManager } from '@duck_ui/core';

const manager = new DuckDBManager();
await manager.initialize();

const conn = await manager.createConnection();
const result = await conn.query('SELECT 1 + 1 AS sum');
console.log(result.toArray()); // [{ sum: 2 }]

await conn.close();
await manager.terminate();
```

---

### ConnectionPool

Manages a pool of reusable `AsyncDuckDBConnection` instances. Reuses idle connections, creates new ones up to a maximum size, and queues callers when the pool is exhausted.

#### Constructor

```ts
new ConnectionPool(manager: DuckDBManager, config?: ConnectionPoolConfig)
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `manager` | `DuckDBManager` | -- | An initialized `DuckDBManager` instance |
| `config` | `ConnectionPoolConfig` | `{}` | Optional pool configuration |

##### ConnectionPoolConfig

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `maxSize` | `number` | `4` | Maximum number of concurrent connections |
| `acquireTimeoutMs` | `number` | `30000` | Milliseconds to wait before timing out when all connections are in use |

#### Methods

##### `acquire(): Promise<duckdb.AsyncDuckDBConnection>`

Returns a connection from the pool. The resolution order is:

1. Reuse an idle connection from the pool.
2. Create a new connection if the pool is below `maxSize`.
3. Wait for a connection to be released (throws `ConnectionError` on timeout).

```ts
const conn = await pool.acquire();
```

##### `release(conn: duckdb.AsyncDuckDBConnection): void`

Returns a connection to the pool. If another caller is waiting, the connection is handed off directly without returning to the idle pool.

```ts
pool.release(conn);
```

##### `drain(): Promise<void>`

Closes every connection (both idle and in-use), rejects all pending waiters with a `ConnectionError`, and resets the pool to empty.

```ts
await pool.drain();
```

#### Full Example

```ts
import { DuckDBManager, ConnectionPool } from '@duck_ui/core';

const manager = new DuckDBManager();
await manager.initialize();

const pool = new ConnectionPool(manager, { maxSize: 8 });

const conn = await pool.acquire();
try {
  const result = await conn.query('SELECT count(*) FROM sales');
  console.log(result.toArray());
} finally {
  pool.release(conn);
}

// On shutdown
await pool.drain();
await manager.terminate();
```

---

### QueryExecutor

Executes SQL queries through a `ConnectionHandle`, automatically acquires and releases connections, coerces Arrow/DuckDB types to plain JavaScript primitives, and measures execution time.

#### Constructor

```ts
new QueryExecutor(handle: ConnectionHandle)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `handle` | `ConnectionHandle` | Object with `acquire()` and `release()` methods |

See [ConnectionHandle](#connectionhandle) for the interface definition.

#### Methods

##### `execute(sql: string): Promise<QueryResult>`

Executes the given SQL string and returns a `QueryResult`. The connection is acquired before execution and released afterward (even on error).

```ts
const executor = new QueryExecutor({
  acquire: () => pool.acquire(),
  release: (conn) => pool.release(conn),
});

const result = await executor.execute('SELECT * FROM users LIMIT 10');
console.log(result.rows);        // Record<string, unknown>[]
console.log(result.columns);     // ColumnInfo[]
console.log(result.rowCount);    // number
console.log(result.executionTime); // milliseconds
```

#### Value Coercion

The executor automatically coerces DuckDB-WASM Arrow types to plain JavaScript values:

| Arrow / DuckDB Type | JavaScript Type | Rule |
|---------------------|-----------------|------|
| `BigInt` | `number` | `Number(bigint)` |
| `Date` | `string` | `.toISOString()` |
| Arrow Decimal (object with `low`/`high` fields) | `number` | `high * 2^32 + (low >>> 0)` |
| Arrow objects with `valueOf()` returning number/bigint/string | `number` or `string` | Calls `.valueOf()` and converts |
| Arrays (LIST columns) | `unknown[]` | Recursively coerces each element |
| `null` / `undefined` | `null` / `undefined` | Passed through |

---

### QueryCache

In-memory LRU cache for query results, with a configurable maximum size and time-to-live.

#### Constructor

```ts
new QueryCache(maxSize?: number, ttlMs?: number)
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `maxSize` | `number` | `100` | Maximum number of cached entries |
| `ttlMs` | `number` | `300000` (5 min) | Time-to-live per entry in milliseconds |

#### Methods

##### `get<T>(key: string): T | undefined`

Returns the cached value for `key`, or `undefined` if the key is missing or the entry has expired. Expired entries are deleted on access.

```ts
const cached = cache.get<QueryResult>('SELECT count(*) FROM orders');
if (cached) {
  return cached;
}
```

##### `set(key: string, result: unknown): void`

Stores `result` under `key`. If the cache is at capacity, the oldest entry (first inserted) is evicted before the new entry is added.

```ts
cache.set('SELECT count(*) FROM orders', queryResult);
```

##### `invalidate(key?: string): void`

If `key` is provided, removes that single entry. If called with no arguments, clears the entire cache.

```ts
cache.invalidate('SELECT count(*) FROM orders'); // remove one
cache.invalidate();                                // clear all
```

##### `get size(): number`

Returns the current number of entries in the cache.

```ts
console.log(cache.size); // 42
```

#### Full Example

```ts
import { QueryCache, QueryExecutor } from '@duck_ui/core';

const cache = new QueryCache(200, 60_000); // 200 entries, 1 min TTL
const executor = new QueryExecutor(handle);

async function cachedQuery(sql: string) {
  const cached = cache.get(sql);
  if (cached) return cached;

  const result = await executor.execute(sql);
  cache.set(sql, result);
  return result;
}
```

---

### FilterInjector

Static utility class that injects WHERE clauses into SQL queries by wrapping the original SQL as a subquery. All identifiers and string literals are safely escaped.

#### Static Methods

##### `inject(sql: string, filters: FilterState, tableName: string): string`

Wraps the original SQL so that every occurrence of `tableName` is replaced with a filtered subquery. Returns the original SQL unchanged if the filter state produces no conditions.

```ts
const sql = 'SELECT * FROM sales';
const filters = { region: ['US', 'EU'], amount: { min: 100, max: 5000 } };

const filtered = FilterInjector.inject(sql, filters, 'sales');
// SELECT * FROM (SELECT * FROM sales ...) AS _result
// where "sales" is replaced with a filtered subquery
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `sql` | `string` | The original SQL query |
| `filters` | `FilterState` | Column-value filter map |
| `tableName` | `string` | The table name to replace with filtered subquery |

##### `buildConditions(filters: FilterState): string[]`

Generates an array of SQL condition strings from a `FilterState` object. Useful if you need to inspect or compose conditions manually.

```ts
const conditions = FilterInjector.buildConditions({
  status: 'active',
  category: ['A', 'B'],
  price: { min: 10, max: 99 },
  created: { start: '2024-01-01', end: '2024-12-31' },
  featured: true,
  deleted: null, // skipped
});

// [
//   '"status" = \'active\'',
//   '"category" IN (\'A\', \'B\')',
//   '"price" >= 10 AND "price" <= 99',
//   '"created" BETWEEN \'2024-01-01\' AND \'2024-12-31\'',
//   '"featured" = true',
// ]
```

#### Condition Rules

| FilterValue Type | Generated SQL | Example |
|------------------|---------------|---------|
| `string[]` or `number[]` | `"col" IN (v1, v2, ...)` | `"region" IN ('US', 'EU')` |
| `{ min, max }` (numeric range) | `"col" >= min AND "col" <= max` | `"price" >= 10 AND "price" <= 99` |
| `{ start, end }` (date range) | `"col" BETWEEN 'start' AND 'end'` | `"date" BETWEEN '2024-01-01' AND '2024-12-31'` |
| `string` | `"col" = 'value'` | `"status" = 'active'` |
| `number` | `"col" = value` | `"amount" = 42` |
| `boolean` | `"col" = value` | `"featured" = true` |
| `null` | skipped | -- |

#### SQL Safety

- Column identifiers are double-quoted and inner double quotes are escaped (`"` to `""`).
- String values are single-quote escaped (`'` to `''`).
- Table name references in `inject()` are matched via a word-boundary-aware regex with special characters escaped.

---

### SchemaInspector

Inspects DuckDB table metadata: lists tables, retrieves column schemas, and computes per-column statistics.

#### Constructor

```ts
new SchemaInspector(handle: ConnectionHandle)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `handle` | `ConnectionHandle` | Object with `acquire()` and `release()` methods |

#### Methods

##### `getTables(): Promise<string[]>`

Returns the names of all tables in the `main` schema.

```ts
const inspector = new SchemaInspector(handle);
const tables = await inspector.getTables();
// ['sales', 'customers', 'products']
```

##### `getTableSchema(tableName: string): Promise<TableSchema>`

Returns the full column metadata for a table.

```ts
const schema = await inspector.getTableSchema('sales');
// {
//   name: 'sales',
//   columns: [
//     { name: 'id', type: 'INTEGER', nullable: false },
//     { name: 'amount', type: 'DOUBLE', nullable: true },
//     { name: 'region', type: 'VARCHAR', nullable: true },
//   ]
// }
```

##### `getColumnStats(tableName: string, columnName: string): Promise<Record<string, unknown>>`

Returns aggregate statistics for a single column.

```ts
const stats = await inspector.getColumnStats('sales', 'amount');
// { count: 10000, distinctCount: 483, min: 1.50, max: 9999.99 }
```

| Return Property | Description |
|-----------------|-------------|
| `count` | Total number of rows |
| `distinctCount` | Number of distinct values |
| `min` | Minimum value |
| `max` | Maximum value |

---

### SchemaInference

Static utility class for detecting file formats and suggesting table names from file names.

#### Static Methods

##### `detectFormat(fileName: string, mimeType?: string): FileFormat | null`

Attempts to detect the `FileFormat` from the file extension first, then falls back to the MIME type. Returns `null` if the format cannot be determined.

```ts
SchemaInference.detectFormat('data.parquet');           // 'parquet'
SchemaInference.detectFormat('report.csv');              // 'csv'
SchemaInference.detectFormat('report.tsv');              // 'csv'
SchemaInference.detectFormat('events.json');             // 'json'
SchemaInference.detectFormat('events.jsonl');            // 'json'
SchemaInference.detectFormat('events.ndjson');           // 'json'
SchemaInference.detectFormat('table.arrow');             // 'arrow'
SchemaInference.detectFormat('table.ipc');               // 'arrow'
SchemaInference.detectFormat('unknown.bin', 'text/csv'); // 'csv'
SchemaInference.detectFormat('unknown.bin');              // null
```

**Extension mapping:**

| Extension | FileFormat |
|-----------|------------|
| `.parquet` | `'parquet'` |
| `.csv`, `.tsv` | `'csv'` |
| `.json`, `.jsonl`, `.ndjson` | `'json'` |
| `.arrow`, `.ipc` | `'arrow'` |

**MIME type mapping (fallback):**

| MIME type contains | FileFormat |
|--------------------|------------|
| `parquet` | `'parquet'` |
| `csv` or `tab-separated` | `'csv'` |
| `json` | `'json'` |
| `arrow` | `'arrow'` |

##### `suggestTableName(fileName: string): string`

Generates a SQL-safe table name from a file name by removing the extension, replacing non-alphanumeric characters with underscores, trimming leading/trailing underscores, and lowercasing.

```ts
SchemaInference.suggestTableName('My Sales Data.csv');   // 'my_sales_data'
SchemaInference.suggestTableName('2024-Q1-report.json'); // '2024_q1_report'
SchemaInference.suggestTableName('__test__.parquet');     // 'test'
```

---

### DataSourceRegistry

A simple in-memory registry that stores `SourceConfig` objects keyed by `name`.

#### Constructor

```ts
new DataSourceRegistry()
```

No arguments.

#### Methods

##### `register(config: SourceConfig): void`

Registers (or overwrites) a data source configuration. The source's `name` field is used as the key.

```ts
const registry = new DataSourceRegistry();
registry.register({
  type: 'file',
  name: 'sales',
  data: csvBuffer,
  format: 'csv',
});
```

##### `remove(name: string): boolean`

Removes a source by name. Returns `true` if the source existed, `false` otherwise.

```ts
registry.remove('sales'); // true
registry.remove('sales'); // false (already removed)
```

##### `get(name: string): SourceConfig | undefined`

Returns the configuration for the named source, or `undefined` if not registered.

```ts
const config = registry.get('sales');
```

##### `list(): SourceConfig[]`

Returns all registered source configurations as an array.

```ts
const sources = registry.list();
```

##### `has(name: string): boolean`

Returns `true` if a source with the given name is registered.

```ts
if (registry.has('sales')) { /* ... */ }
```

##### `clear(): void`

Removes all registered sources.

```ts
registry.clear();
```

---

### SourceLoader

Static dispatcher that loads data into DuckDB from any supported `SourceConfig`. Routes to `FileSource`, `URLSource`, or `GatewaySource` based on the `type` field.

#### Static Methods

##### `load(db: AsyncDuckDB, conn: AsyncDuckDBConnection, source: SourceConfig): Promise<void>`

Loads data described by `source` into a DuckDB table. Wraps underlying errors in a `SourceLoadError`.

```ts
import { SourceLoader, DuckDBManager } from '@duck_ui/core';

const manager = new DuckDBManager();
await manager.initialize();
const db = manager.getDatabase();
const conn = await manager.createConnection();

await SourceLoader.load(db, conn, {
  type: 'file',
  name: 'sales',
  data: parquetBuffer,
  format: 'parquet',
});

await SourceLoader.load(db, conn, {
  type: 'url',
  name: 'remote_data',
  url: 'https://example.com/data.csv',
});

await SourceLoader.load(db, conn, {
  type: 'gateway',
  name: 'api_data',
  endpoint: 'https://api.example.com/query',
  query: 'SELECT * FROM events',
});
```

**Dispatch rules:**

| `source.type` | Handler |
|----------------|---------|
| `'file'` | `FileSource.load()` |
| `'url'` | `URLSource.load()` |
| `'gateway'`, `'postgres'`, `'mysql'`, `'clickhouse'`, `'bigquery'` | `GatewaySource.load()` |

---

### FileSource

Loads in-memory file data (ArrayBuffer, Uint8Array, or File) into a DuckDB table by registering it as a virtual file and running a `CREATE TABLE AS SELECT` statement.

#### Static Methods

##### `load(db: AsyncDuckDB, conn: AsyncDuckDBConnection, config: FileSourceConfig): Promise<void>`

Registers the file buffer with DuckDB and creates a table from it.

```ts
const csvFile = new File([csvString], 'data.csv');

await FileSource.load(db, conn, {
  type: 'file',
  name: 'my_data',
  data: csvFile,
  format: 'csv',
  tableName: 'analytics',
  maxRows: 100_000,
  csvOptions: { delimiter: ';', header: true },
});
```

##### `buildCreateSQL(tableName: string, fileName: string, format: FileFormat, maxRows?: number, csvOptions?: CsvOptions): string`

Generates the SQL statement used to create the table. Useful for debugging or logging.

```ts
FileSource.buildCreateSQL('sales', 'sales.parquet', 'parquet');
// CREATE OR REPLACE TABLE "sales" AS SELECT * FROM read_parquet('sales.parquet')

FileSource.buildCreateSQL('data', 'data.csv', 'csv', 1000);
// CREATE OR REPLACE TABLE "data" AS SELECT * FROM read_csv_auto('data.csv') LIMIT 1000

FileSource.buildCreateSQL('data', 'data.csv', 'csv', undefined, { delimiter: '\t' });
// CREATE OR REPLACE TABLE "data" AS SELECT * FROM read_csv('data.csv', delim='	')
```

**Reader functions by format:**

| Format | Reader | Notes |
|--------|--------|-------|
| `'parquet'` | `read_parquet('file')` | |
| `'csv'` | `read_csv_auto('file')` | Default, no CSV options |
| `'csv'` | `read_csv('file', ...)` | When `csvOptions` are provided |
| `'json'` | `read_json_auto('file')` | |
| `'arrow'` | `read_arrow('file')` | |

---

### URLSource

Fetches a file from a URL, detects its format, registers the response buffer with DuckDB, and creates a table.

#### Static Methods

##### `load(db: AsyncDuckDB, conn: AsyncDuckDBConnection, config: URLSourceConfig): Promise<void>`

Fetches the URL, auto-detects format, and creates the table.

```ts
await URLSource.load(db, conn, {
  type: 'url',
  name: 'remote_sales',
  url: 'https://data.example.com/sales.parquet',
  tableName: 'sales',
});
```

**Format detection priority:**

1. `config.format` (explicit)
2. URL file extension (`.parquet`, `.csv`, `.tsv`, `.json`, `.jsonl`, `.ndjson`, `.arrow`, `.ipc`)
3. Response `Content-Type` header (`text/csv`, `application/json`, `parquet`, `arrow`)
4. Fallback: `'csv'`

**URL extension mapping:**

| Extension | FileFormat |
|-----------|------------|
| `.parquet` | `'parquet'` |
| `.csv`, `.tsv` | `'csv'` |
| `.json`, `.jsonl`, `.ndjson` | `'json'` |
| `.arrow`, `.ipc` | `'arrow'` |

**Content-Type mapping:**

| Header contains | FileFormat |
|-----------------|------------|
| `text/csv` or `text/tab-separated` | `'csv'` |
| `application/json` | `'json'` |
| `parquet` or `application/vnd.apache.parquet` | `'parquet'` |
| `arrow` or `application/vnd.apache.arrow` | `'arrow'` |

---

### GatewaySource

Fetches data from an HTTP API gateway (used for proxied database connections like Postgres, MySQL, ClickHouse, BigQuery) and loads the response into a DuckDB table.

#### Static Methods

##### `load(db: AsyncDuckDB, conn: AsyncDuckDBConnection, config: BaseGatewayConfig): Promise<void>`

Sends the request to the gateway endpoint and creates a table from the response.

```ts
await GatewaySource.load(db, conn, {
  type: 'postgres',
  name: 'pg_orders',
  endpoint: 'https://gateway.example.com/postgres/query',
  query: 'SELECT * FROM orders WHERE created_at > now() - interval \'7 days\'',
  headers: { Authorization: 'Bearer token123' },
  tableName: 'recent_orders',
});
```

**Request defaults:**

| Setting | Default |
|---------|---------|
| HTTP method | `POST` |
| `Accept` header | `application/json, text/csv, application/octet-stream` |
| `Content-Type` (POST) | `application/json` (if not overridden via `headers`) |
| Request body (POST) | `JSON.stringify({ query: config.query })` |

**Format detection:** `config.format` > response `Content-Type` > `'json'` fallback.

---

## Types

### FileFormat

```ts
type FileFormat = 'parquet' | 'csv' | 'json' | 'arrow'
```

### CsvOptions

```ts
interface CsvOptions {
  /** Column delimiter (default: auto-detect) */
  delimiter?: string
  /** Whether the file has a header row (default: true) */
  header?: boolean
  /** Quote character (default: '"') */
  quote?: string
}
```

### FileSourceConfig

```ts
interface FileSourceConfig {
  type: 'file'
  /** Name to register this source as (becomes the table name) */
  name: string
  /** File data as ArrayBuffer, Uint8Array, or File */
  data: ArrayBuffer | Uint8Array | File
  /** File format */
  format: FileFormat
  /** Table name override (defaults to name) */
  tableName?: string
  /** Maximum rows to load (applies LIMIT during table creation) */
  maxRows?: number
  /** CSV-specific options (only used when format is 'csv') */
  csvOptions?: CsvOptions
}
```

### URLSourceConfig

```ts
interface URLSourceConfig {
  type: 'url'
  /** Name to register this source as */
  name: string
  /** URL to fetch the file from */
  url: string
  /** File format (auto-detected from URL extension or Content-Type if not provided) */
  format?: FileFormat
  /** Table name override */
  tableName?: string
  /** Maximum rows to load (applies LIMIT during table creation) */
  maxRows?: number
  /** CSV-specific options (only used when format is 'csv') */
  csvOptions?: CsvOptions
}
```

### BaseGatewayConfig

```ts
interface BaseGatewayConfig {
  name: string
  /** URL of the data gateway API endpoint */
  endpoint: string
  /** Query or command to send to the gateway */
  query?: string
  /** Expected response format (default: 'json') */
  format?: FileFormat
  /** Custom HTTP headers (e.g. Authorization) */
  headers?: Record<string, string>
  /** HTTP method (default: 'POST') */
  method?: 'GET' | 'POST'
  /** Table name override */
  tableName?: string
  /** Maximum rows to load */
  maxRows?: number
}
```

### Gateway Type Variants

Each gateway variant extends `BaseGatewayConfig` with a discriminating `type` field:

```ts
interface GatewaySourceConfig extends BaseGatewayConfig {
  type: 'gateway'
}

interface PostgresSourceConfig extends BaseGatewayConfig {
  type: 'postgres'
}

interface MySQLSourceConfig extends BaseGatewayConfig {
  type: 'mysql'
}

interface ClickHouseSourceConfig extends BaseGatewayConfig {
  type: 'clickhouse'
}

interface BigQuerySourceConfig extends BaseGatewayConfig {
  type: 'bigquery'
}
```

### SourceConfig

Union of all source configuration types:

```ts
type SourceConfig =
  | FileSourceConfig
  | URLSourceConfig
  | GatewaySourceConfig
  | PostgresSourceConfig
  | MySQLSourceConfig
  | ClickHouseSourceConfig
  | BigQuerySourceConfig
```

### QueryResult

```ts
interface QueryResult {
  /** Rows as array of objects with column names as keys */
  rows: Record<string, unknown>[]
  /** Column metadata */
  columns: ColumnInfo[]
  /** Number of rows returned */
  rowCount: number
  /** Execution time in milliseconds */
  executionTime: number
}
```

### ColumnInfo

```ts
interface ColumnInfo {
  name: string
  type: string
  nullable: boolean
}
```

### TableSchema

```ts
interface TableSchema {
  name: string
  columns: ColumnSchema[]
}
```

### ColumnSchema

```ts
interface ColumnSchema {
  name: string
  type: string
  nullable: boolean
}
```

### ConnectionHandle

```ts
interface ConnectionHandle {
  acquire: () => Promise<duckdb.AsyncDuckDBConnection>
  release: (conn: duckdb.AsyncDuckDBConnection) => void
}
```

Use this to connect a `QueryExecutor` or `SchemaInspector` to any connection strategy (pool, single connection, etc.):

```ts
// With ConnectionPool
const handle: ConnectionHandle = {
  acquire: () => pool.acquire(),
  release: (conn) => pool.release(conn),
};

// With a single connection
let conn: duckdb.AsyncDuckDBConnection;
const handle: ConnectionHandle = {
  acquire: async () => {
    conn = await manager.createConnection();
    return conn;
  },
  release: (c) => c.close(),
};
```

### FilterValue

```ts
type FilterValue =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | { min: number; max: number }
  | { start: string; end: string }
  | null
```

### FilterState

```ts
interface FilterState {
  [column: string]: FilterValue
}
```

---

## Errors

All custom errors extend `DuckUIError`, which itself extends the built-in `Error`. Each error has a `code` property for programmatic matching.

### DuckUIError

Base error class for all `@duck_ui/core` errors.

```ts
class DuckUIError extends Error {
  code: string
  constructor(message: string, code: string)
}
```

```ts
try {
  await executor.execute(sql);
} catch (err) {
  if (err instanceof DuckUIError) {
    console.error(`[${err.code}] ${err.message}`);
  }
}
```

### EngineNotInitializedError

Thrown when attempting to use the database before calling `initialize()`.

| Property | Value |
|----------|-------|
| `name` | `'EngineNotInitializedError'` |
| `code` | `'ENGINE_NOT_INITIALIZED'` |
| `message` | `'DuckDB engine not initialized. Call initialize() first.'` |

```ts
class EngineNotInitializedError extends DuckUIError {
  constructor()
}
```

### QuerySyntaxError

Thrown when a SQL query has a syntax error. Includes the offending SQL.

| Property | Value |
|----------|-------|
| `name` | `'QuerySyntaxError'` |
| `code` | `'QUERY_SYNTAX_ERROR'` |
| `sql` | The SQL string that caused the error |

```ts
class QuerySyntaxError extends DuckUIError {
  sql: string
  constructor(message: string, sql: string)
}
```

```ts
try {
  await executor.execute('SELET * FORM users');
} catch (err) {
  if (err instanceof QuerySyntaxError) {
    console.error('Bad SQL:', err.sql);
  }
}
```

### SourceNotFoundError

Thrown when referencing a data source name that is not registered.

| Property | Value |
|----------|-------|
| `name` | `'SourceNotFoundError'` |
| `code` | `'SOURCE_NOT_FOUND'` |
| `message` | `'Data source "<name>" not found'` |

```ts
class SourceNotFoundError extends DuckUIError {
  constructor(sourceName: string)
}
```

### SourceLoadError

Thrown when a data source fails to load (fetch error, parse error, etc.).

| Property | Value |
|----------|-------|
| `name` | `'SourceLoadError'` |
| `code` | `'SOURCE_LOAD_ERROR'` |
| `message` | `'Failed to load data source "<name>": <cause>'` |

```ts
class SourceLoadError extends DuckUIError {
  constructor(sourceName: string, cause: string)
}
```

### MemoryError

Thrown when a memory-related error occurs.

| Property | Value |
|----------|-------|
| `name` | `'MemoryError'` |
| `code` | `'MEMORY_ERROR'` |

```ts
class MemoryError extends DuckUIError {
  constructor(message: string)
}
```

### ConnectionError

Thrown by the `ConnectionPool` when a connection cannot be acquired (timeout) or during pool drain.

| Property | Value |
|----------|-------|
| `name` | `'ConnectionError'` |
| `code` | `'CONNECTION_ERROR'` |

```ts
class ConnectionError extends DuckUIError {
  constructor(message: string)
}
```

```ts
try {
  const conn = await pool.acquire();
} catch (err) {
  if (err instanceof ConnectionError) {
    console.error('Pool exhausted:', err.message);
  }
}
```
