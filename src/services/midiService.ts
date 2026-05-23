import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { MidiDevice, MidiEvent } from "../types";
import { parseMidiMessage } from "../utils/midiParser";

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

type MidiEventCallback = (event: MidiEvent) => void;
type DeviceChangeCallback = (devices: MidiDevice[]) => void;

class MidiService {
  private onEvent: MidiEventCallback | null = null;
  private onDeviceChange: DeviceChangeCallback | null = null;
  private unlisten: UnlistenFn | null = null;
  private unlistenPorts: UnlistenFn | null = null;

  private selectedDeviceId: string | null = null;

  async init(): Promise<{ ok: boolean; error?: string }> {
    try {
      this.unlisten = await listen<TauriMidiMessagePayload>(
        "midi-message",
        (evt) => {
          const { deviceId, deviceName, data } = evt.payload;
          const event = parseMidiMessage(
            new Uint8Array(data),
            Date.now(),
            deviceId,
            deviceName,
          );
          this.onEvent?.(event);
        },
      );

      this.unlistenPorts = await listen<number>(
        "midi-ports-changed",
        async () => {
          console.log("[MidiService] MIDI ports changed — reconnecting...");
          if (this.selectedDeviceId === null) {
            await this.selectAll();
          } else {
            await this.selectDevice(this.selectedDeviceId);
          }
        },
      );

      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { ok: false, error: `MIDI init failed: ${message}` };
    }
  }

  setOnEvent(cb: MidiEventCallback) {
    this.onEvent = cb;
  }

  setOnDeviceChange(cb: DeviceChangeCallback) {
    this.onDeviceChange = cb;
  }

  async selectAll(): Promise<void> {
    this.selectedDeviceId = null;
    try {
      const ports: TauriMidiPort[] = await invoke("connect_all_midi_inputs");
      this.onDeviceChange?.(this._portsToDevices(ports));
    } catch (err) {
      console.error("[MidiService] connect_all_midi_inputs failed:", err);
      this.onDeviceChange?.([]);
    }
  }

  async selectDevice(deviceId: string | null): Promise<void> {
    if (deviceId === null) {
      await this.selectAll();
      return;
    }
    this.selectedDeviceId = deviceId;
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

  async listDevices(): Promise<MidiDevice[]> {
    try {
      const ports: TauriMidiPort[] = await invoke("list_midi_inputs");
      return this._portsToDevices(ports);
    } catch {
      return [];
    }
  }

  dispose(): void {
    this.unlisten?.();
    this.unlistenPorts?.();
    invoke("disconnect_all_midi_inputs").catch(() => {});
    this.onEvent = null;
    this.onDeviceChange = null;
  }

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
