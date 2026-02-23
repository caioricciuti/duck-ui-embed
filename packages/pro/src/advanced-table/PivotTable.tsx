export interface PivotTableProps {
  sql: string
  rows: string[]
  columns: string[]
  values: string[]
  className?: string
}

export function PivotTable({ className }: PivotTableProps) {
  // TODO: Implement pivot table
  return <div className={className}>Pivot Table (Pro)</div>
}
