import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Package, Search, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getAssets, updateAsset } from '../services/assets'
import type { Asset, ConditionRating } from '../types'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { conditionColor, conditionLabel } from '../components/ui/ConditionPicker'
import { DataGrid, type GridColumn } from '../components/ui/DataGrid'
import { ViewToggle, type ViewMode } from '../components/ui/ViewToggle'

const VIEW_KEY = 'assets:view'

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
]

const CONDITION_OPTIONS = [
  { value: '5', label: '5 — Excellent' },
  { value: '4', label: '4 — Good' },
  { value: '3', label: '3 — Fair' },
  { value: '2', label: '2 — Poor' },
  { value: '1', label: '1 — Critical' },
]

const assetColumns: GridColumn<Asset>[] = [
  { key: 'name', header: 'Name', accessor: a => a.name, editable: true, editType: 'text', width: 200 },
  { key: 'item', header: 'Type', accessor: a => a.item, editable: true, editType: 'text' },
  { key: 'location', header: 'Location', accessor: a => a.location, editable: true, editType: 'text' },
  {
    key: 'condition',
    header: 'Condition',
    accessor: a => a.condition,
    render: a => <Badge color={conditionColor(a.condition)}>{conditionLabel(a.condition)}</Badge>,
    editable: true,
    editType: 'select',
    options: CONDITION_OPTIONS,
    toPatch: raw => ({ condition: Number(raw) as ConditionRating }),
  },
  {
    key: 'priority',
    header: 'Priority',
    accessor: a => a.priority ?? '',
    render: a => (a.priority ? a.priority.charAt(0).toUpperCase() + a.priority.slice(1) : '—'),
    editable: true,
    editType: 'select',
    options: PRIORITY_OPTIONS,
  },
  { key: 'quantity', header: 'Qty', accessor: a => a.quantity ?? '', editable: true, editType: 'number', align: 'right' },
  { key: 'installYear', header: 'Install Yr', accessor: a => a.installYear ?? '', editable: true, editType: 'number', align: 'right' },
  {
    key: 'expectedLifespan',
    header: 'Lifespan (yrs)',
    accessor: a => a.expectedLifespan ?? '',
    editable: true,
    editType: 'number',
    align: 'right',
    defaultHidden: true,
  },
  {
    key: 'cost',
    header: 'RS Means Cost',
    accessor: a => a.rsMeansItem?.totalCost ?? '',
    render: a =>
      a.rsMeansItem ? (
        <span className="text-blue-600">
          ${a.rsMeansItem.totalCost.toLocaleString()} / {a.rsMeansItem.unit}
        </span>
      ) : (
        '—'
      ),
    align: 'right',
    defaultHidden: true,
  },
  {
    key: 'notes',
    header: 'Notes',
    accessor: a => a.notes ?? '',
    editable: true,
    editType: 'text',
    defaultHidden: true,
  },
  {
    key: 'updatedAt',
    header: 'Updated',
    accessor: a => a.updatedAt,
    render: a => new Date(a.updatedAt).toLocaleDateString(),
    defaultHidden: true,
  },
]

export function AssetsPage() {
  const { orgId } = useAuth()
  const navigate = useNavigate()
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<ViewMode>(() =>
    (localStorage.getItem(VIEW_KEY) as ViewMode) || 'list'
  )

  useEffect(() => {
    if (!orgId) return
    getAssets(orgId).then(setAssets).finally(() => setLoading(false))
  }, [orgId])

  useEffect(() => {
    localStorage.setItem(VIEW_KEY, view)
  }, [view])

  const handleSave = async (id: string, patch: Partial<Asset>) => {
    const prev = assets
    setAssets(curr => curr.map(a => (a.id === id ? { ...a, ...patch } : a)))
    try {
      await updateAsset(id, patch)
    } catch (err) {
      setAssets(prev) // revert on failure
      alert('Failed to save change. Please try again.')
      console.error(err)
    }
  }

  const filtered = assets.filter(a => {
    const q = search.toLowerCase()
    return !q || a.name.toLowerCase().includes(q) || a.item.toLowerCase().includes(q) || a.location.toLowerCase().includes(q)
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
          <p className="text-sm text-gray-500 mt-0.5">{assets.length} asset{assets.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <ViewToggle value={view} onChange={setView} />
          <Link to="/assets/new"><Button><Plus size={16} /> Add Asset</Button></Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : view === 'grid' ? (
        assets.length === 0 ? (
          <Card>
            <div className="py-16 flex flex-col items-center gap-3 text-gray-400">
              <Package size={40} />
              <p className="font-medium">No assets yet</p>
              <Link to="/assets/new"><Button variant="secondary">Add your first asset</Button></Link>
            </div>
          </Card>
        ) : (
          <DataGrid
            storageKey="assets"
            rows={assets}
            columns={assetColumns}
            getRowId={a => a.id}
            onSave={handleSave}
            onRowClick={a => navigate(`/assets/${a.id}`)}
            emptyMessage="No matching assets"
          />
        )
      ) : (
        <>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search assets by name, type, or location…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {filtered.length === 0 ? (
            <Card>
              <div className="py-16 flex flex-col items-center gap-3 text-gray-400">
                <Package size={40} />
                <p className="font-medium">{search ? 'No matching assets' : 'No assets yet'}</p>
                {!search && <Link to="/assets/new"><Button variant="secondary">Add your first asset</Button></Link>}
              </div>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map(a => (
                <Link key={a.id} to={`/assets/${a.id}`}>
                  <Card className="hover:shadow-md transition-shadow">
                    <div className="p-4 flex items-center gap-4">
                      {a.photos[0] ? (
                        <img src={a.photos[0].url} className="w-16 h-16 rounded-lg object-cover shrink-0" alt={a.name} />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 shrink-0">
                          <Package size={24} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{a.name}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{a.item}</p>
                        <p className="text-xs text-gray-400 truncate">{a.location}</p>
                        {a.rsMeansItem && (
                          <p className="text-xs text-blue-600 mt-0.5">
                            ${a.rsMeansItem.totalCost.toLocaleString()} / {a.rsMeansItem.unit}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <Badge color={conditionColor(a.condition)}>{conditionLabel(a.condition)}</Badge>
                        <ChevronRight size={16} className="text-gray-300" />
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
