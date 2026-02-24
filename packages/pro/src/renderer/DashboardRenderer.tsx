import type { DashboardConfig } from '../builder/types'
import { requireLicense } from '../license/requireLicense'

export interface DashboardRendererProps {
  config: DashboardConfig
  className?: string
}

function DashboardRendererInner({ config, className }: DashboardRendererProps) {
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

export const DashboardRenderer = requireLicense(DashboardRendererInner, 'DashboardRenderer')
