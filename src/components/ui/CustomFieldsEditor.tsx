import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { CustomField, CustomFieldType } from '../../types'
import { Input } from './Input'
import { Select } from './Select'

const TYPE_OPTIONS = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
]

interface Props {
  fields: CustomField[]
  onChange: (fields: CustomField[]) => void
}

export function CustomFieldsEditor({ fields, onChange }: Props) {
  const [newLabel, setNewLabel] = useState('')
  const [newType, setNewType] = useState<CustomFieldType>('text')

  const addField = () => {
    if (!newLabel.trim()) return
    onChange([
      ...fields,
      { id: crypto.randomUUID(), label: newLabel.trim(), type: newType, value: '' },
    ])
    setNewLabel('')
    setNewType('text')
  }

  const removeField = (id: string) => onChange(fields.filter(f => f.id !== id))

  const updateValue = (id: string, value: string | number) => {
    onChange(fields.map(f => (f.id === id ? { ...f, value } : f)))
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-gray-700">Custom Fields</span>

      {fields.map(f => (
        <div key={f.id} className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              label={f.label}
              type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
              value={String(f.value)}
              onChange={e =>
                updateValue(f.id, f.type === 'number' ? Number(e.target.value) : e.target.value)
              }
            />
          </div>
          <button type="button" onClick={() => removeField(f.id)} className="mb-0.5 p-2 text-red-500 hover:bg-red-50 rounded-lg">
            <Trash2 size={16} />
          </button>
        </div>
      ))}

      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Input
            label="Field label"
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            placeholder="e.g. Install Date"
          />
        </div>
        <div className="w-28">
          <Select
            label="Type"
            value={newType}
            options={TYPE_OPTIONS}
            onChange={e => setNewType(e.target.value as CustomFieldType)}
          />
        </div>
        <button
          type="button"
          onClick={addField}
          className="mb-0.5 p-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg"
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  )
}
