import BottomNav from '@/components/BottomNav'
import SideNav from '@/components/SideNav'
import FAB from '@/components/FAB'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar — desktop only */}
      <div className="hidden md:block">
        <SideNav />
      </div>

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="pb-20 md:pb-0">
          {children}
        </div>
      </div>

      {/* FAB + BottomNav — mobile only */}
      <div className="md:hidden">
        <FAB />
        <BottomNav />
      </div>
    </div>
  )
}
