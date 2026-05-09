'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Plus, Trash2, Utensils, Dumbbell, Flame, ChevronLeft, ChevronRight, Zap, Search, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { buscarAlimento, buscarEjercicio, calcularCaloriasEjercicio, ALIMENTOS } from '@/lib/calorias'

type TipoComida = 'desayuno' | 'almuerzo' | 'cena' | 'snack'

interface RegistroComida {
  id: string
  descripcion: string
  calorias: number
  tipo: TipoComida
  hora: string
}

interface RegistroEjercicio {
  id: string
  nombre: string
  series: number
  reps: number
  calorias: number
  descripcion: string
}

function formatDisplayDate(date: Date): string {
  const hoy = new Date()
  const ayer = new Date(hoy)
  ayer.setDate(ayer.getDate() - 1)

  if (date.toDateString() === hoy.toDateString()) return 'Hoy'
  if (date.toDateString() === ayer.toDateString()) return 'Ayer'
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
}

function fechaKey(date: Date): string {
  return date.toISOString().split('T')[0]
}

function horaActual(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

function generarInsight(
  totalCalorias: number,
  totalQuemadas: number,
  ejerciciosList: RegistroEjercicio[],
): string | null {
  if (totalCalorias === 0 && totalQuemadas === 0) return null
  const balance = totalCalorias - totalQuemadas
  if (totalCalorias === 0 && totalQuemadas > 0)
    return `Quemaste ${totalQuemadas} kcal. Registrá lo que comiste para ver tu balance completo.`
  if (totalQuemadas === 0 && totalCalorias > 500) {
    const mins = Math.round(totalCalorias / 9.5)
    return `Consumiste ${totalCalorias} kcal hoy. ~${mins} min corriendo las compensaría.`
  }
  if (balance > 500) {
    const mins = Math.round(balance / 5)
    return `Superávit de ${balance} kcal. ~${mins} min caminando lo equilibraría.`
  }
  if (balance < -300)
    return `Déficit de ${Math.abs(balance)} kcal hoy. El cuerpo usa reservas de grasa.`
  if (Math.abs(balance) <= 150 && totalCalorias > 200)
    return `Balance casi perfecto: ${totalCalorias} kcal ingeridas, ${totalQuemadas} quemadas.`
  if (ejerciciosList.length > 0) {
    const top = [...ejerciciosList].sort((a, b) => b.calorias - a.calorias)[0]
    if (top.calorias > 0) {
      const mins = Math.round(top.calorias / 5)
      return `"${top.nombre}" quemó ${top.calorias} kcal — equivale a caminar ~${mins} min.`
    }
  }
  if (totalCalorias > 0 && totalQuemadas === 0)
    return `Llevás ${totalCalorias} kcal hoy. Agregá ejercicio para ver tu balance calórico.`
  return null
}

const TIPOS: { valor: TipoComida; label: string }[] = [
  { valor: 'desayuno', label: 'Desayuno' },
  { valor: 'almuerzo', label: 'Almuerzo' },
  { valor: 'cena', label: 'Cena' },
  { valor: 'snack', label: 'Snack' },
]

export default function ComidasPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [comidas, setComidas] = useState<RegistroComida[]>([])
  const [ejercicios, setEjercicios] = useState<RegistroEjercicio[]>([])
  const [tab, setTab] = useState<'comidas' | 'ejercicio'>('comidas')
  const [showForm, setShowForm] = useState(false)

  // Comidas form
  const [inputComida, setInputComida] = useState('')
  const [caloriasEstimadas, setCaloriasEstimadas] = useState<number | null>(null)
  const [tipoComida, setTipoComida] = useState<TipoComida>('desayuno')
  const [caloriasManual, setCaloriasManual] = useState('')

  // Ejercicio form
  const [inputEjercicio, setInputEjercicio] = useState('')
  const [series, setSeries] = useState(3)
  const [reps, setReps] = useState(10)
  const [caloriasEjercicio, setCaloriasEjercicio] = useState<number | null>(null)

  const key = fechaKey(selectedDate)
  const hoy = new Date()
  const esHoy = selectedDate.toDateString() === hoy.toDateString()

  // Load from localStorage when date changes
  useEffect(() => {
    const comidasGuardadas = localStorage.getItem(`nido_comidas_${key}`)
    const ejerciciosGuardados = localStorage.getItem(`nido_ejercicios_${key}`)
    setComidas(comidasGuardadas ? JSON.parse(comidasGuardadas) : [])
    setEjercicios(ejerciciosGuardados ? JSON.parse(ejerciciosGuardados) : [])
    setShowForm(false)
  }, [key])

  // Lookup calories when food input changes
  useEffect(() => {
    if (!inputComida.trim()) {
      setCaloriasEstimadas(null)
      return
    }
    const resultado = buscarAlimento(inputComida)
    setCaloriasEstimadas(resultado ? resultado.calorias : null)
  }, [inputComida])

  // Recalculate exercise calories when inputs change
  const recalcularEjercicio = useCallback(() => {
    if (!inputEjercicio.trim()) {
      setCaloriasEjercicio(null)
      return
    }
    const kcal = calcularCaloriasEjercicio(inputEjercicio, series, reps)
    setCaloriasEjercicio(kcal > 0 ? kcal : null)
  }, [inputEjercicio, series, reps])

  useEffect(() => {
    recalcularEjercicio()
  }, [recalcularEjercicio])

  function navDate(dir: number) {
    const next = new Date(selectedDate)
    next.setDate(next.getDate() + dir)
    if (next > hoy) return
    setSelectedDate(next)
  }

  function agregarComida(e: React.FormEvent) {
    e.preventDefault()
    if (!inputComida.trim()) return
    const cals = caloriasManual ? Number(caloriasManual) : (caloriasEstimadas ?? 0)
    const nuevo: RegistroComida = {
      id: Date.now().toString(),
      descripcion: inputComida.trim(),
      calorias: cals,
      tipo: tipoComida,
      hora: horaActual(),
    }
    if (caloriasEstimadas === null && !caloriasManual) {
      toast.info('Estimacion no disponible, se registro con 0 kcal')
    }
    const nuevas = [...comidas, nuevo]
    setComidas(nuevas)
    localStorage.setItem(`nido_comidas_${key}`, JSON.stringify(nuevas))
    setInputComida('')
    setCaloriasEstimadas(null)
    setCaloriasManual('')
    setShowForm(false)
    toast.success('Comida registrada')
  }

  function eliminarComida(id: string) {
    const nuevas = comidas.filter(c => c.id !== id)
    setComidas(nuevas)
    localStorage.setItem(`nido_comidas_${key}`, JSON.stringify(nuevas))
    toast.success('Eliminado')
  }

  function agregarEjercicio(e: React.FormEvent) {
    e.preventDefault()
    if (!inputEjercicio.trim()) return
    const cals = caloriasEjercicio ?? 0
    const nuevo: RegistroEjercicio = {
      id: Date.now().toString(),
      nombre: inputEjercicio.trim(),
      series,
      reps,
      calorias: cals,
      descripcion: `${series} series de ${reps} reps`,
    }
    const nuevos = [...ejercicios, nuevo]
    setEjercicios(nuevos)
    localStorage.setItem(`nido_ejercicios_${key}`, JSON.stringify(nuevos))
    setInputEjercicio('')
    setSeries(3)
    setReps(10)
    setCaloriasEjercicio(null)
    setShowForm(false)
    toast.success('Ejercicio registrado')
  }

  function eliminarEjercicio(id: string) {
    const nuevos = ejercicios.filter(e => e.id !== id)
    setEjercicios(nuevos)
    localStorage.setItem(`nido_ejercicios_${key}`, JSON.stringify(nuevos))
    toast.success('Eliminado')
  }

  const totalCalorias = comidas.reduce((acc, c) => acc + c.calorias, 0)
  const totalQuemadas = ejercicios.reduce((acc, e) => acc + e.calorias, 0)
  const balance = totalCalorias - totalQuemadas
  const insight = useMemo(() => generarInsight(totalCalorias, totalQuemadas, ejercicios), [totalCalorias, totalQuemadas, ejercicios])

  const comidasPorTipo = (tipo: TipoComida) => comidas.filter(c => c.tipo === tipo)

  const esCardioNombre = (nombre: string) =>
    nombre.toLowerCase().includes('caminar') || nombre.toLowerCase().includes('correr')

  const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16 }
  const inputCls = "w-full rounded-xl px-4 py-2.5 text-white placeholder-white/25 text-sm focus:ring-2 focus:ring-indigo-500/40 outline-none transition-all"
  const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }

  return (
    <div className="p-5 pb-8">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-5 pt-2">
          <Link href="/dashboard">
            <motion.div whileTap={{ scale: 0.9 }} className="cursor-pointer p-1 transition-colors" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <ArrowLeft className="w-5 h-5" />
            </motion.div>
          </Link>
          <div className="flex items-center gap-2 flex-1">
            <Utensils className="w-5 h-5" style={{ color: '#f97316' }} />
            <h1 className="text-xl font-bold text-white">Comidas</h1>
          </div>

          {/* Date navigator */}
          <div className="flex items-center gap-1">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navDate(-1)}
              className="cursor-pointer p-1.5 rounded-xl transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.button>
            <span className="text-sm font-semibold text-white px-2 min-w-[52px] text-center">
              {formatDisplayDate(selectedDate)}
            </span>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navDate(1)}
              disabled={esHoy}
              className="cursor-pointer p-1.5 rounded-xl transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', color: esHoy ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)' }}
            >
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-3 gap-2 mb-5">
          {/* Ingeridas */}
          <div className="rounded-2xl p-3 flex flex-col gap-0.5" style={{ background: 'rgba(249,115,22,0.07)', border: '1px solid rgba(249,115,22,0.15)' }}>
            <div className="flex items-center gap-1 mb-0.5">
              <Utensils className="w-3 h-3" style={{ color: '#f97316' }} />
              <p className="text-xs" style={{ color: 'rgba(249,115,22,0.7)' }}>Ingeridas</p>
            </div>
            <p className="text-white font-bold text-lg leading-none">{totalCalorias}</p>
            <p className="text-xs" style={{ color: 'rgba(249,115,22,0.6)' }}>kcal</p>
          </div>

          {/* Quemadas */}
          <div className="rounded-2xl p-3 flex flex-col gap-0.5" style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)' }}>
            <div className="flex items-center gap-1 mb-0.5">
              <Flame className="w-3 h-3" style={{ color: '#10b981' }} />
              <p className="text-xs" style={{ color: 'rgba(16,185,129,0.7)' }}>Quemadas</p>
            </div>
            <p className="text-white font-bold text-lg leading-none">{totalQuemadas}</p>
            <p className="text-xs" style={{ color: 'rgba(16,185,129,0.6)' }}>kcal</p>
          </div>

          {/* Balance */}
          <div
            className="rounded-2xl p-3 flex flex-col gap-0.5"
            style={
              balance <= 0
                ? { background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)' }
                : { background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.15)' }
            }
          >
            <div className="flex items-center gap-1 mb-0.5">
              <Zap className="w-3 h-3" style={{ color: balance <= 0 ? '#10b981' : '#f59e0b' }} />
              <p className="text-xs" style={{ color: balance <= 0 ? 'rgba(16,185,129,0.7)' : 'rgba(245,158,11,0.7)' }}>Balance</p>
            </div>
            <p className="text-white font-bold text-lg leading-none">{balance}</p>
            <p className="text-xs" style={{ color: balance <= 0 ? 'rgba(16,185,129,0.6)' : 'rgba(245,158,11,0.6)' }}>kcal</p>
          </div>
        </motion.div>

        {/* AI Insight */}
        <AnimatePresence>
          {insight && (
            <motion.div
              key={insight}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="rounded-xl px-4 py-3 mb-4 flex items-start gap-2.5"
              style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.14)' }}
            >
              <Sparkles className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#6366f1' }} />
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {insight}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="flex gap-1 rounded-2xl p-1 mb-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <button
            onClick={() => { setTab('comidas'); setShowForm(false) }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all"
            style={
              tab === 'comidas'
                ? { background: 'rgba(249,115,22,0.12)', color: '#f97316', border: '1px solid rgba(249,115,22,0.2)' }
                : { color: 'rgba(255,255,255,0.4)', border: '1px solid transparent' }
            }
          >
            <Utensils className="w-4 h-4" />
            Comidas
          </button>
          <button
            onClick={() => { setTab('ejercicio'); setShowForm(false) }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all"
            style={
              tab === 'ejercicio'
                ? { background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }
                : { color: 'rgba(255,255,255,0.4)', border: '1px solid transparent' }
            }
          >
            <Dumbbell className="w-4 h-4" />
            Ejercicio
          </button>
        </motion.div>

        {/* ─── COMIDAS TAB ─── */}
        <AnimatePresence mode="wait">
          {tab === 'comidas' && (
            <motion.div key="comidas" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}>

              {/* Add button */}
              <div className="flex justify-end mb-3">
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={() => setShowForm(v => !v)}
                  className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-xl cursor-pointer transition-all"
                  style={
                    showForm
                      ? { background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)', color: '#f97316' }
                      : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.7)' }
                  }
                >
                  <Plus className="w-4 h-4" />
                  Agregar
                </motion.button>
              </div>

              {/* Form */}
              <AnimatePresence>
                {showForm && (
                  <motion.form
                    key="form-comida"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22 }}
                    onSubmit={agregarComida}
                    className="rounded-2xl p-4 mb-4 overflow-hidden"
                    style={cardStyle}
                  >
                    <p className="text-sm font-medium text-white mb-3">Registrar comida</p>
                    <div className="flex flex-col gap-3">
                      {/* Food search */}
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(255,255,255,0.25)' }} />
                        <input
                          type="text"
                          placeholder="Que comiste? (ej: milanesa)"
                          value={inputComida}
                          onChange={e => setInputComida(e.target.value)}
                          required
                          className={`${inputCls} pl-9`}
                          style={inputStyle}
                          autoFocus
                        />
                      </div>
                      {inputComida.trim() && (
                        <p className="text-xs -mt-1" style={{ color: caloriasEstimadas !== null ? '#f97316' : 'rgba(255,255,255,0.3)' }}>
                          {caloriasEstimadas !== null
                            ? `~${caloriasEstimadas} kcal estimadas`
                            : 'Sin estimacion disponible'}
                        </p>
                      )}

                      {/* Tipo selector */}
                      <div>
                        <label className="text-xs mb-1.5 block" style={{ color: 'rgba(255,255,255,0.5)' }}>Momento del dia</label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {TIPOS.map(t => (
                            <button
                              key={t.valor}
                              type="button"
                              onClick={() => setTipoComida(t.valor)}
                              className="py-2 px-1 rounded-xl text-xs cursor-pointer transition-all text-center"
                              style={
                                tipoComida === t.valor
                                  ? { background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.35)', color: '#f97316' }
                                  : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }
                              }
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Manual calories */}
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: 'rgba(255,255,255,0.5)' }}>Ajustar calorias (opcional)</label>
                        <input
                          type="number"
                          placeholder={caloriasEstimadas !== null ? String(caloriasEstimadas) : '0'}
                          value={caloriasManual}
                          onChange={e => setCaloriasManual(e.target.value)}
                          min={0}
                          className={inputCls}
                          style={inputStyle}
                        />
                      </div>

                      <motion.button
                        type="submit"
                        whileTap={{ scale: 0.97 }}
                        className="flex items-center justify-center gap-2 text-white rounded-xl py-2.5 font-semibold text-sm cursor-pointer"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.2)' }}
                      >
                        <Plus className="w-4 h-4" />
                        Registrar
                      </motion.button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Comidas grouped by tipo */}
              {TIPOS.map(t => {
                const items = comidasPorTipo(t.valor)
                if (items.length === 0) return null
                return (
                  <div key={t.valor} className="mb-4">
                    <p className="text-xs font-medium uppercase tracking-wider mb-2 px-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      {t.label}
                    </p>
                    <AnimatePresence>
                      {items.map(c => (
                        <motion.div
                          key={c.id}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 12, height: 0 }}
                          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                          className="rounded-xl p-3.5 mb-2 flex items-center gap-3"
                          style={cardStyle}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{c.descripcion}</p>
                            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{c.hora}</p>
                          </div>
                          <span
                            className="text-xs font-semibold px-2 py-1 rounded-lg flex-shrink-0"
                            style={{ background: 'rgba(249,115,22,0.12)', color: '#f97316', border: '1px solid rgba(249,115,22,0.2)' }}
                          >
                            {c.calorias} kcal
                          </span>
                          <motion.button
                            whileTap={{ scale: 0.85 }}
                            onClick={() => eliminarComida(c.id)}
                            className="cursor-pointer p-1 transition-colors flex-shrink-0"
                            style={{ color: 'rgba(255,255,255,0.2)' }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )
              })}

              {comidas.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mt-12">
                  <Utensils className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.1)' }} />
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Registra lo que comiste hoy</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ─── EJERCICIO TAB ─── */}
          {tab === 'ejercicio' && (
            <motion.div key="ejercicio" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>

              {/* Add button */}
              <div className="flex justify-end mb-3">
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={() => setShowForm(v => !v)}
                  className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-xl cursor-pointer transition-all"
                  style={
                    showForm
                      ? { background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981' }
                      : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.7)' }
                  }
                >
                  <Plus className="w-4 h-4" />
                  Agregar
                </motion.button>
              </div>

              {/* Form */}
              <AnimatePresence>
                {showForm && (
                  <motion.form
                    key="form-ejercicio"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22 }}
                    onSubmit={agregarEjercicio}
                    className="rounded-2xl p-4 mb-4 overflow-hidden"
                    style={cardStyle}
                  >
                    <p className="text-sm font-medium text-white mb-3">Registrar ejercicio</p>
                    <div className="flex flex-col gap-3">
                      {/* Exercise search */}
                      <div className="relative">
                        <Dumbbell className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(255,255,255,0.25)' }} />
                        <input
                          type="text"
                          placeholder="Que ejercicio? (ej: flexiones)"
                          value={inputEjercicio}
                          onChange={e => setInputEjercicio(e.target.value)}
                          required
                          className={`${inputCls} pl-9`}
                          style={inputStyle}
                          autoFocus
                        />
                      </div>
                      {inputEjercicio.trim() && caloriasEjercicio !== null && (
                        <p className="text-xs -mt-1" style={{ color: '#10b981' }}>
                          {`~${caloriasEjercicio} kcal estimadas con ${series}×${reps}`}
                        </p>
                      )}

                      {/* Sugerencias rápidas cuando input vacío */}
                      {!inputEjercicio.trim() && (
                        <div>
                          <p className="text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Sugerencias</p>
                          <div className="grid grid-cols-2 gap-1.5">
                            {[
                              { nombre: 'flexiones',   desc: '3×10 series', kcal: 12 },
                              { nombre: 'sentadillas', desc: '3×10 series', kcal: 15 },
                              { nombre: 'burpees',     desc: '3×10 series', kcal: 45 },
                              { nombre: 'abdominales', desc: '3×20 series', kcal: 18 },
                              { nombre: 'caminar',     desc: '~30 min',     kcal: 150 },
                              { nombre: 'correr',      desc: '~30 min',     kcal: 280 },
                            ].map(s => (
                              <motion.button
                                key={s.nombre}
                                type="button"
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setInputEjercicio(s.nombre)}
                                className="flex items-center justify-between text-left px-3 py-2 rounded-xl cursor-pointer transition-all"
                                style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.12)' }}
                              >
                                <div>
                                  <p className="text-xs font-medium text-white capitalize">{s.nombre}</p>
                                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.desc}</p>
                                </div>
                                <span className="text-xs font-semibold ml-2 flex-shrink-0" style={{ color: '#10b981' }}>~{s.kcal}</span>
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Series + Reps */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs mb-1 block" style={{ color: 'rgba(255,255,255,0.5)' }}>Series</label>
                          <input
                            type="number"
                            value={series}
                            onChange={e => setSeries(Math.max(1, Number(e.target.value)))}
                            min={1}
                            className={inputCls}
                            style={inputStyle}
                          />
                        </div>
                        <div>
                          <label className="text-xs mb-1 block" style={{ color: 'rgba(255,255,255,0.5)' }}>
                            {esCardioNombre(inputEjercicio) ? 'Pasos' : 'Reps'}
                          </label>
                          <input
                            type="number"
                            value={reps}
                            onChange={e => setReps(Math.max(1, Number(e.target.value)))}
                            min={1}
                            className={inputCls}
                            style={inputStyle}
                          />
                        </div>
                      </div>

                      {/* Calorie preview */}
                      {caloriasEjercicio !== null && (
                        <div
                          className="flex items-center gap-2 rounded-xl px-3 py-2"
                          style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)' }}
                        >
                          <Flame className="w-4 h-4" style={{ color: '#10b981' }} />
                          <p className="text-sm font-semibold" style={{ color: '#10b981' }}>
                            {`${series} x ${reps} = aprox. ${caloriasEjercicio} kcal`}
                          </p>
                        </div>
                      )}

                      <motion.button
                        type="submit"
                        whileTap={{ scale: 0.97 }}
                        className="flex items-center justify-center gap-2 text-white rounded-xl py-2.5 font-semibold text-sm cursor-pointer"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.2)' }}
                      >
                        <Plus className="w-4 h-4" />
                        Registrar
                      </motion.button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Exercise list */}
              {ejercicios.length > 0 && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider mb-2 px-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    Actividad ({ejercicios.length})
                  </p>
                  <AnimatePresence>
                    {ejercicios.map(ej => (
                      <motion.div
                        key={ej.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 12, height: 0 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                        className="rounded-xl p-3.5 mb-2 flex items-center gap-3"
                        style={cardStyle}
                      >
                        <div
                          className="rounded-xl p-2 flex-shrink-0"
                          style={{ background: 'rgba(16,185,129,0.1)' }}
                        >
                          <Dumbbell className="w-4 h-4" style={{ color: '#10b981' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{ej.nombre}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{ej.descripcion}</p>
                        </div>
                        <span
                          className="text-xs font-semibold px-2 py-1 rounded-lg flex-shrink-0"
                          style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}
                        >
                          {ej.calorias} kcal
                        </span>
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={() => eliminarEjercicio(ej.id)}
                          className="cursor-pointer p-1 transition-colors flex-shrink-0"
                          style={{ color: 'rgba(255,255,255,0.2)' }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {ejercicios.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mt-12">
                  <Dumbbell className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.1)' }} />
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Registra tu actividad fisica</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
