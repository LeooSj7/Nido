'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Bell, Trash2, Clock, BellOff } from 'lucide-react'
import { SkeletonList } from '@/components/Skeleton'
import ConfirmDialog from '@/components/ConfirmDialog'

type Recordatorio = {
  id: string
  titulo: string
  descripcion: string | null
  fecha: string
  usuario_id: string
}

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-AR', {
    weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  })
}

function esHoy(fecha: string) {
  const f = new Date(fecha)
  const hoy = new Date()
  return f.toDateString() === hoy.toDateString()
}

function esPasado(fecha: string) {
  return new Date(fecha) < new Date()
}

function tiempoRestante(fecha: string) {
  const diff = new Date(fecha).getTime() - Date.now()
  if (diff < 0) return null
  const horas = Math.floor(diff / 3600000)
  const minutos = Math.floor((diff % 3600000) / 60000)
  if (horas > 24) return `en ${Math.floor(horas / 24)}d`
  if (horas > 0) return `en ${horas}h ${minutos}m`
  return `en ${minutos}m`
}

export default function RecordatoriosPage() {
  const [recordatorios, setRecordatorios] = useState<Recordatorio[]>([])
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fecha, setFecha] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [casaId, setCasaId] = useState<string | null>(null)
  const [nombreUsuario, setNombreUsuario] = useState('')
  const [loading, setLoading] = useState(false)
  const [iniciado, setIniciado] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: usuario } = await supabase.from('usuarios').select('casa_id, nombre').eq('id', user.id).single()
      if (!usuario?.casa_id) return
      setUserId(user.id)
      setCasaId(usuario.casa_id)
      setNombreUsuario(usuario.nombre)
      await cargarRecordatorios(usuario.casa_id)
      setIniciado(true)
    }
    init()
  }, [])

  async function cargarRecordatorios(cid: string) {
    const { data } = await supabase.from('recordatorios').select('*').eq('casa_id', cid).order('fecha', { ascending: true })
    if (data) setRecordatorios(data)
  }

  async function agregarRecordatorio(e: React.FormEvent) {
    e.preventDefault()
    if (!userId || !casaId || !titulo.trim() || !fecha) return
    setLoading(true)
    await supabase.from('recordatorios').insert({ titulo, descripcion: descripcion || null, fecha, usuario_id: userId, casa_id: casaId })
    await supabase.from('actividad').insert({ casa_id: casaId, usuario_id: userId, usuario_nombre: nombreUsuario, tipo: 'recordatorio_creado', descripcion: `creo el recordatorio "${titulo}"` })
    toast.success('Recordatorio creado')
    setTitulo('')
    setDescripcion('')
    setFecha('')
    await cargarRecordatorios(casaId)
    setLoading(false)
  }

  async function eliminarRecordatorio(id: string) {
    await supabase.from('recordatorios').delete().eq('id', id)
    setRecordatorios(prev => prev.filter(r => r.id !== id))
    setConfirmId(null)
  }

  const proximos = recordatorios.filter(r => !esPasado(r.fecha))
  const pasados = recordatorios.filter(r => esPasado(r.fecha))
  const hoyCount = proximos.filter(r => esHoy(r.fecha)).length

  const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16 }
  const inputCls = "w-full rounded-xl px-4 py-2.5 text-white placeholder-white/25 text-sm focus:ring-2 focus:ring-indigo-500/40 outline-none transition-all"
  const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }

  return (
    <div className="p-5 pb-4">
      <ConfirmDialog
        open={!!confirmId}
        title="Eliminar recordatorio"
        message="Se borrara de la lista de recordatorios."
        onConfirm={() => confirmId && eliminarRecordatorio(confirmId)}
        onCancel={() => setConfirmId(null)}
      />
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-6 pt-2"
        >
          <Link href="/dashboard">
            <motion.div whileTap={{ scale: 0.9 }} className="cursor-pointer p-1 transition-colors" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <ArrowLeft className="w-5 h-5" />
            </motion.div>
          </Link>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" style={{ color: '#a855f7' }} />
            <h1 className="text-xl font-bold text-white">Agenda</h1>
          </div>
          {hoyCount > 0 && (
            <span
              className="ml-auto text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.25)', color: '#a855f7' }}
            >
              {hoyCount} hoy
            </span>
          )}
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={agregarRecordatorio}
          className="rounded-2xl p-4 mb-5"
          style={cardStyle}
        >
          <p className="text-sm font-medium text-white mb-3">Nuevo recordatorio</p>
          <div className="flex flex-col gap-2.5">
            <input
              type="text"
              placeholder="Titulo (ej: Pagar expensas)"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              required
              className={inputCls}
              style={inputStyle}
            />
            <input
              type="text"
              placeholder="Descripcion (opcional)"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              className={inputCls}
              style={inputStyle}
            />
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'rgba(255,255,255,0.5)' }}>Fecha y hora</label>
              <input
                type="datetime-local"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                required
                className={inputCls}
                style={inputStyle}
              />
            </div>
            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.97 }}
              className="flex items-center justify-center gap-2 disabled:opacity-50 text-white rounded-xl py-2.5 font-semibold text-sm cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.2)' }}
            >
              {loading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><Plus className="w-4 h-4" /> Agregar</>
              }
            </motion.button>
          </div>
        </motion.form>

        {/* Proximos */}
        {iniciado && proximos.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-medium uppercase tracking-wider mb-2 px-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Proximos ({proximos.length})
            </p>
            <AnimatePresence>
              {proximos.map((r) => {
                const hoy = esHoy(r.fecha)
                const tiempo = tiempoRestante(r.fecha)
                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16, height: 0 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    className="rounded-xl p-4 mb-2 flex items-start gap-3"
                    style={
                      hoy
                        ? { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(168,85,247,0.25)', borderRadius: 12 }
                        : { ...cardStyle, borderRadius: 12 }
                    }
                  >
                    <div
                      className="rounded-xl p-2 flex-shrink-0"
                      style={
                        hoy
                          ? { background: 'rgba(168,85,247,0.12)', color: '#a855f7' }
                          : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }
                      }
                    >
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium">{r.titulo}</p>
                      {r.descripcion && (
                        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{r.descripcion}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Clock className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.25)' }} />
                        <span className="text-xs" style={{ color: hoy ? '#a855f7' : 'rgba(255,255,255,0.5)' }}>
                          {formatFecha(r.fecha)}
                        </span>
                        {tiempo && hoy && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded-md"
                            style={{ background: 'rgba(168,85,247,0.12)', color: '#c084fc' }}
                          >
                            {tiempo}
                          </span>
                        )}
                      </div>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => setConfirmId(r.id)}
                      className="cursor-pointer p-1 transition-colors"
                      style={{ color: 'rgba(255,255,255,0.2)' }}
                    >
                      <Trash2 className="w-4 h-4 hover:text-red-400" />
                    </motion.button>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Pasados */}
        {iniciado && pasados.length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wider mb-2 px-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Historial ({pasados.length})
            </p>
            <AnimatePresence>
              {pasados.map((r) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.35 }}
                  className="rounded-xl p-4 mb-2 flex items-start gap-3"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12 }}
                >
                  <div
                    className="rounded-xl p-2 flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }}
                  >
                    <BellOff className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{r.titulo}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>{formatFecha(r.fecha)}</p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => setConfirmId(r.id)}
                    className="cursor-pointer p-1 transition-colors"
                    style={{ color: 'rgba(255,255,255,0.2)' }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {!iniciado && <SkeletonList count={3} />}

        {iniciado && recordatorios.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mt-16"
          >
            <Bell className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.12)' }} />
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>No hay recordatorios</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>Agrega uno para no olvidar nada</p>
          </motion.div>
        )}

      </div>
    </div>
  )
}
