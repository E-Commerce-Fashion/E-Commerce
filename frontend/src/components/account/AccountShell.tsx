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
    <main
      className="page-with-navbar-offset min-h-screen pb-16 px-3 sm:px-6 lg:px-8"
      style={{ background: 'var(--bg-base)' }}
    >
      <div className="w-full grid items-start gap-5 lg:grid-cols-[260px_1fr] xl:gap-6">
        <AccountSidebar />

        <section className="min-w-0">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold font-serif" style={{ color: 'var(--text-primary)' }}>
                {title}
              </h1>
              {subtitle ? (
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  {subtitle}
                </p>
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
