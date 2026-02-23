import type { ReactNode } from 'react'
import type { DashboardConfig } from './types'

export interface DashboardBuilderProps {
  config: DashboardConfig
  onChange: (config: DashboardConfig) => void
  children?: ReactNode
}

export function DashboardBuilder({ config, onChange, children }: DashboardBuilderProps) {
  // TODO: Implement drag-and-drop dashboard builder
  return (
    <div>
      <div>Dashboard Builder: {config.title}</div>
      {children}
    </div>
  )
}
