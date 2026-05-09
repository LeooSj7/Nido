'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { LayoutDashboard, CheckSquare, ShoppingCart, Wallet, Utensils, Bell } from 'lucide-react'

const tabs = [
  { href: '/dashboard',               icon: LayoutDashboard, label: 'Inicio',   accent: '#6366f1' },
  { href: '/dashboard/tareas',        icon: CheckSquare,     label: 'Tareas',   accent: '#3b82f6' },
  { href: '/dashboard/compras',       icon: ShoppingCart,    label: 'Compras',  accent: '#10b981' },
  { href: '/dashboard/gastos',        icon: Wallet,          label: 'Dinero',   accent: '#f59e0b' },
  { href: '/dashboard/comidas',       icon: Utensils,        label: 'Comidas',  accent: '#f97316' },
  { href: '/dashboard/recordatorios', icon: Bell,            label: 'Agenda',   accent: '#a855f7' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 px-3"
      style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}
    >
      <nav
        className="max-w-lg mx-auto flex items-center px-1.5 py-1.5 rounded-2xl gap-0.5"
        style={{
          background: 'rgba(12,12,14,0.97)',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 -2px 32px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3)',
        }}
      >
        {tabs.map((tab) => {
          const active = pathname === tab.href
          const Icon = tab.icon

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={active ? 'flex-shrink-0' : 'flex-1 flex items-center justify-center'}
            >
              <motion.div whileTap={{ scale: 0.82 }}>
                {active ? (
                  <motion.div
                    layoutId="nav-pill"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
                    style={{
                      background: `${tab.accent}1c`,
                      border: `1px solid ${tab.accent}38`,
                      boxShadow: `0 0 20px ${tab.accent}18`,
                    }}
                    transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                  >
                    <Icon style={{ width: 15, height: 15, color: tab.accent, strokeWidth: 2.5 }} />
                    <span className="text-xs font-semibold" style={{ color: '#fff', lineHeight: 1 }}>
                      {tab.label}
                    </span>
                  </motion.div>
                ) : (
                  <div className="flex items-center justify-center" style={{ width: 38, height: 36 }}>
                    <Icon style={{ width: 18, height: 18, color: 'rgba(255,255,255,0.28)', strokeWidth: 1.75 }} />
                  </div>
                )}
              </motion.div>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
