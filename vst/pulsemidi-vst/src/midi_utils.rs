const NOTE_NAMES: [&str; 12] = [
    "C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B",
];

const FLAT_NAMES: [&str; 12] = [
    "C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B",
];

#[derive(Clone, Copy)]
pub struct ChordType {
    pub symbol: &'static str,
    pub required: u16,
    pub optional: u16,
    pub priority: u32,
}

const fn mask(intervals: &[u8]) -> u16 {
    let mut out = 0u16;
    let mut i = 0;

    while i < intervals.len() {
        out |= 1 << intervals[i];
        i += 1;
    }

    out
}

const CHORD_TYPES: &[ChordType] = &[
    ChordType {
        symbol: "maj13",
        required: mask(&[0, 4, 11]),
        optional: mask(&[2, 5, 7, 9]),
        priority: 500,
    },
    ChordType {
        symbol: "13",
        required: mask(&[0, 4, 10]),
        optional: mask(&[2, 5, 7, 9]),
        priority: 490,
    },
    ChordType {
        symbol: "m13",
        required: mask(&[0, 3, 10]),
        optional: mask(&[2, 5, 7, 9]),
        priority: 480,
    },
    ChordType {
        symbol: "maj11",
        required: mask(&[0, 4, 11]),
        optional: mask(&[2, 5, 7]),
        priority: 470,
    },
    ChordType {
        symbol: "11",
        required: mask(&[0, 4, 10]),
        optional: mask(&[2, 5, 7]),
        priority: 460,
    },
    ChordType {
        symbol: "m11",
        required: mask(&[0, 3, 10]),
        optional: mask(&[2, 5, 7]),
        priority: 450,
    },
    ChordType {
        symbol: "maj9",
        required: mask(&[0, 4, 11]),
        optional: mask(&[2, 7]),
        priority: 440,
    },
    ChordType {
        symbol: "9",
        required: mask(&[0, 4, 10]),
        optional: mask(&[2, 7]),
        priority: 430,
    },
    ChordType {
        symbol: "m9",
        required: mask(&[0, 3, 10]),
        optional: mask(&[2, 7]),
        priority: 420,
    },
    ChordType {
        symbol: "maj7#11",
        required: mask(&[0, 4, 6, 11]),
        optional: mask(&[2, 7]),
        priority: 410,
    },
    ChordType {
        symbol: "maj9#11",
        required: mask(&[0, 4, 6, 11]),
        optional: mask(&[2, 7]),
        priority: 400,
    },
    ChordType {
        symbol: "maj7",
        required: mask(&[0, 4, 11]),
        optional: mask(&[7]),
        priority: 390,
    },
    ChordType {
        symbol: "mMaj9",
        required: mask(&[0, 3, 11]),
        optional: mask(&[2, 7]),
        priority: 380,
    },
    ChordType {
        symbol: "mMaj7",
        required: mask(&[0, 3, 11]),
        optional: mask(&[7]),
        priority: 370,
    },
    ChordType {
        symbol: "7alt",
        required: mask(&[0, 4, 10]),
        optional: mask(&[1, 3, 6, 8]),
        priority: 360,
    },
    ChordType {
        symbol: "7#5#9",
        required: mask(&[0, 4, 8, 10, 3]),
        optional: 0,
        priority: 350,
    },
    ChordType {
        symbol: "7#5b9",
        required: mask(&[0, 4, 8, 10, 1]),
        optional: 0,
        priority: 340,
    },
    ChordType {
        symbol: "7b5#9",
        required: mask(&[0, 4, 6, 10, 3]),
        optional: 0,
        priority: 330,
    },
    ChordType {
        symbol: "7b5b9",
        required: mask(&[0, 4, 6, 10, 1]),
        optional: 0,
        priority: 320,
    },
    ChordType {
        symbol: "7#11",
        required: mask(&[0, 4, 10, 6]),
        optional: mask(&[2, 7]),
        priority: 310,
    },
    ChordType {
        symbol: "7b13",
        required: mask(&[0, 4, 10, 8]),
        optional: mask(&[2, 7]),
        priority: 300,
    },
    ChordType {
        symbol: "7#9",
        required: mask(&[0, 4, 10, 3]),
        optional: mask(&[7]),
        priority: 290,
    },
    ChordType {
        symbol: "7b9",
        required: mask(&[0, 4, 10, 1]),
        optional: mask(&[7]),
        priority: 280,
    },
    ChordType {
        symbol: "7#5",
        required: mask(&[0, 4, 8, 10]),
        optional: 0,
        priority: 270,
    },
    ChordType {
        symbol: "7b5",
        required: mask(&[0, 4, 6, 10]),
        optional: 0,
        priority: 260,
    },
    ChordType {
        symbol: "7sus4",
        required: mask(&[0, 5, 10]),
        optional: mask(&[7]),
        priority: 250,
    },
    ChordType {
        symbol: "7sus2",
        required: mask(&[0, 2, 10]),
        optional: mask(&[7]),
        priority: 240,
    },
    ChordType {
        symbol: "7",
        required: mask(&[0, 4, 10]),
        optional: mask(&[7]),
        priority: 230,
    },
    ChordType {
        symbol: "m7b5",
        required: mask(&[0, 3, 6, 10]),
        optional: 0,
        priority: 220,
    },
    ChordType {
        symbol: "dim7",
        required: mask(&[0, 3, 6, 9]),
        optional: 0,
        priority: 210,
    },
    ChordType {
        symbol: "m7",
        required: mask(&[0, 3, 10]),
        optional: mask(&[7]),
        priority: 200,
    },
    ChordType {
        symbol: "6/9",
        required: mask(&[0, 4, 9]),
        optional: mask(&[2, 7]),
        priority: 190,
    },
    ChordType {
        symbol: "6",
        required: mask(&[0, 4, 9]),
        optional: mask(&[7]),
        priority: 180,
    },
    ChordType {
        symbol: "m6",
        required: mask(&[0, 3, 9]),
        optional: mask(&[7]),
        priority: 170,
    },
    ChordType {
        symbol: "add11",
        required: mask(&[0, 4, 5]),
        optional: mask(&[7]),
        priority: 160,
    },
    ChordType {
        symbol: "add9",
        required: mask(&[0, 2, 4]),
        optional: mask(&[7]),
        priority: 150,
    },
    ChordType {
        symbol: "madd9",
        required: mask(&[0, 2, 3]),
        optional: mask(&[7]),
        priority: 140,
    },
    ChordType {
        symbol: "sus4",
        required: mask(&[0, 5]),
        optional: mask(&[7]),
        priority: 130,
    },
    ChordType {
        symbol: "sus2",
        required: mask(&[0, 2]),
        optional: mask(&[7]),
        priority: 120,
    },
    ChordType {
        symbol: "aug",
        required: mask(&[0, 4, 8]),
        optional: 0,
        priority: 110,
    },
    ChordType {
        symbol: "dim",
        required: mask(&[0, 3, 6]),
        optional: 0,
        priority: 100,
    },
    ChordType {
        symbol: "m",
        required: mask(&[0, 3]),
        optional: mask(&[7]),
        priority: 90,
    },
    ChordType {
        symbol: "",
        required: mask(&[0, 4]),
        optional: mask(&[7]),
        priority: 80,
    },
    ChordType {
        symbol: "5",
        required: mask(&[0, 7]),
        optional: 0,
        priority: 70,
    },
];

