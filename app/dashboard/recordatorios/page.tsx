'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Bell, Trash2, Clock, BellOff } from 'lucide-react'
import { SkeletonList } from '@/components/Skeleton'
import ConfirmDialog from '@/components/ConfirmDialog'
import PageHeader from '@/components/PageHeader'

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

  const cardStyle = { background: 'var(--color-paper)', border: '1.5px solid var(--color-ink)', borderRadius: 2 }
  const inputCls = "w-full px-0 py-2.5 text-sm focus:outline-none transition-all"
  const inputStyle = { background: 'transparent', border: 0, borderBottom: '1.5px solid var(--color-ink)', borderRadius: 0, color: 'var(--color-ink)' }

  return (
    <div style={{ minHeight: '100vh' }}>
      <ConfirmDialog
        open={!!confirmId}
        title="Eliminar recordatorio"
        message="Se borrara de la lista de recordatorios."
        onConfirm={() => confirmId && eliminarRecordatorio(confirmId)}
        onCancel={() => setConfirmId(null)}
      />
      <PageHeader
        sectionNum="06"
        sectionLabel="Agenda"
        right={`${proximos.length} PRÓXIMOS`}
        title="Lo que viene."
        sub="recordatorios de la casa"
      />
      <div className="page-content">

        {hoyCount > 0 && (
          <div style={{ marginTop: 12 }}>
            <span style={{
              fontFamily: 'var(--font-plex-mono)', fontSize: 10,
              color: 'var(--color-warm)', letterSpacing: '0.06em',
              border: '1px solid var(--color-warm)', padding: '3px 8px',
            }}>
              {hoyCount} hoy
            </span>
          </div>
        )}

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
              <label className="text-xs mb-1 block" style={{ color: 'var(--color-ink-2)' }}>Fecha y hora</label>
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
              style={{ background: 'var(--color-primary)', boxShadow: 'none' }}
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
            <p className="text-xs font-medium uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--color-ink-3)' }}>
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
                        ? { background: 'var(--color-paper)', border: '1px solid rgba(168,85,247,0.25)', borderRadius: 12 }
                        : { ...cardStyle, borderRadius: 12 }
                    }
                  >
                    <div
                      className="rounded-xl p-2 flex-shrink-0"
                      style={
                        hoy
                          ? { background: 'rgba(168,85,247,0.12)', color: '#a855f7' }
                          : { background: 'var(--color-paper)', color: 'var(--color-ink-2)' }
                      }
                    >
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium">{r.titulo}</p>
                      {r.descripcion && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-ink-2)' }}>{r.descripcion}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Clock className="w-3 h-3" style={{ color: 'var(--color-ink-3)' }} />
                        <span className="text-xs" style={{ color: hoy ? '#a855f7' : 'var(--color-ink-2)' }}>
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
                      style={{ color: 'var(--color-ink-3)' }}
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
            <p className="text-xs font-medium uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--color-ink-3)' }}>
              Historial ({pasados.length})
            </p>
            <AnimatePresence>
              {pasados.map((r) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.35 }}
                  className="rounded-xl p-4 mb-2 flex items-start gap-3"
                  style={{ background: 'var(--color-paper)', border: '1px solid var(--color-rule-soft)', borderRadius: 12 }}
                >
                  <div
                    className="rounded-xl p-2 flex-shrink-0"
                    style={{ background: 'var(--color-paper)', color: 'var(--color-ink-2)' }}
                  >
                    <BellOff className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ color: 'var(--color-ink-2)' }}>{r.titulo}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-ink-3)' }}>{formatFecha(r.fecha)}</p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => setConfirmId(r.id)}
                    className="cursor-pointer p-1 transition-colors"
                    style={{ color: 'var(--color-ink-3)' }}
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
            <Bell className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--color-ink-3)' }} />
            <p className="text-sm" style={{ color: 'var(--color-ink-2)' }}>No hay recordatorios</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-ink-3)' }}>Agrega uno para no olvidar nada</p>
          </motion.div>
        )}

      </div>
    </div>
  )
}





