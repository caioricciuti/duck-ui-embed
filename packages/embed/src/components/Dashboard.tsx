import { useRef, type ReactNode } from 'react'
import { useDuckInternal } from '../provider/hooks'
import { useResizeObserver } from '../charts/utils/responsive'

export interface DashboardProps {
  children: ReactNode
  /** Number of grid columns at full width */
  columns?: 1 | 2 | 3 | 4
  /** Gap between panels in px */
  gap?: number
  /** Container padding in px */
  padding?: number
  /** Custom className */
  className?: string
}

export interface DashboardPanelProps {
  children: ReactNode
  /** Number of columns this panel spans */
  span?: number
  /** Number of rows this panel spans */
  rowSpan?: number
  /** Custom className */
  className?: string
}

function getResponsiveColumns(width: number | undefined, maxColumns: number): number {
  if (width === undefined) return maxColumns
  if (width < 480) return 1
  if (width < 768) return Math.min(2, maxColumns)
  if (width < 1024) return Math.min(3, maxColumns)
  return maxColumns
}

function Panel({ children, span = 1, rowSpan = 1, className }: DashboardPanelProps) {
  const { theme } = useDuckInternal()

  const style: React.CSSProperties = {
    gridColumn: span > 1 ? `span ${span}` : undefined,
    gridRow: rowSpan > 1 ? `span ${rowSpan}` : undefined,
    background: theme.surfaceColor,
    border: `1px solid ${theme.borderColor}`,
    borderRadius: 8,
    overflow: 'hidden',
    minWidth: 0,
  }

  return (
    <div className={className} style={style}>
      {children}
    </div>
  )
}

function DashboardRoot({
  children,
  columns = 2,
  gap = 16,
  padding = 24,
  className,
}: DashboardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { theme } = useDuckInternal()
  const { width } = useResizeObserver(containerRef)

  const effectiveColumns = getResponsiveColumns(width, columns)

  const style: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${effectiveColumns}, 1fr)`,
    gap,
    padding,
    background: theme.background,
    fontFamily: theme.fontFamily,
  }

  return (
    <div ref={containerRef} className={className} style={style}>
      {children}
    </div>
  )
}

export const Dashboard = Object.assign(DashboardRoot, { Panel })
