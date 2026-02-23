import type { ReactNode } from 'react'

export interface DrillDownProps {
  children: ReactNode
  onDrill?: (params: Record<string, unknown>) => void
}

export function DrillDown({ children }: DrillDownProps) {
  // TODO: Implement drill-down click → re-query behavior
  return <>{children}</>
}
