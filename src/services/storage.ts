import { supabase } from './supabase'
import type { PhotoRecord } from '../types'

const BUCKET = 'photos'

export async function uploadPhoto(file: File, path: string): Promise<PhotoRecord> {
  const id = crypto.randomUUID()
  // Use the MIME type from the File object; jpeg is the safe default for camera captures
  const contentType = file.type || 'image/jpeg'
  const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg'
  const filePath = `${path}/${id}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, { contentType })

  if (error) {
    console.error('[storage] upload error:', error)
    const status = (error as { statusCode?: string }).statusCode
    const isPolicy =
      status === '403' ||
      error.message.toLowerCase().includes('policy') ||
      error.message.toLowerCase().includes('row-level') ||
      error.message.toLowerCase().includes('not authorized')
    throw new Error(
      isPolicy
        ? 'Upload blocked by storage policy. In Supabase: Storage → photos → Policies → add INSERT for role "authenticated".'
        : `Upload failed (${status ?? 'unknown'}): ${error.message}`
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
