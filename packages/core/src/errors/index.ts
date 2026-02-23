export class DuckUIError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'DuckUIError'
  }
}

export class EngineNotInitializedError extends DuckUIError {
  constructor() {
    super('DuckDB engine not initialized. Call initialize() first.', 'ENGINE_NOT_INITIALIZED')
    this.name = 'EngineNotInitializedError'
  }
}

export class QuerySyntaxError extends DuckUIError {
  constructor(message: string, public sql: string) {
    super(`Query syntax error: ${message}`, 'QUERY_SYNTAX_ERROR')
    this.name = 'QuerySyntaxError'
  }
}

export class SourceNotFoundError extends DuckUIError {
  constructor(sourceName: string) {
    super(`Data source "${sourceName}" not found`, 'SOURCE_NOT_FOUND')
    this.name = 'SourceNotFoundError'
  }
}

export class SourceLoadError extends DuckUIError {
  constructor(sourceName: string, cause: string) {
    super(`Failed to load data source "${sourceName}": ${cause}`, 'SOURCE_LOAD_ERROR')
    this.name = 'SourceLoadError'
  }
}

export class MemoryError extends DuckUIError {
  constructor(message: string) {
    super(message, 'MEMORY_ERROR')
    this.name = 'MemoryError'
  }
}

export class ConnectionError extends DuckUIError {
  constructor(message: string) {
    super(message, 'CONNECTION_ERROR')
    this.name = 'ConnectionError'
  }
}
