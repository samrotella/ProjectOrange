import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Building2, MapPin, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getBuildings, updateBuilding } from '../services/buildings'
import type { Building } from '../types'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { DataGrid, type GridColumn } from '../components/ui/DataGrid'
import { ViewToggle, type ViewMode } from '../components/ui/ViewToggle'

const VIEW_KEY = 'buildings:view'

const BUILDING_TYPE_OPTIONS = [
  'Office',
  'Warehouse',
  'Retail',
  'Educational',
  'Healthcare',
  'Residential',
  'Industrial',
  'Mixed Use',
  'Other',
].map(t => ({ value: t, label: t }))

const buildingColumns: GridColumn<Building>[] = [
  { key: 'name', header: 'Name', accessor: b => b.name, editable: true, editType: 'text', width: 200 },
  { key: 'buildingType', header: 'Type', accessor: b => b.buildingType, editable: true, editType: 'select', options: BUILDING_TYPE_OPTIONS },
  { key: 'address', header: 'Address', accessor: b => b.address, editable: true, editType: 'text', width: 240 },
  { key: 'yearBuilt', header: 'Year Built', accessor: b => b.yearBuilt ?? '', editable: true, editType: 'number', align: 'right' },
  {
    key: 'squareFootage',
    header: 'Sq Ft',
    accessor: b => b.squareFootage ?? '',
    render: b => (b.squareFootage != null ? b.squareFootage.toLocaleString() : '—'),
    editable: true,
    editType: 'number',
    align: 'right',
  },
  { key: 'numberOfFloors', header: 'Floors', accessor: b => b.numberOfFloors ?? '', editable: true, editType: 'number', align: 'right' },
  {
    key: 'constructionType',
    header: 'Construction',
    accessor: b => b.constructionType ?? '',
    editable: true,
    editType: 'text',
    defaultHidden: true,
  },
  {
    key: 'notes',
    header: 'Notes',
    accessor: b => b.notes ?? '',
    editable: true,
    editType: 'text',
    defaultHidden: true,
  },
  {
    key: 'updatedAt',
    header: 'Updated',
    accessor: b => b.updatedAt,
    render: b => new Date(b.updatedAt).toLocaleDateString(),
    defaultHidden: true,
  },
]

export function BuildingsPage() {
  const { orgId } = useAuth()
  const navigate = useNavigate()
  const [buildings, setBuildings] = useState<Building[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<ViewMode>(() =>
    (localStorage.getItem(VIEW_KEY) as ViewMode) || 'list'
  )

  useEffect(() => {
    if (!orgId) return
    getBuildings(orgId).then(setBuildings).finally(() => setLoading(false))
  }, [orgId])

  useEffect(() => {
    localStorage.setItem(VIEW_KEY, view)
  }, [view])

  const handleSave = async (id: string, patch: Partial<Building>) => {
    const prev = buildings
    setBuildings(curr => curr.map(b => (b.id === id ? { ...b, ...patch } : b)))
    try {
      await updateBuilding(id, patch)
    } catch (err) {
      setBuildings(prev) // revert on failure
      alert('Failed to save change. Please try again.')
      console.error(err)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Buildings</h1>
          <p className="text-sm text-gray-500 mt-0.5">{buildings.length} building{buildings.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <ViewToggle value={view} onChange={setView} />
          <Link to="/buildings/new">
            <Button><Plus size={16} /> Add Building</Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : buildings.length === 0 ? (
        <Card>
          <div className="py-16 flex flex-col items-center gap-3 text-gray-400">
            <Building2 size={40} />
            <p className="font-medium">No buildings yet</p>
            <Link to="/buildings/new"><Button variant="secondary">Add your first building</Button></Link>
          </div>
        </Card>
      ) : view === 'grid' ? (
        <DataGrid
          storageKey="buildings"
          rows={buildings}
          columns={buildingColumns}
          getRowId={b => b.id}
          onSave={handleSave}
          onRowClick={b => navigate(`/buildings/${b.id}`)}
          emptyMessage="No matching buildings"
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {buildings.map(b => (
            <Link key={b.id} to={`/buildings/${b.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                {b.photos[0] && (
                  <img src={b.photos[0].url} className="w-full h-40 object-cover rounded-t-xl" alt={b.name} />
                )}
                <div className="p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{b.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{b.buildingType}</p>
                    {b.address && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-1 truncate">
                        <MapPin size={11} /> {b.address}
                      </p>
                    )}
                  </div>
                  <ChevronRight size={18} className="text-gray-300 shrink-0 mt-1" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
