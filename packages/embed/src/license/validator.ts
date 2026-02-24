import { PUBLIC_KEY } from './keys'

export interface LicensePayload {
  sub: string
  dom: string[]
  exp: number
  tier: 'pro' | 'enterprise'
}

function base64urlToUint8Array(b64: string): Uint8Array {
  const base64 = b64.replace(/-/g, '+').replace(/_/g, '/')
  const pad = base64.length % 4
  const padded = pad ? base64 + '='.repeat(4 - pad) : base64
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export class LicenseValidator {
  private payload: LicensePayload | null = null

  async validate(key: string): Promise<boolean> {
    try {
      const stripped = key.replace('DUCK-', '')
      const dotIndex = stripped.indexOf('.')
      if (dotIndex === -1) return false

      const payloadB64 = stripped.slice(0, dotIndex)
      const signatureB64 = stripped.slice(dotIndex + 1)

      const publicKeyBytes = base64urlToUint8Array(PUBLIC_KEY)
      const cryptoKey = await crypto.subtle.importKey(
        'spki',
        publicKeyBytes.buffer as ArrayBuffer,
        { name: 'Ed25519' },
        false,
        ['verify'],
      )

      const payloadBytes = new TextEncoder().encode(payloadB64)
      const signatureBytes = base64urlToUint8Array(signatureB64)

      const valid = await crypto.subtle.verify(
        'Ed25519',
        cryptoKey,
        signatureBytes.buffer as ArrayBuffer,
        payloadBytes,
      )
      if (!valid) return false

      const payloadJson = atob(
        payloadB64.replace(/-/g, '+').replace(/_/g, '/') +
          '='.repeat((4 - (payloadB64.length % 4)) % 4),
      )
      const payload = JSON.parse(payloadJson) as LicensePayload

      if (Date.now() / 1000 > payload.exp) return false

      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname
        const domainMatch = payload.dom.some((pattern) => {
          if (pattern.startsWith('*.')) {
            return hostname.endsWith(pattern.slice(1)) || hostname === pattern.slice(2)
          }
          return hostname === pattern
        })
        if (!domainMatch) return false
      }

      this.payload = payload
      return true
    } catch {
      return false
    }
  }

  getPayload(): LicensePayload | null {
    return this.payload
  }

  getTier(): 'pro' | 'enterprise' | null {
    return this.payload?.tier ?? null
  }
}
