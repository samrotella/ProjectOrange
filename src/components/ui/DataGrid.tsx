import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  SlidersHorizontal,
  Filter,
  Search,
  Check,
  X,
} from 'lucide-react'

export type EditType = 'text' | 'number' | 'select'

export interface GridColumn<T> {
  /** Unique column key. Used for sorting, filtering and visibility state. */
  key: string
  header: string
  /** Raw value used for sorting & filtering (and default rendering). */
  accessor: (row: T) => string | number | null | undefined
  /** Optional custom read-mode cell renderer. Falls back to the accessor value. */
  render?: (row: T) => ReactNode
  editable?: boolean
  editType?: EditType
  /**
   * Click handler for the cell. When set, the cell renders as a link/button and
   * clicking it invokes this instead of inline-editing or row navigation.
   */
  onClick?: (row: T) => void
  /** Options for `editType: 'select'`. */
  options?: { value: string; label: string }[]
  /**
   * Build the patch persisted when a cell is edited. Defaults to `{ [key]: parsed }`
   * where the value is parsed according to `editType`.
   */
  toPatch?: (raw: string, row: T) => Partial<T>
  align?: 'left' | 'right' | 'center'
  /** Fixed column width in px. */
  width?: number
  /** Hidden by default until the user enables it in the column picker. */
  defaultHidden?: boolean
  sortable?: boolean
  filterable?: boolean
}

interface DataGridProps<T> {
  /** Stable key used to persist column visibility in localStorage. */
  storageKey: string
  rows: T[]
  columns: GridColumn<T>[]
  getRowId: (row: T) => string
  /** Persist an inline edit. Should update the backing data and local state. */
  onSave?: (rowId: string, patch: Partial<T>) => Promise<void> | void
  onRowClick?: (row: T) => void
  emptyMessage?: string
}

type SortState = { key: string; dir: 'asc' | 'desc' } | null

function defaultToPatch<T>(col: GridColumn<T>, raw: string): Partial<T> {
  let value: unknown = raw
  if (col.editType === 'number') value = raw === '' ? undefined : Number(raw)
  else if (col.editType === 'select') value = raw === '' ? undefined : raw
  return { [col.key]: value } as Partial<T>
}

