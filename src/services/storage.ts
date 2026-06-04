import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from './firebase'
import type { PhotoRecord } from '../types'

export async function uploadPhoto(file: File, path: string): Promise<PhotoRecord> {
  const id = crypto.randomUUID()
  const ext = file.name.split('.').pop() ?? 'jpg'
  const storageRef = ref(storage, `${path}/${id}.${ext}`)
  await uploadBytes(storageRef, file)
  const url = await getDownloadURL(storageRef)
  return { id, url, takenAt: new Date().toISOString() }
}

export async function deletePhoto(url: string): Promise<void> {
  try {
    const photoRef = ref(storage, url)
    await deleteObject(photoRef)
  } catch {
    // ignore if already deleted
  }
}
