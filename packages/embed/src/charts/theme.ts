export interface ChartTheme {
  background: string
  textColor: string
  gridColor: string
  axisColor: string
  palette: string[]
  fontFamily: string
  fontSize: number
}

export interface DuckTheme extends ChartTheme {
  /** Surface/card background */
  surfaceColor: string
  /** Default border color */
  borderColor: string
  /** Hover/active row background */
  hoverColor: string
  /** Primary accent color (buttons, active elements) */
  primaryColor: string
  /** Error text/border color */
  errorColor: string
  /** Error background color */
  errorBgColor: string
  /** Muted/secondary text color */
  mutedTextColor: string
  /** Stripe/alt-row background */
  stripeColor: string
  /** Success/positive change color */
  successColor: string
  /** Success background */
  successBgColor: string
  /** Danger/negative change color */
  dangerColor: string
  /** Danger background */
  dangerBgColor: string
}

export const lightTheme: DuckTheme = {
  // Chart
  background: '#ffffff',
  textColor: '#374151',
  gridColor: '#e5e7eb',
  axisColor: '#9ca3af',
  palette: ['#2563eb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'],
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: 12,
  // Components
  surfaceColor: '#f9fafb',
  borderColor: '#e5e7eb',
  hoverColor: '#f3f4f6',
  primaryColor: '#2563eb',
  errorColor: '#dc2626',
  errorBgColor: '#fef2f2',
  mutedTextColor: '#6b7280',
  stripeColor: '#f9fafb',
  successColor: '#059669',
  successBgColor: '#ecfdf5',
  dangerColor: '#dc2626',
  dangerBgColor: '#fef2f2',
}

export const darkTheme: DuckTheme = {
  // Chart
  background: '#111827',
  textColor: '#e5e7eb',
  gridColor: '#374151',
  axisColor: '#6b7280',
  palette: ['#60a5fa', '#fbbf24', '#34d399', '#f87171', '#a78bfa', '#f472b6', '#22d3ee', '#a3e635'],
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: 12,
  // Components
  surfaceColor: '#1f2937',
  borderColor: '#374151',
  hoverColor: '#374151',
  primaryColor: '#60a5fa',
  errorColor: '#f87171',
  errorBgColor: '#450a0a',
  mutedTextColor: '#9ca3af',
  stripeColor: '#1f2937',
  successColor: '#34d399',
  successBgColor: '#064e3b',
  dangerColor: '#f87171',
  dangerBgColor: '#450a0a',
}
