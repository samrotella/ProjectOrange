import { List, LayoutGrid } from 'lucide-react'

export type ViewMode = 'list' | 'grid'

export function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  const base = 'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors'
  return (
    <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => onChange('list')}
        className={`${base} ${value === 'list' ? 'bg-blue-700 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
        aria-pressed={value === 'list'}
      >
        <List size={15} /> List
      </button>
      <button
        type="button"
        onClick={() => onChange('grid')}
        className={`${base} border-l border-gray-300 ${value === 'grid' ? 'bg-blue-700 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
        aria-pressed={value === 'grid'}
      >
        <LayoutGrid size={15} /> Grid
      </button>
    </div>
  )
}
