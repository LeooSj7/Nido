'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Plus, Check, Trash2, TrendingUp, Circle } from 'lucide-react'
import { SkeletonList } from '@/components/Skeleton'
import ConfirmDialog from '@/components/ConfirmDialog'
import PageHeader from '@/components/PageHeader'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'

type Habito = {
  id: string
  nombre: string
  activo: boolean
  usuario_id: string
  created_at: string
}

type Registro = {
  id: string
  habito_id: string
  fecha: string
}

function hoyISO() {
  return new Date().toISOString().split('T')[0]
}

function fechaHaceN(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

function formatDia(fecha: string) {
  const d = new Date(fecha + 'T00:00:00')
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
}

export default function HabitosPage() {
  const [habitos, setHabitos] = useState<Habito[]>([])
  const [registros, setRegistros] = useState<Registro[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [casaId, setCasaId] = useState<string | null>(null)
  const [iniciado, setIniciado] = useState(false)
  const [loading, setLoading] = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [tab, setTab] = useState<'hoy' | 'grafica'>('hoy')
  const hoy = hoyISO()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: usuario } = await supabase
        .from('usuarios').select('casa_id').eq('id', user.id).single()
      if (!usuario?.casa_id) return
      setUserId(user.id)
      setCasaId(usuario.casa_id)
      await Promise.all([
        cargarHabitos(usuario.casa_id),
        cargarRegistros(usuario.casa_id),
      ])
      setIniciado(true)
    }
    init()
  }, [])

  async function cargarHabitos(cid: string) {
    const { data } = await supabase
      .from('habitos')
      .select('*')
      .eq('casa_id', cid)
      .eq('activo', true)
      .order('created_at', { ascending: true })
    if (data) setHabitos(data)
  }

  async function cargarRegistros(cid: string) {
    const desde = fechaHaceN(30)
    const { data } = await supabase
      .from('habito_registros')
      .select('id, habito_id, fecha')
      .gte('fecha', desde)
      .in('habito_id', (await supabase
        .from('habitos')
        .select('id')
        .eq('casa_id', cid)
        .then(r => r.data?.map(h => h.id) ?? [])
      ))
    if (data) setRegistros(data)
  }

  async function agregarHabito(e: React.FormEvent) {
    e.preventDefault()
    if (!nuevoNombre.trim() || !userId || !casaId) return
    setLoading(true)
    const { error } = await supabase.from('habitos').insert({
      nombre: nuevoNombre.trim(),
      usuario_id: userId,
      casa_id: casaId,
    })
    if (!error) {
      toast.success('Hábito creado')
      setNuevoNombre('')
      setShowForm(false)
      await cargarHabitos(casaId)
    }
    setLoading(false)
  }

  async function toggleHoy(habitoId: string) {
    const yaHecho = registros.some(r => r.habito_id === habitoId && r.fecha === hoy)
    if (yaHecho) {
      const reg = registros.find(r => r.habito_id === habitoId && r.fecha === hoy)
      if (!reg) return
      await supabase.from('habito_registros').delete().eq('id', reg.id)
      setRegistros(prev => prev.filter(r => r.id !== reg.id))
    } else {
      if (!userId) return
      const { data } = await supabase.from('habito_registros')
        .insert({ habito_id: habitoId, usuario_id: userId, fecha: hoy })
        .select('id, habito_id, fecha')
        .single()
      if (data) setRegistros(prev => [...prev, data])
    }
  }

  async function eliminarHabito(id: string) {
    await supabase.from('habitos').update({ activo: false }).eq('id', id)
    setHabitos(prev => prev.filter(h => h.id !== id))
    setConfirmId(null)
  }

  // Datos de la gráfica: últimos 21 días
  const datosGrafica = useMemo(() => {
    if (habitos.length === 0) return []
    return Array.from({ length: 21 }, (_, i) => {
      const fecha = fechaHaceN(20 - i)
      const completados = habitos.filter(h =>
        registros.some(r => r.habito_id === h.id && r.fecha === fecha)
      ).length
      const pct = habitos.length > 0 ? Math.round((completados / habitos.length) * 100) : 0
      return {
        fecha,
        label: formatDia(fecha),
        completados,
        total: habitos.length,
        pct,
      }
    })
  }, [habitos, registros])

  const completadosHoy = habitos.filter(h =>
    registros.some(r => r.habito_id === h.id && r.fecha === hoy)
  ).length

  const cardStyle = {
    background: 'var(--color-paper)',
    border: '1.5px solid var(--color-ink)',
    borderRadius: 2,
  }

  const rachaActual = useMemo(() => {
    let racha = 0
    for (let i = 0; i < 30; i++) {
      const fecha = fechaHaceN(i)
      if (fecha === hoy && completadosHoy < habitos.length) {
        if (i === 0) continue
        break
      }
      const completos = habitos.filter(h =>
        registros.some(r => r.habito_id === h.id && r.fecha === fecha)
      ).length
      if (completos === habitos.length && habitos.length > 0) {
        racha++
      } else if (i > 0) {
        break
      }
    }
    return racha
  }, [habitos, registros, hoy, completadosHoy])

  return (
    <div style={{ minHeight: '100vh' }}>
      <ConfirmDialog
        open={!!confirmId}
        title="Eliminar hábito"
        message="Se eliminará este hábito y todo su historial."
        onConfirm={() => confirmId && eliminarHabito(confirmId)}
        onCancel={() => setConfirmId(null)}
      />

      <PageHeader
        sectionNum="08"
        sectionLabel="Hábitos"
        right={habitos.length > 0 ? `${completadosHoy}/${habitos.length} HOY` : ''}
        title="Lo que uno construye."
        sub="hábitos diarios de la casa"
      />

      <div className="page-content" style={{ paddingTop: 20, paddingBottom: 40 }}>

        {/* Descripción */}
        <div style={{ borderLeft: '3px solid var(--color-warm)', paddingLeft: 14, marginBottom: 24 }}>
          <p style={{ fontSize: 13, color: 'var(--color-ink-2)', fontFamily: 'var(--font-plex-serif)', fontStyle: 'italic', lineHeight: 1.6 }}>
            Definí tus hábitos y marcalos cada día. La gráfica muestra cómo va tu consistencia a lo largo del tiempo.
          </p>
        </div>

        {/* Stats top */}
        {iniciado && habitos.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-5">
            {[
              { label: 'HOY', valor: `${completadosHoy}/${habitos.length}` },
              { label: 'RACHA', valor: `${rachaActual}d` },
              { label: 'HÁBITOS', valor: `${habitos.length}` },
            ].map(s => (
              <div key={s.label} style={{ ...cardStyle, padding: '12px 10px', textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 8, color: 'var(--color-ink-3)', letterSpacing: '0.08em', marginBottom: 4 }}>
                  {s.label}
                </p>
                <p style={{ fontFamily: 'var(--font-plex-serif)', fontStyle: 'italic', fontSize: 20, color: 'var(--color-ink)' }}>
                  {s.valor}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex mb-5" style={{ borderBottom: '1.5px solid var(--color-ink)' }}>
          {(['hoy', 'grafica'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="cursor-pointer"
              style={{
                fontFamily: 'var(--font-plex-mono)',
                fontSize: 10,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '8px 16px',
                background: 'transparent',
                border: 0,
                borderBottom: tab === t ? '2px solid var(--color-ink)' : '2px solid transparent',
                color: tab === t ? 'var(--color-ink)' : 'var(--color-ink-3)',
                marginBottom: -2,
              }}
            >
              {t === 'hoy' ? 'Hoy' : 'Gráfica 21 días'}
            </button>
          ))}
        </div>

        {/* Tab: HOY */}
        {tab === 'hoy' && (
          <div>
            {/* Agregar hábito */}
            {!showForm && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowForm(true)}
                className="w-full flex items-center justify-center gap-2 text-white py-3 rounded-xl font-semibold text-sm cursor-pointer mb-4"
                style={{ background: 'var(--color-ink)' }}
              >
                <Plus className="w-4 h-4" />
                Nuevo hábito
              </motion.button>
            )}

            <AnimatePresence>
              {showForm && (
                <motion.form
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  onSubmit={agregarHabito}
                  className="p-4 mb-4 flex gap-2"
                  style={cardStyle}
                >
                  <input
                    type="text"
                    placeholder="ej: Leer 20 minutos"
                    value={nuevoNombre}
                    onChange={e => setNuevoNombre(e.target.value)}
                    autoFocus
                    className="flex-1 text-sm focus:outline-none"
                    style={{
                      background: 'transparent',
                      border: 0,
                      borderBottom: '1.5px solid var(--color-ink)',
                      color: 'var(--color-ink)',
                      padding: '4px 0',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="cursor-pointer text-xs px-3 py-2 rounded-lg"
                    style={{ border: '1px solid var(--color-rule-soft)', background: 'transparent', color: 'var(--color-ink-3)', fontFamily: 'var(--font-plex-mono)' }}
                  >
                    ✕
                  </button>
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileTap={{ scale: 0.97 }}
                    className="text-white px-4 py-2 rounded-lg text-xs cursor-pointer"
                    style={{ background: 'var(--color-primary)', fontFamily: 'var(--font-plex-mono)' }}
                  >
                    AGREGAR
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>

            {!iniciado && <SkeletonList count={4} />}

            {iniciado && habitos.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mt-12">
                <Circle className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--color-rule-soft)' }} />
                <p style={{ color: 'var(--color-ink-2)', fontSize: 14 }}>No hay hábitos todavía</p>
                <p style={{ color: 'var(--color-ink-3)', fontSize: 12, marginTop: 4 }}>
                  Agregá uno para empezar a construir consistencia
                </p>
              </motion.div>
            )}

            <AnimatePresence>
              {habitos.map((h, i) => {
                const hecho = registros.some(r => r.habito_id === h.id && r.fecha === hoy)
                return (
                  <motion.div
                    key={h.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16, height: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 mb-2 px-4 py-3"
                    style={{
                      ...cardStyle,
                      opacity: hecho ? 0.7 : 1,
                    }}
                  >
                    {/* Checkbox */}
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => toggleHoy(h.id)}
                      className="flex-shrink-0 cursor-pointer"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 2,
                        border: '1.5px solid var(--color-ink)',
                        background: hecho ? 'var(--color-ink)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}
                    >
                      {hecho && <Check className="w-3.5 h-3.5" style={{ color: 'var(--color-bg)' }} />}
                    </motion.button>

                    {/* Nombre */}
                    <p
                      className="flex-1 text-sm"
                      style={{
                        color: 'var(--color-ink)',
                        textDecoration: hecho ? 'line-through' : 'none',
                        fontFamily: 'var(--font-plex-sans)',
                      }}
                    >
                      {h.nombre}
                    </p>

                    {/* Racha del hábito */}
                    <span style={{
                      fontFamily: 'var(--font-plex-mono)',
                      fontSize: 9,
                      color: 'var(--color-ink-3)',
                      letterSpacing: '0.04em',
                    }}>
                      {(() => {
                        let r = 0
                        for (let d = 0; d < 30; d++) {
                          const f = fechaHaceN(d)
                          if (registros.some(reg => reg.habito_id === h.id && reg.fecha === f)) r++
                          else if (d > 0) break
                        }
                        return r > 0 ? `${r}d` : ''
                      })()}
                    </span>

                    {/* Eliminar */}
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => setConfirmId(h.id)}
                      className="cursor-pointer"
                      style={{ color: 'var(--color-ink-3)', background: 'transparent', border: 0, padding: 4 }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </motion.button>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Tab: GRÁFICA */}
        {tab === 'grafica' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {habitos.length === 0 ? (
              <div className="text-center mt-12">
                <TrendingUp className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--color-rule-soft)' }} />
                <p style={{ color: 'var(--color-ink-2)', fontSize: 14 }}>Agregá hábitos para ver la gráfica</p>
              </div>
            ) : (
              <div style={{ ...cardStyle, padding: '20px 8px 12px' }}>
                <p style={{
                  fontFamily: 'var(--font-plex-mono)',
                  fontSize: 9,
                  color: 'var(--color-ink-3)',
                  letterSpacing: '0.08em',
                  textAlign: 'center',
                  marginBottom: 16,
                  textTransform: 'uppercase',
                }}>
                  % de hábitos completados · últimos 21 días
                </p>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={datosGrafica} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPct" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="0 0" stroke="rgba(45,36,24,0.06)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontFamily: 'var(--font-plex-mono)', fontSize: 8, fill: 'var(--color-ink-3)' }}
                      tickLine={false}
                      axisLine={false}
                      interval={4}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontFamily: 'var(--font-plex-mono)', fontSize: 8, fill: 'var(--color-ink-3)' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={v => `${v}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--color-paper)',
                        border: '1px solid var(--color-ink)',
                        borderRadius: 2,
                        fontFamily: 'var(--font-plex-mono)',
                        fontSize: 11,
                        color: 'var(--color-ink)',
                      }}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(value: any, _: any, props: any) => [
                        `${value}% (${props.payload?.completados ?? 0}/${props.payload?.total ?? 0})`,
                        'Completados'
                      ]}
                      labelStyle={{ color: 'var(--color-ink-3)', fontSize: 10 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="pct"
                      stroke="var(--color-primary)"
                      strokeWidth={1.5}
                      fill="url(#colorPct)"
                      dot={false}
                      activeDot={{ r: 4, fill: 'var(--color-primary)', stroke: 'var(--color-bg)', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>

                {/* Leyenda días de semana debajo */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 12 }}>
                  {[
                    { label: '100%', desc: 'Todos los hábitos' },
                    { label: '0%', desc: 'Ninguno' },
                  ].map(l => (
                    <div key={l.label} className="flex items-center gap-1">
                      <div style={{ width: 8, height: 2, background: 'var(--color-primary)', borderRadius: 1 }} />
                      <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, color: 'var(--color-ink-3)' }}>
                        {l.label} = {l.desc}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detalle por hábito - últimos 7 días */}
            {habitos.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <p style={{
                  fontFamily: 'var(--font-plex-mono)',
                  fontSize: 9,
                  color: 'var(--color-ink-3)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: 10,
                }}>
                  ÚLTIMOS 7 DÍAS POR HÁBITO
                </p>
                {habitos.map(h => {
                  const ultimos7 = Array.from({ length: 7 }, (_, i) => fechaHaceN(6 - i))
                  return (
                    <div key={h.id} className="flex items-center gap-3 mb-3">
                      <p style={{ flex: 1, fontSize: 12, color: 'var(--color-ink)', fontFamily: 'var(--font-plex-sans)', minWidth: 0 }}
                        className="truncate">
                        {h.nombre}
                      </p>
                      <div className="flex gap-1">
                        {ultimos7.map(fecha => {
                          const hecho = registros.some(r => r.habito_id === h.id && r.fecha === fecha)
                          return (
                            <div
                              key={fecha}
                              title={fecha}
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: 1,
                                background: hecho ? 'var(--color-primary)' : 'var(--color-rule-soft)',
                                border: fecha === hoy ? '1px solid var(--color-ink)' : '1px solid transparent',
                              }}
                            />
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}

      </div>
    </div>
  )
}
