import { useMemo, useState } from "react";
import { useMidiStore } from "../store/midiStore";
import { detectChord } from "../utils/chordUtils";
import { midiNoteToName, getCcName } from "../utils/noteUtils";
import PianoKeyboard from "./PianoKeyboard";

function PedalIcon({ active }: { active: boolean }) {
  const c = active ? "#22d3ee" : "#27272a";
  const d = active ? 1 : 0.55;
  return (
    <svg width="34" height="26" viewBox="0 0 34 26" fill="none">
      {/* Base plate */}
      <rect
        x="1"
        y="22"
        width="32"
        height="3.5"
        rx="1.75"
        fill={c}
        opacity={active ? 0.65 : 0.3}
      />
      {/* Left support pillar */}
      <rect
        x="6.5"
        y="16.5"
        width="4"
        height="6"
        rx="1.5"
        fill={c}
        opacity={d * 0.7}
      />
      {/* Right support pillar */}
      <rect
        x="23.5"
        y="16.5"
        width="4"
        height="6"
        rx="1.5"
        fill={c}
        opacity={d * 0.7}
      />
      {/* Pedal body */}
      <rect
        x="4"
        y="8"
        width="26"
        height="11"
        rx="4"
        fill={c}
        opacity={d * 0.9}
      />
      {/* Grip lines */}
      <rect
        x="8"
        y="11.5"
        width="18"
        height="1.5"
        rx="0.75"
        fill="rgba(0,0,0,0.22)"
      />
      <rect
        x="8"
        y="14.5"
        width="18"
        height="1.5"
        rx="0.75"
        fill="rgba(0,0,0,0.22)"
      />
      {/* Indicator LED */}
      <circle
        cx="17"
        cy="4.5"
        r="3"
        fill={active ? "#22d3ee" : "#1a1a28"}
        opacity={active ? 1 : 0.6}
      />
      {active && (
        <circle cx="17" cy="4.5" r="1.3" fill="rgba(255,255,255,0.85)" />
      )}
    </svg>
  );
}

function PedalStrip() {
  const ccValues = useMidiStore((s) => s.ccValues);
  const sustain = useMidiStore((s) => s.diagnostics.sustainPedalDown);

  const pedals = [
    { cc: 64, name: "SUSTAIN", active: sustain },
    { cc: 66, name: "SOSTENUTO", active: (ccValues.get(66) ?? 0) >= 64 },
    { cc: 67, name: "SOFT PEDAL", active: (ccValues.get(67) ?? 0) >= 64 },
    { cc: 65, name: "PORTAMENTO", active: (ccValues.get(65) ?? 0) >= 64 },
  ];

  return (
    <div className="perf-pedal-strip">
      {pedals.map(({ cc, name, active }) => (
        <div
          key={cc}
          className={`perf-pedal-item${active ? " perf-pedal-item--active" : ""}`}
        >
          <PedalIcon active={active} />
          <span className="perf-pedal-label">{name}</span>
        </div>
      ))}
    </div>
  );
}

function CcFaderMini({ cc, value }: { cc: number; value: number }) {
  const isBool = [64, 65, 66, 67, 68, 69].includes(cc);
  const pct = isBool ? (value >= 64 ? 1 : 0) : value / 127;
  const name = getCcName(cc);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
      }}
    >
      <div
        style={{
          position: "relative",
          width: 12,
          height: 52,
          borderRadius: 6,
          background: "#0c0c15",
          border: "1px solid rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: `${pct * 100}%`,
            background:
              isBool && pct > 0
                ? "linear-gradient(to top, rgba(52,211,153,0.4), rgba(52,211,153,0.92))"
                : "linear-gradient(to top, rgba(34,211,238,0.25), rgba(34,211,238,0.88))",
            borderRadius: 6,
          }}
        />
      </div>
      <span
        style={{
          fontSize: 8,
          fontFamily: "monospace",
          fontWeight: 700,
          color: isBool ? (value >= 64 ? "#34d399" : "#52525b") : "#22d3ee",
          lineHeight: 1,
        }}
      >
        {isBool ? (value >= 64 ? "ON" : "—") : value}
      </span>
      <span
        style={{
          fontSize: 7,
          color: "#52525b",
          maxWidth: 40,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {name.length > 8 ? `CC${cc}` : name}
      </span>
    </div>
  );
}

