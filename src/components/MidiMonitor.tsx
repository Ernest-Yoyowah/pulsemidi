import React, { useEffect, useRef } from "react";
import { useMidiStore } from "../store/midiStore";
import { MidiEvent } from "../types";
import { eventSummary } from "../utils/midiParser";
import { formatTimestamp } from "../utils/noteUtils";

function typeTag(event: MidiEvent) {
  const classes: Record<string, string> = {
    noteOn: "tag tag--note-on",
    noteOff: "tag tag--note-off",
    controlChange: "tag tag--cc",
    pitchBend: "tag tag--bend",
    aftertouch: "tag tag--at",
    channelPressure: "tag tag--at",
    programChange: "tag tag--pc",
    clock: "tag tag--dim",
    activeSensing: "tag tag--dim",
    unknown: "tag tag--dim",
  };
  const labels: Record<string, string> = {
    noteOn: "NOTE ON",
    noteOff: "NOTE OFF",
    controlChange: "CC",
    pitchBend: "BEND",
    aftertouch: "AT",
    channelPressure: "PRESSURE",
    programChange: "PC",
    clock: "CLK",
    activeSensing: "SENS",
    unknown: "???",
  };
  return (
    <span className={classes[event.type] ?? "tag tag--dim"}>
      {labels[event.type] ?? event.type.toUpperCase()}
    </span>
  );
}

const EventRow = React.memo(function EventRow({ event }: { event: MidiEvent }) {
  return (
    <div className="event-row group">
      <span className="event-ts">
        {formatTimestamp(Date.now() - event.timestamp)}
      </span>
      <span className="event-ch">CH{event.channel}</span>
      {typeTag(event)}
      <span className="event-msg font-mono truncate">
        {eventSummary(event)}
      </span>
      <span className="event-dev truncate text-right hidden sm:block">
        {event.deviceName}
      </span>
    </div>
  );
});

export default function MidiMonitor() {
  const { events, isPaused, setPaused, clearEvents } = useMidiStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPaused) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [events, isPaused]);

  const visibleEvents = events.filter(
    (e) => e.type !== "clock" && e.type !== "activeSensing",
  );

  return (
    <div className="card flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <h2 className="section-title">MIDI Monitor</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setPaused(!isPaused)}
            className={`btn-sm ${isPaused ? "btn-sm--active" : ""}`}
          >
            {isPaused ? "Resume" : "Pause"}
          </button>
          <button onClick={clearEvents} className="btn-sm">
            Clear
          </button>
        </div>
      </div>

      <div className="event-header shrink-0">
        <span>TIME</span>
        <span>CH</span>
        <span>TYPE</span>
        <span>MESSAGE</span>
        <span className="hidden sm:block text-right">DEVICE</span>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin">
        {visibleEvents.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-zinc-600">Waiting for MIDI events…</p>
          </div>
        ) : (
          <>
            {visibleEvents.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      <div className="shrink-0 mt-2 text-[10px] text-zinc-600 text-right">
        {visibleEvents.length} event{visibleEvents.length !== 1 ? "s" : ""}
        {isPaused && (
          <span className="ml-2 text-amber-400 animate-pulse">● PAUSED</span>
        )}
      </div>
    </div>
  );
}
