import { useEffect } from "react";
import Dashboard from "./pages/Dashboard";
import { midiService } from "./services/midiService";
import { useMidiStore } from "./store/midiStore";
import "./App.css";

function MidiStatusDot() {
  const { midiReady, midiError, events } = useMidiStore();

  if (midiError) {
    return (
      <span className="flex items-center gap-1.5 text-[10px] font-mono text-red-400">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
        MIDI ERROR
      </span>
    );
  }

  if (!midiReady) {
    return (
      <span className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-600">
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
        CONNECTING
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      LIVE · {events.length} events
    </span>
  );
}

function App() {
  const { setMidiReady, setMidiError, setDevices, addEvent } = useMidiStore();

  useEffect(() => {
    let mounted = true;

    async function initMidi() {
      const result = await midiService.init();
      if (!mounted) return;

      if (!result.ok) {
        setMidiError(result.error ?? "MIDI initialisation failed");
        return;
      }

      setMidiReady(true);

      midiService.setOnDeviceChange((devices) => {
        if (mounted) setDevices(devices);
      });

      midiService.setOnEvent((event) => {
        if (mounted) addEvent(event);
      });

      // Connect to all MIDI inputs (emits device list via onDeviceChange)
      await midiService.selectAll();
    }

    initMidi();

    return () => {
      mounted = false;
      midiService.dispose();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="flex items-center gap-3">
          <div className="header-logo">
            <span className="text-cyan-400 font-black tracking-tight text-lg">
              PULSE
            </span>
            <span className="text-zinc-300 font-light text-lg">MIDI</span>
          </div>
          <div className="header-badge">MONITOR</div>
        </div>
        <div className="flex items-center gap-4">
          <MidiStatusDot />
          <span className="text-[10px] text-zinc-600 font-mono">v1.0</span>
        </div>
      </header>

      <main className="app-main">
        <Dashboard />
      </main>
    </div>
  );
}

export default App;
