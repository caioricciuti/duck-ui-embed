import type { ReactNode } from 'react'

export interface ThemeProviderProps {
  theme?: Record<string, string>
  children: ReactNode
}

export function ThemeProvider({ theme, children }: ThemeProviderProps) {
  const style = theme
    ? Object.fromEntries(Object.entries(theme).map(([k, v]) => [`--duck-${k}`, v]))
    : {}

  return <div style={style}>{children}</div>
}
