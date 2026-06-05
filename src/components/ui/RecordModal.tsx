import { useMemo, useState, type ReactNode } from 'react'
import { Modal } from './Modal'
import { Button } from './Button'

export type DetailFieldType = 'text' | 'number' | 'select' | 'date' | 'textarea'

export interface DetailField<T> {
  key: string
  label: string
  /** Current value, used as the editing seed and for read-only display. */
  value: (row: T) => string | number | null | undefined
  type?: DetailFieldType
  options?: { value: string; label: string }[]
  /** Build the patch for this field. Defaults to `{ [key]: parsed }`. */
  toPatch?: (raw: string, row: T) => Partial<T>
  readOnly?: boolean
  /** Custom read-only renderer (used when `readOnly`). Falls back to the value. */
  render?: (row: T) => ReactNode
  /** Span the full width of the field grid. */
  fullWidth?: boolean
}

interface RecordModalProps<T> {
  open: boolean
  onClose: () => void
  title: ReactNode
  subtitle?: ReactNode
  row: T
  fields: DetailField<T>[]
  onSave: (patch: Partial<T>) => Promise<void> | void
  /** Extra read-only sections rendered below the editable fields. */
  children?: ReactNode
}

function defaultToPatch<T>(field: DetailField<T>, raw: string): Partial<T> {
  let value: unknown = raw
  if (field.type === 'number') value = raw === '' ? undefined : Number(raw)
  else if (field.type === 'select') value = raw === '' ? undefined : raw
  return { [field.key]: value } as Partial<T>
}

export function RecordModal<T>({ open, onClose, title, subtitle, row, fields, onSave, children }: RecordModalProps<T>) {
  const editable = useMemo(() => fields.filter(f => !f.readOnly), [fields])

  const seed = () => {
    const d: Record<string, string> = {}
    for (const f of editable) {
      const v = f.value(row)
      d[f.key] = v == null ? '' : String(v)
    }
    return d
  }

  // Seeded once on mount. The parent remounts this component per record
  // (via a `key`), so the draft always starts from the current record.
  const [draft, setDraft] = useState<Record<string, string>>(seed)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dirty = editable.some(f => {
    const original = f.value(row)
    return draft[f.key] !== (original == null ? '' : String(original))
  })

  const handleSave = async () => {
    let patch: Partial<T> = {}
    for (const f of editable) {
      const original = f.value(row)
      if (draft[f.key] === (original == null ? '' : String(original))) continue
      const fieldPatch = f.toPatch ? f.toPatch(draft[f.key], row) : defaultToPatch(f, draft[f.key])
      patch = { ...patch, ...fieldPatch }
    }
    if (Object.keys(patch).length === 0) {
      onClose()
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave(patch)
      onClose()
    } catch (err) {
      console.error(err)
      setError('Failed to save changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      footer={
        <>
          {error && <span className="text-xs text-red-600 mr-auto">{error}</span>}
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving} disabled={!dirty && !saving}>
            Save changes
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map(f => {
          const wrapClass = f.fullWidth ? 'sm:col-span-2' : ''
          if (f.readOnly) {
            const display = f.render ? f.render(row) : (f.value(row) ?? '—')
            return (
              <div key={f.key} className={`flex flex-col gap-1 ${wrapClass}`}>
                <span className="text-xs font-medium text-gray-500">{f.label}</span>
                <div className="text-sm text-gray-900">{display}</div>
              </div>
            )
          }
          return (
            <div key={f.key} className={`flex flex-col gap-1 ${wrapClass}`}>
              <label className="text-xs font-medium text-gray-500">{f.label}</label>
              {f.type === 'select' ? (
                <select
                  className={inputClass}
                  value={draft[f.key] ?? ''}
                  onChange={e => setDraft(d => ({ ...d, [f.key]: e.target.value }))}
                >
                  <option value="">—</option>
                  {f.options?.map(o => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : f.type === 'textarea' ? (
                <textarea
                  rows={3}
                  className={inputClass}
                  value={draft[f.key] ?? ''}
                  onChange={e => setDraft(d => ({ ...d, [f.key]: e.target.value }))}
                />
              ) : (
                <input
                  type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                  className={inputClass}
                  value={draft[f.key] ?? ''}
                  onChange={e => setDraft(d => ({ ...d, [f.key]: e.target.value }))}
                />
              )}
            </div>
          )
        })}
      </div>

      {children && <div className="mt-6 flex flex-col gap-6">{children}</div>}
    </Modal>
  )
}
