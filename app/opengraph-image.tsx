import { ImageResponse } from "next/og";
import { token } from "@/lib/brand-tokens";

export const alt = "Cody Chandler: I help teams grow revenue with better data and products.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Share image. ImageResponse can't read CSS variables, so colors come from tokens.css at build time. */
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 80,
        background: token("--color-bg"),
        color: token("--color-text"),
      }}
    >
      <div style={{ display: "flex", fontSize: 30, fontWeight: 600 }}>Cody Chandler</div>
      <div style={{ display: "flex", fontSize: 72, lineHeight: 1.1, maxWidth: 1000 }}>
        I help teams grow revenue with better data and products.
      </div>
      <div style={{ display: "flex", fontSize: 28, color: token("--color-text-muted") }}>
        Technology and data leader · Calgary
      </div>
    </div>,
    size,
  );
}
