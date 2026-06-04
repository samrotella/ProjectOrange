import type { ConditionRating } from '../../types'

const CONDITIONS: { rating: ConditionRating; label: string; color: string; bg: string }[] = [
  { rating: 5, label: 'Excellent', color: 'text-green-700', bg: 'bg-green-100 border-green-400' },
  { rating: 4, label: 'Good', color: 'text-lime-700', bg: 'bg-lime-100 border-lime-400' },
  { rating: 3, label: 'Fair', color: 'text-yellow-700', bg: 'bg-yellow-100 border-yellow-400' },
  { rating: 2, label: 'Poor', color: 'text-orange-700', bg: 'bg-orange-100 border-orange-400' },
  { rating: 1, label: 'Critical', color: 'text-red-700', bg: 'bg-red-100 border-red-400' },
]

interface Props {
  value: ConditionRating | null
  onChange: (v: ConditionRating) => void
  error?: string
}

export function ConditionPicker({ value, onChange, error }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-gray-700">Condition</span>
      <div className="flex gap-2 flex-wrap">
        {CONDITIONS.map(c => (
          <button
            key={c.rating}
            type="button"
            onClick={() => onChange(c.rating)}
            className={`flex-1 min-w-[64px] rounded-lg border-2 py-2 text-xs font-semibold transition-all
              ${value === c.rating ? `${c.bg} ${c.color} scale-105` : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'}`}
          >
            <div className="text-lg font-bold">{c.rating}</div>
            {c.label}
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

export function conditionColor(rating: ConditionRating): 'green' | 'yellow' | 'orange' | 'red' | 'blue' {
  const map: Record<ConditionRating, 'green' | 'yellow' | 'orange' | 'red' | 'blue'> = {
    5: 'green', 4: 'green', 3: 'yellow', 2: 'orange', 1: 'red',
  }
  return map[rating]
}

export function conditionLabel(rating: ConditionRating): string {
  return CONDITIONS.find(c => c.rating === rating)?.label ?? String(rating)
}
