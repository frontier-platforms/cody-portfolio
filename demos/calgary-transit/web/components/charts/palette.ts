export const C = {
  red: "#c8102e",
  navy: "#041e42",
  teal: "#005670",
  blue: "#0057b8",
  green: "#4c8c2b",
  orange: "#dc4405",
  gold: "#f2a900",
  plum: "#642f6c",
  grey: "#6f7277",
  silver: "#b7b9bb",
  line: "#dbdcdd",
};

export const RIDER_GROUP_COLOURS: Record<string, string> = {
  Adult: C.navy,
  Youth: C.blue,
  Seniors: C.teal,
  "Post-secondary": C.green,
  "Free fare zone": C.gold,
  Other: C.plum,
  Unallocated: C.silver,
};

export const AXIS = { stroke: C.line, tick: { fill: C.grey, fontSize: 12 } };
