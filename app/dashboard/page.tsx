'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

type Actividad = {
  id: string
  usuario_nombre: string
  tipo: string
  descripcion: string
  creado_at: string
}

type GastoSemana = { semana: string; total: number }

// ─── Currency ─────────────────────────────────────────────────────────────────

const CURRENCIES = [
  { code: 'ARS', sym: '$',   name: 'Peso ARG', rate: 1,          noDec: true  },
  { code: 'USD', sym: 'U$',  name: 'Dólar',    rate: 0.000847               },
  { code: 'EUR', sym: '€',   name: 'Euro',     rate: 0.000780               },
  { code: 'BOB', sym: 'Bs',  name: 'Boliviano',rate: 0.00590                },
  { code: 'MXN', sym: 'MX$', name: 'Peso MX',  rate: 0.01458                },
  { code: 'BRL', sym: 'R$',  name: 'Real',     rate: 0.00462                },
  { code: 'CLP', sym: 'CL$', name: 'Peso CL',  rate: 0.8008,  noDec: true  },
  { code: 'PEN', sym: 'S/',  name: 'Sol',      rate: 0.00318                },
  { code: 'GBP', sym: '£',   name: 'Libra',    rate: 0.00066                },
  { code: 'COP', sym: 'CO$', name: 'Peso COL', rate: 3.542,   noDec: true  },
]

