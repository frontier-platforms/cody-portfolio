/**
 * Marks content still waiting on real details. Visible in development so gaps
 * are obvious; renders nothing in production so a draft never ships as fact.
 */
export function Todo({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production") return null;
  return (
    <span className="my-2 block border border-dashed border-accent px-3 py-2 font-mono text-xs text-accent rounded-md">
      TODO: {children}
    </span>
  );
}
