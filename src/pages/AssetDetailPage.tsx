import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Edit2, Building2, MapPin, Tag, DollarSign, Calendar, Clock, AlertTriangle, Hash } from 'lucide-react'
import { getAsset } from '../services/assets'
import { getBuilding } from '../services/buildings'
import type { Asset, Building } from '../types'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { conditionColor, conditionLabel } from '../components/ui/ConditionPicker'

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

type Color = 'green' | 'yellow' | 'orange' | 'red' | 'blue' | 'gray'

const PRIORITY_COLOR: Record<string, Color> = {
  low: 'green',
  medium: 'yellow',
  high: 'orange',
  critical: 'red',
}

export function AssetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [asset, setAsset] = useState<Asset | null>(null)
  const [building, setBuilding] = useState<Building | null>(null)
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    getAsset(id).then(async a => {
      setAsset(a)
      if (a?.buildingId) setBuilding(await getBuilding(a.buildingId))
    }).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="text-center py-16 text-gray-400">Loading…</div>
  if (!asset) return <div className="text-center py-16 text-gray-400">Asset not found.</div>

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft size={20} /></button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">{asset.name}</h1>
          <p className="text-sm text-gray-500">{asset.item}</p>
        </div>
        <Link to={`/assets/${id}/edit`}>
          <Button variant="secondary" size="sm"><Edit2 size={15} /> Edit</Button>
        </Link>
      </div>

      {asset.photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {asset.photos.map(p => (
            <img key={p.id} src={p.url} className="w-full h-32 object-cover rounded-xl cursor-pointer" onClick={() => setPreview(p.url)} />
          ))}
        </div>
      )}

      <Card>
        <CardBody className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Condition</span>
            <Badge color={conditionColor(asset.condition)}>{asset.condition} — {conditionLabel(asset.condition)}</Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin size={16} className="text-gray-400" />
            {asset.location}
          </div>
          {building && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Building2 size={16} className="text-gray-400" />
              <Link to={`/buildings/${building.id}`} className="text-blue-600 hover:underline">{building.name}</Link>
            </div>
          )}
          {asset.priority && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Priority</span>
              <Badge color={PRIORITY_COLOR[asset.priority] ?? 'gray'}>{asset.priority.charAt(0).toUpperCase() + asset.priority.slice(1)}</Badge>
            </div>
          )}
          {asset.namePlate && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Tag size={16} className="text-gray-400" />
              {asset.namePlate}
            </div>
          )}
          {(asset.installYear != null || asset.expectedLifespan != null) && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar size={16} className="text-gray-400" />
              {asset.installYear && <span>Installed {asset.installYear}</span>}
              {asset.installYear && asset.expectedLifespan && <span className="text-gray-400">·</span>}
              {asset.expectedLifespan && (
                <span>
                  {asset.expectedLifespan} yr lifespan
                  {asset.installYear && ` (replace ~${asset.installYear + asset.expectedLifespan})`}
                </span>
              )}
            </div>
          )}
          {asset.quantity != null && asset.quantity !== 1 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Hash size={16} className="text-gray-400" />
              Qty: {asset.quantity}
            </div>
          )}
          {asset.warrantyExpiry && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <AlertTriangle size={16} className="text-gray-400" />
              Warranty expires {new Date(asset.warrantyExpiry).toLocaleDateString()}
            </div>
          )}
          {asset.lastServiceDate && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock size={16} className="text-gray-400" />
              Last serviced {new Date(asset.lastServiceDate).toLocaleDateString()}
            </div>
          )}
          {asset.notes && <p className="text-sm text-gray-500">{asset.notes}</p>}
        </CardBody>
      </Card>

      {asset.rsMeansItem && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 font-semibold text-gray-800">
              <DollarSign size={18} className="text-blue-600" /> RSMeans Cost Data
            </div>
          </CardHeader>
          <CardBody className="flex flex-col gap-2 text-sm">
            <p className="font-medium text-gray-900">{asset.rsMeansItem.description}</p>
            <p className="text-xs text-gray-400">Line #{asset.rsMeansItem.lineNumber} · Unit: {asset.rsMeansItem.unit}</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1 text-gray-600">
              <span>Material: <strong>{fmt(asset.rsMeansItem.materialCost)}</strong></span>
              <span>Labor: <strong>{fmt(asset.rsMeansItem.laborCost)}</strong></span>
              {asset.rsMeansItem.equipmentCost > 0 && <span>Equipment: <strong>{fmt(asset.rsMeansItem.equipmentCost)}</strong></span>}
              <span className="col-span-2 text-blue-800 font-semibold text-base mt-1">
                Total / {asset.rsMeansItem.unit}: {fmt(asset.rsMeansItem.totalCost)}
              </span>
            </div>
          </CardBody>
        </Card>
      )}

      {asset.customFields.length > 0 && (
        <Card>
          <CardHeader><span className="font-semibold text-gray-800">Custom Fields</span></CardHeader>
          <CardBody>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              {asset.customFields.map(f => (
                <div key={f.id}>
                  <dt className="text-xs text-gray-500">{f.label}</dt>
                  <dd className="text-sm font-medium text-gray-900">{String(f.value) || '—'}</dd>
                </div>
              ))}
            </dl>
          </CardBody>
        </Card>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <img src={preview} className="max-w-full max-h-full rounded-xl object-contain" />
        </div>
      )}
    </div>
  )
}
