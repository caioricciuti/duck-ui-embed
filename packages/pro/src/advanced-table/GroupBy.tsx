import { requireLicense } from '../license/requireLicense'

export interface GroupByProps {
  sql: string
  groupColumns: string[]
  className?: string
}

function GroupByInner({ className }: GroupByProps) {
  // TODO: Implement group-by table
  return <div className={className}>GroupBy Table (Pro)</div>
}

export const GroupBy = requireLicense(GroupByInner, 'GroupBy')
