import { type ReactNode } from 'react'
import { AccountSidebar } from '@/components/account/AccountSidebar'

export function AccountShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <main className="account-theme page-with-navbar-offset min-h-screen pb-16 px-3 sm:px-6 lg:px-8 bg-[#07080e]">
      <div className="w-full grid items-start gap-5 sm:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)] xl:gap-6">
        <AccountSidebar />

        <section className="min-w-0">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">{title}</h1>
              {subtitle ? (
                <p className="text-sm mt-1 text-slate-500">{subtitle}</p>
              ) : null}
            </div>
            {actions ? <div>{actions}</div> : null}
          </div>

          {children}
        </section>
      </div>
    </main>
  )
}
