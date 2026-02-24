import { useState, useRef, useCallback, useEffect } from 'react'
import { useDuckInternal } from '../../provider/hooks'

export interface RangeFilterProps {
  column: string
  min: number
  max: number
  step?: number
  label?: string
}

const trackHeight = 6
const thumbSize = 18

export function RangeFilter({ column, min, max, step = 1, label }: RangeFilterProps) {
  const { filters, setFilter, theme } = useDuckInternal()
  const value = filters[column] as { min: number; max: number } | undefined

  const lo = value?.min ?? min
  const hi = value?.max ?? max

  const trackRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState<'lo' | 'hi' | null>(null)

  const toPercent = useCallback((v: number) => ((v - min) / (max - min)) * 100, [min, max])

  const posToValue = useCallback(
    (clientX: number) => {
      const track = trackRef.current
      if (!track) return min
      const rect = track.getBoundingClientRect()
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      const raw = min + ratio * (max - min)
      return Math.round(raw / step) * step
    },
    [min, max, step],
  )

  const commit = useCallback(
    (newLo: number, newHi: number) => {
      const clamped = {
        min: Math.max(min, Math.min(newLo, max)),
        max: Math.min(max, Math.max(newHi, min)),
      }
      if (clamped.min > clamped.max) {
        const tmp = clamped.min
        clamped.min = clamped.max
        clamped.max = tmp
      }
      if (clamped.min <= min && clamped.max >= max) {
        setFilter(column, null)
      } else {
        setFilter(column, clamped)
      }
    },
    [column, min, max, setFilter],
  )

  useEffect(() => {
    if (!dragging) return

    const handleMove = (e: PointerEvent) => {
      const v = posToValue(e.clientX)
      if (dragging === 'lo') {
        commit(v, hi)
      } else {
        commit(lo, v)
      }
    }

    const handleUp = () => setDragging(null)

    document.addEventListener('pointermove', handleMove)
    document.addEventListener('pointerup', handleUp)
    return () => {
      document.removeEventListener('pointermove', handleMove)
      document.removeEventListener('pointerup', handleUp)
    }
  }, [dragging, lo, hi, posToValue, commit])

  const handleTrackClick = (e: React.MouseEvent) => {
    const v = posToValue(e.clientX)
    const distLo = Math.abs(v - lo)
    const distHi = Math.abs(v - hi)
    if (distLo <= distHi) {
      commit(v, hi)
    } else {
      commit(lo, v)
    }
  }

  const handleKeyDown = (which: 'lo' | 'hi') => (e: React.KeyboardEvent) => {
    let delta = 0
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') delta = step
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') delta = -step
    else return

    e.preventDefault()
    if (which === 'lo') {
      commit(lo + delta, hi)
    } else {
      commit(lo, hi + delta)
    }
  }

  const loPercent = toPercent(lo)
  const hiPercent = toPercent(hi)

  const fmt = (v: number) =>
    Number.isInteger(v) ? v.toLocaleString() : v.toLocaleString(undefined, { maximumFractionDigits: 2 })

  const thumbBaseStyle: React.CSSProperties = {
    position: 'absolute', width: thumbSize, height: thumbSize, borderRadius: '50%',
    background: theme.background, border: `2px solid ${theme.primaryColor}`, boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
    transform: 'translateX(-50%)', cursor: 'grab', zIndex: 2, touchAction: 'none', transition: 'box-shadow 0.15s',
  }

  const thumbActiveStyle: React.CSSProperties = {
    ...thumbBaseStyle,
    boxShadow: `0 0 0 4px ${theme.primaryColor}26, 0 1px 3px rgba(0,0,0,0.12)`,
    cursor: 'grabbing',
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block', minWidth: 180 }}>
      {label && <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: theme.textColor, marginBottom: 8 }}>{label}</label>}

      <div ref={trackRef} style={{ position: 'relative', height: thumbSize, display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={handleTrackClick}>
        <div style={{ position: 'absolute', left: 0, right: 0, height: trackHeight, borderRadius: trackHeight / 2, background: theme.borderColor }} />
        <div style={{ position: 'absolute', left: `${loPercent}%`, width: `${hiPercent - loPercent}%`, height: trackHeight, borderRadius: trackHeight / 2, background: theme.primaryColor }} />

        <div
          role="slider" aria-label={`${label ?? column} minimum`} aria-valuemin={min} aria-valuemax={hi} aria-valuenow={lo} tabIndex={0}
          style={{ ...(dragging === 'lo' ? thumbActiveStyle : thumbBaseStyle), left: `${loPercent}%` }}
          onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); setDragging('lo') }}
          onKeyDown={handleKeyDown('lo')}
        />

        <div
          role="slider" aria-label={`${label ?? column} maximum`} aria-valuemin={lo} aria-valuemax={max} aria-valuenow={hi} tabIndex={0}
          style={{ ...(dragging === 'hi' ? thumbActiveStyle : thumbBaseStyle), left: `${hiPercent}%` }}
          onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); setDragging('hi') }}
          onKeyDown={handleKeyDown('hi')}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12, color: theme.mutedTextColor, fontVariantNumeric: 'tabular-nums' }}>
        <span>{fmt(lo)}</span>
        <span>{fmt(hi)}</span>
      </div>
    </div>
  )
}
