'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Home, Plus, Hash, ArrowLeft, ArrowRight } from 'lucide-react'

function generarCodigo() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function LogoMark() {
  return (
    <div
      className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
      style={{
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
      }}
    >
      <svg viewBox="0 0 20 20" fill="none" className="w-7 h-7">
        <path d="M10 3L17 9V17H13V13H7V17H3V9L10 3Z" fill="white" />
      </svg>
    </div>
  )
}

export default function SetupCasaPage() {
  const router = useRouter()
  const [modo, setModo] = useState<'elegir' | 'crear' | 'unirse'>('elegir')
  const [nombreCasa, setNombreCasa] = useState('')
  const [codigo, setCodigo] = useState('')
  const [loading, setLoading] = useState(false)

  async function crearCasa(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const nuevoCodigo = generarCodigo()
    const { data: casa, error } = await supabase
      .from('casas')
      .insert({ nombre: nombreCasa, codigo: nuevoCodigo, creado_por: user.id })
      .select()
      .single()

    if (error || !casa) {
      toast.error('No se pudo crear la casa. Intentá de nuevo.')
      setLoading(false)
      return
    }

    await supabase.from('usuarios').update({ casa_id: casa.id }).eq('id', user.id)
    toast.success(`¡Hogar "${nombreCasa}" creado!`)
    router.push('/dashboard')
  }

  async function unirseACasa(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: casa } = await supabase
      .from('casas')
      .select('id, nombre')
      .eq('codigo', codigo.toUpperCase())
      .single()

    if (!casa) {
      toast.error('Código inválido. Verificá que esté bien escrito.')
      setLoading(false)
      return
    }

    await supabase.from('usuarios').update({ casa_id: casa.id }).eq('id', user.id)
    toast.success(`¡Te uniste a "${casa.nombre}"!`)
    router.push('/dashboard')
  }

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.09)',
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: '#09090b' }}
    >
      {/* Ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 65%)' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm relative"
      >
        <div className="text-center mb-8">
          <LogoMark />
          <h1 className="text-2xl font-bold text-white tracking-tight">Tu Hogar</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Elegí cómo querés empezar
          </p>
        </div>

        <AnimatePresence mode="wait">

          {/* Elegir */}
          {modo === 'elegir' && (
            <motion.div
              key="elegir"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.22 }}
              className="flex flex-col gap-3"
            >
              <motion.button
                onClick={() => setModo('crear')}
                whileTap={{ scale: 0.97 }}
                className="rounded-2xl p-5 text-left cursor-pointer transition-all group"
                style={{
                  background: 'rgba(99,102,241,0.08)',
                  border: '1px solid rgba(99,102,241,0.2)',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(99,102,241,0.2)' }}
                    >
                      <Plus className="w-4 h-4" style={{ color: '#a5b4fc' }} />
                    </div>
                    <p className="font-bold text-white">Crear hogar nuevo</p>
                  </div>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#a5b4fc' }} />
                </div>
                <p className="text-sm pl-12" style={{ color: 'rgba(165,180,252,0.6)' }}>
                  Generás un código para invitar a tu familia
                </p>
              </motion.button>

              <motion.button
                onClick={() => setModo('unirse')}
                whileTap={{ scale: 0.97 }}
                className="rounded-2xl p-5 text-left cursor-pointer transition-all group"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.07)' }}
                    >
                      <Home className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.5)' }} />
                    </div>
                    <p className="font-bold text-white">Unirme a un hogar</p>
                  </div>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'rgba(255,255,255,0.4)' }} />
                </div>
                <p className="text-sm pl-12" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Ingresá el código que te compartieron
                </p>
              </motion.button>
            </motion.div>
          )}

          {/* Crear */}
          {modo === 'crear' && (
            <motion.div
              key="crear"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.22 }}
              className="rounded-2xl p-6"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <button
                onClick={() => setModo('elegir')}
                className="flex items-center gap-1.5 text-sm mb-6 cursor-pointer transition-colors"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                <ArrowLeft className="w-4 h-4" /> Volver
              </button>

              <p className="text-white font-semibold mb-1">Crear hogar nuevo</p>
              <p className="text-xs mb-5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Elegí un nombre para identificar tu hogar
              </p>

              <form onSubmit={crearCasa} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    Nombre del hogar
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Casa García, Los Martínez..."
                    value={nombreCasa}
                    onChange={e => setNombreCasa(e.target.value)}
                    required
                    autoFocus
                    className="rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
                    style={inputStyle}
                  />
                </div>
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-sm text-white cursor-pointer disabled:opacity-50 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 16px rgba(99,102,241,0.25)' }}
                >
                  {loading
                    ? <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
                    : <><Plus className="w-4 h-4" /> Crear hogar</>
                  }
                </motion.button>
              </form>
            </motion.div>
          )}

          {/* Unirse */}
          {modo === 'unirse' && (
            <motion.div
              key="unirse"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.22 }}
              className="rounded-2xl p-6"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <button
                onClick={() => setModo('elegir')}
                className="flex items-center gap-1.5 text-sm mb-6 cursor-pointer transition-colors"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                <ArrowLeft className="w-4 h-4" /> Volver
              </button>

              <p className="text-white font-semibold mb-1">Unirme a un hogar</p>
              <p className="text-xs mb-5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Pedile el código a quien ya tiene la cuenta
              </p>

              <form onSubmit={unirseACasa} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    Código de invitación
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,255,255,0.25)' }} />
                    <input
                      type="text"
                      placeholder="AB12CD"
                      value={codigo}
                      onChange={e => setCodigo(e.target.value.toUpperCase())}
                      required
                      maxLength={6}
                      autoFocus
                      className="w-full rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all uppercase tracking-widest font-mono text-center text-lg placeholder-slate-700"
                      style={inputStyle}
                    />
                  </div>
                </div>
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-sm text-white cursor-pointer disabled:opacity-50 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 16px rgba(99,102,241,0.25)' }}
                >
                  {loading
                    ? <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
                    : 'Unirme al hogar'
                  }
                </motion.button>
              </form>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  )
}
