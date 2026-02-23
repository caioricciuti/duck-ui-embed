import type { DashboardConfig } from '../builder/types'

export interface DashboardRendererProps {
  config: DashboardConfig
  className?: string
}

export function DashboardRenderer({ config, className }: DashboardRendererProps) {
  // TODO: Render dashboard from config
  return (
    <div className={className}>
      <h2>{config.title}</h2>
      <div>
        {config.layout.map((item) => (
          <div key={item.id}>
            [{item.type}] {item.id}
          </div>
        ))}
      </div>
    </div>
  )
}
