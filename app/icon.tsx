import { ImageResponse } from "next/og";
import { token } from "@/lib/brand-tokens";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** Favicon: the plain-name initials (BRAND.md section 11: no logo yet), colors from tokens.css. */
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: token("--color-accent"),
        color: token("--color-on-accent"),
        borderRadius: 6,
        fontSize: 17,
        fontWeight: 600,
        letterSpacing: -0.5,
      }}
    >
      CC
    </div>,
    size,
  );
}
