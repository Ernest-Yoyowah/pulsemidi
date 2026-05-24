import { useMidiStore } from "../store/midiStore";
import { getCcName } from "../utils/noteUtils";

const BOOL_CCS = new Set([64, 65, 66, 67, 68, 69]);
const CENTER_CCS = new Set([10, 8]);

function CcRow({ cc, value }: { cc: number; value: number }) {
  const name = getCcName(cc);
  const isBool = BOOL_CCS.has(cc);
  const isCenter = CENTER_CCS.has(cc);
  const isOn = value >= 64;

  return (
    <div className="cc-slider-row">
      <div className="flex items-center justify-between mb-1.5">
        <span
          style={{
            fontSize: 10,
            color: "#71717a",
            letterSpacing: "0.04em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              fontFamily: "monospace",
              color: "#52525b",
              marginRight: 4,
            }}
          >
            CC{cc}
          </span>
          {name}
        </span>
        <span
          style={{
            fontSize: 11,
            fontFamily: "monospace",
            fontWeight: 700,
            color: isBool ? (isOn ? "#34d399" : "#52525b") : "#22d3ee",
            flexShrink: 0,
            marginLeft: 8,
          }}
        >
          {isBool ? (isOn ? "ON" : "OFF") : value}
        </span>
      </div>

      {isBool ? (
        <div
          style={{
            height: 4,
            borderRadius: 2,
            background: isOn
              ? "linear-gradient(90deg, rgba(52,211,153,0.5), rgba(52,211,153,1))"
              : "rgba(39,39,42,0.8)",
            transition: "background 80ms",
          }}
        />
      ) : isCenter ? (
        <div
          style={{
            height: 4,
            background: "rgba(39,39,42,0.8)",
            borderRadius: 2,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {value >= 64 ? (
            <div
              style={{
                position: "absolute",
                height: "100%",
                left: "50%",
                width: `${((value - 64) / 63) * 50}%`,
                background:
                  "linear-gradient(90deg, rgba(34,211,238,0.5), rgba(34,211,238,1))",
                transition: "width 16ms linear",
              }}
            />
          ) : (
            <div
              style={{
                position: "absolute",
                height: "100%",
                right: "50%",
                width: `${((64 - value) / 64) * 50}%`,
                background:
                  "linear-gradient(270deg, rgba(34,211,238,0.5), rgba(34,211,238,1))",
                transition: "width 16ms linear",
              }}
            />
          )}
          <div
            style={{
              position: "absolute",
              inset: 0,
              left: "calc(50% - 0.5px)",
              width: 1,
              background: "rgba(99,99,102,0.6)",
              pointerEvents: "none",
            }}
          />
        </div>
      ) : (
        <div
          style={{
            height: 4,
            background: "rgba(39,39,42,0.8)",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${(value / 127) * 100}%`,
              background:
                "linear-gradient(90deg, rgba(34,211,238,0.4), rgba(34,211,238,1))",
              borderRadius: 2,
              transition: "width 16ms linear",
            }}
          />
        </div>
      )}
    </div>
  );
}

function CcKnob({ cc, value }: { cc: number; value: number }) {
  const name = getCcName(cc);
  const isBool = BOOL_CCS.has(cc);
  const pct = isBool ? (value >= 64 ? 1 : 0) : value / 127;

  const SIZE = 44;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const R = 16;
  const GAP_DEG = 90;
  const ARC_DEG = 360 - GAP_DEG;
  const START_DEG = 90 + GAP_DEG / 2;
  const END_DEG = START_DEG + ARC_DEG;

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

  const tickInner = polar(valueDeg);
  const tickInnerR = {
    x: cx + (R - 6) * Math.cos(((valueDeg - 90) * Math.PI) / 180),
    y: cy + (R - 6) * Math.sin(((valueDeg - 90) * Math.PI) / 180),
  };

  return (
    <div className="cc-knob-cell">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <path
          d={trackD}
          fill="none"
          stroke="#27272a"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {fillD && (
          <path
            d={fillD}
            fill="none"
            stroke="#22d3ee"
            strokeWidth="3"
            strokeLinecap="round"
          />
        )}
        <circle
          cx={cx}
          cy={cy}
          r="3"
          fill="#1a1a1f"
          stroke="#3f3f46"
          strokeWidth="1"
        />
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
  const viewMode = useMidiStore((s) => s.ccViewMode);

  const entries = Array.from(ccValues.entries()).sort((a, b) => a[0] - b[0]);

  return (
    <div className="card flex flex-col gap-2 h-full min-h-0">
      <div className="flex items-center justify-between">
        <h2 className="section-title">Controllers</h2>
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
