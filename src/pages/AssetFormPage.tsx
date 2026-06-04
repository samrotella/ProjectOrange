import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getAsset, createAsset, updateAsset, deleteAsset } from '../services/assets'
import { getBuildings } from '../services/buildings'
import type { Asset, Building, PhotoRecord, CustomField, ConditionRating, RSMeansItem } from '../types'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { PhotoCapture } from '../components/ui/PhotoCapture'
import { ConditionPicker } from '../components/ui/ConditionPicker'
import { CustomFieldsEditor } from '../components/ui/CustomFieldsEditor'
import { RSMeansPicker } from '../components/assets/RSMeansPicker'
import { Card, CardBody, CardHeader } from '../components/ui/Card'

interface FormValues {
  name: string
  item: string
  location: string
  namePlate: string
  buildingId: string
  notes: string
}

export function AssetFormPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { orgId } = useAuth()

  const [photos, setPhotos] = useState<PhotoRecord[]>([])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [condition, setCondition] = useState<ConditionRating | null>(null)
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [rsMeansItem, setRsMeansItem] = useState<RSMeansItem | undefined>()
  const [buildings, setBuildings] = useState<Building[]>([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [conditionError, setConditionError] = useState('')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: { name: '', item: '', location: '', namePlate: '', buildingId: searchParams.get('buildingId') ?? '', notes: '' },
  })

  useEffect(() => {
    if (!orgId) return
    getBuildings(orgId).then(setBuildings)
  }, [orgId])

  useEffect(() => {
    if (!id) return
    getAsset(id).then(a => {
      if (a) {
        reset({ name: a.name, item: a.item, location: a.location, namePlate: a.namePlate ?? '', buildingId: a.buildingId ?? '', notes: a.notes ?? '' })
        setPhotos(a.photos)
        setCondition(a.condition)
        setCustomFields(a.customFields)
        setRsMeansItem(a.rsMeansItem)
      }
    }).finally(() => setLoading(false))
  }, [id, reset])

  const onSubmit = async (data: FormValues) => {
    if (!condition) { setConditionError('Please select a condition rating'); return }
    setConditionError('')
    setSaving(true)
    try {
      const payload: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'> = {
        ...data,
        buildingId: data.buildingId || undefined,
        condition,
        photos,
        customFields,
        rsMeansItem,
        orgId,
      }
      if (isEdit && id) await updateAsset(id, payload)
      else await createAsset(payload)
      navigate(data.buildingId ? `/buildings/${data.buildingId}` : '/assets')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!id || !confirm('Delete this asset?')) return
    setDeleting(true)
    const snap = await import('../services/assets').then(m => m.getAsset(id))
    await deleteAsset(id)
    navigate(snap?.buildingId ? `/buildings/${snap.buildingId}` : '/assets')
  }

  if (loading) return <div className="text-center py-16 text-gray-400">Loading…</div>

  const buildingOptions = [
    { value: '', label: '— None —' },
    ...buildings.map(b => ({ value: b.id, label: b.name })),
  ]

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft size={20} /></button>
        <h1 className="text-xl font-bold text-gray-900">{isEdit ? 'Edit Asset' : 'New Asset'}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Card>
          <CardHeader><span className="font-semibold text-gray-800">Asset Details</span></CardHeader>
          <CardBody className="flex flex-col gap-4">
            <Input label="Asset Name *" {...register('name', { required: 'Name is required' })} error={errors.name?.message} placeholder="e.g. Rooftop AHU-1" />
            <Input label="Item (what it is) *" {...register('item', { required: 'Item is required' })} error={errors.item?.message} placeholder="e.g. Air Handling Unit" />
            <Input label="Location *" {...register('location', { required: 'Location is required' })} error={errors.location?.message} placeholder="e.g. Roof Level 3, Room 301" />
            <Input label="Name Plate / Model" {...register('namePlate')} placeholder="Manufacturer, model, serial #" />
            <Select label="Building" options={buildingOptions} {...register('buildingId')} />
            <Input label="Notes" {...register('notes')} placeholder="Additional observations…" />
          </CardBody>
        </Card>

        <Card>
          <CardHeader><span className="font-semibold text-gray-800">Condition</span></CardHeader>
          <CardBody>
            <ConditionPicker value={condition} onChange={v => { setCondition(v); setConditionError('') }} error={conditionError} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader><span className="font-semibold text-gray-800">Photos</span></CardHeader>
          <CardBody>
            <PhotoCapture photos={photos} onPhotosChange={setPhotos} storagePath={`${orgId}/assets`} onUploadingChange={setUploadingPhotos} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader><span className="font-semibold text-gray-800">RSMeans Cost Data</span></CardHeader>
          <CardBody>
            <RSMeansPicker value={rsMeansItem} onChange={setRsMeansItem} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader><span className="font-semibold text-gray-800">Custom Fields</span></CardHeader>
          <CardBody>
            <CustomFieldsEditor fields={customFields} onChange={setCustomFields} />
          </CardBody>
        </Card>

        <div className="flex gap-3 justify-between">
          {isEdit && (
            <Button type="button" variant="danger" loading={deleting} onClick={handleDelete}>
              <Trash2 size={16} /> Delete
            </Button>
          )}
          <div className="flex gap-3 ml-auto">
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit" loading={saving || uploadingPhotos}>{isEdit ? 'Save Changes' : 'Create Asset'}</Button>
          </div>
        </div>
      </form>
    </div>
  )
}
