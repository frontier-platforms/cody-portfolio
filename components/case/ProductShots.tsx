import Image from "next/image";

/**
 * Two product visuals side by side at their natural size, stacked on phones.
 * The images are rendered from the product mockups on frontier-platforms.com.
 */
type Shot = { src: string; alt: string; width: number; height: number; label: string };

export function ProductShots({ shots, caption }: { shots: Shot[]; caption?: string }) {
  return (
    <figure className="diagram my-8">
      <div className="flex flex-col items-center gap-8 rounded-md border border-border bg-surface p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-center lg:gap-12">
        {shots.map((s) => (
          <div key={s.src} className="flex min-w-0 flex-col items-center">
            <Image src={s.src} alt={s.alt} width={s.width} height={s.height} className="h-auto max-w-full" />
            <p className="meta mt-3">{s.label}</p>
          </div>
        ))}
      </div>
      {caption && <figcaption className="mt-2 text-sm text-text-muted">{caption}</figcaption>}
    </figure>
  );
}
