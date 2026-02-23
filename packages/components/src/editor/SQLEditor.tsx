import { lazy, Suspense } from 'react'
import { Loading } from '../shared/Loading'

export interface SQLEditorProps {
  value: string
  onChange: (value: string) => void
  onExecute?: () => void
  height?: number
  className?: string
}

// Monaco is lazy-loaded to keep the main bundle small
const MonacoEditor = lazy(() => import('./MonacoWrapper'))

export function SQLEditor(props: SQLEditorProps) {
  return (
    <Suspense fallback={<Loading />}>
      <MonacoEditor {...props} />
    </Suspense>
  )
}
