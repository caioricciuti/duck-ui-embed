export interface ChartTheme {
  background: string
  textColor: string
  gridColor: string
  axisColor: string
  palette: string[]
  fontFamily: string
  fontSize: number
}

export const lightTheme: ChartTheme = {
  background: '#ffffff',
  textColor: '#374151',
  gridColor: '#e5e7eb',
  axisColor: '#9ca3af',
  palette: ['#2563eb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'],
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: 12,
}

export const darkTheme: ChartTheme = {
  background: '#111827',
  textColor: '#e5e7eb',
  gridColor: '#374151',
  axisColor: '#6b7280',
  palette: ['#60a5fa', '#fbbf24', '#34d399', '#f87171', '#a78bfa', '#f472b6', '#22d3ee', '#a3e635'],
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: 12,
}
