import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "32px",
          height: "32px",
          background: "#0a0a0a",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "22px",
            height: "22px",
            background: "rgba(99,102,241,0.25)",
            borderRadius: "5px",
            border: "1.5px solid rgba(99,102,241,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: "13px",
              fontWeight: "700",
              color: "#818cf8",
            }}
          >
            A
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
