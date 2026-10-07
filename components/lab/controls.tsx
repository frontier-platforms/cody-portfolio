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
          className="cursor-pointer border border-border px-3 py-1 text-sm text-text-muted transition-colors hover:text-text has-[:checked]:border-text has-[:checked]:bg-text has-[:checked]:text-bg has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent rounded-md"
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

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-r border-border bg-surface p-4">
      <dd className="num text-2xl font-regular sm:text-3xl">{value}</dd>
      <dt className="mt-1 text-xs text-text-muted">{label}</dt>
    </div>
  );
}
