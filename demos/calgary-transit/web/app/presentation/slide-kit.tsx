import type { ReactNode } from "react";

export type Slide = {
  id: string;
  section?: string;
  answers?: string;
  minutes: number;
  dark?: boolean;
  body: ReactNode;
  notes: string[];
};

export function SlideFrame({ slide, index, total }: { slide: Slide; index: number; total: number }) {
  const dark = slide.dark;
  return (
    <div
      className={`relative flex h-[720px] w-[1280px] flex-col overflow-hidden ${dark ? "bg-cgy-navy text-white" : "bg-white text-cgy-charcoal"}`}
    >
      <div className="h-2 shrink-0 bg-cgy-red" />
      <div className="flex shrink-0 items-center justify-between px-16 pt-6 text-[15px] font-semibold">
        <span className={`flex items-center gap-3 ${dark ? "text-white/60" : "text-cgy-grey"}`}>
          {slide.section ?? ""}
          {slide.answers && (
            <span className={`rounded-full px-2.5 py-0.5 text-[13px] font-bold ${dark ? "bg-white/15 text-white" : "bg-cgy-mist text-cgy-navy"}`}>
              Answers {slide.answers}
            </span>
          )}
        </span>
        <span className={dark ? "text-white/60" : "text-cgy-grey"}>PRIME · Data product case study</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col px-16 pb-10 pt-4">{slide.body}</div>
      <div className={`absolute bottom-5 right-16 text-sm tabular ${dark ? "text-white/50" : "text-cgy-silver"}`}>
        {index + 1} / {total}
      </div>
    </div>
  );
}

export function Title({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return (
    <h2 className={`text-[44px] font-bold leading-tight tracking-tight ${dark ? "text-white" : "text-cgy-navy"}`}>
      {children}
    </h2>
  );
}

export function Lede({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return <p className={`mt-3 max-w-[1000px] text-[22px] leading-snug ${dark ? "text-white/85" : ""}`}>{children}</p>;
}

export function Card({
  title,
  children,
  accent = "red",
  compact = false,
  className = "",
}: {
  title: ReactNode;
  children?: ReactNode;
  accent?: "red" | "navy" | "teal" | "grey";
  compact?: boolean;
  className?: string;
}) {
  const border = { red: "border-l-cgy-red", navy: "border-l-cgy-navy", teal: "border-l-cgy-teal", grey: "border-l-cgy-silver" }[accent];
  return (
    <div className={`rounded-lg border border-cgy-line border-l-[6px] ${border} bg-white ${compact ? "px-5 py-3" : "p-5"} ${className}`}>
      <p className={`${compact ? "text-[19px]" : "text-[21px]"} font-bold text-cgy-navy`}>{title}</p>
      {children && <div className={`${compact ? "mt-1 text-[16px]" : "mt-2 text-[17px]"} leading-snug`}>{children}</div>}
    </div>
  );
}

export function BigStat({ value, label, from }: { value: string; label: string; from?: string }) {
  return (
    <div className="rounded-lg bg-cgy-paper p-6">
      {from && <p className="text-[18px] font-semibold text-cgy-grey line-through decoration-cgy-red decoration-2">{from}</p>}
      <p className="text-[52px] font-bold leading-none text-cgy-red tabular">{value}</p>
      <p className="mt-3 text-[18px] leading-snug text-cgy-navy">{label}</p>
    </div>
  );
}

export function Flow({ steps }: { steps: { label: string; title: string; detail: string; highlight?: boolean; dark?: boolean }[] }) {
  return (
    <div className="flex items-stretch">
      {steps.map((s, i) => (
        <div key={s.label} className="flex flex-1 items-stretch">
          <div
            className={`flex-1 rounded-lg border-2 p-4 ${
              s.dark ? "border-cgy-navy bg-cgy-navy text-white" : s.highlight ? "border-cgy-red bg-white" : "border-cgy-line bg-cgy-paper"
            }`}
          >
            <p className={`text-[13px] font-bold uppercase tracking-wide ${s.dark ? "text-white/70" : s.highlight ? "text-cgy-red" : "text-cgy-grey"}`}>
              {s.label}
            </p>
            <p className={`mt-1 text-[20px] font-bold leading-tight ${s.dark ? "text-white" : "text-cgy-navy"}`}>{s.title}</p>
            <p className={`mt-1 text-[15px] leading-snug ${s.dark ? "text-white/85" : ""}`}>{s.detail}</p>
          </div>
          {i < steps.length - 1 && <span className="self-center px-2 text-[26px] font-bold text-cgy-red">→</span>}
        </div>
      ))}
    </div>
  );
}
