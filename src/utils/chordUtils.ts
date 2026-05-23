const SHARP_NAMES = [
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
    symbol: "maj13",
    required: mask([0, 4, 11]),
    optional: mask([2, 5, 7, 9]),
    priority: 500,
  },
  {
    symbol: "13",
    required: mask([0, 4, 10]),
    optional: mask([2, 5, 7, 9]),
    priority: 490,
  },
  {
    symbol: "m13",
    required: mask([0, 3, 10]),
    optional: mask([2, 5, 7, 9]),
    priority: 480,
  },
  {
    symbol: "maj11",
    required: mask([0, 4, 11]),
    optional: mask([2, 5, 7]),
    priority: 470,
  },
  {
    symbol: "11",
    required: mask([0, 4, 10]),
    optional: mask([2, 5, 7]),
    priority: 460,
  },
  {
    symbol: "m11",
    required: mask([0, 3, 10]),
    optional: mask([2, 5, 7]),
    priority: 450,
  },
  {
    symbol: "maj9",
    required: mask([0, 4, 11]),
    optional: mask([2, 7]),
    priority: 440,
  },
  {
    symbol: "9",
    required: mask([0, 4, 10]),
    optional: mask([2, 7]),
    priority: 430,
  },
  {
    symbol: "m9",
    required: mask([0, 3, 10]),
    optional: mask([2, 7]),
    priority: 420,
  },
  {
    symbol: "maj7#11",
    required: mask([0, 4, 6, 11]),
    optional: mask([2, 7]),
    priority: 410,
  },
  {
    symbol: "maj9#11",
    required: mask([0, 4, 6, 11]),
    optional: mask([2, 7]),
    priority: 400,
  },
  {
    symbol: "maj7",
    required: mask([0, 4, 11]),
    optional: mask([7]),
    priority: 390,
  },
  {
    symbol: "mMaj9",
    required: mask([0, 3, 11]),
    optional: mask([2, 7]),
    priority: 380,
  },
  {
    symbol: "mMaj7",
    required: mask([0, 3, 11]),
    optional: mask([7]),
    priority: 370,
  },
  {
    symbol: "7alt",
    required: mask([0, 4, 10]),
    optional: mask([1, 3, 6, 8]),
    priority: 360,
  },
  {
    symbol: "7#5#9",
    required: mask([0, 4, 8, 10, 3]),
    optional: 0,
    priority: 350,
  },
  {
    symbol: "7#5b9",
    required: mask([0, 4, 8, 10, 1]),
    optional: 0,
    priority: 340,
  },
  {
    symbol: "7b5#9",
    required: mask([0, 4, 6, 10, 3]),
    optional: 0,
    priority: 330,
  },
  {
    symbol: "7b5b9",
    required: mask([0, 4, 6, 10, 1]),
    optional: 0,
    priority: 320,
  },
  {
    symbol: "7#11",
    required: mask([0, 4, 10, 6]),
    optional: mask([2, 7]),
    priority: 310,
  },
  {
    symbol: "7b13",
    required: mask([0, 4, 10, 8]),
    optional: mask([2, 7]),
    priority: 300,
  },
  {
    symbol: "7#9",
    required: mask([0, 4, 10, 3]),
    optional: mask([7]),
    priority: 290,
  },
  {
    symbol: "7b9",
    required: mask([0, 4, 10, 1]),
    optional: mask([7]),
    priority: 280,
  },
  {
    symbol: "7#5",
    required: mask([0, 4, 8, 10]),
    optional: 0,
    priority: 270,
  },
  {
    symbol: "7b5",
    required: mask([0, 4, 6, 10]),
    optional: 0,
    priority: 260,
  },
  {
    symbol: "7sus4",
    required: mask([0, 5, 10]),
    optional: mask([7]),
    priority: 250,
  },
  {
    symbol: "7sus2",
    required: mask([0, 2, 10]),
    optional: mask([7]),
    priority: 240,
  },
  {
    symbol: "7",
    required: mask([0, 4, 10]),
    optional: mask([7]),
    priority: 230,
  },
  {
    symbol: "m7b5",
    required: mask([0, 3, 6, 10]),
    optional: 0,
    priority: 220,
  },
  {
    symbol: "dim7",
    required: mask([0, 3, 6, 9]),
    optional: 0,
    priority: 210,
  },
  {
    symbol: "m7",
    required: mask([0, 3, 10]),
    optional: mask([7]),
    priority: 200,
  },
  {
    symbol: "6/9",
    required: mask([0, 4, 9]),
    optional: mask([2, 7]),
    priority: 190,
  },
  {
    symbol: "6",
    required: mask([0, 4, 9]),
    optional: mask([7]),
    priority: 180,
  },
  {
    symbol: "m6",
    required: mask([0, 3, 9]),
    optional: mask([7]),
    priority: 170,
  },
  {
    symbol: "add11",
    required: mask([0, 4, 5]),
    optional: mask([7]),
    priority: 160,
  },
  {
    symbol: "add9",
    required: mask([0, 2, 4]),
    optional: mask([7]),
    priority: 150,
  },
  {
    symbol: "madd9",
    required: mask([0, 2, 3]),
    optional: mask([7]),
    priority: 140,
  },
  {
    symbol: "sus4",
    required: mask([0, 5]),
    optional: mask([7]),
    priority: 130,
  },
  {
    symbol: "sus2",
    required: mask([0, 2]),
    optional: mask([7]),
    priority: 120,
  },
  {
    symbol: "aug",
    required: mask([0, 4, 8]),
    optional: 0,
    priority: 110,
  },
  {
    symbol: "dim",
    required: mask([0, 3, 6]),
    optional: 0,
    priority: 100,
  },
  {
    symbol: "m",
    required: mask([0, 3]),
    optional: mask([7]),
    priority: 90,
  },
  {
    symbol: "",
    required: mask([0, 4]),
    optional: mask([7]),
    priority: 80,
  },
  {
    symbol: "5",
    required: mask([0, 7]),
    optional: 0,
    priority: 70,
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

export function detectChord(noteNumbers: number[]): ChordResult | null {
  if (noteNumbers.length < 2) {
    return null;
  }

  const pcs = normalize(noteNumbers);

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
      const requiredOk = (chordMask & chord.required) === chord.required;

      if (!requiredOk) {
        continue;
      }

      const allowed = chord.required | chord.optional;

      if ((chordMask & ~allowed) !== 0) {
        continue;
      }

      const rootStr = rootName(root);

      const bassStr = rootName(bassPc);

      const slash = bassPc !== root ? `/${bassStr}` : "";

      const inversion = inversionOf(root, pcs, bassPc);

      const result: ChordResult = {
        name: `${rootStr}${chord.symbol}${slash}`,
        root: rootStr,
        symbol: chord.symbol,
        bass: bassPc !== root ? bassStr : undefined,
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
