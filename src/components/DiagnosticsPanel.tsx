import { useMidiStore } from "../store/midiStore";
import { formatRelativeTime } from "../utils/noteUtils";

function Warn({ children }: { children: React.ReactNode }) {
  return (
    <div className="diag-warn">
      <span className="diag-warn__dot" />
      <span>{children}</span>
    </div>
  );
}

function Ok({ children }: { children: React.ReactNode }) {
  return (
    <div className="diag-ok">
      <span className="diag-ok__dot" />
      <span>{children}</span>
    </div>
  );
}

export default function DiagnosticsPanel() {
  const { diagnostics } = useMidiStore();
  const { stuckNotes, ccSpam, sustainPedalDown, latencyMs } = diagnostics;

  const hasIssues = stuckNotes.length > 0 || ccSpam.length > 0;

  return (
    <div className="card flex flex-col gap-3">
      <h2 className="section-title">Diagnostics</h2>

      <div
        className={`rounded-md px-3 py-2 text-xs font-medium ${
          hasIssues
            ? "bg-amber-900/30 border border-amber-700/40 text-amber-300"
            : "bg-emerald-900/30 border border-emerald-800/40 text-emerald-400"
        }`}
      >
        {hasIssues
          ? `⚠  ${stuckNotes.length + ccSpam.length} issue(s) detected`
          : "✓  All clear"}
      </div>

      <div>
        <p className="diag-label">Sustain Pedal</p>
        {sustainPedalDown ? <Warn>Sustain held down</Warn> : <Ok>Released</Ok>}
      </div>

      <div>
        <p className="diag-label">Stuck Notes</p>
        {stuckNotes.length === 0 ? (
          <Ok>None detected</Ok>
        ) : (
          <div className="flex flex-col gap-1">
            {stuckNotes.map((sn) => (
              <Warn key={`${sn.note}-${sn.channel}`}>
                {sn.noteName} (ch {sn.channel}) — held{" "}
                {formatRelativeTime(sn.onTime)}
              </Warn>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="diag-label">CC Spam</p>
        {ccSpam.length === 0 ? (
          <Ok>No rapid CC flooding</Ok>
        ) : (
          <div className="flex flex-col gap-1">
            {ccSpam.map((spam) => (
              <Warn key={spam.controller}>
                {spam.controllerName} — {spam.count}× in {spam.windowMs}ms
              </Warn>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="diag-label">Event Δt</p>
        {latencyMs === null ? (
          <span className="text-xs text-zinc-600">—</span>
        ) : (
          <span
            className={`text-xs font-mono ${
              latencyMs > 20 ? "text-amber-400" : "text-emerald-400"
            }`}
          >
            {latencyMs.toFixed(1)} ms
          </span>
        )}
      </div>
    </div>
  );
}
