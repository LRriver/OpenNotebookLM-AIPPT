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
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-full bg-black/70 p-1.5 shadow-2xl ring-1 ring-white/15 backdrop-blur-md sm:right-6 sm:top-6">
        <a
          href={src}
          download={downloadName}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-neutral-950 shadow-sm transition hover:bg-primary-50"
          aria-label={t('image.download')}
          title={t('image.download')}
          onClick={(event) => event.stopPropagation()}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-neutral-950 shadow-sm transition hover:bg-primary-50"
          aria-label={t('image.close')}
          title={t('image.close')}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="flex h-full w-full items-center justify-center p-4 pt-20 sm:p-10 sm:pt-20">
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
