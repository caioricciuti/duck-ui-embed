export interface Size {
  width: number | undefined
  height: number | undefined
}

/**
 * Framework-agnostic ResizeObserver wrapper.
 * Returns a cleanup function that disconnects the observer.
 */
export function observeSize(
  element: HTMLElement,
  callback: (size: Size) => void,
): () => void {
  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect
      callback({ width: Math.round(width), height: Math.round(height) })
    }
  })

  observer.observe(element)
  return () => observer.disconnect()
}