export function DataGrid<T>({
  storageKey,
  rows,
  columns,
  getRowId,
  onSave,
  onRowClick,
  emptyMessage = 'No rows',
}: DataGridProps<T>) {
  const lsKey = `datagrid:${storageKey}:hidden`

  // ----- Column visibility (persisted) -----
  const [hidden, setHidden] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(lsKey)
      if (saved) return new Set<string>(JSON.parse(saved))
    } catch {
      /* ignore */
    }
    return new Set(columns.filter(c => c.defaultHidden).map(c => c.key))
  })

  useEffect(() => {
    try {
      localStorage.setItem(lsKey, JSON.stringify([...hidden]))
    } catch {
      /* ignore */
    }
  }, [hidden, lsKey])

  const toggleColumn = (key: string) =>
    setHidden(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const visibleColumns = columns.filter(c => !hidden.has(c.key))

  // ----- Sorting -----
  const [sort, setSort] = useState<SortState>(null)
  const cycleSort = (key: string) =>
    setSort(prev => {
      if (!prev || prev.key !== key) return { key, dir: 'asc' }
      if (prev.dir === 'asc') return { key, dir: 'desc' }
      return null
    })

  // ----- Filtering -----
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Record<string, string>>({})

  // ----- Column picker dropdown -----
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!pickerOpen) return
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [pickerOpen])

  // ----- Inline editing -----
  const [editing, setEditing] = useState<{ rowId: string; key: string } | null>(null)
  const [draft, setDraft] = useState('')

  const startEdit = (rowId: string, col: GridColumn<T>, current: string) => {
    if (!col.editable || !onSave) return
    setEditing({ rowId, key: col.key })
    setDraft(current)
  }

  const commitEdit = async (col: GridColumn<T>, row: T) => {
    if (!editing || !onSave) return
    const original = String(col.accessor(row) ?? '')
    setEditing(null)
    if (draft === original) return
    const patch = col.toPatch ? col.toPatch(draft, row) : defaultToPatch(col, draft)
    await onSave(getRowId(row), patch)
  }

  // ----- Derived rows: filter then sort -----
  const processed = useMemo(() => {
    const q = search.trim().toLowerCase()
    let result = rows.filter(row => {
      // Global search across visible columns
      if (q) {
        const hit = visibleColumns.some(c =>
          String(c.accessor(row) ?? '').toLowerCase().includes(q)
        )
        if (!hit) return false
      }
      // Per-column filters
      for (const [key, val] of Object.entries(filters)) {
        if (!val) continue
        const col = columns.find(c => c.key === key)
        if (!col) continue
        if (!String(col.accessor(row) ?? '').toLowerCase().includes(val.toLowerCase())) return false
      }
      return true
    })

    if (sort) {
      const col = columns.find(c => c.key === sort.key)
      if (col) {
        result = [...result].sort((a, b) => {
          const av = col.accessor(a)
          const bv = col.accessor(b)
          if (av == null && bv == null) return 0
          if (av == null) return 1
          if (bv == null) return -1
          let cmp: number
          if (typeof av === 'number' && typeof bv === 'number') cmp = av - bv
          else cmp = String(av).localeCompare(String(bv), undefined, { numeric: true })
          return sort.dir === 'asc' ? cmp : -cmp
        })
      }
    }
    return result
  }, [rows, columns, visibleColumns, search, filters, sort])

  const alignClass = (a?: GridColumn<T>['align']) =>
    a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left'

  return (
    <div className="flex flex-col gap-3">
      {/* Mobile hint */}
      <p className="sm:hidden text-xs text-gray-400">
        Tip: the grid is best viewed on a larger screen — scroll horizontally to see all columns.
      </p>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <button
          type="button"
          onClick={() => setShowFilters(s => !s)}
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors
            ${showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
        >
          <Filter size={15} /> Filters
        </button>

        <div className="relative" ref={pickerRef}>
          <button
            type="button"
            onClick={() => setPickerOpen(o => !o)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <SlidersHorizontal size={15} /> Columns
          </button>
          {pickerOpen && (
            <div className="absolute right-0 mt-1 w-52 max-h-80 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg z-30 p-1">
              <div className="px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Show columns
              </div>
              {columns.map(c => {
                const visible = !hidden.has(c.key)
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => toggleColumn(c.key)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-gray-700 hover:bg-gray-100 text-left"
                  >
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0
                        ${visible ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'}`}
                    >
                      {visible && <Check size={12} />}
                    </span>
                    <span className="truncate">{c.header}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-sm border-collapse">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              {visibleColumns.map(col => {
                const sortable = col.sortable !== false
                const active = sort?.key === col.key
                return (
                  <th
                    key={col.key}
                    style={col.width ? { width: col.width, minWidth: col.width } : undefined}
                    className={`px-3 py-2.5 font-semibold text-gray-600 border-b border-gray-200 whitespace-nowrap ${alignClass(col.align)}`}
                  >
                    <button
                      type="button"
                      disabled={!sortable}
                      onClick={() => sortable && cycleSort(col.key)}
                      className={`inline-flex items-center gap-1 ${sortable ? 'hover:text-gray-900 cursor-pointer' : 'cursor-default'}`}
                    >
                      {col.header}
                      {sortable &&
                        (active ? (
                          sort!.dir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                        ) : (
                          <ChevronsUpDown size={14} className="text-gray-300" />
                        ))}
                    </button>
                  </th>
                )
              })}
            </tr>
            {showFilters && (
              <tr>
                {visibleColumns.map(col => (
                  <th key={col.key} className="px-2 py-1.5 border-b border-gray-200 bg-white">
                    {col.filterable !== false ? (
                      <input
                        value={filters[col.key] ?? ''}
                        onChange={e =>
                          setFilters(prev => ({ ...prev, [col.key]: e.target.value }))
                        }
                        placeholder="Filter…"
                        className="w-full px-2 py-1 rounded border border-gray-200 text-xs font-normal focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                    ) : null}
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {processed.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length} className="px-3 py-12 text-center text-gray-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              processed.map(row => {
                const rowId = getRowId(row)
                return (
                  <tr
                    key={rowId}
                    className={`border-b border-gray-100 last:border-0 hover:bg-blue-50/40 ${onRowClick ? 'cursor-pointer' : ''}`}
                  >
                    {visibleColumns.map(col => {
                      const isEditing = editing?.rowId === rowId && editing.key === col.key
                      const rawValue = col.accessor(row)
                      const baseDisplay = col.render ? col.render(row) : (rawValue ?? '—')
                      const display = col.onClick ? (
                        <span className="text-blue-700 font-medium hover:underline">{baseDisplay}</span>
                      ) : (
                        baseDisplay
                      )

                      if (isEditing) {
                        return (
                          <td key={col.key} className="px-2 py-1.5">
                            <div className="flex items-center gap-1">
                              {col.editType === 'select' ? (
                                <select
                                  autoFocus
                                  value={draft}
                                  onChange={e => setDraft(e.target.value)}
                                  onBlur={() => commitEdit(col, row)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') commitEdit(col, row)
                                    if (e.key === 'Escape') setEditing(null)
                                  }}
                                  className="w-full px-2 py-1 rounded border border-blue-400 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                  <option value="">—</option>
                                  {col.options?.map(o => (
                                    <option key={o.value} value={o.value}>
                                      {o.label}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  autoFocus
                                  type={col.editType === 'number' ? 'number' : 'text'}
                                  value={draft}
                                  onChange={e => setDraft(e.target.value)}
                                  onBlur={() => commitEdit(col, row)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') commitEdit(col, row)
                                    if (e.key === 'Escape') setEditing(null)
                                  }}
                                  className="w-full px-2 py-1 rounded border border-blue-400 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              )}
                            </div>
                          </td>
                        )
                      }

                      return (
                        <td
                          key={col.key}
                          onClick={e => {
                            if (col.onClick) {
                              e.stopPropagation()
                              col.onClick(row)
                            } else if (col.editable && onSave) {
                              e.stopPropagation()
                              startEdit(rowId, col, String(rawValue ?? ''))
                            } else if (onRowClick) {
                              onRowClick(row)
                            }
                          }}
                          className={`px-3 py-2 text-gray-700 whitespace-nowrap ${alignClass(col.align)}
                            ${col.onClick ? 'cursor-pointer' : ''}
                            ${col.editable && onSave ? 'cursor-text hover:bg-blue-100/60 rounded' : ''}`}
                          title={col.onClick ? 'Open details' : col.editable && onSave ? 'Click to edit' : undefined}
                        >
                          {display}
                        </td>
                      )
                    })}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>
          {processed.length} of {rows.length} row{rows.length !== 1 ? 's' : ''}
        </span>
        {(search || Object.values(filters).some(Boolean)) && (
          <button
            type="button"
            onClick={() => {
              setSearch('')
              setFilters({})
            }}
            className="inline-flex items-center gap-1 hover:text-gray-600"
          >
            <X size={12} /> Clear filters
          </button>
        )}
      </div>
    </div>
  )
}
