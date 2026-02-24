import { requireLicense } from '../license/requireLicense'

export interface PivotTableProps {
  sql: string
  rows: string[]
  columns: string[]
  values: string[]
  className?: string
}

function PivotTableInner({ className }: PivotTableProps) {
  // TODO: Implement pivot table
  return <div className={className}>Pivot Table (Pro)</div>
}

export const PivotTable = requireLicense(PivotTableInner, 'PivotTable')
