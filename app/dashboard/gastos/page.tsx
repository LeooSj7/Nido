'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  ArrowLeft, Plus, Wallet, Trash2, TrendingUp, ChevronLeft, ChevronRight,
  User, Target, UtensilsCrossed, Car, Sparkles, Star, Heart, Home, Zap, Package,
  PiggyBank, Pencil,
} from 'lucide-react'
import { SkeletonList } from '@/components/Skeleton'
import ConfirmDialog from '@/components/ConfirmDialog'

type Gasto = {
  id: string
  descripcion: string
  monto: number
  fecha: string
  categoria: string
  usuario_id: string
}

type CompraComprada = {
  id: string
  item: string
  monto: number
  creado_at: string
}

type Usuario = { id: string; nombre: string }

const CATEGORIAS = [
  { valor: 'comida',     label: 'Comida',     Icon: UtensilsCrossed, color: '#f97316' },
  { valor: 'transporte', label: 'Transporte', Icon: Car,             color: '#3b82f6' },
  { valor: 'limpieza',   label: 'Limpieza',   Icon: Sparkles,        color: '#22d3ee' },
  { valor: 'golosinas',  label: 'Golosinas',  Icon: Star,            color: '#f472b6' },
  { valor: 'salud',      label: 'Salud',      Icon: Heart,           color: '#ef4444' },
  { valor: 'hogar',      label: 'Hogar',      Icon: Home,            color: '#a855f7' },
  { valor: 'servicios',  label: 'Servicios',  Icon: Zap,             color: '#facc15' },
  { valor: 'otros',      label: 'Otros',      Icon: Package,         color: 'rgba(255,255,255,0.4)' },
]

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function formatFecha(fecha: string) {
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
}

function formatMonto(monto: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(monto)
}

function getCat(valor: string) {
  return CATEGORIAS.find(c => c.valor === valor) ?? CATEGORIAS[7]
}

