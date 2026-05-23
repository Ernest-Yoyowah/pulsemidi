import { create } from "zustand";
import {
  MidiDevice,
  MidiEvent,
  DiagnosticsState,
  StuckNote,
  CcSpamEntry,
} from "../types";

const MAX_LOG_EVENTS = 500;
const CC_SPAM_WINDOW_MS = 200;
const CC_SPAM_THRESHOLD = 8;
const STUCK_NOTE_TIMEOUT_MS = 8000;

interface MidiStore {
  midiReady: boolean;
  midiError: string | null;

  devices: MidiDevice[];
  selectedDeviceId: string | null;

  events: MidiEvent[];
  isPaused: boolean;

  activeNotes: Map<number, MidiEvent>;

  diagnostics: DiagnosticsState;

  setMidiReady: (ready: boolean) => void;
  setMidiError: (err: string | null) => void;

  setDevices: (devices: MidiDevice[]) => void;
  selectDevice: (id: string | null) => void;

  ccValues: Map<number, number>;

  touchedCCs: number[];

  bpm: number | null;

  clockBuffer: number[];
  pitchBend: number;

  activeKeyColor: string;

  addEvent: (event: MidiEvent) => void;
  clearEvents: () => void;
  setPaused: (paused: boolean) => void;
  setActiveKeyColor: (color: string) => void;
}

function updateDiagnostics(
  prev: DiagnosticsState,
  event: MidiEvent,
  activeNotes: Map<number, MidiEvent>,
): DiagnosticsState {
  const now = Date.now();

  let sustainPedalDown = prev.sustainPedalDown;
  if (event.type === "controlChange" && event.controller === 64) {
    sustainPedalDown = (event.value ?? 0) >= 64;
  }

  const stuckNotes: StuckNote[] = [];
  activeNotes.forEach((noteEvent) => {
    if (now - noteEvent.timestamp > STUCK_NOTE_TIMEOUT_MS) {
      stuckNotes.push({
        note: noteEvent.note!,
        noteName: noteEvent.noteName!,
        channel: noteEvent.channel,
        onTime: noteEvent.timestamp,
        deviceId: noteEvent.deviceId,
      });
    }
  });

  let ccSpam = [...prev.ccSpam];
  if (event.type === "controlChange" && event.controller !== undefined) {
    const cc = event.controller;
    const idx = ccSpam.findIndex((e) => e.controller === cc);
    const entry: CcSpamEntry =
      idx >= 0
        ? { ...ccSpam[idx] }
        : {
            controller: cc,
            controllerName: event.controllerName ?? `CC ${cc}`,
            count: 0,
            lastTime: 0,
            windowMs: CC_SPAM_WINDOW_MS,
          };

    if (now - entry.lastTime < CC_SPAM_WINDOW_MS) {
      entry.count += 1;
    } else {
      entry.count = 1;
    }
    entry.lastTime = now;

    if (idx >= 0) {
      ccSpam[idx] = entry;
    } else if (entry.count >= CC_SPAM_THRESHOLD) {
      ccSpam.push(entry);
    }

    ccSpam = ccSpam.filter(
      (e) =>
        now - e.lastTime < CC_SPAM_WINDOW_MS * 5 &&
        e.count >= CC_SPAM_THRESHOLD,
    );
  }

  const latencyMs =
    prev.lastEventTime !== null ? event.timestamp - prev.lastEventTime : null;

  return {
    stuckNotes,
    ccSpam,
    sustainPedalDown,
    lastEventTime: event.timestamp,
    latencyMs,
  };
}

export const useMidiStore = create<MidiStore>((set, get) => ({
  midiReady: false,
  midiError: null,

  devices: [],
  selectedDeviceId: null,

  events: [],
  isPaused: false,

  activeNotes: new Map(),

  ccValues: new Map(),

  touchedCCs: [],

  bpm: null,
  clockBuffer: [],
  pitchBend: 0,

  activeKeyColor: "#22d3ee",

  diagnostics: {
    stuckNotes: [],
    ccSpam: [],
    sustainPedalDown: false,
    lastEventTime: null,
    latencyMs: null,
  },

  setMidiReady: (ready) => set({ midiReady: ready }),
  setMidiError: (err) => set({ midiError: err }),

  setDevices: (devices) => set({ devices }),

  selectDevice: (id) => set({ selectedDeviceId: id }),

  addEvent: (event) => {
    if (get().isPaused) return;

    set((state) => {
      const activeNotes = new Map(state.activeNotes);

      if (event.type === "noteOn" && event.note !== undefined) {
        activeNotes.set(event.note, event);
      } else if (event.type === "noteOff" && event.note !== undefined) {
        activeNotes.delete(event.note);
      }

      const ccValues = new Map(state.ccValues);
      let touchedCCs = state.touchedCCs;
      if (event.type === "controlChange" && event.controller !== undefined) {
        ccValues.set(event.controller, event.value ?? 0);
        const cc = event.controller;
        const filtered = touchedCCs.filter((c) => c !== cc);
        touchedCCs = [cc, ...filtered].slice(0, 20);
      }

      const diagnostics = updateDiagnostics(
        state.diagnostics,
        event,
        activeNotes,
      );

      const events =
        state.events.length >= MAX_LOG_EVENTS
          ? [...state.events.slice(-MAX_LOG_EVENTS + 1), event]
          : [...state.events, event];

      let bpm = state.bpm;
      let clockBuffer = state.clockBuffer;
      if (event.type === "clock") {
        clockBuffer = [...clockBuffer, event.timestamp].slice(-25);
        if (clockBuffer.length === 25) {
          const beatMs = clockBuffer[24] - clockBuffer[0];
          const candidate = Math.round(60000 / beatMs);
          if (candidate >= 20 && candidate <= 300) bpm = candidate;
        }
      }

      const pitchBend =
        event.type === "pitchBend" && event.bendValue !== undefined
          ? event.bendValue
          : state.pitchBend;

      return {
        events,
        activeNotes,
        ccValues,
        diagnostics,
        bpm,
        clockBuffer,
        pitchBend,
        touchedCCs,
      };
    });
  },

  clearEvents: () =>
    set({
      events: [],
      activeNotes: new Map(),
      ccValues: new Map(),
      touchedCCs: [],
      bpm: null,
      clockBuffer: [],
      pitchBend: 0,
      diagnostics: {
        stuckNotes: [],
        ccSpam: [],
        sustainPedalDown: false,
        lastEventTime: null,
        latencyMs: null,
      },
    }),

  setPaused: (paused) => set({ isPaused: paused }),
  setActiveKeyColor: (color) => set({ activeKeyColor: color }),
}));
