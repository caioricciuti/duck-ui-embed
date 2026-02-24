import type { ReactNode } from 'react'
import { requireLicense } from '../license/requireLicense'

export interface ThemeProviderProps {
  theme?: Record<string, string>
  children: ReactNode
}

function ThemeProviderInner({ theme, children }: ThemeProviderProps) {
  const style = theme
    ? Object.fromEntries(Object.entries(theme).map(([k, v]) => [`--duck-${k}`, v]))
    : {}

  return <div style={style}>{children}</div>
}

export const ThemeProvider = requireLicense(ThemeProviderInner, 'ThemeProvider')
