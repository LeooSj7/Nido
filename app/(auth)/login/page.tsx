'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Mail, Lock, Eye, EyeOff, User, ArrowRight } from 'lucide-react'
import Link from 'next/link'

type Tab = 'login' | 'register'

function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <div
      className="rounded-xl flex items-center justify-center flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
      }}
    >
      <svg viewBox="0 0 20 20" fill="none" style={{ width: size * 0.55, height: size * 0.55 }}>
        <path d="M10 3L17 9V17H13V13H7V17H3V9L10 3Z" fill="white" />
      </svg>
    </div>
  )
}

function InputField({
  label,
  type,
  placeholder,
  value,
  onChange,
  required,
  minLength,
  autoFocus,
  icon: Icon,
  rightSlot,
}: {
  label: string
  type: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  minLength?: number
  autoFocus?: boolean
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  rightSlot?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,255,255,0.25)' }} />
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          required={required}
          minLength={minLength}
          autoFocus={autoFocus}
          className="w-full rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-transparent outline-none transition-all"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
          onFocus={e => {
            e.currentTarget.style.border = '1px solid rgba(99,102,241,0.6)'
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'
            e.currentTarget.style.background = 'rgba(99,102,241,0.05)'
          }}
          onBlur={e => {
            e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'
            e.currentTarget.style.boxShadow = 'none'
            e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
          }}
        />
        {/* placeholder visual replacement */}
        <span
          className="absolute left-10 top-1/2 -translate-y-1/2 text-sm pointer-events-none select-none transition-opacity"
          style={{
            color: 'rgba(255,255,255,0.2)',
            opacity: value ? 0 : 1,
          }}
        >
          {placeholder}
        </span>
        {rightSlot && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightSlot}</div>
        )}
      </div>
    </div>
  )
}

export default function AuthPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('login')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  function switchTab(t: Tab) {
    setTab(t)
    setPassword('')
    setShowPassword(false)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error('Email o contraseña incorrectos')
      setLoading(false)
      return
    }
    if (data.user) {
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('casa_id')
        .eq('id', data.user.id)
        .single()
      router.push(usuario?.casa_id ? '/dashboard' : '/setup-casa')
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      toast.error('Error al registrarse. Intentá con otro email.')
      setLoading(false)
      return
    }
    if (data.user) {
      await supabase.from('usuarios').insert({ id: data.user.id, nombre, email })
      toast.success('¡Cuenta creada!')
      router.push('/setup-casa')
    }
    setLoading(false)
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: '#09090b' }}
    >
      {/* Ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 65%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm relative"
      >
        {/* Branding */}
        <div className="flex flex-col items-center mb-8">
          <LogoMark size={48} />
          <div className="mt-4 text-center">
            <span className="text-lg font-bold text-white tracking-tight">Nido</span>
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {tab === 'login'
                    ? 'Bienvenido de vuelta a tu hogar'
                    : 'Organizate con tu familia, gratis'}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.05)',
          }}
        >
          {/* Tabs */}
          <div className="flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {(['login', 'register'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                className="flex-1 py-4 text-sm font-medium transition-colors cursor-pointer relative"
                style={{ color: tab === t ? 'white' : 'rgba(255,255,255,0.3)' }}
              >
                {t === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
                {tab === t && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-px"
                    style={{ background: 'linear-gradient(90deg, transparent, #6366f1, #8b5cf6, transparent)' }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Form */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.form
                key={tab}
                initial={{ opacity: 0, x: tab === 'login' ? -14 : 14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: tab === 'login' ? 14 : -14 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                onSubmit={tab === 'login' ? handleLogin : handleRegister}
                className="flex flex-col gap-4"
              >
                {tab === 'register' && (
                  <InputField
                    label="Tu nombre"
                    type="text"
                    placeholder="Ej: María"
                    value={nombre}
                    onChange={setNombre}
                    required
                    autoFocus
                    icon={User}
                  />
                )}

                <InputField
                  label="Email"
                  type="email"
                  placeholder="tucorreo@email.com"
                  value={email}
                  onChange={setEmail}
                  required
                  autoFocus={tab === 'login'}
                  icon={Mail}
                />

                <InputField
                  label="Contraseña"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={tab === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
                  value={password}
                  onChange={setPassword}
                  required
                  minLength={tab === 'register' ? 6 : undefined}
                  icon={Lock}
                  rightSlot={
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="transition-colors cursor-pointer"
                      style={{ color: 'rgba(255,255,255,0.25)' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />

                {tab === 'register' && (
                  <p className="text-xs -mt-2" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    Usá al menos 6 caracteres
                  </p>
                )}

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-sm text-white mt-1 cursor-pointer transition-opacity disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    boxShadow: '0 4px 20px rgba(99,102,241,0.25)',
                  }}
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
                  ) : (
                    <>
                      {tab === 'login' ? 'Entrar a mi hogar' : 'Crear mi cuenta'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </motion.form>
            </AnimatePresence>
          </div>
        </div>

        <p className="text-center text-xs mt-5" style={{ color: 'rgba(255,255,255,0.2)' }}>
          <Link
            href="/"
            className="transition-colors hover:underline"
            style={{ color: 'rgba(255,255,255,0.2)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}
          >
            ← Volver al inicio
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
