'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { ArrowLeft, Plus, ShoppingCart, Trash2, Package, User, Flag, Check } from 'lucide-react'
import { SkeletonList, SkeletonStat } from '@/components/Skeleton'
import ConfirmDialog from '@/components/ConfirmDialog'

// ─── Types & constants ────────────────────────────────────────────────────────

type Compra = {
  id: string
  item: string
  cantidad: number
  monto: number
  comprado: boolean
  creado_at: string
  creado_por: string
  prioridad: 'urgente' | 'normal' | 'baja'
}

type Usuario = { id: string; nombre: string }

const PRIORIDADES = [
  { valor: 'urgente', label: 'Urgente' },
  { valor: 'normal',  label: 'Normal' },
  { valor: 'baja',    label: 'Baja' },
]

async function logActividad(
  casaId: string, usuarioId: string, nombreUsuario: string,
  tipo: string, descripcion: string
) {
  const { supabase: sb } = await import('@/lib/supabase')
  await sb.from('actividad').insert({
    casa_id: casaId, usuario_id: usuarioId,
    usuario_nombre: nombreUsuario, tipo, descripcion,
  })
}

function formatMonto(monto: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(monto)
}

// ─── Design helpers ───────────────────────────────────────────────────────────

const card = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 16,
}

const inputStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 12,
}

