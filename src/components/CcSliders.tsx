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
          className={`h-1.5 rounded-full transition-all duration-75 ${
            isOn ? "bg-cyan-500" : "bg-zinc-700"
          }`}
        />
      ) : isCenter ? (
        /* Bidirectional bar — neutral at 50% */
        <div className="h-1.5 bg-zinc-800 rounded-full relative overflow-hidden">
          {value >= 64 ? (
            <div
              className="absolute h-full bg-cyan-500 transition-all duration-75"
              style={{
                left: "50%",
                width: `${((value - 64) / 63) * 50}%`,
              }}
            />
          ) : (
            <div
              className="absolute h-full bg-cyan-500 transition-all duration-75"
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
            className="h-full bg-cyan-500 rounded-full transition-all duration-75"
            style={{ width: `${(value / 127) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default function CcSliders() {
  const ccValues = useMidiStore((s) => s.ccValues);

  const entries = Array.from(ccValues.entries()).sort((a, b) => a[0] - b[0]);

  return (
    <div className="card flex flex-col gap-2 h-full min-h-0">
      <h2 className="section-title">Controllers</h2>

      {entries.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-zinc-600 text-center leading-relaxed">
            Move a knob or slider
            <br />
            to see live values
          </p>
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
