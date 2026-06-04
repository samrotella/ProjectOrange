import { supabase } from './supabase'
import type { PhotoRecord } from '../types'
import { uuid } from '../utils/uuid'

const BUCKET = 'photos'

export async function uploadPhoto(file: File, path: string): Promise<PhotoRecord> {
  // path must be non-empty and must not contain empty UUID-like segments.
  // Supabase storage RLS policies commonly cast the first path segment to uuid,
  // so paths are structured as "{orgId}/assets/..." or "{orgId}/buildings/...".
  if (!path || path.includes('//') || path.startsWith('/')) {
    throw new Error('Cannot upload: user session not ready. Please wait a moment and try again.')
  }
  const segments = path.split('/')
  if (segments.some(s => s === '')) {
    throw new Error('Cannot upload: invalid storage path (empty segment). Please reload and try again.')
  }

  const id = uuid()
  const mime = file.type || 'image/jpeg'
  const ext = mime === 'image/jpeg' ? 'jpg' : (mime.split('/')[1] ?? 'jpg')
  const filePath = `${path}/${id}.${ext}`

  console.debug('[storage] uploading', { filePath, mime, size: file.size })

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
