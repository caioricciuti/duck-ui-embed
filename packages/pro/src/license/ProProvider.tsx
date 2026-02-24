import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { LicenseValidator, type LicensePayload } from './validator'

interface ProLicenseState {
  valid: boolean
  loading: boolean
  tier: 'pro' | 'enterprise' | null
  payload: LicensePayload | null
}

const ProLicenseContext = createContext<ProLicenseState>({
  valid: false,
  loading: true,
  tier: null,
  payload: null,
})

export function ProProvider({
  license,
  children,
}: {
  license: string
  children: ReactNode
}) {
  const [state, setState] = useState<ProLicenseState>({
    valid: false,
    loading: true,
    tier: null,
    payload: null,
  })

  useEffect(() => {
    const validator = new LicenseValidator()
    validator.validate(license).then((valid) => {
      setState({
        valid,
        loading: false,
        tier: validator.getTier(),
        payload: validator.getPayload(),
      })

      if (!valid) {
        console.warn(
          '@duck_ui/pro: Invalid or expired license key. Pro components will not render. Get a license at https://duck-ui.com/pro',
        )
      }
    })
  }, [license])

  return (
    <ProLicenseContext.Provider value={state}>
      {children}
    </ProLicenseContext.Provider>
  )
}

export function useProLicense(): ProLicenseState {
  return useContext(ProLicenseContext)
}
