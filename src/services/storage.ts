import { supabase } from './supabase'
import type { PhotoRecord } from '../types'

const BUCKET = 'photos'

export async function uploadPhoto(file: File, path: string): Promise<PhotoRecord> {
  const id = crypto.randomUUID()
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const filePath = `${path}/${id}.${ext}`
  const contentType = file.type || `image/${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, { contentType, upsert: false })

  if (error) {
    console.error('[storage] upload error:', error)
    const isPolicy =
      error.message.toLowerCase().includes('policy') ||
      error.message.toLowerCase().includes('row-level') ||
      error.message.toLowerCase().includes('violates') ||
      error.message.toLowerCase().includes('not authorized') ||
      (error as { statusCode?: string }).statusCode === '403'
    throw new Error(
      isPolicy
        ? 'Storage upload blocked (policy). In Supabase go to Storage → photos bucket → Policies and add:\n• INSERT for role "authenticated" with check: bucket_id = \'photos\''
        : `Upload failed: ${error.message}`
    )
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath)
  return { id, url: data.publicUrl, takenAt: new Date().toISOString() }
}

export async function deletePhoto(url: string): Promise<void> {
  const marker = `/object/public/${BUCKET}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return
  const filePath = url.slice(idx + marker.length)
  await supabase.storage.from(BUCKET).remove([filePath])
}
