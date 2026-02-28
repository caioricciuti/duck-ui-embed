import { useState, useEffect, type RefObject } from 'react'
import { observeSize, type Size } from '@duck_ui/core'

export type { Size }

export function useResizeObserver(ref: RefObject<HTMLElement | null>): Size {
  const [size, setSize] = useState<Size>({ width: undefined, height: undefined })

  useEffect(() => {
    const element = ref.current
    if (!element) return

    return observeSize(element, setSize)
  }, [ref])

  return size
}
