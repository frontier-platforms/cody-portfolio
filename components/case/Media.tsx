import Image from "next/image";

type MediaProps = {
  /** Path under /public, e.g. "/media/prime/pipeline.png" or ".mp4". Omit for a placeholder. */
  src?: string;
  alt: string;
  caption?: string;
  /** Intrinsic size; used to reserve space and avoid layout shift. */
  width?: number;
  height?: number;
  poster?: string;
};

/**
 * Screenshot or short screen recording inside a case study. Videos are muted,
 * looped and lazy so they behave like animated screenshots. With no src it
 * renders a labelled placeholder so the layout is ready before the asset is.
 */
export function Media({ src, alt, caption, width = 1600, height = 1000, poster }: MediaProps) {
  const isVideo = src?.match(/\.(mp4|webm)$/);

  return (
    <figure className="not-prose my-12 lg:-mx-12">
      <div className="overflow-hidden border border-border bg-surface rounded-md">
        {!src ? (
          <div
            className="grid place-items-center bg-[repeating-linear-gradient(135deg,transparent_0_10px,var(--color-border)_10px_11px)] text-center"
            style={{ aspectRatio: `${width} / ${height}` }}
          >
            <span className="label bg-bg px-2 py-1">Media placeholder · {alt}</span>
          </div>
        ) : isVideo ? (
          <video
            src={src}
            poster={poster}
            width={width}
            height={height}
            muted
            loop
            playsInline
            autoPlay
            preload="none"
            aria-label={alt}
            className="h-auto w-full"
          />
        ) : (
          <Image src={src} alt={alt} width={width} height={height} className="h-auto w-full" />
        )}
      </div>
      {caption && <figcaption className="mt-2 text-sm text-text-muted">{caption}</figcaption>}
    </figure>
  );
}
