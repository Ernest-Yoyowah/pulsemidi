import { MidiEvent, MidiMessageType } from "../types";
import { midiNoteToName, getCcName, decodePitchBend } from "./noteUtils";

let _eventCounter = 0;

export function parseMidiMessage(
  data: Uint8Array,
  timestamp: number,
  deviceId: string,
  deviceName: string,
): MidiEvent {
  const statusByte = data[0];
  const type: number = statusByte & 0xf0;
  const channel: number = (statusByte & 0x0f) + 1;

  const id = `evt-${Date.now()}-${++_eventCounter}`;
  const rawData = Array.from(data);

  const base = { id, timestamp, channel, rawData, deviceId, deviceName };

  if (type === 0x80 || (type === 0x90 && data[2] === 0)) {
    const note = data[1];
    return {
      ...base,
      type: "noteOff",
      note,
      noteName: midiNoteToName(note),
      velocity: data[2],
    };
  }

  if (type === 0x90) {
    const note = data[1];
    return {
      ...base,
      type: "noteOn",
      note,
      noteName: midiNoteToName(note),
      velocity: data[2],
    };
  }

  if (type === 0xa0) {
    const note = data[1];
    return {
      ...base,
      type: "aftertouch",
      note,
      noteName: midiNoteToName(note),
      value: data[2],
    };
  }

  if (type === 0xb0) {
    return {
      ...base,
      type: "controlChange",
      controller: data[1],
      controllerName: getCcName(data[1]),
      value: data[2],
    };
  }

  if (type === 0xc0) {
    return {
      ...base,
      type: "programChange",
      program: data[1],
    };
  }

  if (type === 0xd0) {
    return {
      ...base,
      type: "channelPressure",
      value: data[1],
    };
  }

  if (type === 0xe0) {
    return {
      ...base,
      type: "pitchBend",
      bendValue: decodePitchBend(data[1], data[2]),
    };
  }

  if (statusByte === 0xf8) {
    return { ...base, type: "clock", channel: 0 };
  }

  if (statusByte === 0xfe) {
    return { ...base, type: "activeSensing", channel: 0 };
  }

  return {
    ...base,
    type: "unknown" as MidiMessageType,
  };
}

export function eventSummary(event: MidiEvent): string {
  switch (event.type) {
    case "noteOn":
      return `Note On  ${event.noteName?.padEnd(4)} — vel ${event.velocity}`;
    case "noteOff":
      return `Note Off ${event.noteName?.padEnd(4)} — vel ${event.velocity}`;
    case "controlChange":
      return `CC ${String(event.controller).padStart(3)}  ${(event.controllerName ?? "").padEnd(20)} — ${event.value}`;
    case "pitchBend": {
      const cents = event.bendValue ?? 0;
      const sign = cents >= 0 ? "+" : "";
      return `Pitch Bend  ${sign}${cents}`;
    }
    case "aftertouch":
      return `Aftertouch  ${event.noteName}  — ${event.value}`;
    case "channelPressure":
      return `Channel Pressure  — ${event.value}`;
    case "programChange":
      return `Program Change  — ${event.program}`;
    default:
      return `[${event.type}]`;
  }
}
