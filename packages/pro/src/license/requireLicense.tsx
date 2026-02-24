import { type ComponentType } from 'react'
import { useProLicense } from './ProProvider'

const warned = new Set<string>()

export function requireLicense<P extends object>(
  Component: ComponentType<P>,
  displayName: string,
): ComponentType<P> {
  function Licensed(props: P) {
    const { valid, loading } = useProLicense()

    if (loading) return null

    if (!valid) {
      if (!warned.has(displayName)) {
        warned.add(displayName)
        console.warn(
          `@duck_ui/pro: Valid license required for <${displayName}>. Get one at https://duck-ui.com/pro`,
        )
      }
      return null
    }

    return <Component {...props} />
  }

  Licensed.displayName = `Licensed(${displayName})`
  return Licensed
}
