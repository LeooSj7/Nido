'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/dashboard',               num: '01', label: 'Inicio'        },
  { href: '/dashboard/tareas',        num: '02', label: 'Tareas'        },
  { href: '/dashboard/compras',       num: '03', label: 'Compras'       },
  { href: '/dashboard/gastos',        num: '04', label: 'Dinero'        },
  { href: '/dashboard/comidas',       num: '05', label: 'Comidas'       },
  { href: '/dashboard/recordatorios', num: '06', label: 'Agenda'        },
  { href: '/dashboard/diario',        num: '07', label: 'Diario'        },
  { href: '/dashboard/habitos',       num: '08', label: 'Hábitos'       },
]

export default function SideNav() {
  const pathname = usePathname()

  return (
    <nav style={{
      width: 200,
      minHeight: '100vh',
      borderRight: '1.5px solid var(--color-ink)',
      background: 'var(--color-bg)',
      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 31px, rgba(45,36,24,0.04) 31px, rgba(45,36,24,0.04) 32px)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      height: '100vh',
      overflowY: 'auto',
    }}>
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '1.5px solid var(--color-ink)',
      }}>
        <span style={{
          fontFamily: 'var(--font-plex-serif)',
          fontStyle: 'italic',
          fontSize: 20,
          color: 'var(--color-ink)',
          letterSpacing: '-0.01em',
        }}>
          Nido
        </span>
        <p style={{
          fontFamily: 'var(--font-plex-mono)',
          fontSize: 9,
          color: 'var(--color-ink-3)',
          letterSpacing: '0.06em',
          marginTop: 2,
        }}>
          DIARIO DE CASA
        </p>
      </div>

      <div style={{ flex: 1, paddingTop: 8 }}>
        {tabs.map((tab) => {
          const active = pathname === tab.href ||
            (tab.href !== '/dashboard' && pathname.startsWith(tab.href))
          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '11px 20px',
                background: active ? 'var(--color-ink)' : 'transparent',
                color: active ? 'var(--color-bg)' : 'var(--color-ink-2)',
                textDecoration: 'none',
                transition: 'background 0.12s, color 0.12s',
                borderLeft: active ? '3px solid var(--color-warm)' : '3px solid transparent',
              }}
            >
              <span style={{
                fontFamily: 'var(--font-plex-mono)',
                fontSize: 9,
                opacity: 0.5,
                minWidth: 18,
              }}>
                {tab.num}
              </span>
              <span style={{
                fontFamily: 'var(--font-plex-mono)',
                fontSize: 11,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
