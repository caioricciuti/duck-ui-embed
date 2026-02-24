import type { ReactNode } from 'react'
import { requireLicense } from '../license/requireLicense'

export interface RowLevelSecurityProps {
  rules: Record<string, string>
  children: ReactNode
}

function RowLevelSecurityInner({ children }: RowLevelSecurityProps) {
  // TODO: Inject WHERE clauses at provider level based on rules
  return <>{children}</>
}

export const RowLevelSecurity = requireLicense(RowLevelSecurityInner, 'RowLevelSecurity')
