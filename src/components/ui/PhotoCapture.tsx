import { useRef, useState } from 'react'
import { Camera, Upload, X, Loader2 } from 'lucide-react'
import type { PhotoRecord } from '../../types'
import { uploadPhoto } from '../../services/storage'

interface Props {
  photos: PhotoRecord[]
  onPhotosChange: (photos: PhotoRecord[]) => void
  storagePath: string
}

export function PhotoCapture({ photos, onPhotosChange, storagePath }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    try {
      const uploads = await Promise.all(
        Array.from(files).map(f => uploadPhoto(f, storagePath))
      )
      onPhotosChange([...photos, ...uploads])
    } finally {
      setUploading(false)
    }
  }

  const remove = (id: string) => {
    onPhotosChange(photos.filter(p => p.id !== id))
  }

  return (
    <div className="flex flex-col gap-3">
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map(p => (
            <div key={p.id} className="relative group aspect-square">
              <img
                src={p.url}
                alt={p.caption ?? 'Photo'}
                className="w-full h-full object-cover rounded-lg cursor-pointer"
                onClick={() => setPreview(p.url)}
              />
              <button
                type="button"
                onClick={() => remove(p.id)}
                className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={uploading}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300
            py-3 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-50"
        >
          {uploading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
          Take Photo
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300
            py-3 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-50"
        >
          <Upload size={18} />
          Upload
        </button>
      </div>

      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" multiple onChange={e => handleFiles(e.target.files)} />
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" multiple onChange={e => handleFiles(e.target.files)} />

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
