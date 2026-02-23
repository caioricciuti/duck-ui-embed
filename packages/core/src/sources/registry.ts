import type { SourceConfig } from './types'

export class DataSourceRegistry {
  private sources = new Map<string, SourceConfig>()

  register(config: SourceConfig): void {
    this.sources.set(config.name, config)
  }

  remove(name: string): boolean {
    return this.sources.delete(name)
  }

  get(name: string): SourceConfig | undefined {
    return this.sources.get(name)
  }

  list(): SourceConfig[] {
    return Array.from(this.sources.values())
  }

  has(name: string): boolean {
    return this.sources.has(name)
  }

  clear(): void {
    this.sources.clear()
  }
}