pub struct ChordResult {
    pub name: String,
    pub root: String,
    pub symbol: String,
    pub bass: Option<String>,
    pub inversion: usize,
}

fn notes_to_mask(notes: &[u8], root: u8) -> u16 {
    let mut mask = 0u16;

    for &n in notes {
        let interval = (n + 12 - root) % 12;
        mask |= 1 << interval;
    }

    mask
}

fn inversion_of(root: u8, pcs: &[u8], bass: u8) -> usize {
    let mut intervals: Vec<u8> = pcs
        .iter()
        .map(|&p| (p + 12 - root) % 12)
        .collect();

    intervals.sort_unstable();

    let bass_interval = (bass + 12 - root) % 12;

    intervals
        .iter()
        .position(|&x| x == bass_interval)
        .unwrap_or(0)
}

pub fn detect_chord(notes: &[u8]) -> Option<ChordResult> {
    if notes.len() < 2 {
        return None;
    }

    let mut pcs: Vec<u8> = notes.iter().map(|n| n % 12).collect();

    pcs.sort_unstable();
    pcs.dedup();

    let bass_pc = notes.iter().min().unwrap() % 12;

    let mut best: Option<(u32, ChordResult)> = None;

    for &root in &pcs {
        let chord_mask = notes_to_mask(&pcs, root);

        for chord in CHORD_TYPES {
            let required_ok =
                (chord_mask & chord.required) == chord.required;

            if !required_ok {
                continue;
            }

            let allowed = chord.required | chord.optional;

            if (chord_mask & !allowed) != 0 {
                continue;
            }

            let root_name = FLAT_NAMES[root as usize].to_string();

            let bass_name =
                FLAT_NAMES[bass_pc as usize].to_string();

            let slash = if bass_pc != root {
                format!("/{}", bass_name)
            } else {
                String::new()
            };

            let inversion =
                inversion_of(root, &pcs, bass_pc);

            let result = ChordResult {
                name: format!(
                    "{}{}{}",
                    root_name,
                    chord.symbol,
                    slash
                ),
                root: root_name,
                symbol: chord.symbol.to_string(),
                bass: if bass_pc != root {
                    Some(bass_name)
                } else {
                    None
                },
                inversion,
            };

            match &best {
                Some((p, _)) if *p >= chord.priority => {}
                _ => {
                    best = Some((chord.priority, result));
                }
            }
        }
    }

    best.map(|(_, r)| r)
}

pub fn note_name(note: u8) -> String {
    let octave = (note as i32 / 12) - 1;

    format!(
        "{}{}",
        NOTE_NAMES[(note % 12) as usize],
        octave
    )
}

const CC_TABLE: &[(u8, &str)] = &[
    (0, "BANK"),
    (1, "MOD"),
    (2, "BREATH"),
    (5, "PORTA"),
    (7, "VOL"),
    (10, "PAN"),
    (11, "EXP"),
    (64, "SUSTAIN"),
    (65, "PORTA SW"),
    (66, "SOSTENUTO"),
    (67, "SOFT"),
    (68, "LEGATO"),
    (71, "RESONANCE"),
    (72, "RELEASE"),
    (73, "ATTACK"),
    (74, "CUTOFF"),
    (75, "DECAY"),
    (76, "VIBRATO"),
    (91, "REVERB"),
    (93, "CHORUS"),
    (94, "VARIATION"),
];

pub fn cc_name(cc: u8) -> String {
    CC_TABLE
        .iter()
        .find(|(n, _)| *n == cc)
        .map(|(_, name)| name.to_string())
        .unwrap_or_else(|| format!("CC{}", cc))
}