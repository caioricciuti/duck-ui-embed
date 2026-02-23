export interface DashboardConfig {
  id: string
  title: string
  layout: LayoutItem[]
  filters?: FilterConfig[]
  theme?: ThemeConfig
}

export interface LayoutItem {
  id: string
  type: 'chart' | 'table' | 'kpi' | 'filter'
  x: number
  y: number
  w: number
  h: number
  config: Record<string, unknown>
}

export interface FilterConfig {
  column: string
  type: 'select' | 'multiselect' | 'range' | 'daterange'
  label?: string
  options?: string[]
}

export interface ThemeConfig {
  primaryColor?: string
  fontFamily?: string
  borderRadius?: number
  darkMode?: boolean
}
