import { useMemo } from "react";
import { useMidiStore } from "../store/midiStore";
import { isBlackKey, PIANO_MIN, PIANO_MAX } from "../utils/noteUtils";

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
}

function activeKeyStyle(
  velocity: number,
  isBlack: boolean,
  color: string,
): React.CSSProperties {
  const v = velocity / 127;
  const opacity = isBlack ? 0.65 + v * 0.35 : 0.60 + v * 0.40;
  const glow = Math.round(8 + v * 12);
  return {
    background: hexToRgba(color, opacity),
    boxShadow: `0 0 ${glow}px ${hexToRgba(color, 0.75)}`,
  };
}

const WHITE_KEY_W = 28;
const WHITE_KEY_H = 100;
const BLACK_KEY_W = 17;
const BLACK_KEY_H = 62;

function buildKeyLayout() {
  const layout: { note: number; x: number; isBlack: boolean }[] = [];
  let whiteX = 0;

  for (let note = PIANO_MIN; note <= PIANO_MAX; note++) {
    const black = isBlackKey(note);
    if (!black) {
      layout.push({ note, x: whiteX, isBlack: false });
      whiteX += WHITE_KEY_W;
    }
  }

  for (let note = PIANO_MIN; note <= PIANO_MAX; note++) {
    if (!isBlackKey(note)) continue;

    const prevWhite = layout.find((k) => k.note === note - 1 && !k.isBlack);
    if (prevWhite) {
      layout.push({
        note,
        x: prevWhite.x + WHITE_KEY_W - BLACK_KEY_W / 2,
        isBlack: true,
      });
    }
  }

  return layout;
}

const KEY_LAYOUT = buildKeyLayout();
const TOTAL_WHITE_KEYS = KEY_LAYOUT.filter((k) => !k.isBlack).length;
const PIANO_WIDTH = TOTAL_WHITE_KEYS * WHITE_KEY_W;

export default function PianoKeyboard() {
  const activeNotes = useMidiStore((s) => s.activeNotes);
  const activeKeyColor = useMidiStore((s) => s.activeKeyColor);

  const activeSet = useMemo(() => new Set(activeNotes.keys()), [activeNotes]);

  return (
    <div className="card overflow-x-auto">
      <h2 className="section-title mb-3">Piano Keyboard</h2>
      <div
        className="relative mx-auto"
        style={{ width: PIANO_WIDTH, height: WHITE_KEY_H + 4 }}
      >
        {KEY_LAYOUT.filter((k) => !k.isBlack).map(({ note, x }) => {
          const active = activeSet.has(note);
          const event = active ? activeNotes.get(note) : undefined;

          return (
            <div
              key={note}
              title={`Note ${note}`}
              style={{
                position: "absolute",
                left: x,
                top: 0,
                width: WHITE_KEY_W - 1,
                height: WHITE_KEY_H,
              }}
              className="rounded-b-sm border border-zinc-700"
            >
              <div
                className="w-full h-full rounded-b-sm transition-colors duration-75"
                style={
                  active
                    ? activeKeyStyle(event?.velocity ?? 80, false, activeKeyColor)
                    : { background: "#e8e8e8" }
                }
              />
            </div>
          );
        })}

        {KEY_LAYOUT.filter((k) => k.isBlack).map(({ note, x }) => {
          const active = activeSet.has(note);
          const event = active ? activeNotes.get(note) : undefined;

          return (
            <div
              key={note}
              title={`Note ${note}`}
              style={{
                position: "absolute",
                left: x,
                top: 0,
                width: BLACK_KEY_W,
                height: BLACK_KEY_H,
                zIndex: 10,
              }}
              className="rounded-b-sm"
            >
              <div
                className="w-full h-full rounded-b-sm transition-all duration-75"
                style={
                  active
                    ? activeKeyStyle(event?.velocity ?? 80, true, activeKeyColor)
                    : { background: "#1a1a1a" }
                }
              />
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-600">
        <div className="flex items-center gap-4">
          <span>A0 → C8 • 88 keys</span>
          {activeSet.size > 0 && (
            <span className="text-cyan-400">
              {activeSet.size} note{activeSet.size !== 1 ? "s" : ""} held
            </span>
          )}
        </div>
        <span className="text-zinc-700 font-mono tracking-wide">Ernest Keyz Studios</span>
      </div>
    </div>
  );
}