function fmtMoney(ars: number, cur: typeof CURRENCIES[0]) {
  const v = ars * cur.rate
  if (cur.noDec) return `${cur.sym}${Math.round(v).toLocaleString('es-AR')}`
  return `${cur.sym}${v.toFixed(2)}`
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function saludo() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function formatDateStrip() {
  const days   = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']
  const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']
  const d = new Date()
  return `${days[d.getDay()]} · ${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`
}

function tiempoAtras(fecha: string) {
  const diff = Date.now() - new Date(fecha).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'ahora'
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

function mesActual() {
  return new Date().toLocaleString('es-AR', { month: 'long' }).toUpperCase()
}

// ─── Logo ─────────────────────────────────────────────────────────────────────

function NidoLogo({ size = 22 }: { size?: number }) {
  return (
    <span style={{
      fontFamily: 'var(--font-plex-serif)',
      fontWeight: 500,
      fontSize: size,
      color: 'var(--color-ink)',
      letterSpacing: '-0.01em',
      display: 'inline-flex',
      alignItems: 'flex-end',
      gap: size * 0.18,
    }}>
      <span style={{
        display: 'inline-block',
        position: 'relative',
        width: size * 1.05,
        height: size * 0.7,
        marginBottom: size * 0.06,
      }}>
        <span style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: size * 0.5,
          borderTopLeftRadius: '100% 100%', borderTopRightRadius: '100% 100%',
          border: '1.6px solid var(--color-ink)', borderBottom: 0,
        }} />
        <span style={{
          position: 'absolute',
          bottom: size * 0.06,
          left: '50%',
          transform: 'translateX(-50%)',
          width: size * 0.32,
          height: size * 0.32,
          borderRadius: '50%',
          background: 'var(--color-primary)',
        }} />
      </span>
      <span style={{ lineHeight: 1 }}>
        Nido<span style={{ color: 'var(--color-primary)' }}>.</span>
      </span>
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()
  const [cargado, setCargado]     = useState(false)
  const [nombre, setNombre]       = useState('')
  const [casaNombre, setCasaNombre] = useState('')
  const [casaCodigo, setCasaCodigo] = useState('')
  const [actividad, setActividad] = useState<Actividad[]>([])
  const [resumen, setResumen]     = useState({
    tareasPendientes: 0,
    proximoRecordatorio: null as string | null,
    gastosMes: 0,
    comprasPendientes: 0,
    presupuesto: 0,
    tareasUrgentes: 0,
    prendas: 0,
  })

  // currency picker
  const [curCode, setCurCode] = useState('ARS')
  const [curOpen, setCurOpen] = useState(false)
  const cur = CURRENCIES.find(c => c.code === curCode) ?? CURRENCIES[0]
  const m   = (ars: number) => fmtMoney(ars, cur)

  // family photo
  const [familyPhoto, setFamilyPhoto] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFamilyPhoto(URL.createObjectURL(file))
    toast.success('Foto actualizada')
  }

  useEffect(() => {
    async function cargar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: usuario } = await supabase
        .from('usuarios').select('nombre, casa_id').eq('id', user.id).single()
      if (!usuario) { router.push('/login'); return }
      if (!usuario.casa_id) { router.push('/setup-casa'); return }

      setNombre(usuario.nombre)
      const cid = usuario.casa_id
      const ahora = new Date().toISOString()
      const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString().split('T')[0]

      const [casa, tareas, tareasUrg, recordatorios, gastos, compras, actividadData, prendas] =
        await Promise.all([
          supabase.from('casas').select('nombre, codigo, presupuesto_mensual').eq('id', cid).single(),
          supabase.from('tareas').select('id', { count: 'exact' }).eq('casa_id', cid).eq('completada', false),
          supabase.from('tareas').select('id', { count: 'exact' }).eq('casa_id', cid).eq('completada', false).eq('prioridad', 'urgente'),
          supabase.from('recordatorios').select('titulo, fecha').eq('casa_id', cid).gte('fecha', ahora).order('fecha').limit(1),
          supabase.from('gastos').select('monto').eq('casa_id', cid).gte('fecha', inicioMes),
          supabase.from('compras').select('id', { count: 'exact' }).eq('casa_id', cid).eq('comprado', false),
          supabase.from('actividad').select('*').eq('casa_id', cid).order('creado_at', { ascending: false }).limit(4),
          supabase.from('prendas').select('id', { count: 'exact' }).eq('usuario_id', user.id),
        ])

      if (casa.data) { setCasaNombre(casa.data.nombre); setCasaCodigo(casa.data.codigo) }
      if (actividadData.data) setActividad(actividadData.data)

      setResumen({
        tareasPendientes:    tareas.count ?? 0,
        proximoRecordatorio: recordatorios.data?.[0]?.titulo ?? null,
        gastosMes:           (gastos.data ?? []).reduce((a, g) => a + Number(g.monto), 0),
        comprasPendientes:   compras.count ?? 0,
        presupuesto:         Number(casa.data?.presupuesto_mensual) || 0,
        tareasUrgentes:      tareasUrg.count ?? 0,
        prendas:             prendas.count ?? 0,
      })
      setCargado(true)
    }
    cargar()
  }, [router])

  const pct = resumen.presupuesto > 0
    ? Math.min(Math.round((resumen.gastosMes / resumen.presupuesto) * 100), 100)
    : 0

  if (!cargado) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-plex-mono)',
        fontSize: 11,
        color: 'var(--color-ink-3)',
        letterSpacing: '0.08em',
      }}>
        CARGANDO…
      </div>
    )
  }

  const secciones: [string, string, string, string, string, string][] = [
    ['/dashboard/tareas',        '02', 'Tareas',  `${resumen.tareasPendientes} pendientes`,                         resumen.tareasUrgentes > 0 ? `${resumen.tareasUrgentes} urg.` : '',      'var(--color-sage)' ],
    ['/dashboard/compras',       '03', 'Compras', `${resumen.comprasPendientes} por comprar`,                       `${resumen.comprasPendientes} it.`,                                        'var(--color-blush)'],
    ['/dashboard/gastos',        '04', 'Dinero',  `${m(resumen.gastosMes)} / ${m(resumen.presupuesto)}`,           '6 mov.',                                                                  'var(--color-sand)' ],
    ['/dashboard/comidas',       '05', 'Comidas', 'Registro diario',                                               'hoy',                                                                     'var(--color-cream)'],
    ['/dashboard/recordatorios', '06', 'Agenda',  resumen.proximoRecordatorio ?? 'Sin próximos',                   resumen.proximoRecordatorio ? '1+' : '—',                                  'var(--color-sky)'  ],
    ['/dashboard/diario',        '07', 'Diario',  'Lo que fue el día',                                             'escribir',                                                                'var(--color-sand)' ],
    ['/dashboard/habitos',       '08', 'Hábitos', 'Construí consistencia día a día',                               'racha',                                                                   'var(--color-sage)' ],
    ['/dashboard/ropa',          '09', 'Armario', `${resumen.prendas} prendas`,                                     `${resumen.prendas}`,                                                      'var(--color-blush)'],
  ]

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Warm backdrop */}
      <div aria-hidden style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background:
          'radial-gradient(circle at 12% 8%, rgba(247,208,170,0.55), transparent 38%), ' +
          'radial-gradient(circle at 92% 96%, rgba(199,211,176,0.45), transparent 42%), ' +
          'linear-gradient(180deg, #FAF1E0 0%, #FBF6EA 50%, #F7EFDD 100%)',
      }} />

      <div className="page-content" style={{ position: 'relative', zIndex: 1 }}>

        {/* Masthead */}
        <div style={{
          borderBottom: '2px solid var(--color-ink)',
          padding: '14px 18px 12px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <NidoLogo size={22} />
          <Link href="/perfil" style={{ textDecoration: 'none' }}>
            <button style={{
              border: '1.5px solid var(--color-ink)',
              background: 'var(--color-bg)',
              width: 32, height: 32,
              borderRadius: 4,
              cursor: 'pointer',
              fontFamily: 'var(--font-plex-serif)',
              fontSize: 14, fontStyle: 'italic',
              color: 'var(--color-ink)',
            }}>
              {nombre.charAt(0).toUpperCase()}
            </button>
          </Link>
        </div>

        {/* Date strip */}
        <div style={{
          padding: '10px 18px',
          fontFamily: 'var(--font-plex-mono)',
          fontSize: 10, color: 'var(--color-ink-2)',
          letterSpacing: '0.05em',
          display: 'flex', justifyContent: 'space-between',
          borderBottom: '1px solid var(--color-rule-soft)',
        }}>
          <span>{formatDateStrip()}</span>
          <span>{casaNombre.toUpperCase()} · {casaCodigo}</span>
        </div>

        {/* Polaroid */}
        <div style={{ padding: '14px 18px 0' }}>
          <div style={{
            position: 'relative',
            border: '1.5px solid var(--color-ink)',
            borderRadius: 2, overflow: 'hidden',
            height: 160,
            background: 'var(--color-cream)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                transform: 'rotate(-1.5deg)',
                background: 'var(--color-paper)',
                padding: '8px 8px 0',
                border: '1.5px solid var(--color-ink)',
                boxShadow: '3px 4px 0 rgba(31,28,20,0.28)',
                cursor: 'pointer',
              }}
            >
              {familyPhoto ? (
                <img
                  src={familyPhoto}
                  alt="familia"
                  style={{ display: 'block', width: 128, height: 96, objectFit: 'cover' }}
                />
              ) : (
                <div style={{
                  width: 128, height: 96,
                  background: 'var(--color-cream)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-plex-mono)',
                  fontSize: 10, color: 'var(--color-ink-2)',
                  textAlign: 'center', lineHeight: 1.5,
                }}>
                  arrastrá<br />una foto
                </div>
              )}
              <div style={{
                padding: '5px 0 6px',
                textAlign: 'center',
                fontFamily: 'var(--font-plex-mono)',
                fontSize: 9, color: 'var(--color-ink-2)',
                letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>
                o <span style={{ textDecoration: 'underline' }}>buscar archivo</span>
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handlePhoto}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        {/* Greeting */}
        <div style={{ padding: '14px 18px 14px' }}>
          <h1 style={{
            fontFamily: 'var(--font-plex-serif)',
            fontWeight: 500, fontStyle: 'italic',
            fontSize: 30, lineHeight: 1, letterSpacing: '-0.02em',
            margin: 0, color: 'var(--color-ink)',
          }}>
            {saludo()},<br />{nombre}.
          </h1>
          <p style={{
            fontSize: 13, color: 'var(--color-ink-2)',
            marginTop: 8, fontFamily: 'var(--font-plex-mono)',
          }}>
            {resumen.tareasUrgentes > 0 && (
              <span style={{ color: 'var(--color-warm)' }}>● {resumen.tareasUrgentes} urgente · </span>
            )}
            {resumen.tareasPendientes} pendientes · {m(resumen.gastosMes)} este mes
          </p>
        </div>

        {/* Budget ledger */}
        <div style={{ margin: '0 18px 16px', border: '1.5px solid var(--color-ink)', background: 'var(--color-paper)' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 14px', borderBottom: '1px solid var(--color-ink)',
            fontFamily: 'var(--font-plex-mono)', fontSize: 10,
            color: 'var(--color-ink-2)', letterSpacing: '0.05em',
            position: 'relative',
          }}>
            <span>§ PRESUPUESTO · {mesActual()}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {resumen.presupuesto > 0 && <span>{pct}%</span>}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setCurOpen(v => !v)}
                  style={{
                    background: 'var(--color-ink)', color: 'var(--color-bg)',
                    border: 0, padding: '3px 8px',
                    fontFamily: 'var(--font-plex-mono)', fontSize: 10,
                    letterSpacing: '0.06em', cursor: 'pointer', borderRadius: 2,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  {cur.code} <span style={{ fontSize: 8, opacity: 0.7 }}>▾</span>
                </button>
                {curOpen && (
                  <>
                    <div
                      onClick={() => setCurOpen(false)}
                      style={{ position: 'fixed', inset: 0, zIndex: 50 }}
                    />
                    <div style={{
                      position: 'absolute', top: '100%', right: 0, marginTop: 4,
                      background: 'var(--color-paper)', border: '1.5px solid var(--color-ink)',
                      boxShadow: '3px 4px 0 rgba(31,28,20,0.18)',
                      zIndex: 51, minWidth: 160, padding: '4px 0',
                    }}>
                      {CURRENCIES.map(c => (
                        <button
                          key={c.code}
                          onClick={() => { setCurCode(c.code); setCurOpen(false) }}
                          style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                            gap: 8, width: '100%', padding: '7px 12px',
                            background: c.code === curCode ? 'var(--color-cream)' : 'transparent',
                            border: 0, cursor: 'pointer',
                            fontFamily: 'var(--font-plex-mono)', fontSize: 11,
                            color: 'var(--color-ink)', textAlign: 'left',
                          }}
                        >
                          <span style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                            <span style={{ width: 32, letterSpacing: '0.04em' }}>{c.code}</span>
                            <span style={{
                              fontFamily: 'var(--font-plex-serif)', fontStyle: 'italic',
                              color: 'var(--color-ink-2)', fontSize: 12,
                            }}>{c.name}</span>
                          </span>
                          <span style={{ color: 'var(--color-ink-3)', fontSize: 11 }}>{c.sym}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <div style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'var(--color-ink-2)' }}>
                gastado
              </span>
              <span style={{
                fontFamily: 'var(--font-plex-serif)', fontStyle: 'italic',
                fontSize: 30, letterSpacing: '-0.02em', color: 'var(--color-ink)',
              }}>
                {m(resumen.gastosMes)}
              </span>
            </div>
            {resumen.presupuesto > 0 && (
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'var(--color-ink-2)' }}>
                  disponible
                </span>
                <span style={{
                  fontFamily: 'var(--font-plex-mono)', fontSize: 14, color: 'var(--color-primary)',
                }}>
                  {m(resumen.presupuesto - resumen.gastosMes)}
                </span>
              </div>
            )}
            {resumen.presupuesto > 0 && (
              <div style={{ marginTop: 14, height: 4, background: 'var(--color-rule-soft)', position: 'relative' }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  width: `${pct}%`,
                  background: pct >= 90 ? 'var(--color-warm)' : 'var(--color-primary)',
                  transition: 'width 0.6s ease',
                }} />
              </div>
            )}
          </div>
        </div>

        {/* Section index */}
        <div style={{ padding: '0 18px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{
              fontFamily: 'var(--font-plex-mono)', fontSize: 10,
              color: 'var(--color-ink-3)', letterSpacing: '0.1em',
            }}>ÍNDICE</span>
            <span style={{ height: 1, background: 'var(--color-ink)', flex: 1 }} />
          </div>

          {secciones.map(([href, num, name, line, badge, dot]) => (
            <Link key={href} href={href} style={{ textDecoration: 'none' }}>
              <div style={{
                width: '100%', padding: '12px 0',
                borderBottom: '1px solid var(--color-rule-soft)',
                background: 'transparent',
                display: 'flex', alignItems: 'baseline', gap: 12,
              }}>
                <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'var(--color-ink-3)', width: 22 }}>
                  {num}
                </span>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: dot, flexShrink: 0,
                  alignSelf: 'center',
                  border: '1px solid var(--color-ink)',
                }} />
                <span style={{
                  fontFamily: 'var(--font-plex-serif)', fontStyle: 'italic',
                  fontSize: 19, color: 'var(--color-ink)', width: 90,
                }}>
                  {name}
                </span>
                <span style={{ flex: 1, fontSize: 12, color: 'var(--color-ink-2)' }}>{line}</span>
                {badge && (
                  <span style={{
                    fontFamily: 'var(--font-plex-mono)', fontSize: 10,
                    color: 'var(--color-warm)', letterSpacing: '0.04em',
                  }}>
                    {badge}
                  </span>
                )}
                <span style={{ color: 'var(--color-ink-3)', fontSize: 14 }}>→</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Bitácora */}
        {actividad.length > 0 && (
          <div style={{ padding: '0 18px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, marginTop: 8 }}>
              <span style={{
                fontFamily: 'var(--font-plex-mono)', fontSize: 10,
                color: 'var(--color-ink-3)', letterSpacing: '0.1em',
              }}>BITÁCORA</span>
              <span style={{ height: 1, background: 'var(--color-ink)', flex: 1 }} />
            </div>
            {actividad.map(a => (
              <div
                key={a.id}
                style={{
                  display: 'flex', gap: 10, padding: '8px 0',
                  borderBottom: '1px dashed var(--color-rule-soft)', fontSize: 12,
                }}
              >
                <span style={{
                  fontFamily: 'var(--font-plex-mono)', fontSize: 10,
                  color: 'var(--color-ink-3)', width: 38, flexShrink: 0,
                }}>
                  {tiempoAtras(a.creado_at)}
                </span>
                <span style={{ flex: 1 }}>
                  <i style={{
                    fontFamily: 'var(--font-plex-serif)', fontStyle: 'italic',
                    color: 'var(--color-primary)',
                  }}>
                    {a.usuario_nombre}
                  </i>
                  <span style={{ color: 'var(--color-ink-2)' }}> {a.descripcion}</span>
                </span>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
