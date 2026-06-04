import { supabase } from './supabase'
import type { PhotoRecord } from '../types'

const BUCKET = 'photos'

export async function uploadPhoto(file: File, path: string): Promise<PhotoRecord> {
  const id = crypto.randomUUID()
  // Derive extension from MIME type; jpeg → jpg, default to jpg
  const mime = file.type || 'image/jpeg'
  const ext = mime === 'image/jpeg' ? 'jpg' : (mime.split('/')[1] ?? 'jpg')
  // Guard against empty path segments (e.g. if orgId is blank)
  const filePath = [path, `${id}.${ext}`].filter(Boolean).join('/').replace(/\/+/g, '/')

  console.debug('[storage] uploading', { filePath, mime, size: file.size })

  // Let the SDK infer content-type from the File object — do not set it explicitly,
  // as some Supabase versions reject the request when it is passed alongside a File.
  const { error } = await supabase.storage.from(BUCKET).upload(filePath, file)

  if (error) {
    console.error('[storage] upload error', { status: (error as { statusCode?: string }).statusCode, message: error.message, error })
    const status = (error as { statusCode?: string }).statusCode
    const msg = error.message.toLowerCase()
    if (status === '403' || msg.includes('policy') || msg.includes('row-level') || msg.includes('not authorized')) {
      throw new Error('Upload blocked by storage policy. In Supabase: Storage → photos → Policies → add INSERT for role "authenticated".')
    }
    if (status === '400') {
      throw new Error(`Upload rejected (400): ${error.message} — check browser DevTools console for full details.`)
    }
    throw new Error(`Upload failed (${status ?? 'unknown'}): ${error.message}`)
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath)
  console.debug('[storage] uploaded OK', data.publicUrl)
  return { id, url: data.publicUrl, takenAt: new Date().toISOString() }
}

export async function deletePhoto(url: string): Promise<void> {
  const marker = `/object/public/${BUCKET}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return
  const filePath = url.slice(idx + marker.length)
  await supabase.storage.from(BUCKET).remove([filePath])
}
