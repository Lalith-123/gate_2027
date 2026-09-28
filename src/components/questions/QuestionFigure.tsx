import { useState } from 'react';
import { ImageOff, Maximize2, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Modal } from '@/components/common/Modal';
import { IconButton } from '@/components/common/IconButton';

/**
 * Renders a question figure. Nothing is reserved when a question has no image,
 * and a missing file degrades to an inline notice instead of a broken icon.
 */
export function QuestionFigure({
  src,
  alt,
  caption,
  className,
}: {
  src: string;
  alt?: string;
  caption?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const [zoom, setZoom] = useState(false);

  if (!src) return null;

  if (failed) {
    return (
      <div
        role="status"
        className={cn(
          'flex items-start gap-2.5 rounded-lg border border-dashed border-warn/40 bg-warn-soft/50 px-3.5 py-3 text-[13px] text-warn-ink',
          className,
        )}
      >
        <ImageOff aria-hidden className="mt-px size-4 shrink-0" />
        <div className="min-w-0">
          <p className="font-medium">Figure could not be loaded</p>
          <p className="mt-0.5 break-all text-xs opacity-80">{src}</p>
        </div>
      </div>
    );
  }

  return (
    <figure className={cn('min-w-0', className)}>
      <div className="group relative overflow-hidden rounded-lg border border-line bg-white p-2">
        <img
          src={src}
          alt={alt ?? 'Question figure'}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="mx-auto block h-auto max-h-[420px] w-auto max-w-full cursor-zoom-in object-contain"
          onClick={() => setZoom(true)}
        />
        <IconButton
          label="View figure full size"
          size="sm"
          onClick={() => setZoom(true)}
          className="absolute right-2 top-2 bg-white/85 opacity-0 shadow-sm backdrop-blur transition-opacity duration-150 group-hover:opacity-100 focus-visible:opacity-100"
        >
          <Maximize2 aria-hidden className="size-3.5" />
        </IconButton>
      </div>
      {caption && <figcaption className="mt-2 text-xs leading-relaxed text-ink-mute">{caption}</figcaption>}

      <Modal open={zoom} onClose={() => setZoom(false)} title="Figure" size="lg">
        <img
          src={src}
          alt={alt ?? 'Question figure'}
          className="mx-auto h-auto max-w-full rounded-lg border border-line bg-white p-3"
        />
        <div className="mt-3 flex justify-end">
          <IconButton label="Close" onClick={() => setZoom(false)}>
            <X aria-hidden className="size-4" />
          </IconButton>
        </div>
      </Modal>
    </figure>
  );
}
