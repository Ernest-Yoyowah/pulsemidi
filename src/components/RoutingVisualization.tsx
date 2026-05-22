import { useMidiStore } from "../store/midiStore";

export default function RoutingVisualization() {
  const { selectedDeviceId, devices, midiReady } = useMidiStore();

  const selectedDevice =
    selectedDeviceId !== null
      ? devices.find((d) => d.id === selectedDeviceId)
      : null;

  const deviceLabel =
    selectedDeviceId === null
      ? "All Devices"
      : (selectedDevice?.name ?? "Unknown");

  return (
    <div className="card">
      <h2 className="section-title mb-3">Signal Flow</h2>

      <div className="flex items-center justify-between gap-2 text-[10px] text-zinc-400 font-mono">
        <div className="route-node route-node--input">
          <div className="route-node__icon text-base">🎹</div>
          <div className="route-node__label truncate max-w-[90px]">
            {deviceLabel}
          </div>
          <div
            className={`route-node__status ${
              midiReady ? "text-emerald-400" : "text-zinc-600"
            }`}
          >
            {midiReady ? "LIVE" : "OFFLINE"}
          </div>
        </div>

        <div className="route-arrow">
          <div className="route-arrow__line" />
          <div className="route-arrow__head">▶</div>
        </div>

        <div className="route-node route-node--monitor">
          <div className="route-node__icon text-base">📡</div>
          <div className="route-node__label">PulseMIDI</div>
          <div className="route-node__status text-cyan-400">MONITOR</div>
        </div>

        <div className="route-arrow">
          <div className="route-arrow__line" />
          <div className="route-arrow__head text-zinc-700">▶</div>
        </div>

        <div className="route-node route-node--output opacity-40">
          <div className="route-node__icon text-base">🔌</div>
          <div className="route-node__label">Output</div>
          <div className="route-node__status text-zinc-600">FUTURE</div>
        </div>
      </div>
    </div>
  );
}
