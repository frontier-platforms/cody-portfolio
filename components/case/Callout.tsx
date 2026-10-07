export function Callout({ children, label = "Note" }: { children: React.ReactNode; label?: string }) {
  return (
    <aside className="border-l-2 border-accent bg-accent-subtle/60 px-6 py-4 text-base">
      <p className="label mb-1 text-accent">{label}</p>
      <div className="[&>p+p]:mt-3">{children}</div>
    </aside>
  );
}
