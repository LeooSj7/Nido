'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/dashboard',               num: '01', label: 'Inicio'   },
  { href: '/dashboard/tareas',        num: '02', label: 'Tareas'   },
  { href: '/dashboard/compras',       num: '03', label: 'Compras'  },
  { href: '/dashboard/gastos',        num: '04', label: 'Dinero'   },
  { href: '/dashboard/comidas',       num: '05', label: 'Comidas'  },
  { href: '/dashboard/recordatorios', num: '06', label: 'Agenda'   },
  { href: '/dashboard/diario',        num: '07', label: 'Diario'   },
  { href: '/dashboard/habitos',       num: '08', label: 'Hábitos'  },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        background: 'var(--color-bg)',
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 31px, rgba(45,36,24,0.04) 31px, rgba(45,36,24,0.04) 32px)',
        borderTop: '1.5px solid var(--color-ink)',
        display: 'flex',
        justifyContent: 'space-between',
        zIndex: 50,
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
      }}
    >
      {tabs.map((tab) => {
        const active = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: '9px 4px 8px',
              fontFamily: 'var(--font-plex-mono)',
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.02em',
              background: active ? 'var(--color-ink)' : 'transparent',
              color: active ? 'var(--color-bg)' : 'var(--color-ink-2)',
              textDecoration: 'none',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            <span>{tab.num}</span>
            <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {tab.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
