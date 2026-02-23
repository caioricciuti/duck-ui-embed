import { useState, useRef, useCallback, useEffect } from 'react'
import { useDuck } from '../provider/hooks'

export interface RangeFilterProps {
  column: string
  min: number
  max: number
  step?: number
  label?: string
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const trackHeight = 6
const thumbSize = 18

const containerStyle: React.CSSProperties = {
  position: 'relative',
  display: 'inline-block',
  minWidth: 180,
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 500,
  color: '#374151',
  marginBottom: 8,
}

const trackContainerStyle: React.CSSProperties = {
  position: 'relative',
  height: thumbSize,
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
}

const trackBgStyle: React.CSSProperties = {
  position: 'absolute',
  left: 0,
  right: 0,
  height: trackHeight,
  borderRadius: trackHeight / 2,
  background: '#e5e7eb',
}

const thumbBaseStyle: React.CSSProperties = {
  position: 'absolute',
  width: thumbSize,
  height: thumbSize,
  borderRadius: '50%',
  background: '#fff',
  border: '2px solid #2563eb',
  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
  transform: 'translateX(-50%)',
  cursor: 'grab',
  zIndex: 2,
  touchAction: 'none',
  transition: 'box-shadow 0.15s',
}

const thumbActiveStyle: React.CSSProperties = {
  ...thumbBaseStyle,
  boxShadow: '0 0 0 4px rgba(37,99,235,0.15), 0 1px 3px rgba(0,0,0,0.12)',
  cursor: 'grabbing',
}

const valueRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: 6,
  fontSize: 12,
  color: '#6b7280',
  fontVariantNumeric: 'tabular-nums',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RangeFilter({ column, min, max, step = 1, label }: RangeFilterProps) {
  const { filters, setFilter } = useDuck()
  const value = filters[column] as { min: number; max: number } | undefined

  const lo = value?.min ?? min
  const hi = value?.max ?? max

  const trackRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState<'lo' | 'hi' | null>(null)

  // Convert value to percentage position
  const toPercent = useCallback(
    (v: number) => ((v - min) / (max - min)) * 100,
    [min, max],
  )

  // Convert pixel position to snapped value
  const posToValue = useCallback(
    (clientX: number) => {
      const track = trackRef.current
      if (!track) return min
      const rect = track.getBoundingClientRect()
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      const raw = min + ratio * (max - min)
      // Snap to step
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
      // Ensure lo <= hi
      if (clamped.min > clamped.max) {
        const tmp = clamped.min
        clamped.min = clamped.max
        clamped.max = tmp
      }
      // If at full range, clear filter
      if (clamped.min <= min && clamped.max >= max) {
        setFilter(column, null)
      } else {
        setFilter(column, clamped)
      }
    },
    [column, min, max, setFilter],
  )

  // Pointer move/up handlers (attached to document during drag)
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

    const handleUp = () => {
      setDragging(null)
    }

    document.addEventListener('pointermove', handleMove)
    document.addEventListener('pointerup', handleUp)
    return () => {
      document.removeEventListener('pointermove', handleMove)
      document.removeEventListener('pointerup', handleUp)
    }
  }, [dragging, lo, hi, posToValue, commit])

  // Click on track to jump nearest thumb
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

  // Keyboard support on thumbs
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

  // Format display values
  const fmt = (v: number) =>
    Number.isInteger(v) ? v.toLocaleString() : v.toLocaleString(undefined, { maximumFractionDigits: 2 })

  return (
    <div style={containerStyle}>
      {label && <label style={labelStyle}>{label}</label>}

      {/* Track */}
      <div
        ref={trackRef}
        style={trackContainerStyle}
        onClick={handleTrackClick}
      >
        {/* Background track */}
        <div style={trackBgStyle} />

        {/* Filled range */}
        <div
          style={{
            position: 'absolute',
            left: `${loPercent}%`,
            width: `${hiPercent - loPercent}%`,
            height: trackHeight,
            borderRadius: trackHeight / 2,
            background: '#2563eb',
          }}
        />

        {/* Low thumb */}
        <div
          role="slider"
          aria-label={`${label ?? column} minimum`}
          aria-valuemin={min}
          aria-valuemax={hi}
          aria-valuenow={lo}
          tabIndex={0}
          style={{
            ...(dragging === 'lo' ? thumbActiveStyle : thumbBaseStyle),
            left: `${loPercent}%`,
          }}
          onPointerDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setDragging('lo')
          }}
          onKeyDown={handleKeyDown('lo')}
        />

        {/* High thumb */}
        <div
          role="slider"
          aria-label={`${label ?? column} maximum`}
          aria-valuemin={lo}
          aria-valuemax={max}
          aria-valuenow={hi}
          tabIndex={0}
          style={{
            ...(dragging === 'hi' ? thumbActiveStyle : thumbBaseStyle),
            left: `${hiPercent}%`,
          }}
          onPointerDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setDragging('hi')
          }}
          onKeyDown={handleKeyDown('hi')}
        />
      </div>

      {/* Value labels */}
      <div style={valueRowStyle}>
        <span>{fmt(lo)}</span>
        <span>{fmt(hi)}</span>
      </div>
    </div>
  )
}
