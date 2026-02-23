export interface LicensePayload {
  sub: string
  dom: string[]
  exp: number
  tier: 'pro' | 'enterprise'
}

export class LicenseValidator {
  private payload: LicensePayload | null = null

  async validate(key: string): Promise<boolean> {
    try {
      const [payloadB64, _signatureB64] = key.replace('DUCK-', '').split('.')
      const payload = JSON.parse(atob(payloadB64)) as LicensePayload

      // Check expiry
      if (Date.now() / 1000 > payload.exp) return false

      // Check domain
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
