import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Package, Search, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getAssets } from '../services/assets'
import type { Asset } from '../types'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { conditionColor, conditionLabel } from '../components/ui/ConditionPicker'

export function AssetsPage() {
  const { orgId } = useAuth()
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!orgId) return
    getAssets(orgId).then(setAssets).finally(() => setLoading(false))
  }, [orgId])

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
        <Link to="/assets/new"><Button><Plus size={16} /> Add Asset</Button></Link>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search assets by name, type, or location…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : filtered.length === 0 ? (
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
    </div>
  )
}