const primaryBtn = {
  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  boxShadow: '0 4px 12px rgba(99,102,241,0.2)',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ComprasPage() {
  const [compras, setCompras] = useState<Compra[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [item, setItem] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [monto, setMonto] = useState('')
  const [prioridad, setPrioridad] = useState<'urgente' | 'normal' | 'baja'>('normal')
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
      const { data: usuario } = await supabase
        .from('usuarios').select('casa_id, nombre').eq('id', user.id).single()
      if (!usuario?.casa_id) return
      setUserId(user.id)
      setCasaId(usuario.casa_id)
      setNombreUsuario(usuario.nombre)
      const [, miembros] = await Promise.all([
        cargarCompras(usuario.casa_id),
        supabase.from('usuarios').select('id, nombre').eq('casa_id', usuario.casa_id),
      ])
      if (miembros.data) setUsuarios(miembros.data)
      setIniciado(true)
    }
    init()
  }, [])

  async function cargarCompras(cid: string) {
    const { data } = await supabase
      .from('compras').select('*').eq('casa_id', cid)
      .order('creado_at', { ascending: false })
    if (data) setCompras(data)
  }

  function nombreMiembro(uid: string) {
    return usuarios.find(u => u.id === uid)?.nombre ?? '?'
  }

  async function agregarCompra(e: React.FormEvent) {
    e.preventDefault()
    if (!userId || !casaId || !item.trim()) return
    setLoading(true)
    await supabase.from('compras').insert({
      item, cantidad,
      monto: monto ? Number(monto) : 0,
      creado_por: userId, casa_id: casaId, prioridad,
    })
    await logActividad(
      casaId, userId, nombreUsuario,
      'compra_agregada', `agregó "${item}" a la lista de compras`,
    )
    toast.success(`"${item}" agregado`)
    setItem(''); setCantidad(1); setMonto(''); setPrioridad('normal')
    await cargarCompras(casaId)
    setLoading(false)
  }

  async function toggleComprado(compra: Compra) {
    await supabase.from('compras').update({ comprado: !compra.comprado }).eq('id', compra.id)
    if (!compra.comprado) toast.success(`"${compra.item}" comprado`)
    setCompras(prev => prev.map(c => c.id === compra.id ? { ...c, comprado: !c.comprado } : c))
  }

  async function eliminarCompra(id: string) {
    await supabase.from('compras').delete().eq('id', id)
    setCompras(prev => prev.filter(c => c.id !== id))
    setConfirmId(null)
  }

  const orden = { urgente: 0, normal: 1, baja: 2 }
  const pendientes = compras
    .filter(c => !c.comprado)
    .sort((a, b) => (orden[a.prioridad] ?? 1) - (orden[b.prioridad] ?? 1))
  const comprados = compras.filter(c => c.comprado)
  const totalPendiente = pendientes.reduce((acc, c) => acc + Number(c.monto || 0), 0)
  const totalGastado = comprados.reduce((acc, c) => acc + Number(c.monto || 0), 0)

  return (
    <div className="p-5 pb-8">
      <ConfirmDialog
        open={!!confirmId}
        title="¿Eliminar ítem?"
        message="Se quitará de la lista de compras."
        onConfirm={() => confirmId && eliminarCompra(confirmId)}
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
            <ShoppingCart className="w-5 h-5" style={{ color: '#10b981' }} />
            <h1 className="text-xl font-bold text-white">Compras</h1>
          </div>
        </motion.div>

        {/* ── Stats ── */}
        {!iniciado && (
          <div className="grid grid-cols-2 gap-3 mb-5">
            <SkeletonStat />
            <SkeletonStat />
          </div>
        )}

        {iniciado && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="grid grid-cols-2 gap-3 mb-5"
          >
            <div style={card} className="p-4">
              <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Por comprar</p>
              <p className="text-xl font-bold" style={{ color: '#10b981' }}>{formatMonto(totalPendiente)}</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>
                {pendientes.length} ítem{pendientes.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div style={card} className="p-4">
              <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Ya gastado</p>
              <p className="text-xl font-bold text-white">{formatMonto(totalGastado)}</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>
                {comprados.length} comprado{comprados.length !== 1 ? 's' : ''}
              </p>
            </div>
          </motion.div>
        )}

        {/* ── Add form ── */}
        <motion.form
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={agregarCompra}
          style={card}
          className="p-4 mb-5"
        >
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="¿Qué hay que comprar?"
              value={item}
              onChange={e => setItem(e.target.value)}
              required
              style={{ ...inputStyle, color: '#fff', fontSize: 14, padding: '10px 16px' }}
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
              const isBaja = p.valor === 'baja'
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
                        : isBaja
                          ? { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)' }
                          : { background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981' }
                      : { background: 'transparent', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.25)' }
                  }
                >
                  <Flag className="w-3 h-3" /> {p.label}
                </motion.button>
              )
            })}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Cantidad
              </label>
              <input
                type="number"
                min={1}
                value={cantidad}
                onChange={e => setCantidad(Number(e.target.value))}
                style={{ ...inputStyle, color: '#fff', fontSize: 14, padding: '8px 12px', width: '100%' }}
                className="focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
              />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Precio estimado
              </label>
              <input
                type="number"
                placeholder="0"
                value={monto}
                onChange={e => setMonto(e.target.value)}
                min={0}
                step="0.01"
                style={{ ...inputStyle, color: '#fff', fontSize: 14, padding: '8px 12px', width: '100%' }}
                className="focus:outline-none focus:ring-2 focus:ring-indigo-500/40 placeholder-[rgba(255,255,255,0.2)] transition-all"
              />
            </div>
          </div>
        </motion.form>

        {/* ── Loading skeleton ── */}
        {!iniciado && <SkeletonList count={3} />}

        {/* ── Pendientes ── */}
        {iniciado && pendientes.length > 0 && (
          <div className="mb-5">
            <p
              className="text-xs font-medium uppercase tracking-wider mb-2 px-1"
              style={{ color: 'rgba(255,255,255,0.25)' }}
            >
              Por comprar
            </p>
            <AnimatePresence>
              {pendientes.map(compra => (
                <motion.div
                  key={compra.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16, height: 0 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: compra.prioridad === 'urgente'
                      ? '1px solid rgba(239,68,68,0.2)'
                      : '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 14,
                  }}
                  className="p-4 mb-2 flex items-center gap-3"
                >
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => toggleComprado(compra)}
                    className="w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center transition-all cursor-pointer"
                    style={{ border: '1.5px solid rgba(255,255,255,0.15)', background: 'transparent' }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = '#10b981'
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.15)'
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{compra.item}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        x{compra.cantidad} · <User className="w-2.5 h-2.5" />{nombreMiembro(compra.creado_por)}
                      </span>
                      {compra.prioridad === 'urgente' && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-md"
                          style={{
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            color: '#f87171',
                          }}
                        >
                          Urgente
                        </span>
                      )}
                      {compra.prioridad === 'baja' && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-md"
                          style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            color: 'rgba(255,255,255,0.3)',
                          }}
                        >
                          Baja
                        </span>
                      )}
                    </div>
                  </div>
                  {compra.monto > 0 && (
                    <span className="text-sm font-medium" style={{ color: '#10b981' }}>
                      {formatMonto(Number(compra.monto))}
                    </span>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => setConfirmId(compra.id)}
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

        {/* ── Comprados ── */}
        {iniciado && comprados.length > 0 && (
          <div>
            <p
              className="text-xs font-medium uppercase tracking-wider mb-2 px-1"
              style={{ color: 'rgba(255,255,255,0.25)' }}
            >
              Comprado ({comprados.length})
            </p>
            <AnimatePresence>
              {comprados.map(compra => (
                <motion.div
                  key={compra.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.35 }}
                  exit={{ opacity: 0, height: 0 }}
                  style={card}
                  className="p-4 mb-2 flex items-center gap-3"
                >
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => toggleComprado(compra)}
                    className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 cursor-pointer"
                    style={{ background: '#10b981', border: '1.5px solid #10b981' }}
                  >
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </motion.button>
                  <div className="flex-1">
                    <p className="text-sm line-through" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {compra.item}
                    </p>
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      <User className="w-2.5 h-2.5" />{nombreMiembro(compra.creado_por)}
                    </span>
                  </div>
                  {compra.monto > 0 && (
                    <span className="text-sm line-through" style={{ color: 'rgba(255,255,255,0.2)' }}>
                      {formatMonto(Number(compra.monto))}
                    </span>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => setConfirmId(compra.id)}
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

        {/* ── Empty state ── */}
        {iniciado && compras.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mt-16"
          >
            <Package className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.1)' }} />
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.25)' }}>La lista está vacía</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.15)' }}>
              Agregá lo que necesitás comprar
            </p>
          </motion.div>
        )}

      </div>
    </div>
  )
}
