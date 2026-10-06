"use client";

/** Segmented control built on radio inputs, so arrow keys and screen readers work natively. */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const name = label.toLowerCase().replace(/\W+/g, "-");
  return (
    <fieldset className="flex flex-wrap gap-1">
      <legend className="sr-only">{label}</legend>
      {options.map((o) => (
        <label
          key={o.value}
          className="cursor-pointer border border-line px-2.5 py-1 text-sm text-muted transition-colors hover:text-ink has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-paper has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent"
        >
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
            className="sr-only"
          />
          {o.label}
        </label>
      ))}
    </fieldset>
  );
}

export function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="border-b border-r border-line bg-surface p-4">
      <dd className="num text-2xl font-medium sm:text-3xl" style={accent ? { color: accent } : undefined}>
        {value}
      </dd>
      <dt className="mt-1 text-xs text-muted">{label}</dt>
    </div>
  );
}
