import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Arvia — Inteligencia Inmobiliaria con IA";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "#0a0a0a",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            left: "-80px",
            width: "500px",
            height: "500px",
            background: "rgba(99,102,241,0.15)",
            borderRadius: "50%",
            filter: "blur(80px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-60px",
            right: "-60px",
            width: "400px",
            height: "400px",
            background: "rgba(168,85,247,0.12)",
            borderRadius: "50%",
            filter: "blur(80px)",
          }}
        />

        {/* Logo row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "52px",
              height: "52px",
              background: "rgba(99,102,241,0.2)",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(99,102,241,0.4)",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                stroke="#818cf8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points="9,22 9,12 15,12 15,22"
                stroke="#818cf8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span
            style={{
              fontSize: "32px",
              fontWeight: "700",
              color: "#ffffff",
              letterSpacing: "-0.5px",
            }}
          >
            ARVIA
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: "58px",
            fontWeight: "700",
            color: "#ffffff",
            textAlign: "center",
            lineHeight: 1.1,
            letterSpacing: "-1px",
            maxWidth: "900px",
          }}
        >
          Inteligencia{" "}
          <span style={{ color: "#818cf8" }}>Inmobiliaria</span>
          {" "}con IA
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "24px",
            color: "#a1a1aa",
            marginTop: "20px",
            textAlign: "center",
            maxWidth: "700px",
          }}
        >
          Búsqueda semántica · Agente WhatsApp · Gestión masiva 24/7
        </div>

        {/* Bottom badge */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "100px",
            padding: "8px 20px",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#22c55e",
            }}
          />
          <span style={{ color: "#a1a1aa", fontSize: "16px" }}>
            arvia-nu.vercel.app
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
