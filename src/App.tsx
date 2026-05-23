import { useEffect, useState } from "react";
import Dashboard from "./pages/Dashboard";
import PerformanceView from "./components/PerformanceView";
import { midiService } from "./services/midiService";
import { useMidiStore } from "./store/midiStore";
import "./App.css";

const APP_VERSION = "1.1.0";

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

function SettingsModal({ onClose }: { onClose: () => void }) {
  const activeKeyColor = useMidiStore((s) => s.activeKeyColor);
  const setActiveKeyColor = useMidiStore((s) => s.setActiveKeyColor);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <div className="modal-title">Settings</div>

        <div className="modal-section">
          <div className="modal-section-title">Display</div>
          <div className="modal-row">
            <label className="modal-label" htmlFor="key-color-picker">
              Active key colour
            </label>
            <input
              id="key-color-picker"
              type="color"
              value={activeKeyColor}
              onChange={(e) => setActiveKeyColor(e.target.value)}
              style={{
                width: 36,
                height: 24,
                border: "1px solid #3f3f46",
                borderRadius: 6,
                background: "transparent",
                cursor: "pointer",
                padding: 2,
              }}
            />
          </div>
          <div className="modal-row">
            <span className="modal-label">Preview</span>
            <span
              style={{
                display: "inline-block",
                width: 60,
                height: 18,
                borderRadius: 4,
                background: activeKeyColor,
                opacity: 0.85,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="about-logo">
          <span className="about-logo__pulse">PULSE</span>
          <span className="about-logo__midi">MIDI</span>
          <span className="about-tag">v{APP_VERSION}</span>
        </div>

        <div className="modal-section">
          <div className="modal-section-title">Created by</div>
          <p style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 4 }}>
            <strong style={{ color: "#e4e4e7" }}>Ernest Keyz</strong> / Ernest
            Keyz Studios
          </p>
          <p style={{ fontSize: 11, color: "#52525b" }}>
            Real-time MIDI monitoring, chord detection & performance
            visualisation
          </p>
        </div>

        <div className="modal-section">
          <div className="modal-section-title">Platform support</div>
          <ul className="about-feature-list">
            <li>macOS 12 Monterey or later (CoreMIDI)</li>
            <li>VST3 plugin — Ableton, Logic, Reaper & more</li>
            <li>CLAP plugin — native low-latency alternative</li>
            <li>Standalone Tauri desktop app</li>
          </ul>
        </div>

        <div className="modal-section">
          <div className="modal-section-title">Features</div>
          <ul className="about-feature-list">
            <li>Full 88-key piano visualiser (A0 – C8)</li>
            <li>Real-time chord detection (triads, 7ths, extensions)</li>
            <li>Live BPM counter via MIDI clock</li>
            <li>Pitch & modulation wheels (centred bidirectional)</li>
            <li>CC sliders & rotary knob views</li>
            <li>Sustain / sostenuto / soft pedal indicators</li>
            <li>Stuck-note & CC-flood diagnostics</li>
            <li>Configurable active-key colours</li>
          </ul>
        </div>

        <div className="modal-section" style={{ marginBottom: 0 }}>
          <div className="modal-section-title">License</div>
          <p style={{ fontSize: 11, color: "#52525b" }}>
            © 2026 Ernest Keyz Studios — All Rights Reserved
          </p>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [mode, setMode] = useState<"monitor" | "live">("live");
  const [showSettings, setShowSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
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

      await midiService.selectAll();
    }

    initMidi();

    return () => {
      mounted = false;
      midiService.dispose();
    };
  }, []);

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
          <span className="text-[9px] text-zinc-700 font-mono tracking-wide hidden sm:inline">
            by Ernest Keyz Studios
          </span>
        </div>

        <div className="mode-toggle">
          <button
            className={`mode-toggle__btn ${mode === "monitor" ? "mode-toggle__btn--monitor-active" : ""}`}
            onClick={() => setMode("monitor")}
          >
            <span className="mode-toggle__dot" />
            MONITOR
          </button>
          <button
            className={`mode-toggle__btn mode-toggle__btn--live-opt ${mode === "live" ? "mode-toggle__btn--live-active" : ""}`}
            onClick={() => setMode("live")}
          >
            <span className="mode-toggle__dot" />
            LIVE
          </button>
        </div>

        <div className="flex items-center gap-2">
          <MidiStatusDot />
          <button
            className="header-icon-btn"
            title="Settings"
            onClick={() => setShowSettings(true)}
          >
            ⚙
          </button>
          <button
            className="header-icon-btn"
            title="About PulseMIDI"
            onClick={() => setShowAbout(true)}
          >
            ⓘ
          </button>
        </div>
      </header>

      <main className="app-main">
        {mode === "monitor" ? <Dashboard /> : <PerformanceView />}
      </main>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </div>
  );
}

export default App;
