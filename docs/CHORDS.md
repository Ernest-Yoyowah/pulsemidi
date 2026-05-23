# Chord Detection Reference

This document describes all chord structures currently supported by the MIDI chord detection engine.

The detector operates using:

- pitch-class normalization
- interval masks
- root scoring
- inversion detection
- slash chord support
- optional tone matching
- omission-tolerant matching

---

# Pitch Classes

| Note  | Value |
| ----- | ----- |
| C     | 0     |
| C#/Db | 1     |
| D     | 2     |
| D#/Eb | 3     |
| E     | 4     |
| F     | 5     |
| F#/Gb | 6     |
| G     | 7     |
| G#/Ab | 8     |
| A     | 9     |
| A#/Bb | 10    |
| B     | 11    |

---

# Chord Naming

Chord names are generated as:

```txt
<ROOT><SYMBOL>/<BASS>
```

````

Examples:

```txt
Cmaj7
Dm9
F#7b9
Bb13
C/E
Am/G
```

Slash notation appears when the bass note differs from the detected root.

---

# Supported Chord Families

## Major Chords

| Symbol  | Intervals       |
| ------- | --------------- |
| (major) | 1 3 5           |
| 6       | 1 3 5 6         |
| maj7    | 1 3 5 7         |
| maj9    | 1 3 5 7 9       |
| maj11   | 1 3 5 7 9 11    |
| maj13   | 1 3 5 7 9 11 13 |
| maj7#11 | 1 3 5 7 9 #11   |
| maj9#11 | 1 3 5 7 9 #11   |
| add9    | 1 3 5 9         |
| add11   | 1 3 5 11        |
| 6/9     | 1 3 5 6 9       |

---

## Minor Chords

| Symbol | Intervals         |
| ------ | ----------------- |
| m      | 1 b3 5            |
| m6     | 1 b3 5 6          |
| m7     | 1 b3 5 b7         |
| m9     | 1 b3 5 b7 9       |
| m11    | 1 b3 5 b7 9 11    |
| m13    | 1 b3 5 b7 9 11 13 |
| mMaj7  | 1 b3 5 7          |
| mMaj9  | 1 b3 5 7 9        |
| madd9  | 1 b3 5 9          |

---

## Dominant Chords

| Symbol | Intervals        |
| ------ | ---------------- |
| 7      | 1 3 5 b7         |
| 9      | 1 3 5 b7 9       |
| 11     | 1 3 5 b7 9 11    |
| 13     | 1 3 5 b7 9 11 13 |
| 7b9    | 1 3 5 b7 b9      |
| 7#9    | 1 3 5 b7 #9      |
| 7#11   | 1 3 5 b7 #11     |
| 7b13   | 1 3 5 b7 b13     |
| 7b5    | 1 3 b5 b7        |
| 7#5    | 1 3 #5 b7        |
| 7alt   | altered dominant |
| 7b5b9  | 1 3 b5 b7 b9     |
| 7b5#9  | 1 3 b5 b7 #9     |
| 7#5b9  | 1 3 #5 b7 b9     |
| 7#5#9  | 1 3 #5 b7 #9     |

---

## Suspended Chords

| Symbol | Intervals |
| ------ | --------- |
| sus2   | 1 2 5     |
| sus4   | 1 4 5     |
| 7sus2  | 1 2 5 b7  |
| 7sus4  | 1 4 5 b7  |

---

## Diminished Chords

| Symbol | Intervals   |
| ------ | ----------- |
| dim    | 1 b3 b5     |
| dim7   | 1 b3 b5 bb7 |
| m7b5   | 1 b3 b5 b7  |

---

## Augmented Chords

| Symbol | Intervals |
| ------ | --------- |
| aug    | 1 3 #5    |
| 7#5    | 1 3 #5 b7 |

---

## Power Chords

| Symbol | Intervals |
| ------ | --------- |
| 5      | 1 5       |

---

# Detection Features

## Inversions

The engine detects inversions automatically.

Examples:

```txt
C/E
C/G
Dm/F
```

The inversion index is also returned:

| Value | Meaning          |
| ----- | ---------------- |
| 0     | root position    |
| 1     | first inversion  |
| 2     | second inversion |
| 3     | third inversion  |

---

## Slash Chords

If the bass note differs from the root, slash notation is added.

Example:

```txt
Cmaj7/E
Am/G
Fmaj9/A
```

---

## Omission Tolerance

The engine supports omitted tones.

Examples:

```txt
C E Bb D
```

Detected as:

```txt
C9
```

even without the fifth.

---

## Priority-Based Matching

More complex chords are preferred over simpler matches.

Example:

```txt
C E G B D A
```

Detected as:

```txt
Cmaj13
```

instead of:

```txt
Cmaj7
```

---

# Internal Detection Model

The engine uses bitmask-based harmonic analysis.

Each interval maps to a bit:

```txt
bit 0  = root
bit 1  = b9
bit 2  = 9
bit 3  = #9
bit 4  = 3
bit 5  = 11
bit 6  = #11
bit 7  = 5
bit 8  = b13/#5
bit 9  = 13
bit 10 = b7
bit 11 = maj7
```

Example:

```txt
Cmaj7
```

becomes:

```txt
1 << 0 |
1 << 4 |
1 << 7 |
1 << 11
```

---

# Detection Pipeline

## 1. Normalize Notes

Incoming MIDI notes are converted to pitch classes.

Example:

```txt
C3 E4 G5
```

becomes:

```txt
[0, 4, 7]
```

---

## 2. Root Candidate Generation

Each pitch class becomes a possible root candidate.

---

## 3. Interval Mask Generation

Intervals are normalized relative to the candidate root.

---

## 4. Chord Matching

The detector compares the generated mask against all known chord templates.

Matching uses:

- required intervals
- optional intervals
- priority ranking

---

## 5. Best Match Selection

The highest-priority valid chord is returned.

---

# Unknown Structures

Some note collections have no conventional chord name.

Example:

```txt
C C# D F# A Bb
```

Future versions may expose:

- pitch-class sets
- Forte numbers
- cluster labels
- quartal structures
- polychords

---

# Future Expansion Ideas

Potential future additions:

- key-aware enharmonic spelling
- modal context analysis
- polychord recognition
- quartal harmony
- quintal harmony
- cluster chord naming
- Forte set classification
- root confidence scoring
- temporal harmonic analysis
- voice-leading detection

---

# Example Outputs

| Notes       | Result |
| ----------- | ------ |
| C E G       | C      |
| C Eb G      | Cm     |
| C E G B     | Cmaj7  |
| C E G Bb    | C7     |
| C Eb G Bb   | Cm7    |
| C Eb Gb Bb  | Cm7b5  |
| C Eb Gb A   | Cdim7  |
| C D G       | Csus2  |
| C F G       | Csus4  |
| C E G D     | Cadd9  |
| C E G B D   | Cmaj9  |
| C E G Bb D  | C9     |
| C E G Bb Db | C7b9   |
| E G C       | C/E    |
| G C E       | C/G    |

---

# MIDI Notes

MIDI note names are rendered as:

```txt
C4
F#3
Bb2
```

Octave formula:

```txt
octave = floor(note / 12) - 1
```

---

# CC Names

The engine includes common MIDI CC labels.

| CC  | Name      |
| --- | --------- |
| 1   | MOD       |
| 7   | VOL       |
| 10  | PAN       |
| 11  | EXP       |
| 64  | SUSTAIN   |
| 71  | RESONANCE |
| 74  | CUTOFF    |
| 91  | REVERB    |
| 93  | CHORUS    |

Unknown CCs are returned as:

```txt
CC<number>
```

```

```
````
