export class DuckUIError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'DuckUIError'
  }
}

export class ConnectionError extends DuckUIError {
  constructor(message: string) {
    super(message, 'CONNECTION_ERROR')
    this.name = 'ConnectionError'
  }
}

export class DataLoadError extends DuckUIError {
  constructor(tableName: string, cause: string) {
    super(`Failed to load data for table "${tableName}": ${cause}`, 'DATA_LOAD_ERROR')
    this.name = 'DataLoadError'
  }
}

export class QueryError extends DuckUIError {
  constructor(message: string, public sql?: string) {
    super(message, 'QUERY_ERROR')
    this.name = 'QueryError'
  }
}

export class QueryTimeoutError extends DuckUIError {
  constructor(timeoutMs: number, public sql?: string) {
    super(`Query timed out after ${timeoutMs}ms`, 'QUERY_TIMEOUT')
    this.name = 'QueryTimeoutError'
  }
}

export class ValidationError extends DuckUIError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

// Error code constants
export const ErrorCodes = {
  NOT_READY: 'NOT_READY',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  DATA_LOAD_ERROR: 'DATA_LOAD_ERROR',
  QUERY_ERROR: 'QUERY_ERROR',
  QUERY_TIMEOUT: 'QUERY_TIMEOUT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const

/**
 * Map common DuckDB error messages to user-friendly descriptions.
 */
export function formatDuckDBError(error: Error): string {
  const msg = error.message

  // Table not found
  const tableMatch = msg.match(/Catalog Error: Table with name (\S+) does not exist/)
  if (tableMatch) {
    return `Table '${tableMatch[1]}' not found. Check that your data was loaded correctly.`
  }

  // Column not found
  const colMatch = msg.match(/Binder Error:.*column "?([^"]+)"? (?:not found|does not exist)/)
    ?? msg.match(/Binder Error:.*Referenced column "?([^"]+)"? not found/)
  if (colMatch) {
    return `Column '${colMatch[1]}' does not exist in the query results.`
  }

  // Parser / syntax error
  if (msg.includes('Parser Error')) {
    const detail = msg.replace(/^Parser Error:\s*/i, '')
    return `SQL syntax error: ${detail}`
  }

  // Conversion error
  if (msg.includes('Conversion Error')) {
    const detail = msg.replace(/^Conversion Error:\s*/i, '')
    return `Data conversion error: ${detail}`
  }

  // Out of memory
  if (msg.includes('Out of Memory') || msg.includes('out of memory')) {
    return 'Query ran out of memory. Try reducing the data size or simplifying the query.'
  }

  // Timeout
  if (error instanceof QueryTimeoutError) {
    return error.message
  }

  return msg
}
