import { useCallback } from 'react'
import { useDuckInternal } from '../provider/hooks'
import type { QueryResult } from '../engine/query'

export interface ExportButtonProps {
  data: QueryResult | null
  format?: 'csv' | 'json'
  fileName?: string
  label?: string
  className?: string
}

export function ExportButton({
  data,
  format = 'csv',
  fileName = 'export',
  label = 'Export',
  className,
}: ExportButtonProps) {
  const { theme } = useDuckInternal()

  const handleExport = useCallback(() => {
    if (!data || data.rowCount === 0) return

    let content: string
    let mimeType: string
    let extension: string

    if (format === 'json') {
      content = JSON.stringify(data.rows, null, 2)
      mimeType = 'application/json'
      extension = 'json'
    } else {
      const headers = data.columns
        .map((c) => `"${c.name.replace(/"/g, '""')}"`)
        .join(',')
      const rows = data.rows.map((row) =>
        data.columns
          .map((c) => {
            const val = row[c.name]
            if (val === null || val === undefined) return ''
            const str = String(val)
            if (/[,"\n\r]/.test(str) || str !== str.trim()) {
              return `"${str.replace(/"/g, '""')}"`
            }
            return str
          })
          .join(',')
      )
      content = [headers, ...rows].join('\n')
      mimeType = 'text/csv;charset=utf-8'
      extension = 'csv'
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${fileName}.${extension}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [data, format, fileName])

  const disabled = !data || data.rowCount === 0

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={handleExport}
        disabled={disabled}
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '7px 14px',
          fontSize: 13,
          fontWeight: 500,
          color: disabled ? theme.mutedTextColor : theme.textColor,
          background: disabled ? theme.surfaceColor : theme.background,
          border: `1px solid ${theme.borderColor}`,
          borderRadius: 6,
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontFamily: theme.fontFamily,
          lineHeight: 1.5,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M7 2v7m0 0L4.5 6.5M7 9l2.5-2.5M2 11h10"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {label}
      </button>
    </div>
  )
}