function SynthWheel({
  pct,
  centered,
  label,
  color = "#22d3ee",
}: {
  pct: number;
  centered: boolean;
  label: string;
  color?: string;
}) {
  const W = 44;
  const H = 200;
  const absPct = Math.abs(pct);
  const shift = (((centered ? pct * 80 : pct * 120) % 10) + 10) % 10;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div
        style={{
          position: "relative",
          width: W,
          height: H,
          borderRadius: W / 2,
          background: "#07070e",
          boxShadow:
            "inset 0 0 30px rgba(0,0,0,0.85), 0 6px 28px rgba(0,0,0,0.6)",
          overflow: "hidden",
          border: "2px solid #16161f",
        }}
      >
        {centered ? (
          absPct > 0.02 && (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                height: `${absPct * 50}%`,
                ...(pct > 0
                  ? {
                      bottom: "50%",
                      background: `linear-gradient(to top, ${color}25, ${color}cc)`,
                    }
                  : {
                      top: "50%",
                      background: `linear-gradient(to bottom, ${color}25, ${color}cc)`,
                    }),
              }}
            />
          )
        ) : (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: `${Math.max(0, pct) * 100}%`,
              background: `linear-gradient(to top, ${color}25, ${color}cc)`,
            }}
          />
        )}

        {/* Grip texture */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `repeating-linear-gradient(
              to bottom,
              rgba(255,255,255,0.06) 0px,
              rgba(255,255,255,0.06) 1.5px,
              transparent 1.5px,
              transparent 8px
            )`,
            backgroundPositionY: `${shift}px`,
            pointerEvents: "none",
          }}
        />

        {/* 3D cylindrical highlight */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.55) 0%, rgba(255,255,255,0.04) 28%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.03) 72%, rgba(0,0,0,0.5) 100%)",
            pointerEvents: "none",
          }}
        />

        {centered && (
          <div
            style={{
              position: "absolute",
              left: 4,
              right: 4,
              top: "50%",
              height: 1.5,
              background: "rgba(255,255,255,0.28)",
              transform: "translateY(-50%)",
              borderRadius: 1,
            }}
          />
        )}

        {/* Rim */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: W / 2,
            border: "1px solid rgba(255,255,255,0.07)",
            pointerEvents: "none",
          }}
        />
      </div>
      <span
        style={{
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: "0.18em",
          textTransform: "uppercase" as const,
          color: "#3f3f46",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function CcKnobMini({ cc, value }: { cc: number; value: number }) {
  const isBool = [64, 65, 66, 67, 68, 69].includes(cc);
  const pct = isBool ? (value >= 64 ? 1 : 0) : value / 127;
  const name = getCcName(cc);

  const SIZE = 40;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const R = 14;
  const GAP = 90;
  const ARC = 360 - GAP;
  const START = 90 + GAP / 2;

  function polar(deg: number) {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: cx + R * Math.cos(rad), y: cy + R * Math.sin(rad) };
  }

  const s = polar(START);
  const e = polar(START + ARC);
  const v = polar(START + pct * ARC);
  const la = pct * ARC > 180 ? 1 : 0;
  const trackD = `M${s.x.toFixed(1)},${s.y.toFixed(1)} A${R},${R} 0 1,1 ${e.x.toFixed(1)},${e.y.toFixed(1)}`;
  const fillD =
    pct > 0.005
      ? `M${s.x.toFixed(1)},${s.y.toFixed(1)} A${R},${R} 0 ${la},1 ${v.x.toFixed(1)},${v.y.toFixed(1)}`
      : null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
      }}
    >
      <div style={{ position: "relative", width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          style={{ overflow: "visible" }}
        >
          <path
            d={trackD}
            fill="none"
            stroke="rgba(63,63,70,0.5)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {fillD && (
            <path
              d={fillD}
              fill="none"
              stroke="#22d3ee"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 8,
            fontFamily: "monospace",
            fontWeight: 700,
            color: isBool ? (value >= 64 ? "#34d399" : "#52525b") : "#22d3ee",
            lineHeight: 1,
            paddingTop: 2,
          }}
        >
          {isBool ? (value >= 64 ? "ON" : "—") : value}
        </div>
      </div>
      <span
        style={{
          fontSize: 7,
          color: "#52525b",
          maxWidth: SIZE,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {name.length > 8 ? `CC${cc}` : name}
      </span>
    </div>
  );
}

