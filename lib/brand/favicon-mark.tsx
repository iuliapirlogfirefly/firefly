import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { ImageResponse } from "next/og";

export const FAVICON_BG = "#141416";
export const FAVICON_FG = "#FEF7A3";

export function FaviconMark({ size }: { size: number }) {
  const fontSize = Math.round(size * 0.72);
  const glowSize = Math.round(size * 0.58);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: FAVICON_BG,
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: Math.round(size * 0.06),
          width: glowSize,
          height: glowSize,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(254,247,163,0.75) 0%, rgba(254,247,163,0.18) 42%, rgba(254,247,163,0) 70%)",
        }}
      />
      <div
        style={{
          display: "flex",
          fontFamily: "Limelight",
          fontSize,
          color: FAVICON_FG,
          lineHeight: 1,
          marginTop: Math.round(size * 0.04),
        }}
      >
        f
      </div>
    </div>
  );
}

export async function loadLimelightFont() {
  return readFile(
    fileURLToPath(new URL("./fonts/Limelight-Regular.ttf", import.meta.url))
  );
}

export async function faviconImageResponse(size: number) {
  const font = await loadLimelightFont();

  return new ImageResponse(<FaviconMark size={size} />, {
    width: size,
    height: size,
    fonts: [
      {
        name: "Limelight",
        data: font,
        style: "normal",
        weight: 400,
      },
    ],
  });
}
