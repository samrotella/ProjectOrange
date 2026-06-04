import { supabase } from './supabase'
import type { Building } from '../types'

const TABLE = 'buildings'

export async function getBuildings(orgId: string): Promise<Building[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export async function getBuilding(id: string): Promise<Building | null> {
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single()
  if (error) return null
  return fromRow(data)
}

export async function createBuilding(building: Omit<Building, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(toRow(building))
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function updateBuilding(id: string, building: Partial<Building>): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update({ ...toRow(building as Omit<Building, 'id' | 'createdAt' | 'updatedAt'>), updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function deleteBuilding(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}

// Supabase uses snake_case columns; our app uses camelCase
function fromRow(row: Record<string, unknown>): Building {
  return {
    id: row.id as string,
    name: row.name as string,
    address: (row.address as string) ?? '',
    buildingType: (row.building_type as string) ?? '',
    yearBuilt: (row.year_built as number) ?? undefined,
    squareFootage: (row.square_footage as number) ?? undefined,
    numberOfFloors: (row.number_of_floors as number) ?? undefined,
    constructionType: (row.construction_type as string) ?? undefined,
    photos: (row.photos as Building['photos']) ?? [],
    notes: (row.notes as string) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    orgId: row.org_id as string,
  }
}

function toRow(b: Partial<Omit<Building, 'id' | 'createdAt' | 'updatedAt'>>) {
  return {
    ...(b.name !== undefined && { name: b.name }),
    ...(b.address !== undefined && { address: b.address }),
    ...(b.buildingType !== undefined && { building_type: b.buildingType }),
    ...(b.yearBuilt !== undefined && { year_built: b.yearBuilt || null }),
    ...(b.squareFootage !== undefined && { square_footage: b.squareFootage || null }),
    ...(b.numberOfFloors !== undefined && { number_of_floors: b.numberOfFloors || null }),
    ...(b.constructionType !== undefined && { construction_type: b.constructionType }),
    ...(b.photos !== undefined && { photos: b.photos }),
    ...(b.notes !== undefined && { notes: b.notes }),
    ...(b.orgId !== undefined && { org_id: b.orgId }),
  }
}
