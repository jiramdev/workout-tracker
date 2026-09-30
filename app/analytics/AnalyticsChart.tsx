// app/analytics/AnalyticsChart.tsx
"use client";

import { useState } from "react";

interface DataPoint {
  date: string;
  value: number;
}

interface AnalyticsChartProps {
  weightPoints: DataPoint[];
  strengthPoints: DataPoint[];
}

// Vloeiende cubic Bezier spline
function buildSmoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;
  if (points.length === 2) {
    return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`;
  }

  let d = `M ${points[0].x},${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }

  return d;
}

export default function AnalyticsChart({
  weightPoints,
  strengthPoints,
}: AnalyticsChartProps) {
  const [metric, setMetric] = useState<"strength" | "weight">("strength");

  const data = (metric === "strength" ? strengthPoints : weightPoints).slice(-7);

  const values = data.map((d) => d.value);
  const minVal = values.length > 0 ? Math.min(...values) : 0;
  const maxVal = values.length > 0 ? Math.max(...values) : 0;
  const range = maxVal - minVal || 1;

  const width = 300;
  const height = 120;
  const paddingY = 16;
  const paddingX = 14;

  const getX = (index: number) => {
    if (data.length <= 1) return width / 2;
    return paddingX + (index / (data.length - 1)) * (width - paddingX * 2);
  };

  const getY = (val: number) => {
    if (minVal === maxVal) return height / 2;
    const norm = (val - minVal) / range;
    return height - paddingY - norm * (height - paddingY * 2);
  };

  const coords = data.map((d, i) => ({
    x: Number(getX(i).toFixed(1)),
    y: Number(getY(d.value).toFixed(1)),
  }));

  const smoothCurve = buildSmoothPath(coords);

  const smoothArea =
    coords.length > 1
      ? `${smoothCurve} L ${coords[coords.length - 1].x},${height} L ${coords[0].x},${height} Z`
      : "";

  const latestVal = data.length > 0 ? data[data.length - 1].value : null;

  return (
    <div className="bg-[#141416] border border-white/[0.08] rounded-[34px] p-6 space-y-4 shadow-[0_16px_36px_rgba(0,0,0,0.25)]">
      {/* Top Toggle & Huidige Waarde */}
      <div className="flex items-center justify-between">
        <div className="flex items-center bg-[#1f1f23] p-1 rounded-full border border-white/[0.06]">
          <button
            onClick={() => setMetric("strength")}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase transition ${
              metric === "strength"
                ? "bg-[#baa3d0] text-[#141416]"
                : "text-[#a1a1aa] hover:text-white"
            }`}
          >
            Kracht
          </button>
          <button
            onClick={() => setMetric("weight")}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase transition ${
              metric === "weight"
                ? "bg-[#baa3d0] text-[#141416]"
                : "text-[#a1a1aa] hover:text-white"
            }`}
          >
            Gewicht
          </button>
        </div>

        <div className="text-right">
          {latestVal !== null ? (
            <>
              <span className="font-editorial text-[22px] text-white tracking-wider">
                {latestVal}
              </span>
              <span className="text-[11px] text-[#a1a1aa] font-medium ml-1">
                {metric === "strength" ? "e1RM score" : "kg"}
              </span>
            </>
          ) : (
            <span className="text-[13px] text-[#71717a] font-medium">--</span>
          )}
        </div>
      </div>

      {/* Grafiek Weergave */}
      {data.length === 0 ? (
        <div className="h-28 flex items-center justify-center text-center">
          <p className="text-[13px] text-[#71717a]">
            Nog geen {metric === "strength" ? "trainingen" : "wegingen"} gelogd
          </p>
        </div>
      ) : (
        <div className="w-full relative pt-2">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-28 overflow-visible"
          >
            <defs>
              <linearGradient id="smoothAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#baa3d0" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#baa3d0" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {coords.length > 1 && (
              <path d={smoothArea} fill="url(#smoothAreaGradient)" />
            )}

            {coords.length > 1 && (
              <path
                d={smoothCurve}
                fill="none"
                stroke="#baa3d0"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {coords.length > 0 && (
              <circle
                cx={coords[coords.length - 1].x}
                cy={coords[coords.length - 1].y}
                r="4.5"
                className="fill-[#baa3d0] stroke-[#141416] stroke-[2]"
              />
            )}
          </svg>

          <div className="flex justify-between items-center text-[10px] font-mono text-[#71717a] pt-2 px-1">
            {data.map((d, i) => (
              <span key={i}>{d.date}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}