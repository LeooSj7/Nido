'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

function NidoLogo({ size = 28 }: { size?: number }) {
  return (
    <span style={{
      fontFamily: 'var(--font-plex-serif)',
      fontWeight: 500, fontSize: size,
      color: 'var(--color-ink)', letterSpacing: '-0.01em',
      display: 'inline-flex', alignItems: 'flex-end', gap: size * 0.18,
    }}>
      <span style={{
        display: 'inline-block', position: 'relative',
        width: size * 1.05, height: size * 0.7, marginBottom: size * 0.06,
      }}>
        <span style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: size * 0.5,
          borderTopLeftRadius: '100% 100%', borderTopRightRadius: '100% 100%',
          border: '1.6px solid var(--color-ink)', borderBottom: 0,
        }} />
        <span style={{
          position: 'absolute', bottom: size * 0.06, left: '50%',
          transform: 'translateX(-50%)',
          width: size * 0.32, height: size * 0.32,
          borderRadius: '50%', background: 'var(--color-primary)',
        }} />
      </span>
      <span style={{ lineHeight: 1 }}>
        Nido<span style={{ color: 'var(--color-primary)' }}>.</span>
      </span>
    </span>
  )
}

const secciones = [
  { num: '01', name: 'Tareas',   desc: 'Compartidas y con prioridad',  dot: 'var(--color-sage)'  },
  { num: '02', name: 'Compras',  desc: 'Lista compartida del super',    dot: 'var(--color-blush)' },
  { num: '03', name: 'Dinero',   desc: 'Gastos, presupuesto y ahorro',  dot: 'var(--color-sand)'  },
  { num: '04', name: 'Comidas',  desc: 'Registro diario de calorías',   dot: 'var(--color-cream)' },
  { num: '05', name: 'Agenda',   desc: 'Recordatorios de la casa',      dot: 'var(--color-sky)'   },
]

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', color: 'var(--color-ink)' }}>

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--color-bg)',
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 31px, rgba(45,36,24,0.04) 31px, rgba(45,36,24,0.04) 32px)',
        borderBottom: '1.5px solid var(--color-ink)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 24px',
      }}>
        <NidoLogo size={22} />
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link href="/login" style={{
            fontFamily: 'var(--font-plex-mono)', fontSize: 11,
            color: 'var(--color-ink-2)', letterSpacing: '0.06em',
            textDecoration: 'none', textTransform: 'uppercase',
          }}>
            Entrar
          </Link>
          <Link href="/login" style={{
            fontFamily: 'var(--font-plex-mono)', fontSize: 11,
            background: 'var(--color-primary)', color: 'var(--color-bg)',
            padding: '7px 14px', borderRadius: 4, letterSpacing: '0.06em',
            textDecoration: 'none', textTransform: 'uppercase',
          }}>
            Crear cuenta →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        maxWidth: 480, margin: '0 auto', padding: '56px 24px 40px',
        borderBottom: '1px solid var(--color-rule-soft)',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <span style={{
              fontFamily: 'var(--font-plex-mono)', fontSize: 10,
              color: 'var(--color-ink-3)', letterSpacing: '0.1em',
            }}>
              —— DIARIO DE LA CASA
            </span>
            <span style={{ height: 1, background: 'var(--color-ink)', flex: 1 }} />
          </div>

          <h1 style={{
            fontFamily: 'var(--font-plex-serif)', fontWeight: 500, fontStyle: 'italic',
            fontSize: 'clamp(40px, 10vw, 56px)', lineHeight: 0.95,
            letterSpacing: '-0.02em', margin: '0 0 20px',
            color: 'var(--color-ink)',
          }}>
            Tu casa,<br />en orden.
          </h1>

          <p style={{
            fontSize: 15, color: 'var(--color-ink-2)', lineHeight: 1.65,
            marginBottom: 28, maxWidth: 360,
          }}>
            Una bitácora compartida para toda la familia. Tareas, gastos, compras y agenda — anotados como en el cuaderno de la cocina.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/login" style={{
              fontFamily: 'var(--font-plex-mono)', fontSize: 12,
              background: 'var(--color-primary)', color: 'var(--color-bg)',
              padding: '13px 24px', borderRadius: 4, letterSpacing: '0.08em',
              textDecoration: 'none', textTransform: 'uppercase',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>
              Abrir el diario →
            </Link>
            <Link href="/login" style={{
              fontFamily: 'var(--font-plex-mono)', fontSize: 11,
              color: 'var(--color-ink-2)', padding: '13px 0',
              textDecoration: 'none', letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              Ya tengo cuenta
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Mock preview */}
      <section style={{ maxWidth: 480, margin: '0 auto', padding: '40px 24px', borderBottom: '1px solid var(--color-rule-soft)' }}>
        <div style={{ border: '1.5px solid var(--color-ink)', background: 'var(--color-paper)' }}>
          {/* Masthead mock */}
          <div style={{
            borderBottom: '2px solid var(--color-ink)',
            padding: '12px 16px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <NidoLogo size={18} />
            <div style={{
              width: 28, height: 28, border: '1.5px solid var(--color-ink)',
              borderRadius: 3, background: 'var(--color-bg)',
              fontFamily: 'var(--font-plex-serif)', fontStyle: 'italic',
              fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-ink)',
            }}>M</div>
          </div>

          {/* Date strip mock */}
          <div style={{
            padding: '8px 16px',
            borderBottom: '1px solid var(--color-rule-soft)',
            fontFamily: 'var(--font-plex-mono)', fontSize: 9,
            color: 'var(--color-ink-2)', letterSpacing: '0.06em',
            display: 'flex', justifyContent: 'space-between',
          }}>
            <span>LUN · 05 ENE 2026</span>
            <span>EL NIDO · GARCÍA·21</span>
          </div>

          {/* Greeting mock */}
          <div style={{ padding: '12px 16px 10px' }}>
            <div style={{
              fontFamily: 'var(--font-plex-serif)', fontStyle: 'italic',
              fontSize: 20, letterSpacing: '-0.02em', color: 'var(--color-ink)',
              lineHeight: 1.1,
            }}>
              Buenas tardes,<br />María.
            </div>
            <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: 'var(--color-ink-2)', marginTop: 6 }}>
              <span style={{ color: 'var(--color-warm)' }}>● 1 urgente</span> · 3 pendientes · $42.500 este mes
            </p>
          </div>

          {/* Index mock */}
          <div style={{ padding: '0 16px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, color: 'var(--color-ink-3)', letterSpacing: '0.1em' }}>ÍNDICE</span>
              <span style={{ height: 1, background: 'var(--color-ink)', flex: 1 }} />
            </div>
            {secciones.slice(0, 3).map(s => (
              <div key={s.num} style={{
                display: 'flex', alignItems: 'baseline', gap: 8, padding: '7px 0',
                borderBottom: '1px solid var(--color-rule-soft)',
              }}>
                <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, color: 'var(--color-ink-3)', width: 18 }}>{s.num}</span>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot, border: '1px solid var(--color-ink)', alignSelf: 'center', flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-plex-serif)', fontStyle: 'italic', fontSize: 14, color: 'var(--color-ink)' }}>{s.name}</span>
                <span style={{ flex: 1, fontSize: 10, color: 'var(--color-ink-2)' }}>{s.desc}</span>
                <span style={{ color: 'var(--color-ink-3)', fontSize: 11 }}>→</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: 480, margin: '0 auto', padding: '40px 24px', borderBottom: '1px solid var(--color-rule-soft)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: 'var(--color-ink-3)', letterSpacing: '0.1em' }}>FUNCIONA ASÍ</span>
          <span style={{ height: 1, background: 'var(--color-ink)', flex: 1 }} />
        </div>

        {[
          { n: '01', title: 'Creá tu cuenta', desc: 'Rápido y gratis. Solo tu nombre, email y contraseña.' },
          { n: '02', title: 'Invitá a tu familia', desc: 'Generá un código único y compartíselo. Cada uno se une con su cuenta.' },
          { n: '03', title: 'Empezá a organizarse', desc: 'Todo disponible al instante desde el celular o la compu.' },
        ].map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            style={{
              display: 'flex', gap: 16, padding: '16px 0',
              borderBottom: '1px solid var(--color-rule-soft)',
            }}
          >
            <span style={{
              fontFamily: 'var(--font-plex-serif)', fontStyle: 'italic',
              fontSize: 24, color: 'var(--color-primary)',
              flexShrink: 0, width: 32, lineHeight: 1,
            }}>{s.n}</span>
            <div>
              <div style={{ fontFamily: 'var(--font-plex-serif)', fontStyle: 'italic', fontSize: 17, color: 'var(--color-ink)', marginBottom: 4 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: 'var(--color-ink-2)', lineHeight: 1.5 }}>{s.desc}</div>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Secciones */}
      <section style={{ maxWidth: 480, margin: '0 auto', padding: '40px 24px', borderBottom: '1px solid var(--color-rule-soft)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: 'var(--color-ink-3)', letterSpacing: '0.1em' }}>QUÉ INCLUYE</span>
          <span style={{ height: 1, background: 'var(--color-ink)', flex: 1 }} />
        </div>
        {secciones.map(s => (
          <div key={s.num} style={{
            display: 'flex', alignItems: 'baseline', gap: 12, padding: '11px 0',
            borderBottom: '1px solid var(--color-rule-soft)',
          }}>
            <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'var(--color-ink-3)', width: 22 }}>{s.num}</span>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.dot, border: '1px solid var(--color-ink)', alignSelf: 'center', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-plex-serif)', fontStyle: 'italic', fontSize: 18, color: 'var(--color-ink)' }}>{s.name}</span>
            <span style={{ flex: 1, fontSize: 12, color: 'var(--color-ink-2)' }}>{s.desc}</span>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section style={{ maxWidth: 480, margin: '0 auto', padding: '56px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <span style={{ height: 1, background: 'var(--color-ink)', flex: 1 }} />
          <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: 'var(--color-ink-3)', letterSpacing: '0.1em' }}>EMPEZAR</span>
          <span style={{ height: 1, background: 'var(--color-ink)', flex: 1 }} />
        </div>
        <h2 style={{
          fontFamily: 'var(--font-plex-serif)', fontWeight: 500, fontStyle: 'italic',
          fontSize: 32, letterSpacing: '-0.015em', margin: '0 0 12px',
          color: 'var(--color-ink)',
        }}>
          ¿Listo para organizarse?
        </h2>
        <p style={{ fontSize: 14, color: 'var(--color-ink-2)', marginBottom: 24 }}>
          Es gratis. Tarda menos de un minuto.
        </p>
        <Link href="/login" style={{
          fontFamily: 'var(--font-plex-mono)', fontSize: 12,
          background: 'var(--color-primary)', color: 'var(--color-bg)',
          padding: '14px 28px', borderRadius: 4, letterSpacing: '0.08em',
          textDecoration: 'none', textTransform: 'uppercase',
          display: 'inline-block',
        }}>
          Crear mi hogar →
        </Link>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1.5px solid var(--color-ink)',
        padding: '16px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <NidoLogo size={16} />
        <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, color: 'var(--color-ink-3)', letterSpacing: '0.08em' }}>
          VOL. 01 · 2026
        </span>
      </footer>

    </div>
  )
}
