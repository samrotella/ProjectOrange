import { supabase } from './supabase'
import type { Asset } from '../types'

const TABLE = 'assets'

export async function getAssets(orgId: string, buildingId?: string): Promise<Asset[]> {
  let q = supabase.from(TABLE).select('*').eq('org_id', orgId).order('created_at', { ascending: false })
  if (buildingId) q = q.eq('building_id', buildingId)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export async function getAsset(id: string): Promise<Asset | null> {
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single()
  if (error) return null
  return fromRow(data)
}

export async function createAsset(asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(toRow(asset))
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function updateAsset(id: string, asset: Partial<Asset>): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update({ ...toRow(asset as Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>), updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function deleteAsset(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}

function fromRow(row: Record<string, unknown>): Asset {
  return {
    id: row.id as string,
    name: row.name as string,
    item: (row.item as string) ?? '',
    location: (row.location as string) ?? '',
    condition: row.condition as Asset['condition'],
    photos: (row.photos as Asset['photos']) ?? [],
    namePlate: (row.name_plate as string) ?? undefined,
    buildingId: (row.building_id as string) ?? undefined,
    rsMeansItem: (row.rs_means_item as Asset['rsMeansItem']) ?? undefined,
    customFields: (row.custom_fields as Asset['customFields']) ?? [],
    notes: (row.notes as string) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    orgId: row.org_id as string,
  }
}

function toRow(a: Partial<Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>>) {
  return {
    ...(a.name !== undefined && { name: a.name }),
    ...(a.item !== undefined && { item: a.item }),
    ...(a.location !== undefined && { location: a.location }),
    ...(a.condition !== undefined && { condition: a.condition }),
    ...(a.photos !== undefined && { photos: a.photos }),
    ...(a.namePlate !== undefined && { name_plate: a.namePlate }),
    ...(a.buildingId !== undefined && { building_id: a.buildingId }),
    ...(a.rsMeansItem !== undefined && { rs_means_item: a.rsMeansItem }),
    ...(a.customFields !== undefined && { custom_fields: a.customFields }),
    ...(a.notes !== undefined && { notes: a.notes }),
    ...(a.orgId !== undefined && { org_id: a.orgId }),
  }
}
