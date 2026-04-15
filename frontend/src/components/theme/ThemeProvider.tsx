'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="dark"
      enableSystem={true}
      disableTransitionOnChange
      themes={['light', 'dark']}
      storageKey="fashionforge-theme"
    >
      {children}
    </NextThemesProvider>
  )
}
