'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Plus, ChevronDown, ChevronUp, Trash2, BookOpen, Sun, Cloud } from 'lucide-react'
import { SkeletonList } from '@/components/Skeleton'
import ConfirmDialog from '@/components/ConfirmDialog'
import PageHeader from '@/components/PageHeader'

type Entrada = {
  id: string
  fecha: string
  titulo: string | null
  contenido: string | null
  positivo: string | null
  negativo: string | null
  created_at: string
  usuario_id: string
}

function formatFecha(fecha: string) {
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  })
}

function hoyISO() {
  return new Date().toISOString().split('T')[0]
}

export default function DiarioPage() {
  const [entradas, setEntradas] = useState<Entrada[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [casaId, setCasaId] = useState<string | null>(null)
  const [iniciado, setIniciado] = useState(false)
  const [loading, setLoading] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [expandida, setExpandida] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [fecha, setFecha] = useState(hoyISO())
  const [titulo, setTitulo] = useState('')
  const [contenido, setContenido] = useState('')
  const [positivo, setPositivo] = useState('')
  const [negativo, setNegativo] = useState('')

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: usuario } = await supabase
        .from('usuarios').select('casa_id').eq('id', user.id).single()
      if (!usuario?.casa_id) return
      setUserId(user.id)
      setCasaId(usuario.casa_id)
      await cargarEntradas(usuario.casa_id)
      setIniciado(true)
    }
    init()
  }, [])

  async function cargarEntradas(cid: string) {
    const { data } = await supabase
      .from('diario')
      .select('*')
      .eq('casa_id', cid)
      .order('fecha', { ascending: false })
    if (data) setEntradas(data)
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    if (!userId || !casaId) return
    if (!contenido.trim() && !positivo.trim() && !negativo.trim()) {
      toast.error('Escribí algo antes de guardar')
      return
    }
    setLoading(true)
    const { error } = await supabase.from('diario').insert({
      casa_id: casaId,
      usuario_id: userId,
      fecha,
      titulo: titulo.trim() || null,
      contenido: contenido.trim() || null,
      positivo: positivo.trim() || null,
      negativo: negativo.trim() || null,
    })
    if (error) {
      toast.error('Error al guardar')
    } else {
      toast.success('Entrada guardada')
      setTitulo('')
      setContenido('')
      setPositivo('')
      setNegativo('')
      setFecha(hoyISO())
      setShowForm(false)
      await cargarEntradas(casaId)
    }
    setLoading(false)
  }

  async function eliminar(id: string) {
    await supabase.from('diario').delete().eq('id', id)
    setEntradas(prev => prev.filter(e => e.id !== id))
    setConfirmId(null)
  }

  const cardStyle = {
    background: 'var(--color-paper)',
    border: '1.5px solid var(--color-ink)',
    borderRadius: 2,
  }

  const inputCls = "w-full px-0 py-2 text-sm focus:outline-none transition-all resize-none"
  const inputStyle = {
    background: 'transparent',
    border: 0,
    borderBottom: '1.5px solid var(--color-ink)',
    borderRadius: 0,
    color: 'var(--color-ink)',
    fontFamily: 'var(--font-plex-sans)',
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <ConfirmDialog
        open={!!confirmId}
        title="Eliminar entrada"
        message="Esta entrada del diario se borrará permanentemente."
        onConfirm={() => confirmId && eliminar(confirmId)}
        onCancel={() => setConfirmId(null)}
      />

      <PageHeader
        sectionNum="07"
        sectionLabel="Diario"
        right={`${entradas.length} ENTRADAS`}
        title="Lo que fue el día."
        sub="un registro personal de la casa"
      />

      <div className="page-content" style={{ paddingTop: 20, paddingBottom: 40 }}>

        {/* Descripción de sección */}
        <div style={{
          borderLeft: '3px solid var(--color-warm)',
          paddingLeft: 14,
          marginBottom: 24,
          marginTop: 4,
        }}>
          <p style={{ fontSize: 13, color: 'var(--color-ink-2)', fontFamily: 'var(--font-plex-serif)', fontStyle: 'italic', lineHeight: 1.6 }}>
            Escribí cómo estuvo el día — lo bueno, lo malo, lo que pasó. Un espacio para recordar y leer después.
          </p>
        </div>

        {/* Botón nueva entrada */}
        {!showForm && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowForm(true)}
            className="w-full flex items-center justify-center gap-2 text-white py-3 rounded-xl font-semibold text-sm cursor-pointer mb-6"
            style={{ background: 'var(--color-ink)' }}
          >
            <Plus className="w-4 h-4" />
            Nueva entrada
          </motion.button>
        )}

        {/* Formulario */}
        <AnimatePresence>
          {showForm && (
            <motion.form
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              onSubmit={guardar}
              className="p-5 mb-6"
              style={cardStyle}
            >
              <p style={{
                fontFamily: 'var(--font-plex-mono)',
                fontSize: 10,
                letterSpacing: '0.08em',
                color: 'var(--color-ink-3)',
                marginBottom: 16,
                textTransform: 'uppercase',
              }}>
                Nueva entrada
              </p>

              <div className="flex flex-col gap-4">
                {/* Fecha */}
                <div>
                  <label style={{ fontSize: 10, color: 'var(--color-ink-3)', fontFamily: 'var(--font-plex-mono)', display: 'block', marginBottom: 4, letterSpacing: '0.06em' }}>
                    FECHA
                  </label>
                  <input
                    type="date"
                    value={fecha}
                    onChange={e => setFecha(e.target.value)}
                    max={hoyISO()}
                    className={inputCls}
                    style={inputStyle}
                  />
                </div>

                {/* Título opcional */}
                <div>
                  <label style={{ fontSize: 10, color: 'var(--color-ink-3)', fontFamily: 'var(--font-plex-mono)', display: 'block', marginBottom: 4, letterSpacing: '0.06em' }}>
                    TÍTULO (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="ej: Un día tranquilo"
                    value={titulo}
                    onChange={e => setTitulo(e.target.value)}
                    className={inputCls}
                    style={inputStyle}
                  />
                </div>

                {/* Contenido */}
                <div>
                  <label style={{ fontSize: 10, color: 'var(--color-ink-3)', fontFamily: 'var(--font-plex-mono)', display: 'block', marginBottom: 4, letterSpacing: '0.06em' }}>
                    ¿CÓMO ESTUVO EL DÍA?
                  </label>
                  <textarea
                    placeholder="Escribí libremente sobre el día..."
                    value={contenido}
                    onChange={e => setContenido(e.target.value)}
                    rows={4}
                    className={inputCls}
                    style={{ ...inputStyle, borderBottom: '1.5px solid var(--color-ink)', paddingTop: 4 }}
                  />
                </div>

                {/* Lo bueno */}
                <div>
                  <label style={{ fontSize: 10, color: '#4A6440', fontFamily: 'var(--font-plex-mono)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4, letterSpacing: '0.06em' }}>
                    <Sun className="w-3 h-3" /> LO BUENO
                  </label>
                  <textarea
                    placeholder="¿Qué salió bien hoy?"
                    value={positivo}
                    onChange={e => setPositivo(e.target.value)}
                    rows={2}
                    className={inputCls}
                    style={{ ...inputStyle, borderBottom: '1.5px solid rgba(74,100,64,0.4)' }}
                  />
                </div>

                {/* Lo malo */}
                <div>
                  <label style={{ fontSize: 10, color: 'var(--color-warm)', fontFamily: 'var(--font-plex-mono)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4, letterSpacing: '0.06em' }}>
                    <Cloud className="w-3 h-3" /> LO QUE NO FUE TAN BIEN
                  </label>
                  <textarea
                    placeholder="¿Qué no salió como esperabas?"
                    value={negativo}
                    onChange={e => setNegativo(e.target.value)}
                    rows={2}
                    className={inputCls}
                    style={{ ...inputStyle, borderBottom: '1.5px solid rgba(168,100,42,0.4)' }}
                  />
                </div>

                <div className="flex gap-2 mt-1">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm cursor-pointer"
                    style={{ border: '1.5px solid var(--color-ink)', background: 'transparent', color: 'var(--color-ink-2)', fontFamily: 'var(--font-plex-mono)', fontSize: 11 }}
                  >
                    CANCELAR
                  </motion.button>
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileTap={{ scale: 0.97 }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm cursor-pointer disabled:opacity-50 text-white font-semibold"
                    style={{ background: 'var(--color-primary)' }}
                  >
                    {loading
                      ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : 'GUARDAR'
                    }
                  </motion.button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Lista de entradas */}
        {!iniciado && <SkeletonList count={3} />}

        {iniciado && entradas.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-16"
          >
            <BookOpen className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--color-rule-soft)' }} />
            <p style={{ color: 'var(--color-ink-2)', fontSize: 14 }}>El diario está vacío</p>
            <p style={{ color: 'var(--color-ink-3)', fontSize: 12, marginTop: 4 }}>
              Empezá escribiendo cómo estuvo hoy
            </p>
          </motion.div>
        )}

        <AnimatePresence>
          {entradas.map((entrada, i) => {
            const abierta = expandida === entrada.id
            return (
              <motion.div
                key={entrada.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.04 }}
                className="mb-3"
                style={{ border: '1.5px solid var(--color-ink)', borderRadius: 2, background: 'var(--color-paper)', overflow: 'hidden' }}
              >
                {/* Cabecera de la entrada */}
                <button
                  className="w-full text-left cursor-pointer"
                  onClick={() => setExpandida(abierta ? null : entrada.id)}
                  style={{ padding: '14px 16px', background: 'transparent', border: 0 }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div style={{ flex: 1 }}>
                      <p style={{
                        fontFamily: 'var(--font-plex-mono)',
                        fontSize: 9,
                        color: 'var(--color-ink-3)',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        marginBottom: 3,
                      }}>
                        {formatFecha(entrada.fecha)}
                      </p>
                      {entrada.titulo && (
                        <p style={{
                          fontFamily: 'var(--font-plex-serif)',
                          fontStyle: 'italic',
                          fontSize: 16,
                          color: 'var(--color-ink)',
                          lineHeight: 1.3,
                        }}>
                          {entrada.titulo}
                        </p>
                      )}
                      {!entrada.titulo && entrada.contenido && (
                        <p style={{ fontSize: 13, color: 'var(--color-ink-2)', lineHeight: 1.4 }}>
                          {entrada.contenido.slice(0, 80)}{entrada.contenido.length > 80 ? '…' : ''}
                        </p>
                      )}
                      {/* Indicadores bueno/malo */}
                      <div className="flex gap-2 mt-2">
                        {entrada.positivo && (
                          <span style={{ fontSize: 9, fontFamily: 'var(--font-plex-mono)', color: '#4A6440', letterSpacing: '0.04em' }}>
                            ↑ bueno
                          </span>
                        )}
                        {entrada.negativo && (
                          <span style={{ fontSize: 9, fontFamily: 'var(--font-plex-mono)', color: 'var(--color-warm)', letterSpacing: '0.04em' }}>
                            ↓ malo
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={(e) => { e.stopPropagation(); setConfirmId(entrada.id) }}
                        style={{ color: 'var(--color-ink-3)', background: 'transparent', border: 0, cursor: 'pointer', padding: 4 }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </motion.button>
                      {abierta
                        ? <ChevronUp className="w-4 h-4" style={{ color: 'var(--color-ink-3)' }} />
                        : <ChevronDown className="w-4 h-4" style={{ color: 'var(--color-ink-3)' }} />
                      }
                    </div>
                  </div>
                </button>

                {/* Contenido expandido */}
                <AnimatePresence>
                  {abierta && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ borderTop: '1px solid var(--color-rule-soft)', overflow: 'hidden' }}
                    >
                      <div style={{ padding: '14px 16px' }} className="flex flex-col gap-4">
                        {entrada.contenido && (
                          <div>
                            <p style={{ fontSize: 11, fontFamily: 'var(--font-plex-mono)', color: 'var(--color-ink-3)', letterSpacing: '0.06em', marginBottom: 6 }}>
                              EL DÍA
                            </p>
                            <p style={{ fontSize: 14, color: 'var(--color-ink)', lineHeight: 1.7, fontFamily: 'var(--font-plex-serif)', whiteSpace: 'pre-wrap' }}>
                              {entrada.contenido}
                            </p>
                          </div>
                        )}
                        {entrada.positivo && (
                          <div style={{ borderLeft: '2px solid #4A6440', paddingLeft: 12 }}>
                            <p style={{ fontSize: 11, fontFamily: 'var(--font-plex-mono)', color: '#4A6440', letterSpacing: '0.06em', marginBottom: 4 }}>
                              LO BUENO
                            </p>
                            <p style={{ fontSize: 13, color: 'var(--color-ink-2)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                              {entrada.positivo}
                            </p>
                          </div>
                        )}
                        {entrada.negativo && (
                          <div style={{ borderLeft: '2px solid var(--color-warm)', paddingLeft: 12 }}>
                            <p style={{ fontSize: 11, fontFamily: 'var(--font-plex-mono)', color: 'var(--color-warm)', letterSpacing: '0.06em', marginBottom: 4 }}>
                              LO QUE NO FUE TAN BIEN
                            </p>
                            <p style={{ fontSize: 13, color: 'var(--color-ink-2)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                              {entrada.negativo}
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </AnimatePresence>

      </div>
    </div>
  )
}
