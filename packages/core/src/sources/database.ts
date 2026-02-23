// Database source (Postgres/MySQL) - Pro feature placeholder
export class DatabaseSource {
  static async load(): Promise<void> {
    throw new Error('Database sources require @duck_ui/pro')
  }
}
