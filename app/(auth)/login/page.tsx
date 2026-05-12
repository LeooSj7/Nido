'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'

// ─── Logo ─────────────────────────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'login' | 'register'

export default function AuthPage() {
  const router  = useRouter()
  const [tab, setTab]       = useState<Tab>('login')
  const [nombre, setNombre] = useState('')
  const [email, setEmail]   = useState('')
  const [pw, setPw]         = useState('')
  const [loading, setLoading] = useState(false)

  function switchTab(t: Tab) {
    setTab(t)
    setPw('')
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pw })
    if (error) {
      toast.error('Email o contraseña incorrectos')
      setLoading(false)
      return
    }
    if (data.user) {
      const { data: usuario } = await supabase
        .from('usuarios').select('casa_id').eq('id', data.user.id).single()
      router.push(usuario?.casa_id ? '/dashboard' : '/setup-casa')
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({ email, password: pw })
    if (error) {
      toast.error('Error al registrarse. Intentá con otro email.')
      setLoading(false)
      return
    }
    if (data.user) {
      await supabase.from('usuarios').insert({ id: data.user.id, nombre, email })
      toast.success('¡Cuenta creada!')
      router.push('/setup-casa')
    }
    setLoading(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    display: 'block',
    padding: '6px 0 8px',
    background: 'transparent',
    border: 0,
    borderBottom: '1.5px solid var(--color-ink)',
    fontFamily: 'var(--font-plex-sans)',
    fontSize: 16,
    color: 'var(--color-ink)',
    outline: 'none',
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '32px 24px 28px',
      maxWidth: 440,
      margin: '0 auto',
    }}>

      {/* Top: logo + edition */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <NidoLogo size={28} />
        <span style={{
          fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: 'var(--color-ink-2)',
        }}>
          Vol. 01 · 2026
        </span>
      </div>

      {/* Center: headline */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{
            fontFamily: 'var(--font-plex-mono)', fontSize: 10,
            color: 'var(--color-ink-3)', letterSpacing: '0.1em',
          }}>—— DIARIO DE</span>
          <span style={{ height: 1, background: 'var(--color-ink)', flex: 1 }} />
        </div>
        <h1 style={{
          fontFamily: 'var(--font-plex-serif)', fontWeight: 500, fontStyle: 'italic',
          fontSize: 46, lineHeight: 0.95, letterSpacing: '-0.02em',
          margin: 0, color: 'var(--color-ink)',
        }}>
          Tu casa,<br />en orden.
        </h1>
        <p style={{ fontSize: 14, color: 'var(--color-ink-2)', marginTop: 16, lineHeight: 1.6 }}>
          Una bitácora compartida. Tareas, gastos, compras y agenda — anotados como en el cuaderno de la cocina.
        </p>
      </div>

      {/* Bottom: form */}
      <div>
        {/* Tab switcher */}
        <div style={{
          display: 'flex', gap: 0,
          borderBottom: '1.5px solid var(--color-ink)', marginBottom: 0,
        }}>
          {(['login', 'register'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              style={{
                flex: 1, padding: '8px 0',
                fontFamily: 'var(--font-plex-mono)', fontSize: 10,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                background: 'transparent', border: 0, cursor: 'pointer',
                color: tab === t ? 'var(--color-ink)' : 'var(--color-ink-3)',
                borderBottom: tab === t ? '2px solid var(--color-ink)' : '2px solid transparent',
                marginBottom: -1.5,
              }}
            >
              {t === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>
          ))}
        </div>

        <form
          onSubmit={tab === 'login' ? handleLogin : handleRegister}
          style={{ paddingTop: 16 }}
        >
          {tab === 'register' && (
            <label style={{ display: 'block', marginBottom: 14 }}>
              <span style={{
                fontFamily: 'var(--font-plex-mono)', fontSize: 9,
                color: 'var(--color-ink-2)', letterSpacing: '0.1em',
                display: 'block', marginBottom: 2,
              }}>
                TU NOMBRE
              </span>
              <input
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                required
                autoFocus
                placeholder="Ej: María"
                style={inputStyle}
              />
            </label>
          )}

          <label style={{ display: 'block', marginBottom: 14 }}>
            <span style={{
              fontFamily: 'var(--font-plex-mono)', fontSize: 9,
              color: 'var(--color-ink-2)', letterSpacing: '0.1em',
              display: 'block', marginBottom: 2,
            }}>
              EMAIL
            </span>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus={tab === 'login'}
              style={inputStyle}
            />
          </label>

          <label style={{ display: 'block', marginBottom: 18 }}>
            <span style={{
              fontFamily: 'var(--font-plex-mono)', fontSize: 9,
              color: 'var(--color-ink-2)', letterSpacing: '0.1em',
              display: 'block', marginBottom: 2,
            }}>
              CONTRASEÑA
            </span>
            <input
              type="password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              required
              minLength={tab === 'register' ? 6 : undefined}
              style={inputStyle}
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '14px',
              background: 'var(--color-primary)',
              color: 'var(--color-bg)', border: 0,
              fontFamily: 'var(--font-plex-mono)', fontSize: 12,
              letterSpacing: '0.1em', cursor: loading ? 'default' : 'pointer',
              borderRadius: 4, fontWeight: 500,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'CARGANDO…' : tab === 'login' ? 'ABRIR EL DIARIO →' : 'CREAR MI CUENTA →'}
          </button>

          <p style={{
            textAlign: 'center', fontSize: 12, color: 'var(--color-ink-2)',
            margin: '12px 0 0', fontFamily: 'var(--font-plex-mono)',
          }}>
            {tab === 'login' ? (
              <>
                ¿nuevo?{' '}
                <button
                  type="button"
                  onClick={() => switchTab('register')}
                  style={{
                    background: 'none', border: 0, padding: 0,
                    color: 'var(--color-primary)', textDecoration: 'underline',
                    fontFamily: 'var(--font-plex-mono)', fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  crear casa
                </button>
              </>
            ) : (
              <>
                ¿ya tenés cuenta?{' '}
                <button
                  type="button"
                  onClick={() => switchTab('login')}
                  style={{
                    background: 'none', border: 0, padding: 0,
                    color: 'var(--color-primary)', textDecoration: 'underline',
                    fontFamily: 'var(--font-plex-mono)', fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  entrar
                </button>
              </>
            )}
          </p>
        </form>
      </div>

    </div>
  )
}
