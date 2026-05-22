export type MidiMessageType =
  | "noteOn"
  | "noteOff"
  | "controlChange"
  | "pitchBend"
  | "aftertouch"
  | "channelPressure"
  | "programChange"
  | "clock"
  | "activeSensing"
  | "unknown";

export interface MidiEvent {
  id: string;
  timestamp: number;
  type: MidiMessageType;
  channel: number;

  note?: number;
  noteName?: string;
  velocity?: number;

  controller?: number;
  controllerName?: string;
  value?: number;

  bendValue?: number;

  program?: number;

  rawData: number[];

  deviceId: string;
  deviceName: string;
}

export interface MidiDevice {
  id: string;
  name: string;
  manufacturer: string;
  state: "connected" | "disconnected";
  type: "input" | "output";
}

export interface StuckNote {
  note: number;
  noteName: string;
  channel: number;
  onTime: number;
  deviceId: string;
}

export interface CcSpamEntry {
  controller: number;
  controllerName: string;
  count: number;
  lastTime: number;
  windowMs: number;
}

export interface DiagnosticsState {
  stuckNotes: StuckNote[];
  ccSpam: CcSpamEntry[];
  sustainPedalDown: boolean;
  lastEventTime: number | null;
  latencyMs: number | null;
}
