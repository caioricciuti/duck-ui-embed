import { useState, useEffect, type RefObject } from 'react'

export interface Size {
  width: number | undefined
  height: number | undefined
}

export function useResizeObserver(ref: RefObject<HTMLElement | null>): Size {
  const [size, setSize] = useState<Size>({ width: undefined, height: undefined })

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setSize({ width: Math.round(width), height: Math.round(height) })
      }
    })

    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])

  return size
}
