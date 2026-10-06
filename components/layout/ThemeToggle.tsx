"use client";

export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Storage can be blocked; the toggle still works for this visit.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="grid size-9 place-items-center text-muted transition-colors hover:text-ink"
    >
      <svg viewBox="0 0 20 20" className="size-[18px]" aria-hidden>
        <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 3a7 7 0 0 1 0 14Z" fill="currentColor" />
      </svg>
    </button>
  );
}
