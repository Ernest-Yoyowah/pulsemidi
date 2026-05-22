import { useMemo } from "react";
import { useMidiStore } from "../store/midiStore";
import {
  isBlackKey,
  PIANO_MIN,
  PIANO_MAX,
  velocityToOpacity,
} from "../utils/noteUtils";

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
          const opacity =
            event?.velocity !== undefined
              ? velocityToOpacity(event.velocity)
              : 0;

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
                    ? {
                        background: `rgba(0, 210, 220, ${opacity})`,
                        boxShadow: `0 0 8px rgba(0, 210, 220, ${opacity * 0.8})`,
                      }
                    : { background: "#e8e8e8" }
                }
              />
            </div>
          );
        })}

        {KEY_LAYOUT.filter((k) => k.isBlack).map(({ note, x }) => {
          const active = activeSet.has(note);
          const event = active ? activeNotes.get(note) : undefined;
          const opacity =
            event?.velocity !== undefined
              ? velocityToOpacity(event.velocity)
              : 0;

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
                className="w-full h-full rounded-b-sm transition-colors duration-75"
                style={
                  active
                    ? {
                        background: `rgba(0, 210, 220, ${opacity})`,
                        boxShadow: `0 0 10px rgba(0, 210, 220, ${opacity})`,
                      }
                    : { background: "#1a1a1a" }
                }
              />
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex items-center gap-4 text-[10px] text-zinc-600">
        <span>A0 → C8 • 88 keys</span>
        {activeSet.size > 0 && (
          <span className="text-cyan-400">
            {activeSet.size} note{activeSet.size !== 1 ? "s" : ""} held
          </span>
        )}
      </div>
    </div>
  );
}
