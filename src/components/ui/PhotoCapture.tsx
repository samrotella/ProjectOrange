import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { Camera, Upload, X } from 'lucide-react'
import type { PhotoRecord } from '../../types'
import { uploadPhoto } from '../../services/storage'
import { uuid } from '../../utils/uuid'

interface Props {
  photos: PhotoRecord[]
  onPhotosChange: (photos: PhotoRecord[]) => void
  storagePath: string
}

interface PendingPhoto {
  localId: string
  file: File
  objectUrl: string
}

export interface PhotoCaptureHandle {
  /** Upload any photos that were selected but not yet stored, then return the full photo list. */
  uploadPending: () => Promise<PhotoRecord[]>
}

export const PhotoCapture = forwardRef<PhotoCaptureHandle, Props>(function PhotoCapture(
  { photos, onPhotosChange, storagePath },
  ref,
) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<PendingPhoto[]>([])
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const handleFiles = (files: FileList | null, inputEl: HTMLInputElement | null) => {
    if (!files?.length) return
    // Snapshot the files BEFORE touching the input: `files` is the input's live
    // FileList, so resetting input.value below would otherwise empty it.
    const fileArray = Array.from(files)
    // Reset input so iOS camera can be triggered again immediately
    if (inputEl) inputEl.value = ''
    setError(null)

    // Hold the files locally and show previews; actual upload happens on save.
    const additions: PendingPhoto[] = fileArray.map(f => ({
      localId: uuid(),
      file: f,
      objectUrl: URL.createObjectURL(f),
    }))
    setPending(prev => [...prev, ...additions])
  }

  const removeUploaded = (id: string) => {
    onPhotosChange(photos.filter(p => p.id !== id))
  }

  const removePending = (localId: string) => {
    setPending(prev => {
      const target = prev.find(p => p.localId === localId)
      if (target) URL.revokeObjectURL(target.objectUrl)
      return prev.filter(p => p.localId !== localId)
    })
  }

  useImperativeHandle(ref, () => ({
    uploadPending: async () => {
      if (pending.length === 0) return photos
      try {
        const uploaded = await Promise.all(pending.map(p => uploadPhoto(p.file, storagePath)))
        const next = [...photos, ...uploaded]
        pending.forEach(p => URL.revokeObjectURL(p.objectUrl))
        setPending([])
        onPhotosChange(next)
        return next
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed. Check that your Supabase "photos" bucket exists and is public.')
        throw err
      }
    },
  }), [pending, photos, storagePath, onPhotosChange])

  const allThumbs = [
    ...photos.map(p => ({ id: p.id, url: p.url, pending: false })),
    ...pending.map(p => ({ id: p.localId, url: p.objectUrl, pending: true })),
  ]

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-gray-700">Photos</span>

      {allThumbs.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {allThumbs.map(p => (
            <div key={p.id} className="relative group aspect-square">
              <img
                src={p.url}
                alt="Photo"
                className="w-full h-full object-cover rounded-lg cursor-pointer"
                onClick={() => setPreview(p.url)}
              />
              {p.pending && (
                <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                  Not saved
                </span>
              )}
              <button
                type="button"
                onClick={() => (p.pending ? removePending(p.id) : removeUploaded(p.id))}
                className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300
            py-3 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
        >
          <Camera size={18} />
          Take Photo
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300
            py-3 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
        >
          <Upload size={18} />
          Upload Photo
        </button>
      </div>

      {/* capture="environment" is single-shot on iOS; value reset above lets users retrigger */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => handleFiles(e.target.files, e.target)}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => handleFiles(e.target.files, e.target)}
      />

      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <img src={preview} className="max-w-full max-h-full rounded-xl object-contain" />
          <button className="absolute top-4 right-4 text-white" onClick={() => setPreview(null)}>
            <X size={28} />
          </button>
        </div>
      )}
    </div>
  )
})
