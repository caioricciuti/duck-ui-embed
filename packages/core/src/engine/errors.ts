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
