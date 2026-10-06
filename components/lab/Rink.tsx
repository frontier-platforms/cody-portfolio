/**
 * Offensive half of an NHL rink in feet, attacking the net on the right.
 * Coordinates match the NHL API: x from 0 (centre ice) to 100 (end boards),
 * y from -42.5 to 42.5. SVG y runs downward, so callers plot at (x, -y).
 */
export function RinkHalf({ children }: { children?: React.ReactNode }) {
  const line = "var(--line)";
  return (
    <>
      <path
        d="M0 -42.5 H72 A28 28 0 0 1 100 -14.5 V14.5 A28 28 0 0 1 72 42.5 H0 Z"
        fill="var(--paper)"
        stroke="var(--muted)"
        strokeWidth={0.6}
      />
      {/* centre red line, blue line, goal line */}
      <line
        x1={0.5}
        x2={0.5}
        y1={-42.5}
        y2={42.5}
        stroke="var(--flames)"
        strokeOpacity={0.35}
        strokeWidth={1}
      />
      <line x1={25} x2={25} y1={-42.5} y2={42.5} stroke="#3b82f6" strokeOpacity={0.35} strokeWidth={1} />
      <line
        x1={89}
        x2={89}
        y1={-37.5}
        y2={37.5}
        stroke="var(--flames)"
        strokeOpacity={0.35}
        strokeWidth={0.4}
      />
      {/* faceoff circles and dots */}
      {[-22, 22].map((y) => (
        <g key={y}>
          <circle cx={69} cy={y} r={15} fill="none" stroke={line} strokeWidth={0.5} />
          <circle cx={69} cy={y} r={0.9} fill="var(--flames)" fillOpacity={0.5} />
        </g>
      ))}
      {/* crease and net */}
      <path d="M89 -4 A6 6 0 0 0 89 4 Z" transform="translate(0 0)" fill="#3b82f6" fillOpacity={0.12} />
      <path
        d="M83 -4 L89 -4 M83 4 L89 4 M83 -4 A4 4 0 0 0 83 4"
        fill="none"
        stroke={line}
        strokeWidth={0.4}
      />
      <rect x={89} y={-3} width={3.3} height={6} fill="none" stroke="var(--muted)" strokeWidth={0.5} />
      {children}
    </>
  );
}
