import { ImageResponse } from "next/og";

export const alt = "BAL Ödevler";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px",
        background: "linear-gradient(135deg, #171717 0%, #32151c 58%, #a21a2a 100%)",
        color: "white",
        fontFamily: "Arial",
      }}
    >
      <div style={{ display: "flex", fontSize: 28, fontWeight: 700, color: "#ff9baa" }}>BORNOVA ANADOLU LİSESİ</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <div style={{ display: "flex", fontSize: 88, fontWeight: 900, letterSpacing: "-0.06em" }}>BAL Ödevler</div>
        <div style={{ display: "flex", maxWidth: 900, fontSize: 34, lineHeight: 1.25, color: "rgba(255,255,255,.78)" }}>Bornova Anadolu Lisesi ödevleri ve teslim tarihleri</div>
      </div>
      <div style={{ display: "flex", fontSize: 24, fontWeight: 700, color: "rgba(255,255,255,.62)" }}>balogrenci.org</div>
    </div>,
    { ...size },
  );
}
