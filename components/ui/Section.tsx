/** BRAND.md section 6, section header: a small mono label above an h2 in the display face. */
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
  const headingId = id ? `${id}-heading` : undefined;
  return (
    <section id={id} aria-labelledby={headingId} className={`mx-auto max-w-site px-4 sm:px-6 ${className}`}>
      <div className="mb-8 border-t border-border pt-4">
        {index && <p className="label">{index}</p>}
        <h2 id={headingId} className="mt-2 text-2xl sm:text-3xl">
          {label}
        </h2>
      </div>
      {children}
    </section>
  );
}
