import { useMemo } from "react";
import { useMidiStore } from "../store/midiStore";
import { detectChord } from "../utils/chordUtils";
import { midiNoteToName, getCcName } from "../utils/noteUtils";
import PianoKeyboard from "./PianoKeyboard";

function SustainPedalIcon() {
  return (
    <svg
      width="22"
      height="16"
      viewBox="0 0 22 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Sustain pedal active"
    >
      <rect x="3" y="10" width="16" height="3" rx="1.5" fill="#22d3ee" />
      <rect x="10" y="2" width="2" height="8" rx="1" fill="#22d3ee" />
      <rect
        x="1"
        y="13"
        width="20"
        height="2"
        rx="1"
        fill="#22d3ee"
        opacity="0.5"
      />
    </svg>
  );
}

function PitchBendWheel({ value }: { value: number }) {
  const pct = Math.max(-1, Math.min(1, value / 8192));
  const isUp = pct > 0;
  const absPct = Math.abs(pct);
  const hasMovement = absPct > 0.02;

  return (
    <div className="perf-wheel-col">
      <div className="perf-wheel-track">
        {hasMovement && (
          <div
            className="perf-wheel-fill"
            style={{
              height: `${absPct * 50}%`,
              ...(isUp
                ? { bottom: "50%", background: "rgba(34,211,238,0.85)" }
                : { top: "50%", background: "rgba(251,191,36,0.85)" }),
            }}
          />
        )}
        <div className="perf-wheel-center" />
      </div>
      <span className="perf-wheel-label">PITCH</span>
    </div>
  );
}

function CcBar({ value, label }: { value: number; label: string }) {
  const pct = (Math.max(0, Math.min(127, value)) / 127) * 100;
  return (
    <div className="perf-wheel-col">
      <div className="perf-wheel-track">
        <div
          className="perf-wheel-fill"
          style={{
            height: `${pct}%`,
            bottom: 0,
            background: "rgba(34,211,238,0.65)",
          }}
        />
      </div>
      <span className="perf-wheel-label">{label}</span>
    </div>
  );
}

export default function PerformanceView() {
  const activeNotes = useMidiStore((s) => s.activeNotes);
  const bpm = useMidiStore((s) => s.bpm);
  const devices = useMidiStore((s) => s.devices);
  const sustain = useMidiStore((s) => s.diagnostics.sustainPedalDown);
  const selectedId = useMidiStore((s) => s.selectedDeviceId);
  const pitchBend = useMidiStore((s) => s.pitchBend);
  const ccValues = useMidiStore((s) => s.ccValues);
  const touchedCCs = useMidiStore((s) => s.touchedCCs);

  const EXCLUDED = new Set([1, 64, 65, 66, 67, 68, 69]);
  const rightBars = touchedCCs
    .filter((cc) => !EXCLUDED.has(cc))
    .slice(0, 2)
    .map((cc) => ({ cc, label: getCcName(cc), value: ccValues.get(cc) ?? 0 }));

  const noteNumbers = useMemo(
    () => Array.from(activeNotes.keys()).sort((a, b) => a - b),
    [activeNotes],
  );
  const noteNames = noteNumbers.map((n) => midiNoteToName(n));
  const chord = useMemo(
    () => detectChord(noteNumbers),
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          {sustain && (
            <span className="perf-sustain-icon" title="Sustain pedal active">
              <SustainPedalIcon />
            </span>
          )}
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
          <PitchBendWheel value={pitchBend} />
          <CcBar value={modValue} label="MOD" />
        </div>

        <div className="perf-center">
          {noteNumbers.length === 0 ? (
            <div className="perf-standby">
              <span className="perf-standby-ring" />
              <span className="perf-standby-label">STANDBY</span>
            </div>
          ) : chord ? (
            <div className="perf-chord-display">
              <span className="perf-chord-root">{chord.root}</span>
              {chord.symbol && (
                <span className="perf-chord-quality">{chord.symbol}</span>
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

        {rightBars.length > 0 && (
          <div className="perf-wheels-group">
            {rightBars.map(({ cc, label, value }) => (
              <CcBar key={cc} value={value} label={label} />
            ))}
          </div>
        )}
      </div>

      <div className="perf-piano-strip">
        <PianoKeyboard />
      </div>
    </div>
  );
}
