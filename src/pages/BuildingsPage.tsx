import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Building2, MapPin, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getBuildings } from '../services/buildings'
import type { Building } from '../types'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

export function BuildingsPage() {
  const { orgId } = useAuth()
  const [buildings, setBuildings] = useState<Building[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orgId) return
    getBuildings(orgId).then(setBuildings).finally(() => setLoading(false))
  }, [orgId])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Buildings</h1>
          <p className="text-sm text-gray-500 mt-0.5">{buildings.length} building{buildings.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/buildings/new">
          <Button><Plus size={16} /> Add Building</Button>
        </Link>
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
