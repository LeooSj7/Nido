'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Plus, Shirt, Trash2, AlertTriangle, Camera, X,
  RotateCcw, LayoutGrid, List, Check, Layers,
} from 'lucide-react'
import { SkeletonList } from '@/components/Skeleton'
import ConfirmDialog from '@/components/ConfirmDialog'
import PageHeader from '@/components/PageHeader'

// ─── Types ────────────────────────────────────────────────────────────────────

type Prenda = {
  id: string
  nombre: string
  categoria: string
  color: string | null
  foto_url: string | null
  estado: 'limpio' | 'sucio'
  usos_desde_lavado: number
  max_usos: number
  ultimo_uso: string | null
  ultimo_lavado: string | null
  creado_at: string
}

type Outfit = {
  id: string
  nombre: string
  prenda_ids: string[]
  fecha: string
  creado_at: string
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const CATEGORIAS = [
  { value: 'remera',     label: 'Remera / Camiseta',     maxUsos: 2  },
  { value: 'camisa',     label: 'Camisa / Blusa',         maxUsos: 2  },
  { value: 'pantalon',   label: 'Pantalón / Jean',        maxUsos: 3  },
  { value: 'short',      label: 'Short / Bermuda',        maxUsos: 2  },
  { value: 'campera',    label: 'Campera / Buzo',         maxUsos: 5  },
  { value: 'vestido',    label: 'Vestido / Falda',        maxUsos: 2  },
  { value: 'zapatillas', label: 'Zapatillas / Zapatos',   maxUsos: 10 },
  { value: 'interior',   label: 'Ropa interior / Medias', maxUsos: 1  },
  { value: 'otro',       label: 'Otro',                   maxUsos: 3  },
]

const COLORES = [
  { value: 'negro',    hex: '#1a1a1a', label: 'Negro'    },
  { value: 'blanco',   hex: '#f5f5f0', label: 'Blanco'   },
  { value: 'gris',     hex: '#9a9a9a', label: 'Gris'     },
  { value: 'azul',     hex: '#3b6fa0', label: 'Azul'     },
  { value: 'rojo',     hex: '#c0392b', label: 'Rojo'     },
  { value: 'verde',    hex: '#4a6440', label: 'Verde'     },
  { value: 'beige',    hex: '#c8b89a', label: 'Beige'    },
  { value: 'marron',   hex: '#7a5c3a', label: 'Marrón'   },
  { value: 'rosa',     hex: '#d4a0a0', label: 'Rosa'     },
  { value: 'amarillo', hex: '#c8a84b', label: 'Amarillo' },
]

type Filtro = 'todas' | 'limpias' | 'sucias' | 'lavar'
type Vista  = 'lista' | 'color' | 'categoria' | 'outfits'
type Layout = 'grilla' | 'lista'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hoyISO() { return new Date().toISOString().split('T')[0] }
function necesitaLavado(p: Prenda) { return p.usos_desde_lavado >= p.max_usos }

function estadoPrenda(p: Prenda) {
  if (necesitaLavado(p)) return { label: 'Lavar ya', color: 'var(--color-warm)' }
  if (p.estado === 'sucio') return { label: 'Sucio', color: '#a86040' }
  return { label: 'Limpio', color: 'var(--color-primary)' }
}

function formatFecha(fecha: string | null) {
  if (!fecha) return null
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
}

// ─── Tarjeta grilla (carta de prenda) ────────────────────────────────────────

function PrendaCardGrilla({
  prenda, onUso, onLavado, onEliminar,
  seleccionable = false, seleccionado = false, onToggle,
}: {
  prenda: Prenda
  onUso: (p: Prenda) => void
  onLavado: (p: Prenda) => void
  onEliminar: (id: string) => void
  seleccionable?: boolean
  seleccionado?: boolean
  onToggle?: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const lavar    = necesitaLavado(prenda)
  const estado   = estadoPrenda(prenda)
  const colorHex = COLORES.find(c => c.value === prenda.color)?.hex
  const catLabel = CATEGORIAS.find(c => c.value === prenda.categoria)?.label ?? prenda.categoria

  function handleClick() {
    if (seleccionable && onToggle) { onToggle(prenda.id); return }
    setExpanded(v => !v)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onClick={handleClick}
      style={{
        border: seleccionado
          ? '2px solid var(--color-primary)'
          : lavar ? '1.5px solid var(--color-warm)' : '1.5px solid var(--color-ink)',
        borderRadius: 4,
        background: seleccionado ? 'rgba(74,100,64,0.06)' : 'var(--color-paper)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: seleccionado
          ? '3px 4px 0 rgba(74,100,64,0.20)'
          : '3px 4px 0 rgba(45,36,24,0.10)',
        cursor: 'pointer',
        transition: 'border 0.12s, box-shadow 0.12s',
      }}
    >
      {/* Foto */}
      <div style={{
        width: '100%', aspectRatio: '3 / 4',
        background: '#FFFFFF',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', position: 'relative',
      }}>
        {prenda.foto_url ? (
          <img src={prenda.foto_url} alt={prenda.nombre}
            style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 6 }} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <Shirt className="w-8 h-8" style={{ color: lavar ? 'var(--color-warm)' : 'var(--color-ink-3)' }} />
            {colorHex && <div style={{ width: 10, height: 10, borderRadius: '50%', background: colorHex, border: '1px solid rgba(45,36,24,0.2)' }} />}
          </div>
        )}

        {/* Check de selección */}
        {seleccionable && (
          <div style={{
            position: 'absolute', top: 6, left: 6,
            width: 20, height: 20, borderRadius: '50%',
            background: seleccionado ? 'var(--color-primary)' : 'rgba(255,255,255,0.9)',
            border: seleccionado ? '2px solid var(--color-primary)' : '2px solid var(--color-ink-3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.12s',
          }}>
            {seleccionado && <Check className="w-3 h-3" style={{ color: '#fff' }} />}
          </div>
        )}

        {/* Badge lavar */}
        {lavar && !seleccionable && (
          <div style={{
            position: 'absolute', top: 6, right: 6,
            background: 'var(--color-warm)', color: '#fff',
            fontFamily: 'var(--font-plex-mono)', fontSize: 8,
            letterSpacing: '0.06em', padding: '2px 5px', borderRadius: 2,
          }}>
            LAVAR
          </div>
        )}
      </div>

      {/* Info inferior */}
      <div style={{ padding: '8px 8px 6px' }}>
        <p style={{
          fontFamily: 'var(--font-plex-sans)', fontWeight: 600,
          fontSize: 12, color: 'var(--color-ink)', margin: 0, lineHeight: 1.2,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {prenda.nombre}
        </p>
        <p style={{
          fontFamily: 'var(--font-plex-mono)', fontSize: 8,
          color: 'var(--color-ink-3)', margin: '2px 0 0',
          letterSpacing: '0.04em', textTransform: 'uppercase',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {catLabel}{prenda.color ? ` · ${prenda.color}` : ''}
        </p>

        {/* Barra usos */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
          <div style={{ flex: 1, height: 2, background: 'var(--color-rule-soft)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, (prenda.usos_desde_lavado / prenda.max_usos) * 100)}%`,
              background: lavar ? 'var(--color-warm)' : 'var(--color-primary)',
              borderRadius: 2, transition: 'width 0.3s ease',
            }} />
          </div>
          <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 8, color: estado.color, letterSpacing: '0.04em', flexShrink: 0 }}>
            {prenda.usos_desde_lavado}/{prenda.max_usos}
          </span>
        </div>

        {/* Acciones expandibles (solo cuando no es modo selección) */}
        {!seleccionable && (
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => onUso(prenda)}
                    style={{ flex: 1, padding: '5px 0', border: '1px solid var(--color-ink)', background: 'transparent', borderRadius: 2, fontFamily: 'var(--font-plex-mono)', fontSize: 8, letterSpacing: '0.04em', cursor: 'pointer', color: 'var(--color-ink)', textTransform: 'uppercase' }}>
                    Usé
                  </motion.button>
                  {(lavar || prenda.estado === 'sucio') && (
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => onLavado(prenda)}
                      style={{ flex: 1, padding: '5px 0', border: '1px solid var(--color-warm)', background: 'rgba(168,100,42,0.08)', borderRadius: 2, fontFamily: 'var(--font-plex-mono)', fontSize: 8, letterSpacing: '0.04em', cursor: 'pointer', color: 'var(--color-warm)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                      <RotateCcw className="w-2.5 h-2.5" />Lavé
                    </motion.button>
                  )}
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => onEliminar(prenda.id)}
                    style={{ padding: '5px 6px', border: '1px solid var(--color-rule-soft)', background: 'transparent', borderRadius: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 className="w-3 h-3" style={{ color: 'var(--color-ink-3)' }} />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  )
}

// ─── Tarjeta lista horizontal ─────────────────────────────────────────────────

function PrendaCardLista({
  prenda, onUso, onLavado, onEliminar,
}: { prenda: Prenda; onUso: (p: Prenda) => void; onLavado: (p: Prenda) => void; onEliminar: (id: string) => void }) {
  const lavar    = necesitaLavado(prenda)
  const estado   = estadoPrenda(prenda)
  const colorHex = COLORES.find(c => c.value === prenda.color)?.hex
  const catLabel = CATEGORIAS.find(c => c.value === prenda.categoria)?.label ?? prenda.categoria

  return (
    <div style={{ borderBottom: '1px solid var(--color-rule-soft)', padding: '14px 0' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{
          width: 56, height: 56, flexShrink: 0,
          border: lavar ? '1.5px solid var(--color-warm)' : '1.5px solid var(--color-ink)',
          borderRadius: 3, overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#FFFFFF',
        }}>
          {prenda.foto_url
            ? <img src={prenda.foto_url} alt={prenda.nombre} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 3 }} />
            : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Shirt className="w-5 h-5" style={{ color: lavar ? 'var(--color-warm)' : 'var(--color-ink-3)' }} />
                {colorHex && <div style={{ width: 8, height: 8, borderRadius: '50%', background: colorHex }} />}
              </div>
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <div>
              <p style={{ fontFamily: 'var(--font-plex-sans)', fontWeight: 600, fontSize: 14, color: 'var(--color-ink)', margin: 0, lineHeight: 1.2 }}>{prenda.nombre}</p>
              <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, color: 'var(--color-ink-3)', margin: '3px 0 0', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {catLabel}{prenda.color ? ` · ${prenda.color}` : ''}
              </p>
            </div>
            <button onClick={() => onEliminar(prenda.id)} style={{ background: 'transparent', border: 0, cursor: 'pointer', padding: 2, flexShrink: 0 }}>
              <Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--color-ink-3)' }} />
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <div style={{ flex: 1, height: 3, background: 'var(--color-rule-soft)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, (prenda.usos_desde_lavado / prenda.max_usos) * 100)}%`, background: lavar ? 'var(--color-warm)' : 'var(--color-primary)', borderRadius: 2 }} />
            </div>
            <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, color: lavar ? 'var(--color-warm)' : 'var(--color-ink-3)', flexShrink: 0, letterSpacing: '0.04em' }}>{prenda.usos_desde_lavado}/{prenda.max_usos}</span>
            <span style={{ fontSize: 9, fontFamily: 'var(--font-plex-mono)', color: estado.color, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{estado.label}</span>
          </div>
          {(prenda.ultimo_uso || prenda.ultimo_lavado) && (
            <p style={{ fontSize: 9, fontFamily: 'var(--font-plex-mono)', color: 'var(--color-ink-3)', margin: '4px 0 0', letterSpacing: '0.03em' }}>
              {prenda.ultimo_uso && `Usado: ${formatFecha(prenda.ultimo_uso)}`}
              {prenda.ultimo_uso && prenda.ultimo_lavado && ' · '}
              {prenda.ultimo_lavado && `Lavado: ${formatFecha(prenda.ultimo_lavado)}`}
            </p>
          )}
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => onUso(prenda)}
              style={{ padding: '5px 10px', border: '1px solid var(--color-ink)', background: 'transparent', borderRadius: 2, fontFamily: 'var(--font-plex-mono)', fontSize: 9, letterSpacing: '0.06em', cursor: 'pointer', color: 'var(--color-ink)', textTransform: 'uppercase' }}>
              Usé hoy
            </motion.button>
            {(lavar || prenda.estado === 'sucio') && (
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => onLavado(prenda)}
                style={{ padding: '5px 10px', border: '1px solid var(--color-warm)', background: 'rgba(168,100,42,0.08)', borderRadius: 2, fontFamily: 'var(--font-plex-mono)', fontSize: 9, letterSpacing: '0.06em', cursor: 'pointer', color: 'var(--color-warm)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
                <RotateCcw className="w-2.5 h-2.5" />Lavé
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Tarjeta de outfit ────────────────────────────────────────────────────────

function OutfitCard({
  outfit, prendas, onUsar, onEliminar,
}: { outfit: Outfit; prendas: Prenda[]; onUsar: (o: Outfit) => void; onEliminar: (id: string) => void }) {
  const prendasDelOutfit = outfit.prenda_ids
    .map(id => prendas.find(p => p.id === id))
    .filter(Boolean) as Prenda[]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      style={{
        border: '1.5px solid var(--color-ink)', borderRadius: 4,
        background: 'var(--color-paper)',
        boxShadow: '3px 4px 0 rgba(45,36,24,0.10)',
        overflow: 'hidden', marginBottom: 12,
      }}
    >
      {/* Strip de fotos */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-rule-soft)' }}>
        {prendasDelOutfit.slice(0, 4).map((p, i) => (
          <div key={p.id} style={{
            flex: 1, aspectRatio: '1',
            background: '#FFFFFF',
            borderLeft: i > 0 ? '1px solid var(--color-rule-soft)' : 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}>
            {p.foto_url
              ? <img src={p.foto_url} alt={p.nombre} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
              : <Shirt className="w-5 h-5" style={{ color: 'var(--color-ink-3)' }} />
            }
          </div>
        ))}
        {prendasDelOutfit.length === 0 && (
          <div style={{ flex: 1, aspectRatio: '4/1', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F2EC' }}>
            <Layers className="w-6 h-6" style={{ color: 'var(--color-ink-3)' }} />
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ fontFamily: 'var(--font-plex-serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--color-ink)', margin: 0, lineHeight: 1.2 }}>
              {outfit.nombre}
            </p>
            <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, color: 'var(--color-ink-3)', margin: '3px 0 0', letterSpacing: '0.04em' }}>
              {formatFecha(outfit.fecha)} · {prendasDelOutfit.length} prendas
            </p>
          </div>
          <button onClick={() => onEliminar(outfit.id)} style={{ background: 'transparent', border: 0, cursor: 'pointer', padding: 2 }}>
            <Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--color-ink-3)' }} />
          </button>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => onUsar(outfit)}
          style={{
            marginTop: 10, width: '100%', padding: '8px 0',
            border: '1.5px solid var(--color-ink)', background: 'transparent',
            fontFamily: 'var(--font-plex-mono)', fontSize: 10,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            color: 'var(--color-ink)', borderRadius: 2, cursor: 'pointer',
          }}
        >
          Me lo puse hoy
        </motion.button>
      </div>
    </motion.div>
  )
}

// ─── Cabecera de grupo ────────────────────────────────────────────────────────

function GrupoHeader({ dot, label, count }: { dot?: string; label: string; count: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '18px 0 10px', borderBottom: '1.5px solid var(--color-ink)', marginBottom: 4 }}>
      {dot && <div style={{ width: 12, height: 12, borderRadius: '50%', background: dot, border: '1.5px solid var(--color-ink)', flexShrink: 0 }} />}
      <span style={{ fontFamily: 'var(--font-plex-serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--color-ink)', flex: 1 }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, color: 'var(--color-ink-3)', letterSpacing: '0.06em' }}>{count}</span>
    </div>
  )
}

// ─── Grid/Lista de prendas ────────────────────────────────────────────────────

function PrendasGrid({ items, layout, onUso, onLavado, onEliminar, seleccionable, seleccionados, onToggle }: {
  items: Prenda[]
  layout: Layout
  onUso: (p: Prenda) => void
  onLavado: (p: Prenda) => void
  onEliminar: (id: string) => void
  seleccionable?: boolean
  seleccionados?: string[]
  onToggle?: (id: string) => void
}) {
  if (layout === 'grilla') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, paddingTop: 4 }}>
        <AnimatePresence>
          {items.map(p => (
            <PrendaCardGrilla
              key={p.id} prenda={p}
              onUso={onUso} onLavado={onLavado} onEliminar={onEliminar}
              seleccionable={seleccionable}
              seleccionado={seleccionados?.includes(p.id)}
              onToggle={onToggle}
            />
          ))}
        </AnimatePresence>
      </div>
    )
  }
  return (
    <div>
      {items.map((p, i) => (
        <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
          <PrendaCardLista prenda={p} onUso={onUso} onLavado={onLavado} onEliminar={onEliminar} />
        </motion.div>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ArmarioPage() {
  const [prendas, setPrendas]     = useState<Prenda[]>([])
  const [outfits, setOutfits]     = useState<Outfit[]>([])
  const [userId, setUserId]       = useState<string | null>(null)
  const [casaId, setCasaId]       = useState<string | null>(null)
  const [iniciado, setIniciado]   = useState(false)
  const [filtro, setFiltro]       = useState<Filtro>('todas')
  const [vista, setVista]         = useState<Vista>('lista')
  const [layout, setLayout]       = useState<Layout>('grilla')
  const [showForm, setShowForm]   = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [confirmOutfitId, setConfirmOutfitId] = useState<string | null>(null)
  const [loading, setLoading]     = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Form prenda
  const [nombre, setNombre]       = useState('')
  const [categoria, setCategoria] = useState('remera')
  const [color, setColor]         = useState('')
  const [maxUsos, setMaxUsos]     = useState(2)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [fotoFile, setFotoFile]   = useState<File | null>(null)

  // Modo outfit
  const [creandoOutfit, setCreandoOutfit]           = useState(false)
  const [prendasSeleccionadas, setPrendasSeleccionadas] = useState<string[]>([])
  const [nombreOutfit, setNombreOutfit]             = useState('')
  const [guardandoOutfit, setGuardandoOutfit]       = useState(false)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: usuario } = await supabase.from('usuarios').select('casa_id').eq('id', user.id).single()
      if (!usuario?.casa_id) return
      setUserId(user.id)
      setCasaId(usuario.casa_id)
      await Promise.all([cargar(user.id), cargarOutfits(user.id)])
      setIniciado(true)
    }
    init()
  }, [])

  async function cargar(uid: string) {
    const { data } = await supabase.from('prendas').select('*').eq('usuario_id', uid).order('creado_at', { ascending: false })
    if (data) setPrendas(data as Prenda[])
  }

  async function cargarOutfits(uid: string) {
    const { data } = await supabase.from('outfits').select('*').eq('usuario_id', uid).order('creado_at', { ascending: false })
    if (data) setOutfits(data as Outfit[])
  }

  function onCategoriaChange(val: string) {
    setCategoria(val)
    const cat = CATEGORIAS.find(c => c.value === val)
    if (cat) setMaxUsos(cat.maxUsos)
  }

  function onFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoFile(file)
    setFotoPreview(URL.createObjectURL(file))
  }

  async function fondoBlanco(file: File): Promise<File> {
    return new Promise(resolve => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')!
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
        canvas.toBlob(
          blob => resolve(blob ? new File([blob], 'prenda.jpg', { type: 'image/jpeg' }) : file),
          'image/jpeg', 0.92
        )
      }
      img.src = URL.createObjectURL(file)
    })
  }

  async function subirFoto(file: File): Promise<string | null> {
    const procesada = await fondoBlanco(file)
    const path = `${userId}/${Date.now()}.jpg`
    const { error } = await supabase.storage.from('prendas').upload(path, procesada, { upsert: true, contentType: 'image/jpeg' })
    if (error) {
      toast.error(`Error al subir foto: ${error.message}`)
      return null
    }
    const { data } = supabase.storage.from('prendas').getPublicUrl(path)
    return data.publicUrl
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    if (!userId || !casaId) return
    setLoading(true)
    let foto_url: string | null = null
    if (fotoFile) { setUploading(true); foto_url = await subirFoto(fotoFile); setUploading(false) }
    const { error } = await supabase.from('prendas').insert({
      usuario_id: userId, casa_id: casaId,
      nombre: nombre.trim(), categoria,
      color: color || null, foto_url,
      max_usos: maxUsos, estado: 'limpio', usos_desde_lavado: 0,
    })
    if (error) { toast.error(`Error al guardar: ${error.message}`) }
    else { toast.success('Prenda agregada'); resetForm(); await cargar(userId) }
    setLoading(false)
  }

  async function marcarUso(prenda: Prenda) {
    const nuevosUsos  = prenda.usos_desde_lavado + 1
    const nuevoEstado = nuevosUsos >= prenda.max_usos ? 'sucio' : prenda.estado
    const { error } = await supabase.from('prendas').update({ usos_desde_lavado: nuevosUsos, estado: nuevoEstado, ultimo_uso: hoyISO() }).eq('id', prenda.id)
    if (!error) {
      setPrendas(prev => prev.map(p => p.id === prenda.id ? { ...p, usos_desde_lavado: nuevosUsos, estado: nuevoEstado, ultimo_uso: hoyISO() } : p))
      if (nuevosUsos >= prenda.max_usos) toast(`${prenda.nombre} necesita lavado`)
      else toast.success(`Uso registrado (${nuevosUsos}/${prenda.max_usos})`)
    }
  }

  async function marcarLavado(prenda: Prenda) {
    const { error } = await supabase.from('prendas').update({ usos_desde_lavado: 0, estado: 'limpio', ultimo_lavado: hoyISO() }).eq('id', prenda.id)
    if (!error) {
      setPrendas(prev => prev.map(p => p.id === prenda.id ? { ...p, usos_desde_lavado: 0, estado: 'limpio', ultimo_lavado: hoyISO() } : p))
      toast.success(`${prenda.nombre} marcado como lavado`)
    }
  }

  async function eliminar(id: string) {
    await supabase.from('prendas').delete().eq('id', id)
    setPrendas(prev => prev.filter(p => p.id !== id))
    setConfirmId(null)
    toast.success('Prenda eliminada')
  }

  function toggleSeleccion(id: string) {
    setPrendasSeleccionadas(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  async function guardarOutfit() {
    if (!userId || !casaId || prendasSeleccionadas.length === 0 || !nombreOutfit.trim()) return
    setGuardandoOutfit(true)
    const { error } = await supabase.from('outfits').insert({
      usuario_id: userId,
      casa_id: casaId,
      nombre: nombreOutfit.trim(),
      prenda_ids: prendasSeleccionadas,
      fecha: hoyISO(),
    })
    if (error) { toast.error(`Error: ${error.message}`) }
    else {
      toast.success('Outfit guardado')
      setCreandoOutfit(false)
      setPrendasSeleccionadas([])
      setNombreOutfit('')
      await cargarOutfits(userId)
    }
    setGuardandoOutfit(false)
  }

  async function usarOutfit(outfit: Outfit) {
    const hoy = hoyISO()
    await Promise.all(
      outfit.prenda_ids.map(async id => {
        const prenda = prendas.find(p => p.id === id)
        if (!prenda) return
        const nuevosUsos  = prenda.usos_desde_lavado + 1
        const nuevoEstado = nuevosUsos >= prenda.max_usos ? 'sucio' : prenda.estado
        await supabase.from('prendas').update({ usos_desde_lavado: nuevosUsos, estado: nuevoEstado, ultimo_uso: hoy }).eq('id', id)
        setPrendas(prev => prev.map(p => p.id === id ? { ...p, usos_desde_lavado: nuevosUsos, estado: nuevoEstado, ultimo_uso: hoy } : p))
      })
    )
    toast.success(`Outfit "${outfit.nombre}" registrado — usos actualizados`)
  }

  async function eliminarOutfit(id: string) {
    await supabase.from('outfits').delete().eq('id', id)
    setOutfits(prev => prev.filter(o => o.id !== id))
    setConfirmOutfitId(null)
    toast.success('Outfit eliminado')
  }

  function resetForm() {
    setShowForm(false); setFotoPreview(null); setFotoFile(null)
    setNombre(''); setCategoria('remera'); setColor(''); setMaxUsos(2)
  }

  const countLavar = prendas.filter(necesitaLavado).length

  const prendasFiltradas = prendas.filter(p => {
    if (filtro === 'limpias') return p.estado === 'limpio' && !necesitaLavado(p)
    if (filtro === 'sucias')  return p.estado === 'sucio'
    if (filtro === 'lavar')   return necesitaLavado(p)
    return true
  })

  const byColor: { key: string; hex: string; label: string; items: Prenda[] }[] = []
  COLORES.forEach(c => {
    const items = prendas.filter(p => p.color === c.value)
    if (items.length) byColor.push({ key: c.value, hex: c.hex, label: c.label, items })
  })
  const sinColor = prendas.filter(p => !p.color)
  if (sinColor.length) byColor.push({ key: 'sin-color', hex: 'var(--color-rule-soft)', label: 'Sin color', items: sinColor })

  const byCategoria: { key: string; label: string; items: Prenda[] }[] = []
  CATEGORIAS.forEach(c => {
    const items = prendas.filter(p => p.categoria === c.value)
    if (items.length) byCategoria.push({ key: c.value, label: c.label, items })
  })

  const inputStyle: React.CSSProperties = {
    background: 'transparent', border: 0,
    borderBottom: '1.5px solid var(--color-ink)', borderRadius: 0,
    color: 'var(--color-ink)', fontFamily: 'var(--font-plex-sans)',
    outline: 'none', width: '100%', padding: '8px 0', fontSize: 14,
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 10, color: 'var(--color-ink-3)', fontFamily: 'var(--font-plex-mono)',
    display: 'block', marginBottom: 4, letterSpacing: '0.06em',
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <ConfirmDialog
        open={!!confirmId}
        title="Eliminar prenda"
        message="Esta prenda se borrará del inventario permanentemente."
        onConfirm={() => confirmId && eliminar(confirmId)}
        onCancel={() => setConfirmId(null)}
      />
      <ConfirmDialog
        open={!!confirmOutfitId}
        title="Eliminar outfit"
        message="Este outfit se eliminará. Las prendas no se ven afectadas."
        onConfirm={() => confirmOutfitId && eliminarOutfit(confirmOutfitId)}
        onCancel={() => setConfirmOutfitId(null)}
      />

      <PageHeader
        sectionNum="09"
        sectionLabel="Armario"
        right={`${prendas.length} PRENDAS`}
        title="Tu armario."
        sub="inventario personal de ropa"
      />

      <div className="page-content" style={{ paddingTop: 16, paddingBottom: creandoOutfit ? 120 : 40 }}>

        {/* Alerta lavar */}
        {countLavar > 0 && !creandoOutfit && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{ borderLeft: '3px solid var(--color-warm)', paddingLeft: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-warm)' }} />
            <p style={{ fontSize: 13, color: 'var(--color-warm)', fontFamily: 'var(--font-plex-sans)' }}>
              {countLavar} {countLavar === 1 ? 'prenda necesita' : 'prendas necesitan'} lavado
            </p>
          </motion.div>
        )}

        {/* ── Modo creación de outfit ── */}
        {creandoOutfit ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <button onClick={() => { setCreandoOutfit(false); setPrendasSeleccionadas([]) }}
                style={{ background: 'transparent', border: 0, cursor: 'pointer', padding: 0 }}>
                <X className="w-5 h-5" style={{ color: 'var(--color-ink-2)' }} />
              </button>
              <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'var(--color-ink-2)', letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0 }}>
                Seleccioná las prendas del outfit
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {prendas.map(p => (
                <PrendaCardGrilla
                  key={p.id} prenda={p}
                  onUso={() => {}} onLavado={() => {}} onEliminar={() => {}}
                  seleccionable seleccionado={prendasSeleccionadas.includes(p.id)}
                  onToggle={toggleSeleccion}
                />
              ))}
            </div>

            {/* Bottom sheet fijo */}
            <motion.div
              initial={{ y: 80 }} animate={{ y: 0 }}
              style={{
                position: 'fixed', bottom: 0, left: 0, right: 0,
                background: 'var(--color-bg)',
                borderTop: '1.5px solid var(--color-ink)',
                padding: '12px 18px 24px',
                zIndex: 50,
              }}
            >
              <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: 'var(--color-ink-3)', marginBottom: 8, letterSpacing: '0.06em' }}>
                {prendasSeleccionadas.length} prenda{prendasSeleccionadas.length !== 1 ? 's' : ''} seleccionada{prendasSeleccionadas.length !== 1 ? 's' : ''}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Nombre del outfit…"
                  value={nombreOutfit}
                  onChange={e => setNombreOutfit(e.target.value)}
                  style={{
                    flex: 1, padding: '10px 12px',
                    border: '1.5px solid var(--color-ink)',
                    background: 'var(--color-paper)',
                    fontFamily: 'var(--font-plex-sans)', fontSize: 14,
                    color: 'var(--color-ink)', borderRadius: 4, outline: 'none',
                  }}
                />
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={guardarOutfit}
                  disabled={prendasSeleccionadas.length === 0 || !nombreOutfit.trim() || guardandoOutfit}
                  style={{
                    padding: '10px 18px',
                    background: prendasSeleccionadas.length > 0 && nombreOutfit.trim() ? 'var(--color-primary)' : 'var(--color-ink-3)',
                    color: '#fff', border: 0, borderRadius: 4,
                    fontFamily: 'var(--font-plex-mono)', fontSize: 11,
                    letterSpacing: '0.06em', cursor: 'pointer',
                    opacity: guardandoOutfit ? 0.6 : 1,
                  }}
                >
                  {guardandoOutfit ? 'GUARDANDO…' : 'GUARDAR'}
                </motion.button>
              </div>
            </motion.div>
          </>
        ) : (
          <>
            {/* Controles normales */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
              <div style={{ display: 'flex', border: '1.5px solid var(--color-ink)', borderRadius: 2, overflow: 'hidden', flex: 1 }}>
                {(['lista', 'color', 'categoria', 'outfits'] as Vista[]).map((v, i) => (
                  <button key={v} onClick={() => setVista(v)}
                    style={{
                      flex: 1, padding: '7px 2px',
                      fontFamily: 'var(--font-plex-mono)', fontSize: 8.5,
                      letterSpacing: '0.05em', textTransform: 'uppercase',
                      background: vista === v ? 'var(--color-ink)' : 'transparent',
                      color: vista === v ? 'var(--color-bg)' : 'var(--color-ink-3)',
                      border: 0, borderLeft: i > 0 ? '1px solid var(--color-ink)' : 0,
                      cursor: 'pointer', transition: 'background 0.12s, color 0.12s',
                    }}>
                    {v === 'lista' ? 'Lista' : v === 'color' ? 'Color' : v === 'categoria' ? 'Cat.' : 'Outfits'}
                  </button>
                ))}
              </div>
              {vista !== 'outfits' && (
                <div style={{ display: 'flex', border: '1.5px solid var(--color-ink)', borderRadius: 2, overflow: 'hidden' }}>
                  <button onClick={() => setLayout('grilla')}
                    style={{ padding: '7px 9px', background: layout === 'grilla' ? 'var(--color-ink)' : 'transparent', border: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', color: layout === 'grilla' ? 'var(--color-bg)' : 'var(--color-ink-3)', transition: 'background 0.12s' }}>
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setLayout('lista')}
                    style={{ padding: '7px 9px', background: layout === 'lista' ? 'var(--color-ink)' : 'transparent', border: 0, borderLeft: '1px solid var(--color-ink)', cursor: 'pointer', display: 'flex', alignItems: 'center', color: layout === 'lista' ? 'var(--color-bg)' : 'var(--color-ink-3)', transition: 'background 0.12s' }}>
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Filtros (solo lista) */}
            {vista === 'lista' && (
              <div style={{ display: 'flex', borderBottom: '1.5px solid var(--color-ink)', marginBottom: 16 }}>
                {([
                  { key: 'todas', label: 'Todas' },
                  { key: 'lavar', label: `Lavar (${countLavar})` },
                  { key: 'limpias', label: 'Limpias' },
                  { key: 'sucias', label: 'Sucias' },
                ] as { key: Filtro; label: string }[]).map(f => (
                  <button key={f.key} onClick={() => setFiltro(f.key)}
                    style={{
                      flex: 1, padding: '8px 4px',
                      fontFamily: 'var(--font-plex-mono)', fontSize: 9,
                      letterSpacing: '0.08em', textTransform: 'uppercase',
                      background: 'transparent', border: 0, cursor: 'pointer',
                      color: filtro === f.key ? 'var(--color-ink)' : 'var(--color-ink-3)',
                      borderBottom: filtro === f.key ? '2px solid var(--color-ink)' : '2px solid transparent',
                      marginBottom: -1.5,
                    }}>
                    {f.label}
                  </button>
                ))}
              </div>
            )}

            {/* Botón agregar / nuevo outfit */}
            {!showForm && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {vista !== 'outfits' && (
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowForm(true)}
                    className="flex items-center justify-center gap-2 py-3 font-semibold text-sm cursor-pointer"
                    style={{ flex: 1, background: 'var(--color-ink)', color: 'var(--color-bg)', borderRadius: 12 }}>
                    <Plus className="w-4 h-4" />
                    Agregar prenda
                  </motion.button>
                )}
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={() => { setCreandoOutfit(true); setVista('lista') }}
                  className="flex items-center justify-center gap-2 py-3 font-semibold text-sm cursor-pointer"
                  style={{
                    flex: vista === 'outfits' ? undefined : undefined,
                    width: vista === 'outfits' ? '100%' : 'auto',
                    paddingLeft: 16, paddingRight: 16,
                    border: '1.5px solid var(--color-ink)',
                    background: 'transparent', color: 'var(--color-ink)', borderRadius: 12,
                  }}>
                  <Layers className="w-4 h-4" />
                  {vista === 'outfits' ? 'Nuevo outfit' : ''}
                </motion.button>
              </div>
            )}

            {/* Formulario nueva prenda */}
            <AnimatePresence>
              {showForm && (
                <motion.form
                  initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                  onSubmit={guardar} className="p-5 mb-6"
                  style={{ border: '1.5px solid var(--color-ink)', borderRadius: 2, background: 'var(--color-paper)' }}>
                  <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, letterSpacing: '0.08em', color: 'var(--color-ink-3)', marginBottom: 16, textTransform: 'uppercase' }}>
                    Nueva prenda
                  </p>
                  <div className="flex flex-col gap-4">
                    <div>
                      <label style={labelStyle}>FOTO (opcional)</label>
                      <p style={{ fontSize: 10, color: 'var(--color-ink-3)', fontFamily: 'var(--font-plex-mono)', marginBottom: 8, letterSpacing: '0.03em' }}>
                        Fotografiá sobre fondo blanco o claro.
                      </p>
                      <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onFoto} style={{ display: 'none' }} />
                      {fotoPreview ? (
                        <div style={{ position: 'relative', width: 120, height: 150 }}>
                          <div style={{ width: 120, height: 150, border: '1.5px solid var(--color-ink)', borderRadius: 2, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            <img src={fotoPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          </div>
                          <button type="button" onClick={() => { setFotoPreview(null); setFotoFile(null) }}
                            style={{ position: 'absolute', top: -6, right: -6, background: 'var(--color-ink)', border: 0, borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <X className="w-3 h-3" style={{ color: 'var(--color-bg)' }} />
                          </button>
                          <button type="button" onClick={() => fileRef.current?.click()}
                            style={{ position: 'absolute', bottom: -6, right: -6, background: 'var(--color-primary)', border: 0, borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <Camera className="w-2.5 h-2.5" style={{ color: 'var(--color-bg)' }} />
                          </button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => fileRef.current?.click()}
                          style={{ width: 120, height: 150, borderRadius: 2, border: '1.5px dashed var(--color-ink-3)', background: '#FFF', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, position: 'relative' }}>
                          <div style={{ position: 'absolute', inset: 12, border: '1px dashed rgba(45,36,24,0.15)', borderRadius: 1, pointerEvents: 'none' }} />
                          <Camera className="w-6 h-6" style={{ color: 'var(--color-ink-3)' }} />
                          <span style={{ fontSize: 9, fontFamily: 'var(--font-plex-mono)', color: 'var(--color-ink-3)', letterSpacing: '0.04em', textAlign: 'center', lineHeight: 1.5, padding: '0 8px' }}>SUBIR FOTO</span>
                        </button>
                      )}
                    </div>
                    <div>
                      <label style={labelStyle}>NOMBRE</label>
                      <input type="text" placeholder="Ej: Pantalón negro de vestir" value={nombre} onChange={e => setNombre(e.target.value)} required style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>CATEGORÍA</label>
                      <select value={categoria} onChange={e => onCategoriaChange(e.target.value)} style={{ ...inputStyle, paddingBottom: 8 }}>
                        {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>COLOR</label>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 4 }}>
                        {COLORES.map(c => (
                          <button key={c.value} type="button" onClick={() => setColor(color === c.value ? '' : c.value)} title={c.label}
                            style={{ width: 24, height: 24, borderRadius: '50%', background: c.hex, border: 'none', cursor: 'pointer', outline: color === c.value ? '2px solid var(--color-ink)' : '2px solid transparent', outlineOffset: 2 }} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>USOS ANTES DE LAVAR</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 6 }}>
                        <button type="button" onClick={() => setMaxUsos(v => Math.max(1, v - 1))}
                          style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid var(--color-ink)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'var(--color-ink)' }}>−</button>
                        <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 18, color: 'var(--color-ink)', minWidth: 20, textAlign: 'center' }}>{maxUsos}</span>
                        <button type="button" onClick={() => setMaxUsos(v => Math.min(15, v + 1))}
                          style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid var(--color-ink)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'var(--color-ink)' }}>+</button>
                        <span style={{ fontSize: 11, color: 'var(--color-ink-3)', fontFamily: 'var(--font-plex-mono)' }}>usos</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <button type="button" onClick={resetForm}
                        style={{ flex: 1, padding: '10px 0', border: '1.5px solid var(--color-ink)', background: 'transparent', color: 'var(--color-ink-2)', fontFamily: 'var(--font-plex-mono)', fontSize: 11, borderRadius: 4, cursor: 'pointer', letterSpacing: '0.06em' }}>
                        CANCELAR
                      </button>
                      <button type="submit" disabled={loading}
                        style={{ flex: 1, padding: '10px 0', background: 'var(--color-primary)', color: 'var(--color-bg)', border: 0, fontFamily: 'var(--font-plex-mono)', fontSize: 11, borderRadius: 4, cursor: loading ? 'default' : 'pointer', letterSpacing: '0.06em', opacity: loading ? 0.6 : 1 }}>
                        {uploading ? 'SUBIENDO…' : loading ? 'GUARDANDO…' : 'GUARDAR'}
                      </button>
                    </div>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {!iniciado && <SkeletonList count={4} />}

            {/* Empty state prendas */}
            {iniciado && prendas.length === 0 && vista !== 'outfits' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mt-16">
                <Shirt className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--color-rule-soft)' }} />
                <p style={{ color: 'var(--color-ink-2)', fontSize: 14 }}>Todavía no agregaste ropa</p>
              </motion.div>
            )}

            {/* Vista: Lista */}
            {vista === 'lista' && iniciado && (
              <>
                {prendasFiltradas.length === 0 && prendas.length > 0 && (
                  <p style={{ textAlign: 'center', color: 'var(--color-ink-3)', fontSize: 13, marginTop: 32 }}>Sin prendas en esta categoría</p>
                )}
                <PrendasGrid items={prendasFiltradas} layout={layout} onUso={marcarUso} onLavado={marcarLavado} onEliminar={id => setConfirmId(id)} />
              </>
            )}

            {/* Vista: Color */}
            {vista === 'color' && iniciado && prendas.length > 0 && byColor.map(g => (
              <div key={g.key}>
                <GrupoHeader dot={g.hex} label={g.label} count={g.items.length} />
                <PrendasGrid items={g.items} layout={layout} onUso={marcarUso} onLavado={marcarLavado} onEliminar={id => setConfirmId(id)} />
              </div>
            ))}

            {/* Vista: Categoría */}
            {vista === 'categoria' && iniciado && prendas.length > 0 && byCategoria.map(g => (
              <div key={g.key}>
                <GrupoHeader label={g.label} count={g.items.length} />
                <PrendasGrid items={g.items} layout={layout} onUso={marcarUso} onLavado={marcarLavado} onEliminar={id => setConfirmId(id)} />
              </div>
            ))}

            {/* Vista: Outfits */}
            {vista === 'outfits' && iniciado && (
              <>
                {outfits.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mt-16">
                    <Layers className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--color-rule-soft)' }} />
                    <p style={{ color: 'var(--color-ink-2)', fontSize: 14 }}>Todavía no armaste ningún outfit</p>
                    <p style={{ color: 'var(--color-ink-3)', fontSize: 12, marginTop: 4 }}>Tocá el botón de arriba para empezar</p>
                  </motion.div>
                ) : (
                  outfits.map(o => (
                    <OutfitCard
                      key={o.id} outfit={o} prendas={prendas}
                      onUsar={usarOutfit}
                      onEliminar={id => setConfirmOutfitId(id)}
                    />
                  ))
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
