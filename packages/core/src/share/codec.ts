/**
 * Share codec — single source of truth for Duck-UI's shareable analysis links.
 *
 * Wire format (MUST stay byte-compatible with the Duck-UI app's src/lib/share):
 *   JSON(SharePayload) → gzip (CompressionStream) → base64url (no padding)
 *
 * The payload carries the query/notebook definition and chart config — never the
 * data. It is decoded entirely client-side; nothing is uploaded.
 */

export const SHARE_VERSION = 2
export const SHARE_HASH_KEY = 's'

export interface SharedChartConfig {
  type?: string
  xAxis?: string
  yAxis?: string
  title?: string
  subtitle?: string
  [key: string]: unknown
}

/** An interactive filter exposed on an embed, keyed by a result column. */
export interface SharedParam {
  /** Result column this control filters on. */
  column: string
  /** Display label (defaults to the column name). */
  label?: string
  /** Control kind: dropdown of values, free-text contains, or numeric range. */
  type: 'select' | 'search' | 'range'
}

export interface SharedNotebookCell {
  id: string
  type: 'sql' | 'markdown'
  content: string
  [key: string]: unknown
}

export interface SharePayload {
  /** Schema version. */
  v: number
  /** Tab kind. */
  type: 'sql' | 'notebook'
  /** Tab title. */
  title: string
  /** SQL text (type: 'sql'). */
  sql?: string
  /** Notebook cells (type: 'notebook'). */
  cells?: SharedNotebookCell[]
  /** Chart configuration for the result. */
  chartConfig?: SharedChartConfig
  /** Interactive filter controls for embeds (v2+). */
  params?: SharedParam[]
  /** Whether the query should auto-run on open. */
  autoRun?: boolean
}

// ---------------------------------------------------------------------------
// base64url (URL-safe, no padding)
// ---------------------------------------------------------------------------

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

// ---------------------------------------------------------------------------
// gzip (native Web Streams)
// ---------------------------------------------------------------------------

// Drive the transform stream directly (no Blob/Response) so this works in
// browsers, Node, and jsdom alike.
async function streamThrough(
  input: Uint8Array,
  transform: CompressionStream | DecompressionStream,
): Promise<Uint8Array> {
  const writer = transform.writable.getWriter()
  // Fire-and-forget the write; small payloads won't hit backpressure. Swallow
  // writer-side rejections (invalid gzip errors both ends) — the read side
  // surfaces the failure to the caller's try/catch.
  void writer.write(input as BufferSource).catch(() => {})
  void writer.close().catch(() => {})

  const reader = transform.readable.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    total += value.length
  }
  const out = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.length
  }
  return out
}

function gzip(input: Uint8Array): Promise<Uint8Array> {
  return streamThrough(input, new CompressionStream('gzip'))
}

function gunzip(input: Uint8Array): Promise<Uint8Array> {
  return streamThrough(input, new DecompressionStream('gzip'))
}

// ---------------------------------------------------------------------------
// Encode / decode
// ---------------------------------------------------------------------------

/** Encode a share payload into a URL-safe string. */
export async function encodeShare(payload: SharePayload): Promise<string> {
  const json = JSON.stringify(payload, (_key, value) =>
    typeof value === 'bigint' ? value.toString() : value,
  )
  const compressed = await gzip(new TextEncoder().encode(json))
  return bytesToBase64Url(compressed)
}

/** Decode a share string back into a payload, or null if invalid. */
export async function decodeShare(value: string): Promise<SharePayload | null> {
  try {
    const bytes = base64UrlToBytes(value)
    const json = new TextDecoder().decode(await gunzip(bytes))
    const parsed = JSON.parse(json) as SharePayload
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      (parsed.type !== 'sql' && parsed.type !== 'notebook')
    ) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

/** Extract a share param from a URL or raw string (#s=, ?s=, or the bare token). */
export function extractShareParam(input: string): string | null {
  if (!input) return null
  // Already a bare token (no scheme, no separators)?
  if (!/[#?/:]/.test(input)) return input
  try {
    const url = new URL(input, 'http://x')
    const fromQuery = url.searchParams.get(SHARE_HASH_KEY)
    if (fromQuery) return fromQuery
    const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash
    if (hash) {
      const fromHash = new URLSearchParams(hash).get(SHARE_HASH_KEY)
      if (fromHash) return fromHash
    }
  } catch {
    // fall through
  }
  return null
}
