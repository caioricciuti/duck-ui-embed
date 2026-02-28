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

/** Escape HTML special characters */
export function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
