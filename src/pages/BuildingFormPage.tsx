import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getBuilding, createBuilding, updateBuilding, deleteBuilding } from '../services/buildings'
import type { Building, PhotoRecord } from '../types'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { PhotoCapture } from '../components/ui/PhotoCapture'
import { Card, CardBody, CardHeader } from '../components/ui/Card'

const BUILDING_TYPES = ['Office', 'Warehouse', 'Retail', 'Educational', 'Healthcare', 'Residential', 'Industrial', 'Mixed Use', 'Other']
  .map(v => ({ value: v, label: v }))

interface FormValues {
  name: string
  address: string
  buildingType: string
  notes: string
}

export function BuildingFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { orgId } = useAuth()
  const [photos, setPhotos] = useState<PhotoRecord[]>([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: { name: '', address: '', buildingType: 'Office', notes: '' },
  })

  useEffect(() => {
    if (!id) return
    getBuilding(id).then(b => {
      if (b) {
        reset({ name: b.name, address: b.address, buildingType: b.buildingType, notes: b.notes ?? '' })
        setPhotos(b.photos)
      }
    }).finally(() => setLoading(false))
  }, [id, reset])

  const onSubmit = async (data: FormValues) => {
    setSaving(true)
    try {
      const payload: Omit<Building, 'id' | 'createdAt' | 'updatedAt'> = {
        ...data, photos, orgId,
      }
      if (isEdit && id) await updateBuilding(id, payload)
      else await createBuilding(payload)
      navigate('/buildings')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!id || !confirm('Delete this building?')) return
    setDeleting(true)
    await deleteBuilding(id)
    navigate('/buildings')
  }

  if (loading) return <div className="text-center py-16 text-gray-400">Loading…</div>

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-gray-900">{isEdit ? 'Edit Building' : 'New Building'}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Card>
          <CardHeader><span className="font-semibold text-gray-800">Building Details</span></CardHeader>
          <CardBody className="flex flex-col gap-4">
            <Input
              label="Building Name *"
              {...register('name', { required: 'Name is required' })}
              error={errors.name?.message}
            />
            <Input
              label="Address"
              {...register('address')}
              placeholder="123 Main St, City, State 00000"
            />
            <Select
              label="Building Type"
              options={BUILDING_TYPES}
              {...register('buildingType')}
            />
            <Input
              label="Notes"
              {...register('notes')}
              placeholder="Additional notes…"
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader><span className="font-semibold text-gray-800">Photos</span></CardHeader>
          <CardBody>
            <PhotoCapture
              photos={photos}
              onPhotosChange={setPhotos}
              storagePath={`${orgId}/buildings`}
            />
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
            <Button type="submit" loading={saving}>
              {isEdit ? 'Save Changes' : 'Create Building'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
