import { useState, useEffect, useRef } from 'react'
import { Search, X, DollarSign } from 'lucide-react'
import { searchRSMeans } from '../../services/rsmeans'
import type { RSMeansItem } from '../../types'

interface Props {
  value: RSMeansItem | undefined
  onChange: (item: RSMeansItem | undefined) => void
}

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

export function RSMeansPicker({ value, onChange }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<RSMeansItem[]>([])
  const [searching, setSearching] = useState(false)
  const [open, setOpen] = useState(false)
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    clearTimeout(debounce.current)
    debounce.current = setTimeout(async () => {
      setSearching(true)
      try { setResults(await searchRSMeans(query)) }
      finally { setSearching(false) }
    }, 350)
    return () => clearTimeout(debounce.current)
  }, [query])

  const select = (item: RSMeansItem) => {
    onChange(item)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">RSMeans Cost Item</span>
        {value && (
          <button type="button" onClick={() => onChange(undefined)} className="text-xs text-red-500 hover:underline flex items-center gap-1">
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {value ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">
          <p className="font-semibold text-blue-900">{value.description}</p>
          <p className="text-xs text-blue-600 mt-0.5">#{value.lineNumber} - Unit: {value.unit}</p>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-700">
            <span>Material: <strong>{fmt(value.materialCost)}</strong></span>
            <span>Labor: <strong>{fmt(value.laborCost)}</strong></span>
            {value.equipmentCost > 0 && <span>Equipment: <strong>{fmt(value.equipmentCost)}</strong></span>}
            <span className="col-span-2 text-blue-800 font-semibold">Total / {value.unit}: {fmt(value.totalCost)}</span>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-500 hover:border-blue-400 transition-colors"
        >
          <DollarSign size={16} />
          Search RSMeans cost data...
        </button>
      )}

      {(open || results.length > 0) && !value && (
        <div className="rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
            <Search size={15} className="text-gray-400" />
            <input
              autoFocus
              className="flex-1 text-sm outline-none"
              placeholder="Search by description or line number..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {searching && <span className="text-xs text-gray-400">Searching...</span>}
          </div>
          {results.length > 0 && (
            <ul className="max-h-60 overflow-y-auto divide-y divide-gray-50">
              {results.map(item => (
                <li key={item.lineNumber}>
                  <button
                    type="button"
                    onClick={() => select(item)}
                    className="w-full text-left px-3 py-2.5 hover:bg-blue-50 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-900 truncate">{item.description}</p>
                    <p className="text-xs text-gray-500">#{item.lineNumber} - {item.unit} - Total: {fmt(item.totalCost)}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {query.length >= 2 && results.length === 0 && !searching && (
            <p className="px-3 py-3 text-sm text-gray-400 text-center">No results for "{query}"</p>
          )}
        </div>
      )}
    </div>
  )
}
