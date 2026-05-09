'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeft, Plus, CheckSquare, Trash2, Users, User, Calendar,
  AlertCircle, Flag, Droplets, Footprints, Check, Home, Star, Pencil,
} from 'lucide-react'
import { SkeletonList } from '@/components/Skeleton'
import ConfirmDialog from '@/components/ConfirmDialog'

// ─── Types & constants ────────────────────────────────────────────────────────

type Tab = 'hogar' | 'habitos' | 'agua' | 'pasos'

type Tarea = {
  id: string
  titulo: string
  completada: boolean
  es_compartida: boolean
  creado_at: string
  usuario_id: string
  fecha_limite: string | null
  prioridad: 'urgente' | 'normal' | 'baja'
}

type Usuario = { id: string; nombre: string }
type Habito = { id: string; nombre: string }

const PRIORIDADES = [
  { valor: 'urgente', label: 'Urgente' },
  { valor: 'normal',  label: 'Normal' },
  { valor: 'baja',    label: 'Baja' },
]

function getPrioridad(v: string) {
  return PRIORIDADES.find(p => p.valor === v) ?? PRIORIDADES[1]
}

function formatLimite(fecha: string) {
  const d = new Date(fecha + 'T00:00:00')
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const diff = Math.ceil((d.getTime() - hoy.getTime()) / 86400000)
  if (diff < 0) return { label: 'Vencida', urgent: true }
  if (diff === 0) return { label: 'Hoy', urgent: true }
  if (diff === 1) return { label: 'Mañana', urgent: false }
  return { label: d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }), urgent: false }
}

async function logActividad(
  casaId: string, usuarioId: string, nombreUsuario: string,
  tipo: string, descripcion: string
) {
  await supabase.from('actividad').insert({
    casa_id: casaId, usuario_id: usuarioId,
    usuario_nombre: nombreUsuario, tipo, descripcion,
  })
}

function todayKey() {
  return new Date().toISOString().split('T')[0]
}

// ─── Design helpers ───────────────────────────────────────────────────────────

const card = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 16,
}

const input = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 12,
}

