import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Plus, Package, MapPin } from 'lucide-react'
import { getBuilding } from '../services/buildings'
import { getAssets } from '../services/assets'
import { useAuth } from '../context/AuthContext'
import type { Building, Asset } from '../types'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { conditionColor, conditionLabel } from '../components/ui/ConditionPicker'

export function BuildingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { orgId } = useAuth()
  const [building, setBuilding] = useState<Building | null>(null)
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!id || !orgId) return
    Promise.all([getBuilding(id), getAssets(orgId, id)])
      .then(([b, a]) => { setBuilding(b); setAssets(a) })
      .finally(() => setLoading(false))
  }, [id, orgId])

  if (loading) return <div className="text-center py-16 text-gray-400">Loading...</div>
  if (!building) return <div className="text-center py-16 text-gray-400">Building not found.</div>

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft size={20} /></button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">{building.name}</h1>
          <p className="text-sm text-gray-500">{building.buildingType}</p>
        </div>
        <Link to={`/buildings/${id}/edit`}>
          <Button variant="secondary" size="sm"><Edit2 size={15} /> Edit</Button>
        </Link>
      </div>

      {building.photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {building.photos.map(p => (
            <img key={p.id} src={p.url} alt={building.name} className="w-full h-32 object-cover rounded-xl cursor-pointer" onClick={() => setPreview(p.url)} />
          ))}
        </div>
      )}

      <Card>
        <CardBody className="flex flex-col gap-2">
          {building.address && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin size={16} className="text-gray-400" />
              {building.address}
            </div>
          )}
          {building.notes && <p className="text-sm text-gray-500 mt-1">{building.notes}</p>}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-800">Assets ({assets.length})</span>
            <Link to={`/assets/new?buildingId=${id}`}>
              <Button size="sm"><Plus size={14} /> Add Asset</Button>
            </Link>
          </div>
        </CardHeader>
        {assets.length === 0 ? (
          <CardBody>
            <div className="py-8 flex flex-col items-center gap-2 text-gray-400">
              <Package size={32} />
              <p className="text-sm">No assets yet for this building.</p>
            </div>
          </CardBody>
        ) : (
          <ul className="divide-y divide-gray-100">
            {assets.map(a => (
              <li key={a.id}>
                <Link to={`/assets/${a.id}`} className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition-colors">
                  {a.photos[0] && (
                    <img src={a.photos[0].url} className="w-12 h-12 rounded-lg object-cover shrink-0" alt={a.name} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{a.name}</p>
                    <p className="text-xs text-gray-400 truncate">{a.item} - {a.location}</p>
                  </div>
                  <Badge color={conditionColor(a.condition)}>{conditionLabel(a.condition)}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {preview && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <img src={preview} className="max-w-full max-h-full rounded-xl object-contain" />
        </div>
      )}
    </div>
  )
}
