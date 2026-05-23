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
    pub min_notes: usize,
    pub allow_slash: bool,
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
        symbol: "sus4",
        required: mask(&[0, 5, 7]),
        optional: 0,
        priority: 1000,
        min_notes: 3,
        allow_slash: false,
    },
    ChordType {
        symbol: "sus2",
        required: mask(&[0, 2, 7]),
        optional: 0,
        priority: 990,
        min_notes: 3,
        allow_slash: false,
    },
    ChordType {
        symbol: "",
        required: mask(&[0, 4, 7]),
        optional: 0,
        priority: 980,
        min_notes: 3,
        allow_slash: false,
    },
    ChordType {
        symbol: "m",
        required: mask(&[0, 3, 7]),
        optional: 0,
        priority: 970,
        min_notes: 3,
        allow_slash: false,
    },
    ChordType {
        symbol: "dim",
        required: mask(&[0, 3, 6]),
        optional: 0,
        priority: 960,
        min_notes: 3,
        allow_slash: false,
    },
    ChordType {
        symbol: "aug",
        required: mask(&[0, 4, 8]),
        optional: 0,
        priority: 950,
        min_notes: 3,
        allow_slash: false,
    },
    ChordType {
        symbol: "5",
        required: mask(&[0, 7]),
        optional: 0,
        priority: 940,
        min_notes: 2,
        allow_slash: false,
    },
    ChordType {
        symbol: "7",
        required: mask(&[0, 4, 7, 10]),
        optional: 0,
        priority: 930,
        min_notes: 4,
        allow_slash: true,
    },
    ChordType {
        symbol: "maj7",
        required: mask(&[0, 4, 7, 11]),
        optional: 0,
        priority: 920,
        min_notes: 4,
        allow_slash: true,
    },
    ChordType {
        symbol: "m7",
        required: mask(&[0, 3, 7, 10]),
        optional: 0,
        priority: 910,
        min_notes: 4,
        allow_slash: true,
    },
    ChordType {
        symbol: "m7b5",
        required: mask(&[0, 3, 6, 10]),
        optional: 0,
        priority: 900,
        min_notes: 4,
        allow_slash: true,
    },
    ChordType {
        symbol: "dim7",
        required: mask(&[0, 3, 6, 9]),
        optional: 0,
        priority: 890,
        min_notes: 4,
        allow_slash: true,
    },
    ChordType {
        symbol: "add9",
        required: mask(&[0, 2, 4, 7]),
        optional: 0,
        priority: 880,
        min_notes: 4,
        allow_slash: false,
    },
    ChordType {
        symbol: "madd9",
        required: mask(&[0, 2, 3, 7]),
        optional: 0,
        priority: 870,
        min_notes: 4,
        allow_slash: false,
    },
    ChordType {
        symbol: "6",
        required: mask(&[0, 4, 7, 9]),
        optional: 0,
        priority: 860,
        min_notes: 4,
        allow_slash: true,
    },
    ChordType {
        symbol: "m6",
        required: mask(&[0, 3, 7, 9]),
        optional: 0,
        priority: 850,
        min_notes: 4,
        allow_slash: true,
    },
    ChordType {
        symbol: "9",
        required: mask(&[0, 2, 4, 7, 10]),
        optional: 0,
        priority: 840,
        min_notes: 5,
        allow_slash: true,
    },
    ChordType {
        symbol: "maj9",
        required: mask(&[0, 2, 4, 7, 11]),
        optional: 0,
        priority: 830,
        min_notes: 5,
        allow_slash: true,
    },
    ChordType {
        symbol: "m9",
        required: mask(&[0, 2, 3, 7, 10]),
        optional: 0,
        priority: 820,
        min_notes: 5,
        allow_slash: true,
    },
];

pub struct ChordResult {
    pub name: String,
    pub root: String,
    pub symbol: String,
    pub bass: Option<String>,
    pub inversion: usize,
}

fn normalize(notes: &[u8]) -> Vec<u8> {
    let mut pcs: Vec<u8> = notes.iter().map(|n| n % 12).collect();

    pcs.sort_unstable();
    pcs.dedup();

    pcs
}

fn notes_to_mask(notes: &[u8], root: u8) -> u16 {
    let mut out = 0u16;

    for &n in notes {
        let interval = (n + 12 - root) % 12;
        out |= 1 << interval;
    }

    out
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

fn detect_interval(pcs: &[u8]) -> Option<String> {
    if pcs.len() != 2 {
        return None;
    }

    let interval = (pcs[1] + 12 - pcs[0]) % 12;

    let name = match interval {
        0 => "Unison",
        1 => "Minor 2nd",
        2 => "Major 2nd",
        3 => "Minor 3rd",
        4 => "Major 3rd",
        5 => "Perfect 4th",
        6 => "Tritone",
        7 => "Perfect 5th",
        8 => "Minor 6th",
        9 => "Major 6th",
        10 => "Minor 7th",
        11 => "Major 7th",
        _ => return None,
    };

    Some(name.to_string())
}

pub fn detect_chord(notes: &[u8]) -> Option<ChordResult> {
    if notes.len() < 2 {
        return None;
    }

    let pcs = normalize(notes);

    if let Some(interval_name) = detect_interval(&pcs) {
        return Some(ChordResult {
            name: interval_name,
            root: String::new(),
            symbol: String::new(),
            bass: None,
            inversion: 0,
        });
    }

    let bass_pc = notes.iter().min().unwrap() % 12;

    let mut best: Option<(u32, ChordResult)> = None;

    for &root in &pcs {
        let chord_mask = notes_to_mask(&pcs, root);

        for chord in CHORD_TYPES {
            if pcs.len() < chord.min_notes {
                continue;
            }

            if (chord_mask & chord.required) != chord.required {
                continue;
            }

            let allowed = chord.required | chord.optional;

            if (chord_mask & !allowed) != 0 {
                continue;
            }

            let root_name = FLAT_NAMES[root as usize].to_string();

            let bass_name = FLAT_NAMES[bass_pc as usize].to_string();

            let slash = if chord.allow_slash
                && pcs.len() >= 4
                && bass_pc != root
            {
                format!("/{}", bass_name)
            } else {
                String::new()
            };

            let inversion = inversion_of(root, &pcs, bass_pc);

            let result = ChordResult {
                name: format!("{}{}{}", root_name, chord.symbol, slash),
                root: root_name,
                symbol: chord.symbol.to_string(),
                bass: if slash.is_empty() {
                    None
                } else {
                    Some(bass_name)
                },
                inversion,
            };

            match &best {
                Some((p, _)) if *p >= chord.priority => {}
                _ => best = Some((chord.priority, result)),
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