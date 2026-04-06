import { AdminSidebar } from '@/components/admin/AdminSidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <main
      className="page-with-navbar-offset min-h-screen pb-16 px-3 sm:px-6 lg:px-8"
      style={{ background: 'var(--bg-base)' }}
    >
      <div className="w-full">
        <div className="grid items-start gap-5 lg:grid-cols-[260px_1fr] xl:gap-6">
          <AdminSidebar />
          <section className="min-w-0">{children}</section>
        </div>
      </div>
    </main>
  )
}