const primaryBtn = {
  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  boxShadow: '0 4px 12px rgba(99,102,241,0.2)',
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TareasPage() {
  const [activeTab, setActiveTab] = useState<Tab>('hogar')

  // Hogar state
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [titulo, setTitulo] = useState('')
  const [compartida, setCompartida] = useState(false)
  const [fechaLimite, setFechaLimite] = useState('')
  const [prioridad, setPrioridad] = useState<'urgente' | 'normal' | 'baja'>('normal')
  const [userId, setUserId] = useState<string | null>(null)
  const [casaId, setCasaId] = useState<string | null>(null)
  const [nombreUsuario, setNombreUsuario] = useState('')
  const [loading, setLoading] = useState(false)
  const [iniciado, setIniciado] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  // Habitos state
  const [habitos, setHabitos] = useState<Habito[]>([])
  const [completadosHoy, setCompletadosHoy] = useState<Record<string, boolean>>({})
  const [nuevoHabito, setNuevoHabito] = useState('')

  // Agua state
  const [vasos, setVasos] = useState(0)
  const [aguaGoalToasted, setAguaGoalToasted] = useState(false)

  // Pasos state
  const [pasos, setPasos] = useState(0)
  const [pasosGoalToasted, setPasosGoalToasted] = useState(false)
  const [pasosGoal, setPasosGoal] = useState(10000)
  const [editandoPasosGoal, setEditandoPasosGoal] = useState(false)
  const [nuevoPasosGoal, setNuevoPasosGoal] = useState('')

  // ── Supabase init ──────────────────────────────────────────────────────────

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: usuario } = await supabase
        .from('usuarios').select('casa_id, nombre').eq('id', user.id).single()
      if (!usuario?.casa_id) return
      setUserId(user.id)
      setCasaId(usuario.casa_id)
      setNombreUsuario(usuario.nombre)
      const [, miembros] = await Promise.all([
        cargarTareas(usuario.casa_id),
        supabase.from('usuarios').select('id, nombre').eq('casa_id', usuario.casa_id),
      ])
      if (miembros.data) setUsuarios(miembros.data)
      setIniciado(true)
    }
    init()
  }, [])

  // ── localStorage init ──────────────────────────────────────────────────────

  useEffect(() => {
    const raw = localStorage.getItem('nido_habitos')
    if (raw) setHabitos(JSON.parse(raw))
    const rawH = localStorage.getItem(`nido_habitos_${todayKey()}`)
    if (rawH) setCompletadosHoy(JSON.parse(rawH))
    const rawA = localStorage.getItem(`nido_agua_${todayKey()}`)
    setVasos(rawA ? Number(rawA) : 0)
    const rawP = localStorage.getItem(`nido_pasos_${todayKey()}`)
    setPasos(rawP ? Number(rawP) : 0)
    const rawGoal = localStorage.getItem('nido_pasos_goal')
    setPasosGoal(rawGoal ? Number(rawGoal) : 10000)
  }, [])

  // ── Supabase functions ─────────────────────────────────────────────────────

  async function cargarTareas(cid: string) {
    const { data } = await supabase
      .from('tareas').select('*').eq('casa_id', cid)
      .order('creado_at', { ascending: false })
    if (data) setTareas(data)
  }

  function nombreMiembro(uid: string) {
    return usuarios.find(u => u.id === uid)?.nombre ?? '?'
  }

  async function agregarTarea(e: React.FormEvent) {
    e.preventDefault()
    if (!userId || !casaId || !titulo.trim()) return
    setLoading(true)
    await supabase.from('tareas').insert({
      titulo, es_compartida: compartida,
      usuario_id: userId, casa_id: casaId,
      fecha_limite: fechaLimite || null, prioridad,
    })
    await logActividad(casaId, userId, nombreUsuario, 'tarea_creada', `agregó la tarea "${titulo}"`)
    toast.success('Tarea agregada')
    setTitulo(''); setCompartida(false); setFechaLimite(''); setPrioridad('normal')
    await cargarTareas(casaId)
    setLoading(false)
  }

  async function toggleTarea(tarea: Tarea) {
    await supabase.from('tareas').update({ completada: !tarea.completada }).eq('id', tarea.id)
    if (!tarea.completada && userId && casaId) {
      await logActividad(casaId, userId, nombreUsuario, 'tarea_completada', `completó "${tarea.titulo}"`)
      toast.success('¡Tarea completada!')
    }
    setTareas(prev => prev.map(t => t.id === tarea.id ? { ...t, completada: !t.completada } : t))
  }

  async function eliminarTarea(id: string) {
    await supabase.from('tareas').delete().eq('id', id)
    toast.success('Tarea eliminada')
    setTareas(prev => prev.filter(t => t.id !== id))
    setConfirmId(null)
  }

  // ── Habitos functions ──────────────────────────────────────────────────────

  const saveHabitos = useCallback((list: Habito[]) => {
    setHabitos(list)
    localStorage.setItem('nido_habitos', JSON.stringify(list))
  }, [])

  const saveCompletados = useCallback((map: Record<string, boolean>) => {
    setCompletadosHoy(map)
    localStorage.setItem(`nido_habitos_${todayKey()}`, JSON.stringify(map))
  }, [])

  function agregarHabito(e: React.FormEvent) {
    e.preventDefault()
    if (!nuevoHabito.trim()) return
    const nuevo: Habito = { id: crypto.randomUUID(), nombre: nuevoHabito.trim() }
    const updated = [...habitos, nuevo]
    saveHabitos(updated)
    setNuevoHabito('')
  }

  function toggleHabito(id: string) {
    const updated = { ...completadosHoy, [id]: !completadosHoy[id] }
    saveCompletados(updated)
    const totalCompletados = habitos.filter(h => updated[h.id]).length
    if (totalCompletados === habitos.length && habitos.length > 0) {
      toast.success('¡Todos los hábitos completados hoy!')
    }
  }

  function eliminarHabito(id: string) {
    const updated = habitos.filter(h => h.id !== id)
    saveHabitos(updated)
    const updatedMap = { ...completadosHoy }
    delete updatedMap[id]
    saveCompletados(updatedMap)
  }

  // ── Agua functions ─────────────────────────────────────────────────────────

  function updateVasos(next: number) {
    const clamped = Math.max(0, Math.min(12, next))
    setVasos(clamped)
    localStorage.setItem(`nido_agua_${todayKey()}`, String(clamped))
    if (clamped >= 8 && !aguaGoalToasted) {
      toast.success('¡Meta de agua alcanzada!')
      setAguaGoalToasted(true)
    }
    if (clamped < 8) setAguaGoalToasted(false)
  }

  // ── Pasos functions ────────────────────────────────────────────────────────

  function updatePasos(next: number) {
    const clamped = Math.max(0, next)
    setPasos(clamped)
    localStorage.setItem(`nido_pasos_${todayKey()}`, String(clamped))
    if (clamped >= pasosGoal && !pasosGoalToasted) {
      toast.success('¡Meta de pasos alcanzada!')
      setPasosGoalToasted(true)
    }
    if (clamped < pasosGoal) setPasosGoalToasted(false)
  }

  function guardarPasosGoal() {
    const val = Math.max(1000, Number(nuevoPasosGoal) || 10000)
    localStorage.setItem('nido_pasos_goal', String(val))
    setPasosGoal(val)
    setEditandoPasosGoal(false)
    setPasosGoalToasted(false)
    toast.success(`Meta: ${val.toLocaleString('es-AR')} pasos`)
  }

  // ── Derived values ─────────────────────────────────────────────────────────

  const urgentes = tareas.filter(t => !t.completada && t.prioridad === 'urgente')
  const normales = tareas.filter(t => !t.completada && t.prioridad !== 'urgente')
  const completadas = tareas.filter(t => t.completada)

  const habitosCompletadosHoy = habitos.filter(h => completadosHoy[h.id]).length
  const pasosProgress = Math.min(pasos / pasosGoal, 1)
  const aguaGoalReached = vasos >= 8
  const pasosGoalReached = pasos >= pasosGoal

  const TABS: { key: Tab; label: string; Icon: LucideIcon }[] = [
    { key: 'hogar',   label: 'Hogar',   Icon: Home },
    { key: 'habitos', label: 'Hábitos', Icon: Star },
    { key: 'agua',    label: 'Agua',    Icon: Droplets },
    { key: 'pasos',   label: 'Pasos',   Icon: Footprints },
  ]

  return (
    <div className="p-5 pb-8" style={{ minHeight: '100vh' }}>
      <ConfirmDialog
        open={!!confirmId}
        title="¿Eliminar tarea?"
        message="Esta acción no se puede deshacer."
        onConfirm={() => confirmId && eliminarTarea(confirmId)}
        onCancel={() => setConfirmId(null)}
      />

      <div className="max-w-lg mx-auto">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-6 pt-2"
        >
          <Link href="/dashboard">
            <motion.div
              whileTap={{ scale: 0.9 }}
              className="p-1 cursor-pointer transition-colors"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.div>
          </Link>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5" style={{ color: '#3b82f6' }} />
            <h1 className="text-xl font-bold text-white">Tareas</h1>
          </div>
          <div className="ml-auto">
            {activeTab === 'hogar' && urgentes.length > 0 && (
              <span
                className="text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}
              >
                <AlertCircle className="w-3 h-3" />
                {urgentes.length} urgente{urgentes.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </motion.div>

        {/* ── Tab pills ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex gap-2 mb-6"
        >
          {TABS.map(tab => (
            <motion.button
              key={tab.key}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-xl transition-all cursor-pointer"
              style={
                activeTab === tab.key
                  ? {
                      background: 'rgba(59,130,246,0.15)',
                      border: '1px solid rgba(59,130,246,0.3)',
                      color: '#3b82f6',
                    }
                  : {
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      color: 'rgba(255,255,255,0.35)',
                    }
              }
            >
              <tab.Icon className="w-3 h-3" />
              {tab.label}
            </motion.button>
          ))}
        </motion.div>

        {/* ── Tab content ── */}
        <AnimatePresence mode="wait">

          {/* ════ HOGAR ════ */}
          {activeTab === 'hogar' && (
            <motion.div
              key="hogar"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
            >
              {/* Add form */}
              <motion.form
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                onSubmit={agregarTarea}
                style={card}
                className="p-4 mb-5"
              >
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="¿Qué hay que hacer?"
                    value={titulo}
                    onChange={e => setTitulo(e.target.value)}
                    required
                    style={{ ...input, color: '#fff', fontSize: 14, padding: '10px 16px' }}
                    className="flex-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 placeholder-[rgba(255,255,255,0.25)] transition-all"
                  />
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileTap={{ scale: 0.93 }}
                    style={{ ...primaryBtn, borderRadius: 12, padding: '10px 16px' }}
                    className="text-white disabled:opacity-50 cursor-pointer transition-opacity"
                  >
                    {loading
                      ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <Plus className="w-4 h-4" />}
                  </motion.button>
                </div>

                {/* Priority buttons */}
                <div className="flex gap-1.5 mb-3">
                  {PRIORIDADES.map(p => {
                    const isActive = prioridad === p.valor
                    const isUrgente = p.valor === 'urgente'
                    return (
                      <motion.button
                        key={p.valor}
                        type="button"
                        whileTap={{ scale: 0.93 }}
                        onClick={() => setPrioridad(p.valor as typeof prioridad)}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                        style={
                          isActive
                            ? isUrgente
                              ? { background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }
                              : { background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#3b82f6' }
                            : { background: 'transparent', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.25)' }
                        }
                      >
                        <Flag className="w-3 h-3" /> {p.label}
                      </motion.button>
                    )
                  })}
                </div>

                <div className="flex items-center gap-3">
                  <label
                    className="flex items-center gap-2 text-sm cursor-pointer select-none flex-1"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                  >
                    <input
                      type="checkbox"
                      checked={compartida}
                      onChange={e => setCompartida(e.target.checked)}
                      className="accent-blue-500 w-4 h-4 rounded"
                    />
                    <Users className="w-3.5 h-3.5" /> Compartida
                  </label>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.25)' }} />
                    <input
                      type="date"
                      value={fechaLimite}
                      onChange={e => setFechaLimite(e.target.value)}
                      style={{ ...input, color: 'rgba(255,255,255,0.7)', fontSize: 12, padding: '6px 10px' }}
                      className="focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
                    />
                  </div>
                </div>
              </motion.form>

              {!iniciado && <SkeletonList count={3} />}

              {/* Urgentes */}
              {iniciado && urgentes.length > 0 && (
                <div className="mb-4">
                  <p
                    className="text-xs font-medium uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5"
                    style={{ color: 'rgba(248,113,113,0.8)' }}
                  >
                    <AlertCircle className="w-3 h-3" /> Urgentes
                  </p>
                  <AnimatePresence>
                    {urgentes.map(t => (
                      <TareaItem
                        key={t.id} tarea={t}
                        onToggle={toggleTarea} onEliminar={setConfirmId}
                        nombreMiembro={nombreMiembro}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Normales */}
              {iniciado && normales.length > 0 && (
                <div className="mb-4">
                  {urgentes.length > 0 && (
                    <p
                      className="text-xs font-medium uppercase tracking-wider mb-2 px-1"
                      style={{ color: 'rgba(255,255,255,0.25)' }}
                    >
                      Otras
                    </p>
                  )}
                  <AnimatePresence>
                    {normales.map(t => (
                      <TareaItem
                        key={t.id} tarea={t}
                        onToggle={toggleTarea} onEliminar={setConfirmId}
                        nombreMiembro={nombreMiembro}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Completadas */}
              {iniciado && completadas.length > 0 && (
                <div>
                  <p
                    className="text-xs font-medium uppercase tracking-wider mb-2 px-1"
                    style={{ color: 'rgba(255,255,255,0.25)' }}
                  >
                    Completadas ({completadas.length})
                  </p>
                  <AnimatePresence>
                    {completadas.map(t => (
                      <motion.div
                        key={t.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        exit={{ opacity: 0, height: 0 }}
                        style={card}
                        className="p-4 mb-2 flex items-center gap-3"
                      >
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={() => toggleTarea(t)}
                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer"
                          style={{ background: '#3b82f6' }}
                        >
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </motion.button>
                        <p
                          className="flex-1 text-sm line-through truncate"
                          style={{ color: 'rgba(255,255,255,0.5)' }}
                        >
                          {t.titulo}
                        </p>
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={() => setConfirmId(t.id)}
                          className="transition-colors cursor-pointer p-1 hover:text-red-400"
                          style={{ color: 'rgba(255,255,255,0.2)' }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Empty state */}
              {iniciado && tareas.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-center mt-16"
                >
                  <CheckSquare className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.1)' }} />
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.25)' }}>No hay tareas todavía</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ════ HÁBITOS ════ */}
          {activeTab === 'habitos' && (
            <motion.div
              key="habitos"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
            >
              {/* Progress bar */}
              {habitos.length > 0 && (
                <div style={card} className="p-4 mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">Progreso de hoy</span>
                    <span className="text-sm font-bold" style={{ color: '#3b82f6' }}>
                      {habitosCompletadosHoy}/{habitos.length}
                    </span>
                  </div>
                  <div
                    className="w-full rounded-full overflow-hidden"
                    style={{ height: 6, background: 'rgba(255,255,255,0.07)' }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: '#3b82f6' }}
                      initial={{ width: 0 }}
                      animate={{
                        width: habitos.length > 0
                          ? `${(habitosCompletadosHoy / habitos.length) * 100}%`
                          : '0%',
                      }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              )}

              {/* Add habit form */}
              <form onSubmit={agregarHabito} className="flex gap-2 mb-5">
                <input
                  type="text"
                  placeholder="Nuevo hábito..."
                  value={nuevoHabito}
                  onChange={e => setNuevoHabito(e.target.value)}
                  style={{ ...input, color: '#fff', fontSize: 14, padding: '10px 16px' }}
                  className="flex-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 placeholder-[rgba(255,255,255,0.25)] transition-all"
                />
                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.93 }}
                  style={{ ...primaryBtn, borderRadius: 12, padding: '10px 16px' }}
                  className="text-white cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </motion.button>
              </form>

              {/* Habit list */}
              <AnimatePresence>
                {habitos.map(h => {
                  const done = !!completadosHoy[h.id]
                  return (
                    <motion.div
                      key={h.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 16, height: 0 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      style={card}
                      className="p-4 mb-2 flex items-center gap-3"
                    >
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => toggleHabito(h.id)}
                        className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center cursor-pointer transition-all"
                        style={
                          done
                            ? { background: '#3b82f6', border: '1.5px solid #3b82f6' }
                            : { background: 'transparent', border: '1.5px solid rgba(255,255,255,0.15)' }
                        }
                      >
                        {done && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                      </motion.button>
                      <p
                        className="flex-1 text-sm transition-all"
                        style={{
                          color: done ? 'rgba(255,255,255,0.4)' : '#fff',
                          textDecoration: done ? 'line-through' : 'none',
                        }}
                      >
                        {h.nombre}
                      </p>
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => eliminarHabito(h.id)}
                        className="p-1 cursor-pointer transition-colors hover:text-red-400"
                        style={{ color: 'rgba(255,255,255,0.2)' }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </motion.div>
                  )
                })}
              </AnimatePresence>

              {habitos.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-center mt-12"
                >
                  <CheckSquare className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.1)' }} />
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.25)' }}>Sin hábitos todavía</p>
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.15)' }}>
                    Agregá tu primer hábito arriba
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ════ AGUA ════ */}
          {activeTab === 'agua' && (
            <motion.div
              key="agua"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
            >
              {/* Date header */}
              <p
                className="text-xs font-medium uppercase tracking-wider mb-5 text-center"
                style={{ color: 'rgba(255,255,255,0.25)' }}
              >
                {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>

              {/* Big circular display */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative flex items-center justify-center mb-4">
                  <svg width="160" height="160" viewBox="0 0 160 160">
                    <circle
                      cx="80" cy="80" r="68"
                      fill="none"
                      stroke="rgba(255,255,255,0.07)"
                      strokeWidth="10"
                    />
                    <circle
                      cx="80" cy="80" r="68"
                      fill="none"
                      stroke={aguaGoalReached ? '#22c55e' : '#38bdf8'}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 68}`}
                      strokeDashoffset={`${2 * Math.PI * 68 * (1 - Math.min(vasos / 8, 1))}`}
                      transform="rotate(-90 80 80)"
                      style={{ transition: 'stroke-dashoffset 0.4s ease, stroke 0.4s ease' }}
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-5xl font-bold text-white">{vasos}</span>
                    <span className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>vasos</span>
                  </div>
                </div>

                {/* Drop icons row */}
                <div className="flex gap-2 mb-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <motion.button
                      key={i}
                      whileTap={{ scale: 0.85 }}
                      onClick={() => updateVasos(i < vasos ? i : i + 1)}
                      className="cursor-pointer transition-all"
                    >
                      <Droplets
                        className="w-6 h-6"
                        style={{
                          color: i < vasos
                            ? aguaGoalReached ? '#22c55e' : '#38bdf8'
                            : 'rgba(255,255,255,0.12)',
                          filter: i < vasos ? 'drop-shadow(0 0 4px rgba(56,189,248,0.4))' : 'none',
                          transition: 'color 0.2s, filter 0.2s',
                        }}
                      />
                    </motion.button>
                  ))}
                </div>

                <p className="text-sm font-medium mb-1" style={{ color: aguaGoalReached ? '#22c55e' : '#38bdf8' }}>
                  {vasos} de 8 vasos
                </p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  0 calorías · esencial para el cuerpo
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 mb-4">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => updateVasos(vasos - 1)}
                  disabled={vasos <= 0}
                  className="flex-1 py-3 rounded-xl font-medium text-sm transition-all cursor-pointer disabled:opacity-30"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    color: '#fff',
                  }}
                >
                  - Vaso
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => updateVasos(vasos + 1)}
                  disabled={vasos >= 12}
                  className="flex-1 py-3 rounded-xl font-medium text-sm transition-all cursor-pointer disabled:opacity-30 text-white"
                  style={
                    aguaGoalReached
                      ? { background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e' }
                      : { background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.3)', color: '#38bdf8' }
                  }
                >
                  + Vaso
                </motion.button>
              </div>

              {aguaGoalReached && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  style={{
                    background: 'rgba(34,197,94,0.1)',
                    border: '1px solid rgba(34,197,94,0.2)',
                    borderRadius: 12,
                    padding: '12px 16px',
                  }}
                  className="text-center"
                >
                  <p className="text-sm font-medium" style={{ color: '#22c55e' }}>
                    Meta de hidratacion alcanzada
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ════ PASOS ════ */}
          {activeTab === 'pasos' && (
            <motion.div
              key="pasos"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
            >
              {/* Date header */}
              <p
                className="text-xs font-medium uppercase tracking-wider mb-5 text-center"
                style={{ color: 'rgba(255,255,255,0.25)' }}
              >
                {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>

              {/* Big step display */}
              <div style={card} className="p-6 mb-4 text-center">
                <Footprints
                  className="w-8 h-8 mx-auto mb-3"
                  style={{ color: pasosGoalReached ? '#4ade80' : 'rgba(255,255,255,0.3)' }}
                />
                <p
                  className="text-6xl font-bold mb-1 transition-colors"
                  style={{ color: pasosGoalReached ? '#4ade80' : '#fff' }}
                >
                  {pasos.toLocaleString('es-AR')}
                </p>
                <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>pasos hoy</p>

                {/* Progress bar */}
                <div
                  className="w-full rounded-full overflow-hidden mb-2"
                  style={{ height: 8, background: 'rgba(255,255,255,0.07)' }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: pasosGoalReached ? '#4ade80' : '#4ade80' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pasosProgress * 100}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  <span>{pasos.toLocaleString('es-AR')} pasos</span>
                  <AnimatePresence mode="wait">
                    {editandoPasosGoal ? (
                      <motion.div
                        key="edit-goal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-1.5"
                      >
                        <input
                          type="number"
                          value={nuevoPasosGoal}
                          onChange={e => setNuevoPasosGoal(e.target.value)}
                          autoFocus
                          min={1000}
                          onKeyDown={e => e.key === 'Enter' && guardarPasosGoal()}
                          style={{ width: 72, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', padding: '1px 6px', fontSize: 11, outline: 'none' }}
                        />
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={guardarPasosGoal}
                          style={{ background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 5, padding: '1px 7px', color: '#4ade80', fontSize: 10, cursor: 'pointer' }}
                        >
                          OK
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setEditandoPasosGoal(false)}
                          style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, cursor: 'pointer' }}
                        >
                          ✕
                        </motion.button>
                      </motion.div>
                    ) : (
                      <motion.button
                        key="show-goal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => { setEditandoPasosGoal(true); setNuevoPasosGoal(String(pasosGoal)) }}
                        className="flex items-center gap-1 cursor-pointer transition-colors"
                        style={{ color: 'rgba(255,255,255,0.4)' }}
                      >
                        <Pencil className="w-2.5 h-2.5" />
                        Meta: {pasosGoal.toLocaleString('es-AR')}
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>

                <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-sm" style={{ color: '#4ade80' }}>
                    {Math.round(pasos * 0.04)} kcal quemadas
                  </p>
                </div>
              </div>

              {/* Manual input */}
              <div style={card} className="p-4 mb-4">
                <label className="block text-xs mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Ingresar pasos manualmente
                </label>
                <input
                  type="number"
                  min={0}
                  value={pasos || ''}
                  onChange={e => updatePasos(Number(e.target.value) || 0)}
                  placeholder="0"
                  style={{ ...input, color: '#fff', fontSize: 18, fontWeight: 700, padding: '12px 16px', width: '100%' }}
                  className="focus:outline-none focus:ring-2 focus:ring-indigo-500/40 placeholder-[rgba(255,255,255,0.15)] transition-all text-center"
                />
              </div>

              {/* Quick add buttons */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[1000, 2000, 5000, 10000].map(amount => (
                  <motion.button
                    key={amount}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => updatePasos(pasos + amount)}
                    className="py-3 rounded-xl text-xs font-medium cursor-pointer transition-all"
                    style={{
                      background: 'rgba(74,222,128,0.1)',
                      border: '1px solid rgba(74,222,128,0.2)',
                      color: '#4ade80',
                    }}
                  >
                    +{amount >= 1000 ? `${amount / 1000}k` : amount}
                  </motion.button>
                ))}
              </div>

              {pasosGoalReached && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  style={{
                    background: 'rgba(74,222,128,0.1)',
                    border: '1px solid rgba(74,222,128,0.2)',
                    borderRadius: 12,
                    padding: '12px 16px',
                  }}
                  className="text-center"
                >
                  <p className="text-sm font-medium" style={{ color: '#4ade80' }}>
                    Meta de pasos alcanzada
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── TareaItem component ──────────────────────────────────────────────────────

function TareaItem({
  tarea, onToggle, onEliminar, nombreMiembro,
}: {
  tarea: Tarea
  onToggle: (t: Tarea) => void
  onEliminar: (id: string) => void
  nombreMiembro: (uid: string) => string
}) {
  const limite = tarea.fecha_limite ? formatLimite(tarea.fecha_limite) : null
  const prioridad = getPrioridad(tarea.prioridad)

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16, height: 0 }}
      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: tarea.prioridad === 'urgente'
          ? '1px solid rgba(239,68,68,0.2)'
          : '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14,
      }}
      className="p-4 mb-2 flex items-center gap-3"
    >
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={() => onToggle(tarea)}
        className="w-5 h-5 rounded-full flex-shrink-0 transition-all cursor-pointer"
        style={{ border: '1.5px solid rgba(255,255,255,0.15)', background: 'transparent' }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = '#3b82f6'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.15)'
        }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{tarea.titulo}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {tarea.es_compartida
              ? <Users className="w-2.5 h-2.5" style={{ color: 'rgba(99,102,241,0.7)' }} />
              : <User className="w-2.5 h-2.5" />}
            {nombreMiembro(tarea.usuario_id)}
          </span>
          {tarea.prioridad !== 'normal' && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-md"
              style={
                tarea.prioridad === 'urgente'
                  ? { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }
                  : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.3)' }
              }
            >
              {prioridad.label}
            </span>
          )}
          {limite && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-md"
              style={
                limite.urgent
                  ? { background: 'rgba(239,68,68,0.15)', color: '#f87171' }
                  : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }
              }
            >
              {limite.label}
            </span>
          )}
        </div>
      </div>
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={() => onEliminar(tarea.id)}
        className="transition-colors cursor-pointer p-1 hover:text-red-400"
        style={{ color: 'rgba(255,255,255,0.2)' }}
      >
        <Trash2 className="w-4 h-4" />
      </motion.button>
    </motion.div>
  )
}
