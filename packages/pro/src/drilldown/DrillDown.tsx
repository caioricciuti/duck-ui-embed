import type { ReactNode } from 'react'
import { requireLicense } from '../license/requireLicense'

export interface DrillDownProps {
  children: ReactNode
  onDrill?: (params: Record<string, unknown>) => void
}

function DrillDownInner({ children }: DrillDownProps) {
  // TODO: Implement drill-down click → re-query behavior
  return <>{children}</>
}

export const DrillDown = requireLicense(DrillDownInner, 'DrillDown')
