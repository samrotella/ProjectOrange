export type ConditionRating = 1 | 2 | 3 | 4 | 5

export type CustomFieldType = 'text' | 'number' | 'date'

export interface CustomField {
  id: string
  label: string
  type: CustomFieldType
  value: string | number
}

export interface PhotoRecord {
  id: string
  url: string
  caption?: string
  takenAt: string
}

export interface Building {
  id: string
  name: string
  address: string
  buildingType: string
  photos: PhotoRecord[]
  notes?: string
  createdAt: string
  updatedAt: string
  orgId: string
}

export interface RSMeansItem {
  lineNumber: string
  description: string
  unit: string
  materialCost: number
  laborCost: number
  equipmentCost: number
  totalCost: number
  city?: string
}

export interface Asset {
  id: string
  name: string
  item: string
  location: string
  condition: ConditionRating
  photos: PhotoRecord[]
  namePlate?: string
  buildingId?: string
  rsMeansItem?: RSMeansItem
  customFields: CustomField[]
  notes?: string
  createdAt: string
  updatedAt: string
  orgId: string
}

export type BuildingType =
  | 'Office'
  | 'Warehouse'
  | 'Retail'
  | 'Educational'
  | 'Healthcare'
  | 'Residential'
  | 'Industrial'
  | 'Mixed Use'
  | 'Other'
