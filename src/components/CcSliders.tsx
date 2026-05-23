import { useState } from "react";
import { useMidiStore } from "../store/midiStore";
import { getCcName } from "../utils/noteUtils";

// CCs that behave as boolean on/off switches
const BOOL_CCS = new Set([64, 65, 66, 67, 68, 69]);
// CCs where center (64) = neutral, displayed as a bidirectional bar
const CENTER_CCS = new Set([10, 8]);

function CcRow({ cc, value }: { cc: number; value: number }) {
  const name = getCcName(cc);
  const isBool = BOOL_CCS.has(cc);
  const isCenter = CENTER_CCS.has(cc);
  const isOn = value >= 64;

  return (
    <div className="cc-slider-row">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[10px] text-zinc-500 truncate leading-none">
          <span className="font-mono text-zinc-600 mr-1">CC{cc}</span>
          {name}
        </span>
        <span className="text-[10px] font-mono text-cyan-400 shrink-0 ml-1">
          {isBool ? (isOn ? "ON" : "OFF") : value}
        </span>
      </div>

      {isBool ? (
        <div
          className={`h-1.5 rounded-full transition-all duration-[16ms] ${
            isOn ? "bg-cyan-500" : "bg-zinc-700"
          }`}
        />
      ) : isCenter ? (
        /* Bidirectional bar — neutral at 50% */
        <div className="h-1.5 bg-zinc-800 rounded-full relative overflow-hidden">
          {value >= 64 ? (
            <div
              className="absolute h-full bg-cyan-500 transition-all duration-[16ms]"
              style={{
                left: "50%",
                width: `${((value - 64) / 63) * 50}%`,
              }}
            />
          ) : (
            <div
              className="absolute h-full bg-cyan-500 transition-all duration-[16ms]"
              style={{
                right: "50%",
                width: `${((64 - value) / 64) * 50}%`,
              }}
            />
          )}
          {/* Center tick */}
          <div className="absolute inset-y-0 left-1/2 w-px bg-zinc-600 pointer-events-none" />
        </div>
      ) : (
        /* Standard 0–127 bar */
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-500 rounded-full transition-all duration-[16ms]"
            style={{ width: `${(value / 127) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}

// SVG rotary knob (≃270° arc, 7 o’clock to 5 o’clock)
function CcKnob({ cc, value }: { cc: number; value: number }) {
  const name = getCcName(cc);
  const isBool = BOOL_CCS.has(cc);
  const pct = isBool ? (value >= 64 ? 1 : 0) : value / 127;

  const SIZE = 44;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const R = 16;
  const GAP_DEG = 90; // gap at bottom
  const ARC_DEG = 360 - GAP_DEG; // 270°
  const START_DEG = 90 + GAP_DEG / 2; // 135° (7 o’clock)
  const END_DEG = START_DEG + ARC_DEG; // 405° = 45° (5 o’clock)

  function polar(angleDeg: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + R * Math.cos(rad), y: cy + R * Math.sin(rad) };
  }

  const startPt = polar(START_DEG);
  const endPt = polar(END_DEG);
  const trackD = `M${startPt.x.toFixed(2)},${startPt.y.toFixed(2)} A${R},${R} 0 1,1 ${endPt.x.toFixed(2)},${endPt.y.toFixed(2)}`;

  const valueDeg = START_DEG + pct * ARC_DEG;
  const valuePt = polar(valueDeg);
  const largeArc = valueDeg - START_DEG > 180 ? 1 : 0;
  const fillD =
    pct > 0.005
      ? `M${startPt.x.toFixed(2)},${startPt.y.toFixed(2)} A${R},${R} 0 ${largeArc},1 ${valuePt.x.toFixed(2)},${valuePt.y.toFixed(2)}`
      : null;

  // Indicator tick
  const tickInner = polar(valueDeg);
  const tickInnerR = {
    x: cx + (R - 6) * Math.cos(((valueDeg - 90) * Math.PI) / 180),
    y: cy + (R - 6) * Math.sin(((valueDeg - 90) * Math.PI) / 180),
  };

  return (
    <div className="cc-knob-cell">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {/* Track */}
        <path
          d={trackD}
          fill="none"
          stroke="#27272a"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Fill */}
        {fillD && (
          <path
            d={fillD}
            fill="none"
            stroke="#22d3ee"
            strokeWidth="3"
            strokeLinecap="round"
          />
        )}
        {/* Center dot */}
        <circle
          cx={cx}
          cy={cy}
          r="3"
          fill="#1a1a1f"
          stroke="#3f3f46"
          strokeWidth="1"
        />
        {/* Indicator */}
        <line
          x1={tickInnerR.x.toFixed(2)}
          y1={tickInnerR.y.toFixed(2)}
          x2={tickInner.x.toFixed(2)}
          y2={tickInner.y.toFixed(2)}
          stroke="#22d3ee"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <span className="cc-knob-value">{value}</span>
      <span className="cc-knob-name">
        CC{cc} {name}
      </span>
    </div>
  );
}

export default function CcSliders() {
  const ccValues = useMidiStore((s) => s.ccValues);
  const [viewMode, setViewMode] = useState<"sliders" | "knobs">("sliders");

  const entries = Array.from(ccValues.entries()).sort((a, b) => a[0] - b[0]);

  return (
    <div className="card flex flex-col gap-2 h-full min-h-0">
      <div className="flex items-center justify-between">
        <h2 className="section-title">Controllers</h2>
        <div className="view-toggle">
          <button
            className={`view-toggle__btn ${viewMode === "sliders" ? "view-toggle__btn--active" : ""}`}
            onClick={() => setViewMode("sliders")}
            title="Slider view"
          >
            &#9776;
          </button>
          <button
            className={`view-toggle__btn ${viewMode === "knobs" ? "view-toggle__btn--active" : ""}`}
            onClick={() => setViewMode("knobs")}
            title="Knob view"
          >
            &#9711;
          </button>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-zinc-600 text-center leading-relaxed">
            Move a knob or slider
            <br />
            to see live values
          </p>
        </div>
      ) : viewMode === "knobs" ? (
        <div className="cc-knob-grid overflow-y-auto flex-1 min-h-0 scrollbar-thin pr-0.5 pt-1">
          {entries.map(([cc, value]) => (
            <CcKnob key={cc} cc={cc} value={value} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2 overflow-y-auto flex-1 min-h-0 scrollbar-thin pr-0.5">
          {entries.map(([cc, value]) => (
            <CcRow key={cc} cc={cc} value={value} />
          ))}
        </div>
      )}
    </div>
  );
}
