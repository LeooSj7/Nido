'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { CheckSquare, ShoppingCart, Wallet, Bell, Utensils, Copy, Users, UserCircle, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'
import { SkeletonDashboard } from '@/components/Skeleton'
import { BarChart, Bar, ResponsiveContainer, Tooltip, Cell } from 'recharts'

type Actividad = { id: string; usuario_nombre: string; tipo: string; descripcion: string; creado_at: string }
type GastoSemana = { semana: string; total: number }

function saludo() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function tiempoAtras(fecha: string) {
  const diff = Date.now() - new Date(fecha).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'ahora'
  if (min < 60) return `hace ${min}m`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h}h`
  return `hace ${Math.floor(h / 24)}d`
}

function iconoActividad(tipo: string) {
  if (tipo.includes('tarea')) return <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
  if (tipo.includes('compra')) return <ShoppingCart className="w-3.5 h-3.5 text-emerald-400" />
  if (tipo.includes('gasto')) return <Wallet className="w-3.5 h-3.5 text-amber-400" />
  return <Bell className="w-3.5 h-3.5 text-purple-400" />
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }

const cardStyle = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
}

export default function DashboardPage() {
  const router = useRouter()
  const [cargado, setCargado] = useState(false)
  const [nombre, setNombre] = useState('')
  const [casaNombre, setCasaNombre] = useState('')
  const [casaCodigo, setCasaCodigo] = useState('')
  const [actividad, setActividad] = useState<Actividad[]>([])
  const [gastosSemanas, setGastosSemanas] = useState<GastoSemana[]>([])
  const [resumen, setResumen] = useState({ tareasPendientes: 0, proximoRecordatorio: null as string | null, gastosMes: 0, comprasPendientes: 0, presupuesto: 0, tareasUrgentes: 0 })

  useEffect(() => {
    async function cargar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: usuario } = await supabase.from('usuarios').select('nombre, casa_id').eq('id', user.id).single()
      if (!usuario) { router.push('/login'); return }
      if (!usuario.casa_id) { router.push('/setup-casa'); return }

      setNombre(usuario.nombre)
      const cid = usuario.casa_id

      const ahora = new Date().toISOString()
      const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

      const semanas: GastoSemana[] = []
      for (let i = 3; i >= 0; i--) {
        const inicio = new Date(); inicio.setDate(inicio.getDate() - (i + 1) * 7)
        const fin = new Date(); fin.setDate(fin.getDate() - i * 7)
        semanas.push({ semana: `S${4 - i}`, total: 0, _inicio: inicio.toISOString().split('T')[0], _fin: fin.toISOString().split('T')[0] } as GastoSemana & { _inicio: string; _fin: string })
      }

      const [casa, tareas, tareasUrgentes, recordatorios, gastos, compras, actividadData] = await Promise.all([
        supabase.from('casas').select('nombre, codigo, presupuesto_mensual').eq('id', cid).single(),
        supabase.from('tareas').select('id', { count: 'exact' }).eq('casa_id', cid).eq('completada', false),
        supabase.from('tareas').select('id', { count: 'exact' }).eq('casa_id', cid).eq('completada', false).eq('prioridad', 'urgente'),
        supabase.from('recordatorios').select('titulo, fecha').eq('casa_id', cid).gte('fecha', ahora).order('fecha').limit(1),
        supabase.from('gastos').select('monto, fecha').eq('casa_id', cid).gte('fecha', inicioMes),
        supabase.from('compras').select('id', { count: 'exact' }).eq('casa_id', cid).eq('comprado', false),
        supabase.from('actividad').select('*').eq('casa_id', cid).order('creado_at', { ascending: false }).limit(8),
      ])

      if (casa.data) { setCasaNombre(casa.data.nombre); setCasaCodigo(casa.data.codigo) }
      if (actividadData.data) setActividad(actividadData.data)

      const gastosMesTotal = (gastos.data ?? []).reduce((acc, g) => acc + Number(g.monto), 0)

      const gastosData = gastos.data ?? []
      const semanasCalculadas = (semanas as (GastoSemana & { _inicio: string; _fin: string })[]).map(s => ({
        semana: s.semana,
        total: gastosData
          .filter(g => g.fecha >= s._inicio && g.fecha < s._fin)
          .reduce((acc, g) => acc + Number(g.monto), 0)
      }))
      setGastosSemanas(semanasCalculadas)

      setResumen({
        tareasPendientes: tareas.count ?? 0,
        proximoRecordatorio: recordatorios.data?.[0]?.titulo ?? null,
        gastosMes: gastosMesTotal,
        comprasPendientes: compras.count ?? 0,
        presupuesto: Number(casa.data?.presupuesto_mensual) || 0,
        tareasUrgentes: tareasUrgentes.count ?? 0,
      })
      setCargado(true)
    }
    cargar()
  }, [router])

  function copiarCodigo() {
    navigator.clipboard.writeText(casaCodigo)
    toast.success(`Código ${casaCodigo} copiado`)
  }

  const porcentajePresupuesto = resumen.presupuesto > 0 ? Math.min((resumen.gastosMes / resumen.presupuesto) * 100, 100) : 0
  const maxGasto = Math.max(...gastosSemanas.map(s => s.total), 1)
  const estadoCasa = resumen.tareasUrgentes > 0
    ? { texto: `${resumen.tareasUrgentes} tarea${resumen.tareasUrgentes > 1 ? 's' : ''} urgente${resumen.tareasUrgentes > 1 ? 's' : ''}`, ok: false }
    : resumen.tareasPendientes === 0
      ? { texto: 'Todo al día', ok: true }
      : { texto: `${resumen.tareasPendientes} pendiente${resumen.tareasPendientes > 1 ? 's' : ''}`, ok: true }

  if (!cargado) {
    return (
      <div className="p-5 max-w-lg mx-auto pt-6" style={{ background: '#09090b', minHeight: '100vh' }}>
        <SkeletonDashboard />
      </div>
    )
  }

  return (
    <div className="p-5 pb-4" style={{ background: '#09090b', minHeight: '100vh' }}>
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-start mb-6 pt-2"
        >
          <div>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{saludo()}</p>
            <h1 className="text-2xl font-bold text-white mt-0.5">{nombre}</h1>
            <div className={`flex items-center gap-1.5 mt-1 ${estadoCasa.ok ? 'text-emerald-400' : 'text-red-400'}`}>
              {estadoCasa.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              <span className="text-xs font-medium">{estadoCasa.texto}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <Link href="/perfil">
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="cursor-pointer p-2 rounded-xl transition-colors"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                <UserCircle className="w-5 h-5" />
              </motion.div>
            </Link>
          </div>
        </motion.div>

        {/* Card casa + presupuesto */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="rounded-2xl p-4 mb-4"
          style={cardStyle}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="rounded-xl p-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <Users className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.5)' }} />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{casaNombre}</p>
                <p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.35)' }}>#{casaCodigo}</p>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={copiarCodigo}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all cursor-pointer"
              style={{
                color: 'rgba(255,255,255,0.5)',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <Copy className="w-3 h-3" /> Invitar
            </motion.button>
          </div>

          {resumen.presupuesto > 0 && (
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>Gastos del mes</span>
                <span
                  className="font-medium"
                  style={{ color: porcentajePresupuesto >= 90 ? '#f87171' : 'rgba(255,255,255,0.6)' }}
                >
                  ${resumen.gastosMes.toLocaleString('es-AR')} / ${resumen.presupuesto.toLocaleString('es-AR')}
                </span>
              </div>
              <div className="rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${porcentajePresupuesto}%` }}
                  transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                  className={`h-1.5 rounded-full ${porcentajePresupuesto >= 90 ? 'bg-red-400' : porcentajePresupuesto >= 70 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Quick stats */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="grid grid-cols-4 gap-2 mb-4"
        >
          {[
            { label: 'Tareas',  value: resumen.tareasPendientes,                                  accent: '#3b82f6', href: '/dashboard/tareas' },
            { label: 'Compras', value: resumen.comprasPendientes,                                 accent: '#10b981', href: '/dashboard/compras' },
            { label: 'Aviso',   value: resumen.proximoRecordatorio ? '1+' : '—',                  accent: '#a855f7', href: '/dashboard/recordatorios' },
            { label: 'Gastos',  value: `$${(resumen.gastosMes / 1000).toFixed(1)}k`,             accent: '#f59e0b', href: '/dashboard/gastos' },
          ].map(s => (
            <Link key={s.href} href={s.href}>
              <motion.div
                whileTap={{ scale: 0.93 }}
                className="rounded-xl p-3 text-center cursor-pointer transition-colors"
                style={cardStyle}
              >
                <p className="text-lg font-bold" style={{ color: s.accent }}>{s.value}</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{s.label}</p>
              </motion.div>
            </Link>
          ))}
        </motion.div>

        {/* Gráfico de gastos */}
        {gastosSemanas.some(s => s.total > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="rounded-2xl p-4 mb-4"
            style={cardStyle}
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4" style={{ color: '#6366f1' }} />
              <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>Gastos últimas 4 semanas</p>
            </div>
            <div className="h-20">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gastosSemanas} barSize={28}>
                  <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                    {gastosSemanas.map((s, i) => (
                      <Cell key={i} fill={s.total === maxGasto ? '#6366f1' : 'rgba(255,255,255,0.08)'} />
                    ))}
                  </Bar>
                  <Tooltip
                    cursor={false}
                    contentStyle={{
                      background: '#111113',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [`$${v.toLocaleString('es-AR')}`, '']}
                    labelStyle={{ color: 'rgba(255,255,255,0.4)' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between mt-1">
              {gastosSemanas.map(s => (
                <span key={s.semana} className="text-xs flex-1 text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  {s.semana}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Actividad reciente */}
        {actividad.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl p-4 mb-4"
            style={cardStyle}
          >
            <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Actividad reciente
            </p>
            <div className="flex flex-col gap-2.5">
              {actividad.map(a => (
                <div key={a.id} className="flex items-start gap-2.5">
                  <div className="rounded-lg p-1.5 flex-shrink-0 mt-0.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    {iconoActividad(a.tipo)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      <span className="text-white font-medium">{a.usuario_nombre}</span> {a.descripcion}
                    </p>
                  </div>
                  <span className="text-xs flex-shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    {tiempoAtras(a.creado_at)}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Secciones */}
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 gap-3">
          {[
            { href: '/dashboard/tareas',        icon: CheckSquare,  label: 'Tareas',       sub: `${resumen.tareasPendientes} pendiente${resumen.tareasPendientes !== 1 ? 's' : ''}`, accentColor: '#3b82f6' },
            { href: '/dashboard/compras',        icon: ShoppingCart, label: 'Compras',      sub: `${resumen.comprasPendientes} por comprar`,                                          accentColor: '#10b981' },
            { href: '/dashboard/gastos',         icon: Wallet,       label: 'Gastos',       sub: `$${resumen.gastosMes.toLocaleString('es-AR')} este mes`,                            accentColor: '#f59e0b' },
            { href: '/dashboard/recordatorios',  icon: Bell,         label: 'Recordatorios',sub: resumen.proximoRecordatorio ?? 'Sin próximos',                                       accentColor: '#a855f7' },
            { href: '/dashboard/comidas',        icon: Utensils,     label: 'Comidas',      sub: 'Registro diario',                                                                   accentColor: '#f97316' },
          ].map(s => (
            <motion.div key={s.href} variants={item}>
              <Link href={s.href}>
                <motion.div
                  whileTap={{ scale: 0.96 }}
                  className="rounded-2xl p-5 cursor-pointer transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = `${s.accentColor}33`
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = 'rgba(255,255,255,0.07)'
                  }}
                >
                  <div
                    className="rounded-xl p-2.5 w-fit mb-3"
                    style={{ background: `${s.accentColor}1e` }}
                  >
                    <s.icon className="w-5 h-5" style={{ color: s.accentColor }} />
                  </div>
                  <p className="font-bold text-white text-base">{s.label}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.sub}</p>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </div>
  )
}
