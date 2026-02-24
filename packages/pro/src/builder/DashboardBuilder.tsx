import type { ReactNode } from 'react'
import type { DashboardConfig } from './types'
import { requireLicense } from '../license/requireLicense'

export interface DashboardBuilderProps {
  config: DashboardConfig
  onChange: (config: DashboardConfig) => void
  children?: ReactNode
}

function DashboardBuilderInner({ config, onChange, children }: DashboardBuilderProps) {
  // TODO: Implement drag-and-drop dashboard builder
  return (
    <div>
      <div>Dashboard Builder: {config.title}</div>
      {children}
    </div>
  )
}

export const DashboardBuilder = requireLicense(DashboardBuilderInner, 'DashboardBuilder')
