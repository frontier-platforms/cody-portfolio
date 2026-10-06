/** Page section with the numbered mono label ("01 / Work") that runs through the site. */
export function Section({
  index,
  label,
  id,
  children,
  className = "",
}: {
  index?: string;
  label: string;
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const headingId = id ? `${id}-label` : undefined;
  return (
    <section id={id} aria-labelledby={headingId} className={`mx-auto max-w-6xl px-4 sm:px-6 ${className}`}>
      <div className="mb-8 flex items-center gap-3 border-t border-ink pt-3">
        <p id={headingId} className="label text-ink">
          {index && <span className="text-accent">{index} / </span>}
          {label}
        </p>
      </div>
      {children}
    </section>
  );
}
