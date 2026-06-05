import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Package, Search, ChevronRight, Edit2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getAssets, updateAsset } from '../services/assets'
import type { Asset, ConditionRating } from '../types'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { conditionColor, conditionLabel } from '../components/ui/ConditionPicker'
import { DataGrid, type GridColumn } from '../components/ui/DataGrid'
import { ViewToggle, type ViewMode } from '../components/ui/ViewToggle'
import { RecordModal, type DetailField } from '../components/ui/RecordModal'

const VIEW_KEY = 'assets:view'

const fmtCurrency = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

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

function buildAssetColumns(onOpen: (a: Asset) => void): GridColumn<Asset>[] {
  return [
    { key: 'name', header: 'Name', accessor: a => a.name, onClick: onOpen, width: 200 },
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
}

const assetDetailFields: DetailField<Asset>[] = [
  { key: 'name', label: 'Name', value: a => a.name, type: 'text' },
  { key: 'item', label: 'Type', value: a => a.item, type: 'text' },
  { key: 'location', label: 'Location', value: a => a.location, type: 'text' },
  {
    key: 'condition',
    label: 'Condition',
    value: a => String(a.condition),
    type: 'select',
    options: CONDITION_OPTIONS,
    toPatch: raw => ({ condition: Number(raw) as ConditionRating }),
  },
  { key: 'priority', label: 'Priority', value: a => a.priority ?? '', type: 'select', options: PRIORITY_OPTIONS },
  { key: 'quantity', label: 'Quantity', value: a => a.quantity ?? '', type: 'number' },
  { key: 'namePlate', label: 'Nameplate', value: a => a.namePlate ?? '', type: 'text' },
  { key: 'installYear', label: 'Install Year', value: a => a.installYear ?? '', type: 'number' },
  { key: 'expectedLifespan', label: 'Expected Lifespan (yrs)', value: a => a.expectedLifespan ?? '', type: 'number' },
  { key: 'warrantyExpiry', label: 'Warranty Expiry', value: a => (a.warrantyExpiry ? a.warrantyExpiry.slice(0, 10) : ''), type: 'date' },
  { key: 'lastServiceDate', label: 'Last Service Date', value: a => (a.lastServiceDate ? a.lastServiceDate.slice(0, 10) : ''), type: 'date' },
  { key: 'notes', label: 'Notes', value: a => a.notes ?? '', type: 'textarea', fullWidth: true },
]

export function AssetsPage() {
  const { orgId } = useAuth()
  const navigate = useNavigate()
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
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

  const columns = useMemo(() => buildAssetColumns(a => setSelectedId(a.id)), [])

  const selected = selectedId ? assets.find(a => a.id === selectedId) ?? null : null

  const handleSave = async (id: string, patch: Partial<Asset>) => {
    const prev = assets
    setAssets(curr => curr.map(a => (a.id === id ? { ...a, ...patch } : a)))
    try {
      await updateAsset(id, patch)
    } catch (err) {
      setAssets(prev) // revert on failure
      console.error(err)
      throw err
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
            columns={columns}
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

      {selected && (
        <RecordModal
          key={selected.id}
          open={!!selected}
          onClose={() => setSelectedId(null)}
          title={selected.name}
          subtitle={selected.item}
          row={selected}
          fields={assetDetailFields}
          onSave={patch => handleSave(selected.id, patch)}
        >
          {selected.photos.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Photos</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {selected.photos.map(p => (
                  <img key={p.id} src={p.url} alt={p.caption ?? selected.name} className="w-full h-24 object-cover rounded-lg" />
                ))}
              </div>
            </div>
          )}

          {selected.rsMeansItem && (
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-xs font-medium text-gray-500 mb-1">RSMeans Cost Data</p>
              <p className="text-sm font-medium text-gray-900">{selected.rsMeansItem.description}</p>
              <p className="text-xs text-gray-400">
                Line #{selected.rsMeansItem.lineNumber} · Unit: {selected.rsMeansItem.unit}
              </p>
              <p className="text-sm text-blue-800 font-semibold mt-1">
                Total / {selected.rsMeansItem.unit}: {fmtCurrency(selected.rsMeansItem.totalCost)}
              </p>
            </div>
          )}

          {selected.customFields.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Custom Fields</p>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                {selected.customFields.map(f => (
                  <div key={f.id}>
                    <dt className="text-xs text-gray-500">{f.label}</dt>
                    <dd className="text-sm font-medium text-gray-900">{String(f.value) || '—'}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <div>
            <Link to={`/assets/${selected.id}/edit`}>
              <Button variant="secondary" size="sm">
                <Edit2 size={14} /> Edit photos &amp; advanced fields
              </Button>
            </Link>
          </div>
        </RecordModal>
      )}
    </div>
  )
}
