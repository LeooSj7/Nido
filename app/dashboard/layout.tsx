import BottomNav from '@/components/BottomNav'
import FAB from '@/components/FAB'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: '#09090b' }}>
      <div className="pb-24">
        {children}
      </div>
      <FAB />
      <BottomNav />
    </div>
  )
}
