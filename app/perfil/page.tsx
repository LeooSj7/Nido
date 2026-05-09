'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { ArrowLeft, Save, Users, Copy, LogOut, Hash } from 'lucide-react'

type Miembro = { id: string; nombre: string; email: string }

const card = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
}

export default function PerfilPage() {
  const router = useRouter()
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [casaNombre, setCasaNombre] = useState('')
  const [casaCodigo, setCasaCodigo] = useState('')
  const [miembros, setMiembros] = useState<Miembro[]>([])
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function cargar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: usuario } = await supabase
        .from('usuarios').select('nombre, email, casa_id').eq('id', user.id).single()
      if (!usuario) return

      setUserId(user.id)
      setNombre(usuario.nombre)
      setEmail(usuario.email)

      if (usuario.casa_id) {
        const [casa, miembrosData] = await Promise.all([
          supabase.from('casas').select('nombre, codigo').eq('id', usuario.casa_id).single(),
          supabase.from('usuarios').select('id, nombre, email').eq('casa_id', usuario.casa_id)
        ])
        if (casa.data) { setCasaNombre(casa.data.nombre); setCasaCodigo(casa.data.codigo) }
        if (miembrosData.data) setMiembros(miembrosData.data)
      }
    }
    cargar()
  }, [router])

  async function guardarNombre(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) return
    setLoading(true)
    await supabase.from('usuarios').update({ nombre }).eq('id', userId)
    toast.success('Nombre actualizado')
    setLoading(false)
  }

  function copiarCodigo() {
    navigator.clipboard.writeText(casaCodigo)
    toast.success(`Código ${casaCodigo} copiado`)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const iniciales = (n: string) => n.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="min-h-screen p-5 pb-24" style={{ background: '#09090b' }}>
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-8 pt-2"
        >
          <Link href="/dashboard">
            <motion.div
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-xl cursor-pointer transition-colors"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.div>
          </Link>
          <h1 className="text-xl font-bold text-white">Mi perfil</h1>
        </motion.div>

        {/* Avatar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex flex-col items-center mb-8"
        >
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white mb-4"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}
          >
            {nombre ? iniciales(nombre) : '?'}
          </div>
          <p className="text-white font-semibold text-lg">{nombre}</p>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{email}</p>
        </motion.div>

        {/* Editar nombre */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-5 mb-3"
          style={card}
        >
          <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Editar nombre
          </p>
          <form onSubmit={guardarNombre} className="flex gap-2">
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              required
              placeholder="Tu nombre"
              className="flex-1 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
            />
            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.93 }}
              className="rounded-xl px-4 py-2.5 cursor-pointer disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              {loading
                ? <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
                : <Save className="w-4 h-4 text-white" />
              }
            </motion.button>
          </form>
        </motion.div>

        {/* Casa */}
        {casaNombre && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl p-5 mb-3"
            style={card}
          >
            <div className="flex items-center justify-between mb-5">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Tu hogar
              </p>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={copiarCodigo}
                className="flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5 cursor-pointer transition-all"
                style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc' }}
              >
                <Copy className="w-3 h-3" /> Copiar código
              </motion.button>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <Users className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.5)' }} />
              </div>
              <div>
                <p className="text-white font-semibold">{casaNombre}</p>
                <div className="flex items-center gap-1 mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  <Hash className="w-3 h-3" />
                  <span className="font-mono text-xs tracking-widest">{casaCodigo}</span>
                </div>
              </div>
            </div>

            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Miembros · {miembros.length}
            </p>
            <div className="flex flex-col gap-2">
              {miembros.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{
                      background: m.id === userId
                        ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                        : 'rgba(255,255,255,0.08)',
                    }}
                  >
                    {iniciales(m.nombre)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-white font-medium truncate">{m.nombre}</p>
                      {m.id === userId && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-md flex-shrink-0"
                          style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}
                        >
                          vos
                        </span>
                      )}
                    </div>
                    <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>{m.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Cerrar sesión */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.button
            onClick={handleLogout}
            whileTap={{ scale: 0.97 }}
            className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 font-medium text-sm cursor-pointer transition-all"
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.18)',
              color: '#f87171',
            }}
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </motion.button>
        </motion.div>

      </div>
    </div>
  )
}
