import type { DuckTheme } from '@duck_ui/core'

/**
 * Convert a DuckTheme to CSS custom properties.
 * Applied on the <duck-provider> element and inherited by all children.
 */
export function themeToCSS(theme: DuckTheme): string {
  return `
    --duck-bg: ${theme.background};
    --duck-text: ${theme.textColor};
    --duck-primary: ${theme.primaryColor};
    --duck-surface: ${theme.surfaceColor};
    --duck-border: ${theme.borderColor};
    --duck-muted: ${theme.mutedTextColor};
    --duck-hover: ${theme.hoverColor};
    --duck-stripe: ${theme.stripeColor};
    --duck-success: ${theme.successColor};
    --duck-success-bg: ${theme.successBgColor};
    --duck-danger: ${theme.dangerColor};
    --duck-danger-bg: ${theme.dangerBgColor};
    --duck-error: ${theme.errorColor};
    --duck-error-bg: ${theme.errorBgColor};
    --duck-grid: ${theme.gridColor};
    --duck-axis: ${theme.axisColor};
    --duck-font: ${theme.fontFamily};
    --duck-font-size: ${theme.fontSize}px;
  `
}

/** Shared base CSS used by all duck-* elements' Shadow DOM */
export const baseStyles = `
  :host {
    display: block;
    font-family: var(--duck-font, system-ui, -apple-system, sans-serif);
    font-size: var(--duck-font-size, 14px);
    color: var(--duck-text, #374151);
    box-sizing: border-box;
  }

  *, *::before, *::after {
    box-sizing: border-box;
  }

  @keyframes duck-spin {
    to { transform: rotate(360deg); }
  }

  @keyframes duck-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  .duck-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 32px;
    color: var(--duck-muted, #6b7280);
    font-size: 14px;
  }

  .duck-loading .spinner {
    width: 18px;
    height: 18px;
    border: 2px solid var(--duck-border, #e5e7eb);
    border-top-color: var(--duck-primary, #2563eb);
    border-radius: 50%;
    animation: duck-spin 0.6s linear infinite;
  }

  .duck-error {
    padding: 16px;
    border: 1px solid var(--duck-error, #dc2626);
    border-radius: 8px;
    background: var(--duck-error-bg, #fef2f2);
    color: var(--duck-error, #dc2626);
    font-size: 13px;
    line-height: 1.5;
  }

  .duck-error-title {
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 6px;
  }

  .duck-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px;
    color: var(--duck-muted, #9ca3af);
    font-size: 14px;
  }
`

/** Render loading state HTML */
export function loadingHTML(message = 'Loading...'): string {
  return `<div class="duck-loading"><div class="spinner"></div>${message}</div>`
}

/** Render error state HTML */
export function errorHTML(message: string): string {
  return `<div class="duck-error"><div class="duck-error-title">Error</div>${escapeHTML(message)}</div>`
}

/** Render empty state HTML */
export function emptyHTML(message = 'No data available'): string {
  return `<div class="duck-empty">${escapeHTML(message)}</div>`
}

/** Render skeleton chart loading state HTML */
export function skeletonChartHTML(): string {
  const bars = [60, 90, 45, 100, 70, 55, 80]
    .map((h) => `<div style="width:24px;height:${h}px;border-radius:3px;background:var(--duck-border, #e5e7eb);animation:duck-pulse 1.5s ease-in-out infinite"></div>`)
    .join('')
  return `<div style="padding:16px"><div style="width:120px;height:14px;border-radius:4px;background:var(--duck-border, #e5e7eb);animation:duck-pulse 1.5s ease-in-out infinite"></div><div style="display:flex;align-items:flex-end;gap:8px;margin-top:16px;height:120px">${bars}</div></div>`
}

/** Render skeleton table loading state HTML */
export function skeletonTableHTML(): string {
  const cols = [80, 120, 100, 90]
  const headerCells = cols.map((w) => `<div style="width:${w}px;height:12px;border-radius:4px;background:var(--duck-border, #e5e7eb);animation:duck-pulse 1.5s ease-in-out infinite"></div>`).join('')
  const rows = Array.from({ length: 5 }, (_, i) => {
    const cells = cols.map((w) => `<div style="width:${w}px;height:12px;border-radius:4px;background:var(--duck-border, #e5e7eb);animation:duck-pulse 1.5s ease-in-out infinite"></div>`).join('')
    const bg = i % 2 === 1 ? 'var(--duck-stripe, #f9fafb)' : 'var(--duck-bg, #ffffff)'
    return `<div style="display:flex;gap:12px;padding:12px 14px;border-top:1px solid var(--duck-hover, #f3f4f6);background:${bg}">${cells}</div>`
  }).join('')
  return `<div style="border-radius:8px;border:1px solid var(--duck-border, #e5e7eb);overflow:hidden"><div style="display:flex;gap:12px;padding:12px 14px;background:var(--duck-surface, #f9fafb)">${headerCells}</div>${rows}</div>`
}

/** Render skeleton KPI loading state HTML */
export function skeletonKPIHTML(): string {
  return `<div style="padding:20px"><div style="width:80px;height:12px;border-radius:4px;background:var(--duck-border, #e5e7eb);animation:duck-pulse 1.5s ease-in-out infinite"></div><div style="margin-top:10px;width:140px;height:28px;border-radius:6px;background:var(--duck-border, #e5e7eb);animation:duck-pulse 1.5s ease-in-out infinite"></div><div style="margin-top:10px;width:60px;height:16px;border-radius:12px;background:var(--duck-border, #e5e7eb);animation:duck-pulse 1.5s ease-in-out infinite"></div></div>`
}

/** Escape HTML special characters */
export function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
