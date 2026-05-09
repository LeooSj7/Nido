'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Users, Shield, Smartphone } from 'lucide-react'

// ─── SVG Illustrations ───────────────────────────────────────────────────────

function TareasIllustration() {
  return (
    <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="20" y="24" width="120" height="76" rx="10" fill="#1e3a5f" fillOpacity="0.4" />
      <rect x="20" y="24" width="120" height="18" rx="10" fill="#2563eb" fillOpacity="0.25" />
      <rect x="20" y="35" width="120" height="7" fill="#2563eb" fillOpacity="0.25" />
      <rect x="34" y="54" width="70" height="7" rx="3.5" fill="#3b82f6" fillOpacity="0.2" />
      <rect x="34" y="54" width="40" height="7" rx="3.5" fill="#3b82f6" fillOpacity="0.7" />
      <rect x="34" y="68" width="70" height="7" rx="3.5" fill="#3b82f6" fillOpacity="0.2" />
      <rect x="34" y="68" width="58" height="7" rx="3.5" fill="#3b82f6" fillOpacity="0.7" />
      <rect x="34" y="82" width="70" height="7" rx="3.5" fill="#3b82f6" fillOpacity="0.2" />
      <rect x="34" y="82" width="25" height="7" rx="3.5" fill="#3b82f6" fillOpacity="0.7" />
      <circle cx="118" cy="34" r="18" fill="#1e40af" />
      <circle cx="118" cy="34" r="14" fill="#2563eb" />
      <path d="M111 34L116 39L126 28" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DineroIllustration() {
  return (
    <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="20" y="16" width="120" height="88" rx="10" fill="#451a03" fillOpacity="0.3" />
      <rect x="32" y="62" width="16" height="34" rx="4" fill="#f59e0b" fillOpacity="0.3" />
      <rect x="54" y="50" width="16" height="46" rx="4" fill="#f59e0b" fillOpacity="0.5" />
      <rect x="76" y="36" width="16" height="60" rx="4" fill="#f59e0b" fillOpacity="0.7" />
      <rect x="98" y="22" width="16" height="74" rx="4" fill="#f59e0b" />
      <path d="M40 64L62 52L84 38L106 24" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 3" />
      <circle cx="106" cy="24" r="6" fill="#f59e0b" />
      <circle cx="40" cy="64" r="4" fill="#f59e0b" fillOpacity="0.6" />
      <line x1="28" y1="96" x2="132" y2="96" stroke="#f59e0b" strokeOpacity="0.2" strokeWidth="1" />
    </svg>
  )
}

function ComprasIllustration() {
  return (
    <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="20" y="16" width="120" height="88" rx="10" fill="#052e16" fillOpacity="0.4" />
      <path d="M48 44H112L105 92H55L48 44Z" fill="#10b981" fillOpacity="0.12" stroke="#10b981" strokeOpacity="0.35" strokeWidth="1.5" />
      <path d="M62 44V36C62 26 98 26 98 36V44" stroke="#10b981" strokeOpacity="0.6" strokeWidth="2" strokeLinecap="round" />
      <line x1="62" y1="62" x2="98" y2="62" stroke="#10b981" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="64" y1="72" x2="94" y2="72" stroke="#10b981" strokeOpacity="0.4" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="66" y1="82" x2="88" y2="82" stroke="#10b981" strokeOpacity="0.3" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="112" cy="92" r="16" fill="#064e3b" />
      <circle cx="112" cy="92" r="12" fill="#059669" />
      <path d="M106 92L110 96L119 86" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function AgendaIllustration() {
  return (
    <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="20" y="22" width="108" height="84" rx="10" fill="#2e1065" fillOpacity="0.4" stroke="#a855f7" strokeOpacity="0.2" strokeWidth="1" />
      <rect x="20" y="22" width="108" height="22" rx="10" fill="#7c3aed" fillOpacity="0.25" />
      <rect x="20" y="35" width="108" height="9" fill="#7c3aed" fillOpacity="0.25" />
      <rect x="42" y="16" width="7" height="14" rx="3.5" fill="#a855f7" fillOpacity="0.8" />
      <rect x="99" y="16" width="7" height="14" rx="3.5" fill="#a855f7" fillOpacity="0.8" />
      <circle cx="42" cy="62" r="5" fill="#a855f7" fillOpacity="0.4" />
      <circle cx="62" cy="62" r="5" fill="#a855f7" />
      <circle cx="82" cy="62" r="5" fill="#a855f7" fillOpacity="0.4" />
      <circle cx="102" cy="62" r="5" fill="#a855f7" fillOpacity="0.2" />
      <circle cx="42" cy="80" r="5" fill="#a855f7" fillOpacity="0.2" />
      <circle cx="62" cy="80" r="5" fill="#a855f7" fillOpacity="0.4" />
      <circle cx="82" cy="80" r="5" fill="#a855f7" fillOpacity="0.2" />
      <circle cx="128" cy="30" r="14" fill="#581c87" />
      <circle cx="128" cy="30" r="10" fill="#9333ea" />
      <path d="M124 30L127 33L133 26" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Data ────────────────────────────────────────────────────────────────────

const features = [
  {
    Illustration: TareasIllustration,
    accentColor: '#3b82f6',
    borderColor: 'rgba(59,130,246,0.18)',
    glowColor: 'rgba(59,130,246,0.06)',
    title: 'Tareas',
    tag: 'Del hogar',
    desc: 'Organizá y distribuí las tareas. Con prioridades, fechas límite y seguimiento por persona.',
  },
  {
    Illustration: DineroIllustration,
    accentColor: '#f59e0b',
    borderColor: 'rgba(245,158,11,0.18)',
    glowColor: 'rgba(245,158,11,0.06)',
    title: 'Dinero',
    tag: 'Finanzas',
    desc: 'Controlá los gastos del mes, fijá un presupuesto y mantené las finanzas bajo control.',
  },
  {
    Illustration: ComprasIllustration,
    accentColor: '#10b981',
    borderColor: 'rgba(16,185,129,0.18)',
    glowColor: 'rgba(16,185,129,0.06)',
    title: 'Compras',
    tag: 'Lista compartida',
    desc: 'Una lista siempre actualizada. Marcá lo que ya compraste directo desde el supermercado.',
  },
  {
    Illustration: AgendaIllustration,
    accentColor: '#a855f7',
    borderColor: 'rgba(168,85,247,0.18)',
    glowColor: 'rgba(168,85,247,0.06)',
    title: 'Agenda',
    tag: 'Recordatorios',
    desc: 'Nunca más olvides pagar una factura o una fecha importante. Todo a tiempo.',
  },
]

const steps = [
  { n: '01', title: 'Creá tu cuenta', desc: 'Rápido y gratis. Solo tu nombre, email y contraseña.' },
  { n: '02', title: 'Invitá a tu familia', desc: 'Generá un código único y compartíselo. Cada uno se une con su cuenta.' },
  { n: '03', title: 'Empezá a organizarse', desc: 'Tareas, gastos, compras y recordatorios disponibles al instante.' },
]

// ─── Component ───────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen text-white" style={{ background: '#09090b' }}>

      {/* Nav */}
      <nav
        className="fixed top-0 w-full z-50 border-b"
        style={{
          background: 'rgba(9,9,11,0.85)',
          backdropFilter: 'blur(16px)',
          borderColor: 'rgba(255,255,255,0.06)',
        }}
      >
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
                <path d="M10 3L17 9V17H13V13H7V17H3V9L10 3Z" fill="white" />
              </svg>
            </div>
            <span className="font-bold text-white tracking-tight text-base">Nido</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium transition-colors"
              style={{ color: 'rgba(255,255,255,0.5)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'white')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold text-white px-4 py-1.5 rounded-lg transition-all"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              Empezar gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-36 pb-24 px-4 text-center overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 70%)',
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6 border"
            style={{
              background: 'rgba(99,102,241,0.1)',
              borderColor: 'rgba(99,102,241,0.25)',
              color: '#a5b4fc',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Para familias que quieren organizarse
          </motion.div>

          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] mb-5">
            <span
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.7) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              El hogar de tu familia,
            </span>
            <br />
            <span
              style={{
                background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 50%, #c084fc 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              organizado.
            </span>
          </h1>

          <p className="text-base sm:text-lg max-w-md mx-auto mb-9 leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Tareas, dinero, compras y agenda. Todo en un solo lugar, para todos los que viven juntos.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 24px rgba(99,102,241,0.3)' }}
            >
              Empezar gratis <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-80"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              Ya tengo cuenta
            </Link>
          </div>
        </motion.div>

        {/* Dashboard preview */}
        <motion.div
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16 mx-auto max-w-xs"
        >
          <div
            className="rounded-2xl p-4 text-left"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.08)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Casa García</div>
                <div className="text-sm font-semibold text-white">Buen día, María</div>
              </div>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
              >
                M
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[
                { l: 'Tareas', v: '4 pendientes', c: '#3b82f6' },
                { l: 'Dinero', v: '$42.500', c: '#f59e0b' },
                { l: 'Compras', v: '7 ítems', c: '#10b981' },
                { l: 'Agenda', v: '2 hoy', c: '#a855f7' },
              ].map(s => (
                <div
                  key={s.l}
                  className="rounded-xl p-3"
                  style={{ background: `${s.c}12`, border: `1px solid ${s.c}25` }}
                >
                  <div className="text-xs mb-0.5" style={{ color: `${s.c}99` }}>{s.l}</div>
                  <div className="text-sm font-semibold" style={{ color: s.c }}>{s.v}</div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {[
                { t: 'Comprar jabón', done: true },
                { t: 'Pagar la luz', done: false },
                { t: 'Barrer la cocina', done: false },
              ].map(item => (
                <div key={item.t} className="flex items-center gap-2">
                  <div
                    className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                    style={{
                      background: item.done ? '#6366f1' : 'transparent',
                      border: `1.5px solid ${item.done ? '#6366f1' : 'rgba(255,255,255,0.15)'}`,
                    }}
                  />
                  <span
                    className="text-xs"
                    style={{
                      color: item.done ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.6)',
                      textDecoration: item.done ? 'line-through' : 'none',
                    }}
                  >
                    {item.t}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-20 px-4" style={{ background: 'rgba(255,255,255,0.015)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#818cf8' }}>
              Funcionalidades
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3" style={{ color: 'white' }}>
              Todo lo que tu hogar necesita
            </h2>
            <p className="text-base" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Cuatro módulos diseñados para la vida real de una familia.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-2xl overflow-hidden group"
                style={{
                  background: `linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))`,
                  border: `1px solid ${f.borderColor}`,
                  boxShadow: `0 0 40px ${f.glowColor}`,
                }}
              >
                {/* Illustration */}
                <div
                  className="h-36 w-full p-4 transition-all duration-500 group-hover:scale-105"
                  style={{ background: `${f.accentColor}08` }}
                >
                  <f.Illustration />
                </div>
                {/* Text */}
                <div className="p-5 pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{ background: `${f.accentColor}18`, color: f.accentColor }}
                    >
                      {f.tag}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-white mb-1.5">{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {f.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#818cf8' }}>
              Cómo funciona
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: 'white' }}>
              Empezá en minutos
            </h2>
          </div>
          <div className="space-y-8">
            {steps.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-start gap-5"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    boxShadow: '0 4px 16px rgba(99,102,241,0.25)',
                    color: 'white',
                  }}
                >
                  {s.n}
                </div>
                <div className="pt-1.5">
                  <div className="font-semibold text-white mb-0.5">{s.title}</div>
                  <div className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="py-16 px-4" style={{ background: 'rgba(255,255,255,0.015)' }}>
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              icon: Users,
              title: 'Para toda la familia',
              desc: 'Cada miembro con su cuenta. Todo sincronizado y visible para todos.',
            },
            {
              icon: Shield,
              title: 'Privado y seguro',
              desc: 'Tu hogar es tuyo. Solo los miembros invitados pueden acceder.',
            },
            {
              icon: Smartphone,
              title: 'Siempre disponible',
              desc: 'Funciona en celular y computadora. Accedé desde donde sea.',
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="text-center p-6"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-4"
                style={{
                  background: 'rgba(99,102,241,0.1)',
                  border: '1px solid rgba(99,102,241,0.2)',
                }}
              >
                <item.icon className="w-5 h-5" style={{ color: '#818cf8' }} />
              </div>
              <h3 className="font-semibold text-sm text-white mb-2">{item.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(99,102,241,0.1) 0%, transparent 70%)',
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4" style={{ color: 'white' }}>
            ¿Listo para organizarse?
          </h2>
          <p className="text-base mb-9" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Es gratis. Tarda menos de un minuto.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: '0 0 32px rgba(99,102,241,0.35)',
            }}
          >
            Crear mi hogar <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              <svg viewBox="0 0 20 20" fill="none" className="w-3.5 h-3.5">
                <path d="M10 3L17 9V17H13V13H7V17H3V9L10 3Z" fill="white" />
              </svg>
            </div>
            <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>Nido</span>
          </div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Organizá tu hogar, simplificá tu vida.
          </p>
        </div>
      </footer>
    </div>
  )
}
