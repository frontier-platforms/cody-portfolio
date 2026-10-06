import { ImageResponse } from "next/og";

export const alt = "Cody Chandler: data, product and growth";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "#faf8f4",
        color: "#1a1814",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 28, color: "#6b655c" }}>
        <div style={{ width: 18, height: 18, background: "#c2410c" }} />
        cody chandler · calgary
      </div>
      <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2, maxWidth: 980 }}>
        I connect the data stack to the revenue it’s meant to drive.
      </div>
      <div style={{ display: "flex", gap: 48, fontSize: 28, color: "#6b655c" }}>
        <span>Data</span>
        <span>Product</span>
        <span>Growth</span>
        <span>AI</span>
      </div>
    </div>,
    size,
  );
}
