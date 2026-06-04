import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Package, AlertTriangle, CheckCircle2, Plus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getBuildings } from '../services/buildings'
import { getAssets } from '../services/assets'
import type { Building, Asset } from '../types'
import { Card, CardBody } from '../components/ui/Card'

export function DashboardPage() {
  const { orgId } = useAuth()
  const [buildings, setBuildings] = useState<Building[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orgId) return
    Promise.all([getBuildings(orgId), getAssets(orgId)])
      .then(([b, a]) => { setBuildings(b); setAssets(a) })
      .finally(() => setLoading(false))
  }, [orgId])

  const criticalAssets = assets.filter(a => a.condition <= 2)
  const totalCost = assets.reduce((sum, a) => sum + (a.rsMeansItem?.totalCost ?? 0), 0)

  const stats = [
    { label: 'Buildings', value: buildings.length, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-100', to: '/buildings' },
    { label: 'Assets', value: assets.length, icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-100', to: '/assets' },
    { label: 'Critical / Poor', value: criticalAssets.length, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100', to: '/assets' },
    { label: 'Est. Replacement', value: `$${(totalCost / 1000).toFixed(0)}K`, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100', to: '/assets' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Capital planning overview</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {stats.map(s => (
              <Link key={s.label} to={s.to}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardBody className="flex flex-col gap-2">
                    <div className={`${s.bg} ${s.color} w-10 h-10 rounded-xl flex items-center justify-center`}>
                      <s.icon size={20} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                      <div className="text-xs text-gray-500">{s.label}</div>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <Card>
              <CardBody>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-800">Recent Buildings</h2>
                  <Link to="/buildings/new" className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                    <Plus size={13} /> Add
                  </Link>
                </div>
                {buildings.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4 text-center">No buildings yet.</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {buildings.slice(0, 5).map(b => (
                      <li key={b.id}>
                        <Link to={`/buildings/${b.id}`} className="flex items-center gap-3 py-2.5 hover:text-blue-700">
                          <Building2 size={16} className="text-gray-400" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{b.name}</p>
                            <p className="text-xs text-gray-400 truncate">{b.address}</p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-800">Critical Assets</h2>
                  <Link to="/assets" className="text-xs text-blue-600 hover:underline">View all</Link>
                </div>
                {criticalAssets.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4 text-center">No critical assets.</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {criticalAssets.slice(0, 5).map(a => (
                      <li key={a.id}>
                        <Link to={`/assets/${a.id}`} className="flex items-center gap-3 py-2.5 hover:text-blue-700">
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${a.condition === 1 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                            {a.condition}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{a.name}</p>
                            <p className="text-xs text-gray-400 truncate">{a.item} · {a.location}</p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
