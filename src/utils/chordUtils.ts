const SHARP_NAMES = [
  "C",
  "C#",
  "D",
  "Eb",
  "E",
  "F",
  "F#",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
] as const;

const FLAT_NAMES: Record<number, string> = {
  1: "Db",
  3: "Eb",
  6: "Gb",
  8: "Ab",
  10: "Bb",
};

function rootName(pc: number): string {
  return FLAT_NAMES[pc] ?? SHARP_NAMES[pc];
}

type ChordType = {
  symbol: string;
  required: number;
  optional: number;
  priority: number;
  minNotes: number;
  allowSlash: boolean;
};

function mask(intervals: readonly number[]): number {
  let out = 0;

  for (const i of intervals) {
    out |= 1 << i;
  }

  return out;
}

const CHORD_TYPES: readonly ChordType[] = [
  {
    symbol: "sus4",
    required: mask([0, 5, 7]),
    optional: 0,
    priority: 1000,
    minNotes: 3,
    allowSlash: false,
  },
  {
    symbol: "sus2",
    required: mask([0, 2, 7]),
    optional: 0,
    priority: 990,
    minNotes: 3,
    allowSlash: false,
  },
  {
    symbol: "",
    required: mask([0, 4, 7]),
    optional: 0,
    priority: 980,
    minNotes: 3,
    allowSlash: false,
  },
  {
    symbol: "m",
    required: mask([0, 3, 7]),
    optional: 0,
    priority: 970,
    minNotes: 3,
    allowSlash: false,
  },
  {
    symbol: "dim",
    required: mask([0, 3, 6]),
    optional: 0,
    priority: 960,
    minNotes: 3,
    allowSlash: false,
  },
  {
    symbol: "aug",
    required: mask([0, 4, 8]),
    optional: 0,
    priority: 950,
    minNotes: 3,
    allowSlash: false,
  },
  {
    symbol: "5",
    required: mask([0, 7]),
    optional: 0,
    priority: 940,
    minNotes: 2,
    allowSlash: false,
  },
  {
    symbol: "7",
    required: mask([0, 4, 7, 10]),
    optional: 0,
    priority: 930,
    minNotes: 4,
    allowSlash: true,
  },
  {
    symbol: "maj7",
    required: mask([0, 4, 7, 11]),
    optional: 0,
    priority: 920,
    minNotes: 4,
    allowSlash: true,
  },
  {
    symbol: "m7",
    required: mask([0, 3, 7, 10]),
    optional: 0,
    priority: 910,
    minNotes: 4,
    allowSlash: true,
  },
  {
    symbol: "m7b5",
    required: mask([0, 3, 6, 10]),
    optional: 0,
    priority: 900,
    minNotes: 4,
    allowSlash: true,
  },
  {
    symbol: "dim7",
    required: mask([0, 3, 6, 9]),
    optional: 0,
    priority: 890,
    minNotes: 4,
    allowSlash: true,
  },
  {
    symbol: "add9",
    required: mask([0, 2, 4, 7]),
    optional: 0,
    priority: 880,
    minNotes: 4,
    allowSlash: false,
  },
  {
    symbol: "madd9",
    required: mask([0, 2, 3, 7]),
    optional: 0,
    priority: 870,
    minNotes: 4,
    allowSlash: false,
  },
  {
    symbol: "6",
    required: mask([0, 4, 7, 9]),
    optional: 0,
    priority: 860,
    minNotes: 4,
    allowSlash: true,
  },
  {
    symbol: "m6",
    required: mask([0, 3, 7, 9]),
    optional: 0,
    priority: 850,
    minNotes: 4,
    allowSlash: true,
  },
  {
    symbol: "9",
    required: mask([0, 2, 4, 7, 10]),
    optional: 0,
    priority: 840,
    minNotes: 5,
    allowSlash: true,
  },
  {
    symbol: "maj9",
    required: mask([0, 2, 4, 7, 11]),
    optional: 0,
    priority: 830,
    minNotes: 5,
    allowSlash: true,
  },
  {
    symbol: "m9",
    required: mask([0, 2, 3, 7, 10]),
    optional: 0,
    priority: 820,
    minNotes: 5,
    allowSlash: true,
  },
];

export interface ChordResult {
  name: string;
  root: string;
  symbol: string;
  bass?: string;
  inversion: number;
}

function normalize(notes: number[]): number[] {
  return [...new Set(notes.map((n) => ((n % 12) + 12) % 12))].sort(
    (a, b) => a - b,
  );
}

function notesToMask(notes: number[], root: number): number {
  let out = 0;

  for (const n of notes) {
    const interval = (n - root + 12) % 12;
    out |= 1 << interval;
  }

  return out;
}

function inversionOf(root: number, pcs: number[], bass: number): number {
  const intervals = pcs.map((p) => (p - root + 12) % 12).sort((a, b) => a - b);

  const bassInterval = (bass - root + 12) % 12;

  return Math.max(
    0,
    intervals.findIndex((i) => i === bassInterval),
  );
}

function detectInterval(pcs: number[]): string | null {
  if (pcs.length !== 2) {
    return null;
  }

  const interval = (pcs[1] - pcs[0] + 12) % 12;

  switch (interval) {
    case 0:
      return "Unison";
    case 1:
      return "Minor 2nd";
    case 2:
      return "Major 2nd";
    case 3:
      return "Minor 3rd";
    case 4:
      return "Major 3rd";
    case 5:
      return "Perfect 4th";
    case 6:
      return "Tritone";
    case 7:
      return "Perfect 5th";
    case 8:
      return "Minor 6th";
    case 9:
      return "Major 6th";
    case 10:
      return "Minor 7th";
    case 11:
      return "Major 7th";
    default:
      return null;
  }
}

export function detectChord(noteNumbers: number[]): ChordResult | null {
  if (noteNumbers.length < 2) {
    return null;
  }

  const pcs = normalize(noteNumbers);

  const intervalName = detectInterval(pcs);

  if (intervalName) {
    return {
      name: intervalName,
      root: "",
      symbol: "",
      inversion: 0,
    };
  }

  const bassPc = ((Math.min(...noteNumbers) % 12) + 12) % 12;

  let best:
    | {
        priority: number;
        result: ChordResult;
      }
    | undefined;

  for (const root of pcs) {
    const chordMask = notesToMask(pcs, root);

    for (const chord of CHORD_TYPES) {
      if (pcs.length < chord.minNotes) {
        continue;
      }

      if ((chordMask & chord.required) !== chord.required) {
        continue;
      }

      const allowed = chord.required | chord.optional;

      if ((chordMask & ~allowed) !== 0) {
        continue;
      }

      const rootStr = rootName(root);

      const bassStr = rootName(bassPc);

      const slash =
        chord.allowSlash && pcs.length >= 4 && bassPc !== root
          ? `/${bassStr}`
          : "";

      const inversion = inversionOf(root, pcs, bassPc);

      const result: ChordResult = {
        name: `${rootStr}${chord.symbol}${slash}`,
        root: rootStr,
        symbol: chord.symbol,
        bass: slash ? bassStr : undefined,
        inversion,
      };

      if (!best || chord.priority > best.priority) {
        best = {
          priority: chord.priority,
          result,
        };
      }
    }
  }

  return best?.result ?? null;
}
