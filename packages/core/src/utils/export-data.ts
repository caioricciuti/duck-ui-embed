import type { QueryResult } from '../engine/query'

/**
 * Export query result data as CSV or JSON and trigger a browser download.
 */
export function exportToFile(
  data: QueryResult,
  format: 'csv' | 'json',
  fileName: string = 'export',
): void {
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
}
