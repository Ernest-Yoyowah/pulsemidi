import { useMidiStore } from "../store/midiStore";
import { midiService } from "../services/midiService";

export default function DeviceManager() {
  const { devices, selectedDeviceId, selectDevice, midiReady, midiError } =
    useMidiStore();

  async function handleSelect(id: string | null) {
    selectDevice(id);
    await midiService.selectDevice(id);
  }

  const connectedDevices = devices.filter((d) => d.state === "connected");

  return (
    <div className="card h-full flex flex-col gap-3">
      <h2 className="section-title">MIDI Devices</h2>

      {midiError && (
        <div className="rounded-md bg-red-900/40 border border-red-700/50 px-3 py-2 text-xs text-red-300">
          {midiError}
        </div>
      )}

      {!midiReady && !midiError && (
        <p className="text-xs text-zinc-500 animate-pulse">
          Requesting MIDI access…
        </p>
      )}

      {midiReady && connectedDevices.length === 0 && (
        <p className="text-xs text-zinc-500">No MIDI input devices detected.</p>
      )}

      {midiReady && (
        <ul className="flex flex-col gap-1.5">
          <li>
            <button
              onClick={() => handleSelect(null)}
              className={`device-item w-full text-left ${
                selectedDeviceId === null ? "device-item--active" : ""
              }`}
            >
              <span className="device-dot bg-cyan-400" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium text-zinc-100 truncate">
                  All Devices
                </span>
                <span className="text-[10px] text-zinc-500">
                  Monitor all inputs
                </span>
              </div>
            </button>
          </li>

          {connectedDevices.map((device) => (
            <li key={device.id}>
              <button
                onClick={() => handleSelect(device.id)}
                className={`device-item w-full text-left ${
                  selectedDeviceId === device.id ? "device-item--active" : ""
                }`}
              >
                <span
                  className={`device-dot ${
                    device.state === "connected"
                      ? "bg-emerald-400"
                      : "bg-zinc-600"
                  }`}
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-medium text-zinc-100 truncate">
                    {device.name}
                  </span>
                  <span className="text-[10px] text-zinc-500 truncate">
                    {device.manufacturer || "Unknown manufacturer"}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
