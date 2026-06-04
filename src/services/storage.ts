import { supabase } from './supabase'
import type { PhotoRecord } from '../types'

const BUCKET = 'photos'

export async function uploadPhoto(file: File, path: string): Promise<PhotoRecord> {
  const id = crypto.randomUUID()
  const ext = file.name.split('.').pop() ?? 'jpg'
  const filePath = `${path}/${id}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(filePath, file)
  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath)
  return { id, url: data.publicUrl, takenAt: new Date().toISOString() }
}

export async function deletePhoto(url: string): Promise<void> {
  // Extract the path after the bucket name in the URL
  const marker = `/object/public/${BUCKET}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return
  const filePath = url.slice(idx + marker.length)
  await supabase.storage.from(BUCKET).remove([filePath])
}