export default function PerformanceView() {
  const activeNotes = useMidiStore((s) => s.activeNotes);
  const bpm = useMidiStore((s) => s.bpm);
  const devices = useMidiStore((s) => s.devices);
  const selectedId = useMidiStore((s) => s.selectedDeviceId);
  const pitchBend = useMidiStore((s) => s.pitchBend);
  const ccValues = useMidiStore((s) => s.ccValues);
  const touchedCCs = useMidiStore((s) => s.touchedCCs);

  const [ccModes, setCcModes] = useState<Record<number, "knob" | "fader">>({});
  function toggleCcMode(cc: number) {
    setCcModes((prev) => ({
      ...prev,
      [cc]: prev[cc] === "fader" ? "knob" : "fader",
    }));
  }

  const EXCLUDED = new Set([1, 64, 65, 66, 67, 68, 69]);
  const allCcs = touchedCCs
    .filter((cc) => !EXCLUDED.has(cc))
    .map((cc) => ({ cc, value: ccValues.get(cc) ?? 0 }));

  const noteNumbers = useMemo(
    () => Array.from(activeNotes.keys()).sort((a, b) => a - b),
    [activeNotes],
  );
  const noteNames = noteNumbers.map((n) => midiNoteToName(n));
  const chord = useMemo(
    () => detectChord(noteNumbers),
    [noteNumbers.join(",")],
  );

  const deviceName =
    selectedId === null
      ? devices.length > 0
        ? `All devices (${devices.length})`
        : "No device connected"
      : (devices.find((d) => d.id === selectedId)?.name ?? selectedId);

  const modValue = ccValues.get(1) ?? 0;

  return (
    <div className="perf-shell">
      <div className="perf-topbar">
        <span className="perf-device-label">{deviceName}</span>
        <div className="flex items-center gap-5">
          {bpm !== null ? (
            <div className="perf-bpm-block">
              <span className="perf-bpm-value">{bpm}</span>
              <span className="perf-bpm-unit">BPM</span>
            </div>
          ) : (
            <span className="perf-bpm-off">— BPM</span>
          )}
        </div>
      </div>

      <div className="perf-stage">
        <div className="perf-wheels-group">
          <SynthWheel
            pct={pitchBend / 8192}
            centered
            label="PITCH"
            color="#22d3ee"
          />
          <SynthWheel
            pct={modValue / 127}
            centered={false}
            label="MOD"
            color="#a78bfa"
          />
        </div>

        <div className="perf-center">
          {noteNumbers.length === 0 ? (
            <div className="perf-standby">
              <span className="perf-standby-ring" />
              <span className="perf-standby-label">STANDBY</span>
            </div>
          ) : chord ? (
            <div className="perf-chord-display">
              {chord.root === "" ? (
                <span className="perf-chord-interval">{chord.name}</span>
              ) : (
                <>
                  <span className="perf-chord-root">{chord.root}</span>
                  {chord.symbol && (
                    <span className="perf-chord-quality">{chord.symbol}</span>
                  )}
                </>
              )}
            </div>
          ) : noteNumbers.length === 1 ? (
            <div className="perf-chord-display">
              <span className="perf-chord-root">{noteNames[0]}</span>
            </div>
          ) : (
            <div className="perf-chord-display">
              <span className="perf-chord-root perf-chord-root--cluster">
                {noteNames.join("  ")}
              </span>
            </div>
          )}

          {noteNumbers.length > 0 && (
            <div className="perf-notes-row">
              {noteNumbers.map((nn, i) => (
                <span key={nn} className="perf-note-chip">
                  {noteNames[i]}
                </span>
              ))}
            </div>
          )}
        </div>

        {allCcs.length > 0 && (
          <div className="perf-cc-panel">
            <div className="perf-cc-panel__scroll">
              {allCcs.map(({ cc, value }) => {
                const mode = ccModes[cc] ?? "knob";
                return (
                  <div key={cc} style={{ position: "relative" }}>
                    <button
                      onClick={() => toggleCcMode(cc)}
                      title={
                        mode === "knob" ? "Switch to fader" : "Switch to knob"
                      }
                      style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        width: 14,
                        height: 14,
                        borderRadius: 3,
                        background: "rgba(28,28,40,0.95)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        color: "#52525b",
                        fontSize: 8,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        padding: 0,
                        zIndex: 2,
                        lineHeight: 1,
                      }}
                    >
                      {mode === "knob" ? "F" : "K"}
                    </button>
                    {mode === "knob" ? (
                      <CcKnobMini cc={cc} value={value} />
                    ) : (
                      <CcFaderMini cc={cc} value={value} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="perf-piano-strip">
        <PianoKeyboard heightRatio={5} />
      </div>
      <PedalStrip />
    </div>
  );
}
