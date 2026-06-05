import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  subtitle?: ReactNode
  /** Sticky footer content (e.g. action buttons). */
  footer?: ReactNode
  children: ReactNode
  /** Tailwind max-width class for the panel. Defaults to a large modal. */
  maxWidth?: string
}

export function Modal({ open, onClose, title, subtitle, footer, children, maxWidth = 'max-w-3xl' }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    // Lock background scroll while open
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className={`bg-white w-full ${maxWidth} sm:rounded-2xl shadow-xl flex flex-col max-h-screen sm:max-h-[90vh] overflow-hidden`}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {(title || subtitle) && (
          <div className="flex items-start justify-between gap-3 px-5 sm:px-6 py-4 border-b border-gray-100 shrink-0">
            <div className="min-w-0">
              {title && <h2 className="text-lg font-bold text-gray-900 truncate">{title}</h2>}
              {subtitle && <p className="text-sm text-gray-500 truncate">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 -mr-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 shrink-0"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5">{children}</div>

        {footer && (
          <div className="px-5 sm:px-6 py-3 border-t border-gray-100 bg-gray-50 shrink-0 flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
