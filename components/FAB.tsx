'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, CheckSquare, ShoppingCart, Wallet, Bell, Utensils } from 'lucide-react'

const acciones = [
  { label: 'Tarea',   icon: CheckSquare,  href: '/dashboard/tareas',        accent: '#3b82f6' },
  { label: 'Compra',  icon: ShoppingCart, href: '/dashboard/compras',        accent: '#10b981' },
  { label: 'Gasto',   icon: Wallet,       href: '/dashboard/gastos',         accent: '#f59e0b' },
  { label: 'Aviso',   icon: Bell,         href: '/dashboard/recordatorios',  accent: '#a855f7' },
  { label: 'Comida',  icon: Utensils,     href: '/dashboard/comidas',        accent: '#f97316' },
]

export default function FAB() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  function ir(href: string) {
    setOpen(false)
    router.push(href)
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-2.5">
        <AnimatePresence>
          {open && acciones.map((a, i) => (
            <motion.button
              key={a.href}
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ delay: i * 0.04, type: 'spring', stiffness: 420, damping: 30 }}
              onClick={() => ir(a.href)}
              className="flex items-center gap-2.5 rounded-2xl pl-4 pr-5 py-2.5 cursor-pointer"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: a.accent }}
              />
              <a.icon className="w-4 h-4 text-white" />
              <span className="text-sm font-semibold text-white">{a.label}</span>
            </motion.button>
          ))}
        </AnimatePresence>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setOpen(v => !v)}
          className="w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            boxShadow: '0 8px 24px rgba(99,102,241,0.4)',
          }}
        >
          <motion.div
            animate={{ rotate: open ? 45 : 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <Plus className="w-5 h-5 text-white" />
          </motion.div>
        </motion.button>
      </div>
    </>
  )
}
