import { useRef, useState } from 'react'
import { Camera, Upload, X, Loader2 } from 'lucide-react'
import type { PhotoRecord } from '../../types'
import { uploadPhoto } from '../../services/storage'

interface Props {
  photos: PhotoRecord[]
  onPhotosChange: (photos: PhotoRecord[]) => void
  storagePath: string
}

interface PendingPhoto {
  localId: string
  objectUrl: string
}

export function PhotoCapture({ photos, onPhotosChange, storagePath }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<PendingPhoto[]>([])
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const handleFiles = async (files: FileList | null, inputEl: HTMLInputElement | null) => {
    if (!files?.length) return
    // Reset input so iOS camera can be triggered again immediately
    if (inputEl) inputEl.value = ''

    setError(null)
    const fileArray = Array.from(files)

    // Show local previews right away
    const previews: PendingPhoto[] = fileArray.map(f => ({
      localId: crypto.randomUUID(),
      objectUrl: URL.createObjectURL(f),
    }))
    setPending(prev => [...prev, ...previews])

    try {
      const uploads = await Promise.all(
        fileArray.map(f => uploadPhoto(f, storagePath))
      )
      onPhotosChange([...photos, ...uploads])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Check that your Supabase "photos" bucket exists and is public.')
    } finally {
      setPending(prev => prev.filter(p => !previews.find(q => q.localId === p.localId)))
      previews.forEach(p => URL.revokeObjectURL(p.objectUrl))
    }
  }

  const remove = (id: string) => {
    onPhotosChange(photos.filter(p => p.id !== id))
  }

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
                onClick={() => !p.pending && setPreview(p.url)}
              />
              {p.pending && (
                <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                  <Loader2 size={20} className="text-white animate-spin" />
                </div>
              )}
              {!p.pending && (
                <button
                  type="button"
                  onClick={() => remove(p.id)}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              )}
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
          Upload
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
}
