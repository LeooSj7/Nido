'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'

type Props = {
  open: boolean
  title?: string
  message?: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title = '¿Eliminar?',
  message = 'Esta acción no se puede deshacer.',
  confirmLabel = 'Eliminar',
  onConfirm,
  onCancel,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 z-50 backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.7)' }}
          />
          <motion.div
            key="dialog"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-xs px-4"
          >
            <div
              className="rounded-2xl p-6 shadow-2xl backdrop-blur-xl"
              style={{
                background: 'rgba(9,9,11,0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div className="flex flex-col items-center text-center gap-3 mb-5">
                <div
                  className="rounded-full p-3"
                  style={{
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.2)',
                  }}
                >
                  <AlertTriangle className="w-6 h-6" style={{ color: '#f87171' }} />
                </div>
                <div>
                  <p className="font-semibold text-base" style={{ color: '#ffffff' }}>
                    {title}
                  </p>
                  <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {message}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={onCancel}
                  className="flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors cursor-pointer"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.6)',
                  }}
                >
                  Cancelar
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={onConfirm}
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors cursor-pointer"
                  style={{
                    background: 'rgba(239,68,68,0.15)',
                    border: '1px solid rgba(239,68,68,0.25)',
                    color: '#f87171',
                  }}
                >
                  {confirmLabel}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