export default function GastosPage() {
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [comprasCompradas, setComprasCompradas] = useState<CompraComprada[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [descripcion, setDescripcion] = useState('')
  const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [categoria, setCategoria] = useState('comida')
  const [filtroCategoria, setFiltroCategoria] = useState('todos')
  const [userId, setUserId] = useState<string | null>(null)
  const [casaId, setCasaId] = useState<string | null>(null)
  const [nombreUsuario, setNombreUsuario] = useState('')
  const [presupuesto, setPresupuesto] = useState(0)
  const [editandoPresupuesto, setEditandoPresupuesto] = useState(false)
  const [nuevoPresupuesto, setNuevoPresupuesto] = useState('')
  const [ahorro, setAhorro] = useState(0)
  const [editandoAhorro, setEditandoAhorro] = useState(false)
  const [nuevoAhorro, setNuevoAhorro] = useState('')
  const [loading, setLoading] = useState(false)
  const [iniciado, setIniciado] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const hoy = new Date()
  const [mesActual, setMesActual] = useState(hoy.getMonth())
  const [anioActual, setAnioActual] = useState(hoy.getFullYear())

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: usuario } = await supabase.from('usuarios').select('casa_id, nombre').eq('id', user.id).single()
      if (!usuario?.casa_id) return
      setUserId(user.id)
      setCasaId(usuario.casa_id)
      setNombreUsuario(usuario.nombre)
      const [, casa, miembros] = await Promise.all([
        cargarTodo(usuario.casa_id),
        supabase.from('casas').select('presupuesto_mensual').eq('id', usuario.casa_id).single(),
        supabase.from('usuarios').select('id, nombre').eq('casa_id', usuario.casa_id),
      ])
      if (casa.data) setPresupuesto(Number(casa.data.presupuesto_mensual) || 0)
      if (miembros.data) setUsuarios(miembros.data)
      setIniciado(true)
    }
    init()
  }, [])

  // Sync ahorro from localStorage whenever month/year changes
  useEffect(() => {
    const key = `nido_ahorro_${anioActual}-${String(mesActual + 1).padStart(2, '0')}`
    const saved = localStorage.getItem(key)
    setAhorro(saved ? Number(saved) : 0)
    setEditandoAhorro(false)
  }, [mesActual, anioActual])

  async function cargarTodo(cid: string) {
    const [gastosRes, comprasRes] = await Promise.all([
      supabase.from('gastos').select('*').eq('casa_id', cid).order('fecha', { ascending: false }),
      supabase.from('compras').select('id, item, monto, creado_at').eq('casa_id', cid).eq('comprado', true),
    ])
    if (gastosRes.data) setGastos(gastosRes.data)
    if (comprasRes.data) setComprasCompradas(comprasRes.data)
  }

  function nombreMiembro(uid: string) {
    return usuarios.find(u => u.id === uid)?.nombre ?? '?'
  }

  async function agregarGasto(e: React.FormEvent) {
    e.preventDefault()
    if (!userId || !casaId || !descripcion.trim() || !monto) return
    setLoading(true)
    await supabase.from('gastos').insert({ descripcion, monto: Number(monto), fecha, categoria, usuario_id: userId, casa_id: casaId })
    await supabase.from('actividad').insert({
      casa_id: casaId, usuario_id: userId, usuario_nombre: nombreUsuario,
      tipo: 'gasto_registrado',
      descripcion: `registró un gasto: "${descripcion}" $${Number(monto).toLocaleString('es-AR')}`,
    })
    toast.success('Gasto registrado')
    setDescripcion(''); setMonto(''); setFecha(new Date().toISOString().split('T')[0]); setCategoria('comida')
    await cargarTodo(casaId)
    setLoading(false)
  }

  async function eliminarGasto(id: string) {
    await supabase.from('gastos').delete().eq('id', id)
    toast.success('Gasto eliminado')
    setGastos(prev => prev.filter(g => g.id !== id))
    setConfirmId(null)
  }

  async function guardarPresupuesto() {
    if (!casaId) return
    const val = Number(nuevoPresupuesto)
    await supabase.from('casas').update({ presupuesto_mensual: val }).eq('id', casaId)
    setPresupuesto(val)
    setEditandoPresupuesto(false)
    toast.success('Presupuesto actualizado')
  }

  function guardarAhorro() {
    const val = Math.max(0, Number(nuevoAhorro) || 0)
    const key = `nido_ahorro_${anioActual}-${String(mesActual + 1).padStart(2, '0')}`
    localStorage.setItem(key, String(val))
    setAhorro(val)
    setEditandoAhorro(false)
    toast.success('Ahorro actualizado')
  }

  function cambiarMes(dir: number) {
    let m = mesActual + dir, a = anioActual
    if (m > 11) { m = 0; a++ }
    if (m < 0) { m = 11; a-- }
    setMesActual(m); setAnioActual(a)
  }

  const gastosMes = gastos.filter(g => {
    const d = new Date(g.fecha + 'T00:00:00')
    return d.getMonth() === mesActual && d.getFullYear() === anioActual
  })

  const comprasMes = comprasCompradas.filter(c => {
    const d = new Date(c.creado_at)
    return d.getMonth() === mesActual && d.getFullYear() === anioActual && Number(c.monto) > 0
  })

  const gastosFiltrados = filtroCategoria === 'todos' ? gastosMes : gastosMes.filter(g => g.categoria === filtroCategoria)
  const totalGastosDirecto = gastosMes.reduce((acc, g) => acc + Number(g.monto), 0)
  const totalComprasMes = comprasMes.reduce((acc, c) => acc + Number(c.monto), 0)
  const totalMes = totalGastosDirecto + totalComprasMes
  const porcentaje = presupuesto > 0 ? Math.min((totalMes / presupuesto) * 100, 100) : 0
  const esMesActual = mesActual === hoy.getMonth() && anioActual === hoy.getFullYear()

  const topCategorias = CATEGORIAS.map(c => ({
    ...c, total: gastosMes.filter(g => g.categoria === c.valor).reduce((acc, g) => acc + Number(g.monto), 0)
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total).slice(0, 4)

  const inputCls = "w-full rounded-xl px-4 py-2.5 text-white placeholder-white/25 text-sm focus:ring-2 focus:ring-indigo-500/40 outline-none transition-all"
  const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }
  const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16 }

  return (
    <div className="p-5 pb-4">
      <ConfirmDialog
        open={!!confirmId}
        title="Eliminar gasto"
        message="Se borrará permanentemente del registro."
        onConfirm={() => confirmId && eliminarGasto(confirmId)}
        onCancel={() => setConfirmId(null)}
      />
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-6 pt-2">
          <Link href="/dashboard">
            <motion.div whileTap={{ scale: 0.9 }} className="cursor-pointer p-1 transition-colors" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <ArrowLeft className="w-5 h-5" />
            </motion.div>
          </Link>
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5" style={{ color: '#f59e0b' }} />
            <h1 className="text-xl font-bold text-white">Dinero</h1>
          </div>
        </motion.div>

        {/* Navegación de mes */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="flex items-center justify-between mb-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => cambiarMes(-1)}
            className="cursor-pointer p-1.5 rounded-xl transition-all"
            style={{ color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <ChevronLeft className="w-4 h-4" />
          </motion.button>
          <p className="text-white font-semibold text-sm">
            {MESES[mesActual]} {anioActual}
            {esMesActual && <span className="ml-2 text-xs" style={{ color: '#f59e0b' }}>(este mes)</span>}
          </p>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => cambiarMes(1)}
            disabled={esMesActual}
            className="cursor-pointer p-1.5 rounded-xl transition-all"
            style={{ color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <ChevronRight className={`w-4 h-4 ${esMesActual ? 'opacity-30' : ''}`} />
          </motion.button>
        </motion.div>

        {/* Total card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="rounded-2xl p-5 mb-3"
          style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.15)' }}
        >
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" style={{ color: 'rgba(245,158,11,0.7)' }} />
              <p className="text-sm" style={{ color: 'rgba(245,158,11,0.7)' }}>Total {MESES[mesActual]}</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => { setEditandoPresupuesto(true); setNuevoPresupuesto(String(presupuesto || '')) }}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg cursor-pointer transition-all"
              style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}
            >
              <Target className="w-3 h-3" />
              {presupuesto > 0 ? 'Límite' : 'Fijar límite'}
            </motion.button>
          </div>
          <p className="text-white text-3xl font-bold">{formatMonto(totalMes)}</p>

          {/* Breakdown pills */}
          {totalComprasMes > 0 && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span
                className="text-xs px-2.5 py-0.5 rounded-full"
                style={{ background: 'rgba(245,158,11,0.1)', color: 'rgba(245,158,11,0.8)', border: '1px solid rgba(245,158,11,0.18)' }}
              >
                Gastos: {formatMonto(totalGastosDirecto)}
              </span>
              <span
                className="text-xs px-2.5 py-0.5 rounded-full"
                style={{ background: 'rgba(16,185,129,0.1)', color: 'rgba(16,185,129,0.8)', border: '1px solid rgba(16,185,129,0.18)' }}
              >
                Compras: {formatMonto(totalComprasMes)}
              </span>
            </div>
          )}

          {presupuesto > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1" style={{ color: 'rgba(245,158,11,0.6)' }}>
                <span>{Math.round(porcentaje)}% del límite</span>
                <span>Límite: {formatMonto(presupuesto)}</span>
              </div>
              <div className="rounded-full h-2" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${porcentaje}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-2 rounded-full"
                  style={{ background: porcentaje >= 90 ? '#ef4444' : porcentaje >= 70 ? '#facc15' : '#f59e0b' }}
                />
              </div>
              {porcentaje >= 90 && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>Cerca del límite</p>}
            </div>
          )}
        </motion.div>

        {/* Ahorro card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-4 mb-4"
          style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl p-2 flex-shrink-0" style={{ background: 'rgba(16,185,129,0.1)' }}>
                <PiggyBank className="w-4 h-4" style={{ color: '#10b981' }} />
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: 'rgba(16,185,129,0.7)' }}>
                  Ahorro de {MESES[mesActual]}
                </p>
                <AnimatePresence mode="wait">
                  {editandoAhorro ? (
                    <motion.div
                      key="edit-ahorro"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 mt-1"
                    >
                      <input
                        type="number"
                        value={nuevoAhorro}
                        onChange={e => setNuevoAhorro(e.target.value)}
                        autoFocus
                        placeholder="0"
                        min={0}
                        onKeyDown={e => e.key === 'Enter' && guardarAhorro()}
                        className="text-white font-bold text-lg focus:outline-none"
                        style={{ background: 'transparent', borderBottom: '1px solid rgba(16,185,129,0.4)', paddingBottom: 2, width: 112 }}
                      />
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={guardarAhorro}
                        className="text-xs px-2.5 py-1 rounded-lg cursor-pointer"
                        style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981' }}
                      >
                        OK
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setEditandoAhorro(false)}
                        className="text-xs cursor-pointer"
                        style={{ color: 'rgba(255,255,255,0.3)' }}
                      >
                        ✕
                      </motion.button>
                    </motion.div>
                  ) : (
                    <motion.p
                      key="display-ahorro"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-2xl font-bold text-white mt-0.5"
                    >
                      {formatMonto(ahorro)}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>
            {!editandoAhorro && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => { setEditandoAhorro(true); setNuevoAhorro(String(ahorro || '')) }}
                className="p-2 rounded-xl cursor-pointer transition-all"
                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.14)', color: 'rgba(16,185,129,0.7)' }}
              >
                <Pencil className="w-3.5 h-3.5" />
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Modal presupuesto */}
        <AnimatePresence>
          {editandoPresupuesto && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-2xl p-4 mb-4 flex gap-2 items-end"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(245,158,11,0.2)' }}
            >
              <div className="flex-1">
                <label className="text-xs mb-1 block" style={{ color: 'rgba(255,255,255,0.5)' }}>Presupuesto mensual</label>
                <input
                  type="number"
                  placeholder="Ej: 50000"
                  value={nuevoPresupuesto}
                  onChange={e => setNuevoPresupuesto(e.target.value)}
                  autoFocus
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={guardarPresupuesto}
                className="text-white rounded-xl px-4 py-2.5 text-sm font-medium cursor-pointer transition-all"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 4px 12px rgba(245,158,11,0.2)' }}
              >
                Guardar
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setEditandoPresupuesto(false)}
                className="px-3 py-2.5 text-sm cursor-pointer transition-colors"
                style={{ color: 'rgba(255,255,255,0.5)' }}
              >
                ✕
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top categorías */}
        {topCategorias.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="rounded-2xl p-4 mb-5"
            style={cardStyle}
          >
            <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>Top categorías</p>
            <div className="grid grid-cols-2 gap-2">
              {topCategorias.map(c => {
                const IconComp = c.Icon
                return (
                  <div
                    key={c.valor}
                    className="flex items-center gap-2 rounded-xl px-3 py-2"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    <div className="rounded-lg p-1.5 flex-shrink-0" style={{ background: `${c.color}18` }}>
                      <IconComp className="w-3.5 h-3.5" style={{ color: c.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate text-white">{c.label}</p>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{formatMonto(c.total)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          onSubmit={agregarGasto}
          className="rounded-2xl p-4 mb-5"
          style={cardStyle}
        >
          <p className="text-sm font-medium text-white mb-3">Registrar gasto</p>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Descripción"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              required
              className={inputCls}
              style={inputStyle}
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'rgba(255,255,255,0.5)' }}>Monto</label>
                <input
                  type="number"
                  placeholder="0"
                  value={monto}
                  onChange={e => setMonto(e.target.value)}
                  required
                  min={0}
                  step="0.01"
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'rgba(255,255,255,0.5)' }}>Fecha</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={e => setFecha(e.target.value)}
                  required
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'rgba(255,255,255,0.5)' }}>Categoría</label>
              <div className="grid grid-cols-4 gap-1.5">
                {CATEGORIAS.map(c => {
                  const IconComp = c.Icon
                  const isActive = categoria === c.valor
                  return (
                    <motion.button
                      key={c.valor}
                      type="button"
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setCategoria(c.valor)}
                      className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-xs cursor-pointer transition-all"
                      style={
                        isActive
                          ? { background: `${c.color}26`, border: `1px solid ${c.color}60`, color: c.color }
                          : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }
                      }
                    >
                      <IconComp className="w-4 h-4" />
                      <span className="leading-none">{c.label}</span>
                    </motion.button>
                  )
                })}
              </div>
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
                : <><Plus className="w-4 h-4" /> Registrar</>
              }
            </motion.button>
          </div>
        </motion.form>

        {/* Filter chips + list */}
        {iniciado && gastosMes.length > 0 && (
          <div>
            <div className="flex gap-1.5 mb-3 flex-wrap">
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={() => setFiltroCategoria('todos')}
                className="text-xs px-3 py-1.5 rounded-full cursor-pointer transition-all"
                style={
                  filtroCategoria === 'todos'
                    ? { background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }
                    : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }
                }
              >
                Todos
              </motion.button>
              {CATEGORIAS.filter(c => gastosMes.some(g => g.categoria === c.valor)).map(c => {
                const IconComp = c.Icon
                const isActive = filtroCategoria === c.valor
                return (
                  <motion.button
                    key={c.valor}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => setFiltroCategoria(c.valor)}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full cursor-pointer transition-all"
                    style={
                      isActive
                        ? { background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }
                        : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }
                    }
                  >
                    <IconComp className="w-3 h-3" />
                    {c.label}
                  </motion.button>
                )
              })}
            </div>

            <p className="text-xs font-medium uppercase tracking-wider mb-2 px-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Historial ({gastosFiltrados.length})
            </p>

            <AnimatePresence>
              {gastosFiltrados.map((gasto) => {
                const cat = getCat(gasto.categoria)
                const IconComp = cat.Icon
                return (
                  <motion.div
                    key={gasto.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16, height: 0 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    className="rounded-xl p-4 mb-2 flex items-center gap-3"
                    style={cardStyle}
                  >
                    <div className="rounded-xl p-2 flex-shrink-0" style={{ background: `${cat.color}18` }}>
                      <IconComp className="w-4 h-4" style={{ color: cat.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{gasto.descripcion}</p>
                      <span className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        <span>{cat.label} · {formatFecha(gasto.fecha)}</span>
                        <span style={{ color: 'rgba(255,255,255,0.12)' }}>·</span>
                        <User className="w-2.5 h-2.5" />
                        <span>{nombreMiembro(gasto.usuario_id)}</span>
                      </span>
                    </div>
                    <p className="font-bold text-sm" style={{ color: '#f59e0b' }}>{formatMonto(Number(gasto.monto))}</p>
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => setConfirmId(gasto.id)}
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

        {!iniciado && <SkeletonList count={4} />}

        {iniciado && gastosMes.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-center mt-12">
            <Wallet className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.12)' }} />
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Sin gastos en {MESES[mesActual]}</p>
          </motion.div>
        )}

      </div>
    </div>
  )
}
