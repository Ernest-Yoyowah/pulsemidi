import { useEffect, useMemo, useRef, useState } from "react";
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
  const opacity = isBlack ? 0.65 + v * 0.5 : 0.6 + v * 0.4;
  return {
    background: hexToRgba(color, opacity),
  };
}

// Build layout storing normalized white-key index (not absolute px)
function buildKeyLayout() {
  const layout: { note: number; whiteIdx: number; isBlack: boolean }[] = [];
  let whiteIdx = 0;
  const whiteMap = new Map<number, number>();

  for (let note = PIANO_MIN; note <= PIANO_MAX; note++) {
    if (!isBlackKey(note)) {
      whiteMap.set(note, whiteIdx);
      layout.push({ note, whiteIdx, isBlack: false });
      whiteIdx++;
    }
  }

  for (let note = PIANO_MIN; note <= PIANO_MAX; note++) {
    if (!isBlackKey(note)) continue;
    const prevIdx = whiteMap.get(note - 1);
    if (prevIdx !== undefined) {
      layout.push({ note, whiteIdx: prevIdx, isBlack: true });
    }
  }

  return layout;
}

const KEY_LAYOUT = buildKeyLayout();
const TOTAL_WHITE_KEYS = KEY_LAYOUT.filter((k) => !k.isBlack).length;

export default function PianoKeyboard({
  heightRatio = 3.2,
}: {
  heightRatio?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(0);
  const activeNotes = useMidiStore((s) => s.activeNotes);
  const activeKeyColor = useMidiStore((s) => s.activeKeyColor);

  const activeSet = useMemo(() => new Set(activeNotes.keys()), [activeNotes]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setContainerW(e.contentRect.width));
    ro.observe(el);
    setContainerW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const keyW = containerW > 0 ? Math.floor(containerW / TOTAL_WHITE_KEYS) : 14;
  const keyH = Math.max(48, Math.round(keyW * heightRatio));
  const blackW = Math.max(6, Math.round(keyW * 0.6));
  const blackH = Math.round(keyH * 0.62);

  return (
    <div className="card overflow-hidden" ref={containerRef}>
      <h2 className="section-title mb-3">Piano Keyboard</h2>
      <div className="relative" style={{ width: "100%", height: keyH + 4 }}>
        {KEY_LAYOUT.filter((k) => !k.isBlack).map(({ note, whiteIdx }) => {
          const active = activeSet.has(note);
          const event = active ? activeNotes.get(note) : undefined;

          return (
            <div
              key={note}
              title={`Note ${note}`}
              style={{
                position: "absolute",
                left: whiteIdx * keyW,
                top: 0,
                width: keyW - 1,
                height: keyH,
              }}
              className="rounded-b-sm border border-zinc-700"
            >
              <div
                className="w-full h-full rounded-b-sm transition-colors duration-75"
                style={
                  active
                    ? activeKeyStyle(
                        event?.velocity ?? 80,
                        false,
                        activeKeyColor,
                      )
                    : { background: "#e8e8e8" }
                }
              />
            </div>
          );
        })}

        {KEY_LAYOUT.filter((k) => k.isBlack).map(({ note, whiteIdx }) => {
          const active = activeSet.has(note);
          const event = active ? activeNotes.get(note) : undefined;

          return (
            <div
              key={note}
              title={`Note ${note}`}
              style={{
                position: "absolute",
                left: whiteIdx * keyW + keyW - Math.round(blackW / 2),
                top: 0,
                width: blackW,
                height: blackH,
                zIndex: 10,
              }}
              className="rounded-b-sm"
            >
              <div
                className="w-full h-full rounded-b-sm transition-all duration-75"
                style={
                  active
                    ? activeKeyStyle(
                        event?.velocity ?? 80,
                        true,
                        activeKeyColor,
                      )
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
        <span className="text-zinc-700 font-mono tracking-wide">
          Ernest Keyz Studios
        </span>
      </div>
    </div>
  );
}
