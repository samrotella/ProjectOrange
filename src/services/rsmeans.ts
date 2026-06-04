import type { RSMeansItem } from '../types'

const API_KEY = import.meta.env.VITE_RSMEANS_API_KEY as string | undefined
const API_URL = import.meta.env.VITE_RSMEANS_API_URL as string | undefined

const SAMPLE_DATA: RSMeansItem[] = [
  { lineNumber: '23 05 23.10 0200', description: 'Air handling unit, up to 2000 CFM', unit: 'Ea', materialCost: 3250, laborCost: 680, equipmentCost: 0, totalCost: 3930 },
  { lineNumber: '23 05 23.10 0400', description: 'Air handling unit, 2001-5000 CFM', unit: 'Ea', materialCost: 6100, laborCost: 1050, equipmentCost: 0, totalCost: 7150 },
  { lineNumber: '23 09 93.20 0100', description: 'Boiler, hot water, gas-fired, 500 MBH', unit: 'Ea', materialCost: 8200, laborCost: 1400, equipmentCost: 0, totalCost: 9600 },
  { lineNumber: '23 09 93.20 0200', description: 'Boiler, hot water, gas-fired, 1000 MBH', unit: 'Ea', materialCost: 13500, laborCost: 2100, equipmentCost: 0, totalCost: 15600 },
  { lineNumber: '23 74 13.10 0100', description: 'Chiller, scroll, air-cooled, 20 ton', unit: 'Ea', materialCost: 18500, laborCost: 2800, equipmentCost: 500, totalCost: 21800 },
  { lineNumber: '23 74 13.10 0200', description: 'Chiller, centrifugal, water-cooled, 100 ton', unit: 'Ea', materialCost: 68000, laborCost: 5600, equipmentCost: 1200, totalCost: 74800 },
  { lineNumber: '26 24 16.20 0100', description: 'Electrical panel, 200A, 3-phase, 42 circuit', unit: 'Ea', materialCost: 1850, laborCost: 720, equipmentCost: 0, totalCost: 2570 },
  { lineNumber: '26 24 16.20 0200', description: 'Electrical panel, 400A, 3-phase, 84 circuit', unit: 'Ea', materialCost: 3400, laborCost: 1200, equipmentCost: 0, totalCost: 4600 },
  { lineNumber: '22 11 23.10 0100', description: 'Water heater, commercial gas, 100 gal', unit: 'Ea', materialCost: 2200, laborCost: 480, equipmentCost: 0, totalCost: 2680 },
  { lineNumber: '22 11 23.10 0200', description: 'Water heater, commercial electric, 80 gal', unit: 'Ea', materialCost: 1650, laborCost: 360, equipmentCost: 0, totalCost: 2010 },
  { lineNumber: '23 81 26.10 0100', description: 'Split system A/C, 3 ton, residential', unit: 'Ea', materialCost: 2800, laborCost: 680, equipmentCost: 0, totalCost: 3480 },
  { lineNumber: '23 81 26.10 0200', description: 'Split system A/C, 5 ton, commercial', unit: 'Ea', materialCost: 4200, laborCost: 950, equipmentCost: 0, totalCost: 5150 },
  { lineNumber: '26 51 13.10 0100', description: 'LED lighting fixture, troffer 2x4, 40W', unit: 'Ea', materialCost: 185, laborCost: 95, equipmentCost: 0, totalCost: 280 },
  { lineNumber: '07 22 16.10 0100', description: 'Roof membrane, TPO, 60 mil', unit: 'SF', materialCost: 1.85, laborCost: 1.20, equipmentCost: 0.10, totalCost: 3.15 },
  { lineNumber: '09 65 13.10 0100', description: 'Carpet, commercial, 26 oz', unit: 'SY', materialCost: 28, laborCost: 6.50, equipmentCost: 0, totalCost: 34.50 },
  { lineNumber: '09 65 13.10 0200', description: 'Vinyl composite tile (VCT), 12x12', unit: 'SF', materialCost: 1.95, laborCost: 1.80, equipmentCost: 0, totalCost: 3.75 },
  { lineNumber: '08 14 16.10 0100', description: 'Door, hollow metal, 3070, incl frame & hardware', unit: 'Ea', materialCost: 780, laborCost: 320, equipmentCost: 0, totalCost: 1100 },
  { lineNumber: '23 34 23.10 0100', description: 'Exhaust fan, ceiling mount, 500 CFM', unit: 'Ea', materialCost: 340, laborCost: 210, equipmentCost: 0, totalCost: 550 },
  { lineNumber: '21 13 13.10 0100', description: 'Fire suppression sprinkler head, concealed', unit: 'Ea', materialCost: 28, laborCost: 45, equipmentCost: 0, totalCost: 73 },
  { lineNumber: '11 21 13.10 0100', description: 'Elevator, hydraulic, 2-stop, 2500 lb', unit: 'Ea', materialCost: 42000, laborCost: 8500, equipmentCost: 1500, totalCost: 52000 },
]

export async function searchRSMeans(query: string): Promise<RSMeansItem[]> {
  if (API_KEY && API_URL) {
    try {
      const resp = await fetch(`${API_URL}/items?search=${encodeURIComponent(query)}&pagesize=20`, {
        headers: { 'Authorization': `Bearer ${API_KEY}`, 'Accept': 'application/json' },
      })
      if (resp.ok) {
        const data = await resp.json()
        return (data.items ?? data) as RSMeansItem[]
      }
    } catch { /* fall through */ }
  }
  const lower = query.toLowerCase()
  return SAMPLE_DATA.filter(item =>
    item.description.toLowerCase().includes(lower) || item.lineNumber.includes(lower)
  )
}

export async function getRSMeansItem(lineNumber: string): Promise<RSMeansItem | null> {
  if (API_KEY && API_URL) {
    try {
      const resp = await fetch(`${API_URL}/items/${encodeURIComponent(lineNumber)}`, {
        headers: { 'Authorization': `Bearer ${API_KEY}`, 'Accept': 'application/json' },
      })
      if (resp.ok) return (await resp.json()) as RSMeansItem
    } catch { /* fall through */ }
  }
  return SAMPLE_DATA.find(i => i.lineNumber === lineNumber) ?? null
}
