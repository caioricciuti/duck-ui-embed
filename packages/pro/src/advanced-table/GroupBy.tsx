export interface GroupByProps {
  sql: string
  groupColumns: string[]
  className?: string
}

export function GroupBy({ className }: GroupByProps) {
  // TODO: Implement group-by table
  return <div className={className}>GroupBy Table (Pro)</div>
}
