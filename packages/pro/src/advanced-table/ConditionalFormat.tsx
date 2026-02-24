import { requireLicense } from '../license/requireLicense'

export interface ConditionalFormatRule {
  column: string
  condition: 'gt' | 'lt' | 'eq' | 'between'
  value: number | [number, number]
  style: Record<string, string>
}

export interface ConditionalFormatProps {
  rules: ConditionalFormatRule[]
  children: React.ReactNode
}

function ConditionalFormatInner({ children }: ConditionalFormatProps) {
  // TODO: Apply conditional formatting to table cells
  return <>{children}</>
}

export const ConditionalFormat = requireLicense(ConditionalFormatInner, 'ConditionalFormat')
