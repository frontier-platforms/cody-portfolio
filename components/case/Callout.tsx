export function Callout({ children, label = "Note" }: { children: React.ReactNode; label?: string }) {
  return (
    <aside className="border-l-2 border-accent bg-accent-soft/60 px-5 py-4 text-[0.975rem]">
      <p className="label mb-1 text-accent-ink">{label}</p>
      <div className="[&>p+p]:mt-3">{children}</div>
    </aside>
  );
}
