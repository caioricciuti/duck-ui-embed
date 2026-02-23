import type { ReactNode } from 'react'

export interface RowLevelSecurityProps {
  rules: Record<string, string>
  children: ReactNode
}

export function RowLevelSecurity({ children }: RowLevelSecurityProps) {
  // TODO: Inject WHERE clauses at provider level based on rules
  return <>{children}</>
}
