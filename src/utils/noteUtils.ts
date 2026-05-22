const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

export function midiNoteToName(note: number): string {
  const octave = Math.floor(note / 12) - 1;
  const name = NOTE_NAMES[note % 12];
  return `${name}${octave}`;
}

export function isBlackKey(note: number): boolean {
  const semitone = note % 12;
  return [1, 3, 6, 8, 10].includes(semitone);
}

export const PIANO_MIN = 21;
export const PIANO_MAX = 108;
export const PIANO_KEY_COUNT = PIANO_MAX - PIANO_MIN + 1; // 88

const CC_NAMES: Record<number, string> = {
  0: "Bank Select",
  1: "Modulation",
  2: "Breath Control",
  4: "Foot Controller",
  5: "Portamento Time",
  6: "Data Entry MSB",
  7: "Volume",
  8: "Balance",
  10: "Pan",
  11: "Expression",
  12: "Effect Control 1",
  13: "Effect Control 2",
  32: "Bank Select LSB",
  38: "Data Entry LSB",
  64: "Sustain Pedal",
  65: "Portamento",
  66: "Sostenuto",
  67: "Soft Pedal",
  68: "Legato Footswitch",
  69: "Hold 2",
  70: "Sound Variation",
  71: "Resonance",
  72: "Release Time",
  73: "Attack Time",
  74: "Brightness",
  80: "GP Knob 1",
  81: "GP Knob 2",
  82: "GP Knob 3",
  83: "GP Knob 4",
  91: "Reverb Level",
  92: "Tremolo Level",
  93: "Chorus Level",
  94: "Detune Level",
  95: "Phaser Level",
  96: "Data Increment",
  97: "Data Decrement",
  120: "All Sound Off",
  121: "Reset All Controllers",
  122: "Local Control",
  123: "All Notes Off",
  124: "Omni Off",
  125: "Omni On",
  126: "Mono Mode",
  127: "Poly Mode",
};

export function getCcName(controller: number): string {
  return CC_NAMES[controller] ?? `CC ${controller}`;
}

export function velocityToColor(velocity: number): string {
  const ratio = velocity / 127;

  const l = 35 + Math.round(ratio * 40);
  return `hsl(185, 90%, ${l}%)`;
}

export function velocityToOpacity(velocity: number): number {
  return 0.3 + (velocity / 127) * 0.7;
}

export function decodePitchBend(lsb: number, msb: number): number {
  return ((msb << 7) | lsb) - 8192;
}

export function formatTimestamp(ts: number): string {
  const date = new Date(ts);
  const h = date.getHours().toString().padStart(2, "0");
  const m = date.getMinutes().toString().padStart(2, "0");
  const s = date.getSeconds().toString().padStart(2, "0");
  const ms = date.getMilliseconds().toString().padStart(3, "0");
  return `${h}:${m}:${s}.${ms}`;
}

export function formatRelativeTime(ts: number): string {
  const delta = Date.now() - ts;
  if (delta < 1000) return `${delta}ms ago`;
  if (delta < 60000) return `${Math.round(delta / 1000)}s ago`;
  return `${Math.round(delta / 60000)}m ago`;
}
