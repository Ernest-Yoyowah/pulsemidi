import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { MidiDevice, MidiEvent } from "../types";
import { parseMidiMessage } from "../utils/midiParser";

// ─── IPC Types ────────────────────────────────────────────────────────────────

interface TauriMidiPort {
  index: number;
  name: string;
}

interface TauriMidiMessagePayload {
  deviceId: string;
  deviceName: string;
  timestamp: number;
  data: number[];
}

// ─── Callbacks ────────────────────────────────────────────────────────────────

type MidiEventCallback = (event: MidiEvent) => void;
type DeviceChangeCallback = (devices: MidiDevice[]) => void;

// ─── Service ─────────────────────────────────────────────────────────────────

class MidiService {
  private onEvent: MidiEventCallback | null = null;
  private onDeviceChange: DeviceChangeCallback | null = null;
  private unlisten: UnlistenFn | null = null;

  // ── Init ─────────────────────────────────────────────────────────────────
  // Subscribes to the Rust `midi-message` event stream. No Web MIDI needed.

  async init(): Promise<{ ok: boolean; error?: string }> {
    try {
      this.unlisten = await listen<TauriMidiMessagePayload>(
        "midi-message",
        (evt) => {
          const { deviceId, deviceName, data } = evt.payload;
          // Use frontend wall-clock time so all Date.now() comparisons work correctly.
          // midir timestamps are µs since device open — incompatible with epoch ms.
          const event = parseMidiMessage(
            new Uint8Array(data),
            Date.now(),
            deviceId,
            deviceName,
          );
          this.onEvent?.(event);
        },
      );
      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { ok: false, error: `MIDI init failed: ${message}` };
    }
  }

  // ── Callbacks ─────────────────────────────────────────────────────────────

  setOnEvent(cb: MidiEventCallback) {
    this.onEvent = cb;
  }

  setOnDeviceChange(cb: DeviceChangeCallback) {
    this.onDeviceChange = cb;
  }

  // ── Device operations ─────────────────────────────────────────────────────

  /** Connect to all available MIDI inputs (default mode). */
  async selectAll(): Promise<void> {
    try {
      const ports: TauriMidiPort[] = await invoke("connect_all_midi_inputs");
      this.onDeviceChange?.(this._portsToDevices(ports));
    } catch (err) {
      console.error("[MidiService] connect_all_midi_inputs failed:", err);
      this.onDeviceChange?.([]);
    }
  }

  /** Connect to a single device, or all if id is null. */
  async selectDevice(deviceId: string | null): Promise<void> {
    if (deviceId === null) {
      await this.selectAll();
      return;
    }
    const portIndex = parseInt(deviceId.replace("port-", ""), 10);
    if (isNaN(portIndex)) return;
    try {
      const port: TauriMidiPort = await invoke("connect_midi_input", {
        portIndex,
      });
      this.onDeviceChange?.([this._portToDevice(port)]);
    } catch (err) {
      console.error("[MidiService] connect_midi_input failed:", err);
    }
  }

  /** Refresh device list without changing active connections. */
  async listDevices(): Promise<MidiDevice[]> {
    try {
      const ports: TauriMidiPort[] = await invoke("list_midi_inputs");
      return this._portsToDevices(ports);
    } catch {
      return [];
    }
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────

  dispose(): void {
    this.unlisten?.();
    invoke("disconnect_all_midi_inputs").catch(() => {});
    this.onEvent = null;
    this.onDeviceChange = null;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private _portToDevice(port: TauriMidiPort): MidiDevice {
    return {
      id: `port-${port.index}`,
      name: port.name,
      manufacturer: "",
      state: "connected",
      type: "input",
    };
  }

  private _portsToDevices(ports: TauriMidiPort[]): MidiDevice[] {
    return ports.map((p) => this._portToDevice(p));
  }
}

export const midiService = new MidiService();
