export function StackList({ items, className = "" }: { items: string[]; className?: string }) {
  return (
    <ul className={`flex flex-wrap gap-2 ${className}`} aria-label="Tools and technologies">
      {items.map((item) => (
        <li
          key={item}
          className="border border-border px-2 py-1 font-mono text-xs text-text-muted rounded-md"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
