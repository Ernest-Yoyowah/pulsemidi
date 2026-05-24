import DeviceManager from "../components/DeviceManager";
import MidiMonitor from "../components/MidiMonitor";
import PianoKeyboard from "../components/PianoKeyboard";
import DiagnosticsPanel from "../components/DiagnosticsPanel";
import RoutingVisualization from "../components/RoutingVisualization";
import CcSliders from "../components/CcSliders";

export default function Dashboard() {
  return (
    <div className="flex flex-col h-full gap-3 p-4 min-h-0">
      <RoutingVisualization />

      <div className="flex flex-1 gap-3 min-h-0">
        <div className="flex flex-col gap-3 w-56 shrink-0">
          <DeviceManager />
          <DiagnosticsPanel />
        </div>

        <div className="flex-1 min-w-0">
          <MidiMonitor />
        </div>

        <div className="w-52 shrink-0">
          <CcSliders />
        </div>
      </div>

      <PianoKeyboard />
    </div>
  );
}
