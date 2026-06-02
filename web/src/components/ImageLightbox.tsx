import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useUiPreferences } from '../contexts/useUiPreferences'

interface ImageLightboxProps {
  isOpen: boolean
  src: string
  alt: string
  downloadName: string
  onClose: () => void
}

function ImageLightbox({ isOpen, src, alt, downloadName, onClose }: ImageLightboxProps) {
  const { t } = useUiPreferences()

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[120] bg-black/88 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
      data-testid="image-lightbox"
    >
      <div className="absolute right-5 top-5 z-10 flex items-center gap-3">
        <a
          href={src}
          download={downloadName}
          className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/12 text-white ring-1 ring-white/20 transition hover:bg-white/22"
          aria-label={t('image.download')}
          title={t('image.download')}
          onClick={(event) => event.stopPropagation()}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14"
            />
          </svg>
        </a>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/12 text-white ring-1 ring-white/20 transition hover:bg-white/22"
          aria-label={t('image.close')}
          title={t('image.close')}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="flex h-full w-full items-center justify-center p-6 sm:p-10">
        <img
          src={src}
          alt={alt}
          className="max-h-full max-w-full rounded-2xl object-contain shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
          onClick={(event) => event.stopPropagation()}
        />
      </div>
    </div>,
    document.body
  )
}

export default ImageLightbox
