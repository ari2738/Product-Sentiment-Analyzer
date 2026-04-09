import React, { useState } from "react";
import { analyzeText } from "../utils/api";

const LC = { positive: "#4ade80", negative: "#f87171", neutral: "#facc15" };
const LE = { positive: "😊", negative: "😠", neutral: "😐" };

function ProgressBar({ value, min = 0, max = 1, label, color }) {
  const pct = Math.max(2, ((value - min) / (max - min)) * 100);
  return (
    <div style={{ marginBottom: "1.1rem" }}>
      <div className="flex-between" style={{ marginBottom: ".35rem" }}>
        <span style={{ fontSize: ".83rem", color: "#94a3b8" }}>{label}</span>
        <span style={{ color, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{value?.toFixed(4)}</span>
      </div>
      <div style={{ background: "#12152a", borderRadius: 5, height: 10, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 5, background: color, transition: "width .45s ease" }} />
      </div>
    </div>
  );
}

const EXAMPLES = [
  "This product is absolutely amazing! Best purchase I've made all year. Highly recommend!",
  "Terrible quality. Broke after two days. Complete waste of money. Very disappointed.",
  "It works as described. Nothing special but does the job for the price.",
  "Decent product overall but the packaging could be much better. Delivery was fast though.",
];

export default function Analyzer() {
  const [text,    setText]    = useState("");
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const analyze = async (t = text) => {
    if (!t.trim()) return;
    setLoading(true); setError(""); setResult(null);
    try {
      setResult(await analyzeText(t));
    } catch {
      setError("Analysis failed. Make sure the backend is running on port 5000.");
    } finally {
      setLoading(false);
    }
  };

  const clear = () => { setText(""); setResult(null); setError(""); };
  const label = result?.final_label;

  return (
    <div>
      <h1 className="page-title">Text Sentiment Analyzer</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>

        {/* ── Left col ─────────────────────────────────────────────── */}
        <div>
          <div className="card mb-2">
            <div className="card-title">Enter Review Text</div>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Type or paste any product review text here…"
              style={{ minHeight: 160, marginBottom: "1rem" }}
            />
            {error && <div className="error-msg mb-2">{error}</div>}
            <div className="flex-row">
              <button className="btn-primary" onClick={() => analyze()} disabled={loading || !text.trim()}>
                {loading ? "Analyzing…" : "Analyze Sentiment"}
              </button>
              <button className="btn-secondary" onClick={clear}>Clear</button>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Quick Examples</div>
            <div style={{ display: "flex", flexDirection: "column", gap: ".55rem" }}>
              {EXAMPLES.map((ex, i) => (
                <button key={i} className="btn-secondary"
                  style={{ textAlign: "left", padding: ".7rem 1rem", lineHeight: 1.5, whiteSpace: "normal" }}
                  onClick={() => { setText(ex); analyze(ex); }}>
                  {ex.slice(0, 80)}…
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right col ────────────────────────────────────────────── */}
        <div>
          {!result ? (
            <div className="card" style={{ textAlign: "center", padding: "5rem 2rem" }}>
              <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🔍</div>
              <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                Paste a review on the left and click<br />
                <strong style={{ color: "#c4b5fd" }}>Analyze Sentiment</strong> to see results
              </div>
            </div>
          ) : (
            <>
              {/* Verdict */}
              <div className="card mb-2" style={{ textAlign: "center", padding: "2rem" }}>
                <div style={{ fontSize: "4.5rem", lineHeight: 1, marginBottom: ".5rem" }}>{LE[label]}</div>
                <div style={{ fontSize: "2rem", fontWeight: 900, color: LC[label], letterSpacing: ".05em" }}>
                  {label?.toUpperCase()}
                </div>
                <div style={{ color: "#64748b", fontSize: ".82rem", marginTop: ".35rem" }}>
                  TextBlob sentiment classification
                </div>
              </div>

              {/* Detail */}
              <div className="card">
                <div className="card-title">TextBlob Analysis</div>
                <div className="mb-2">
                  <span className={`badge ${label}`}>{label}</span>
                </div>

                {/* Polarity bar — maps -1..+1 → 0..100% */}
                <ProgressBar
                  value={(result.polarity + 1) / 2}
                  min={0} max={1}
                  label={`Polarity: ${result.polarity?.toFixed(4)}  (−1 negative → +1 positive)`}
                  color={LC[label]}
                />
                <ProgressBar
                  value={result.subjectivity}
                  min={0} max={1}
                  label={`Subjectivity: ${result.subjectivity?.toFixed(4)}  (0 objective → 1 subjective)`}
                  color="#7c6af7"
                />

                {/* Score boxes */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem", marginTop: ".5rem" }}>
                  {[
                    { label: "Polarity",     val: result.polarity?.toFixed(4),     color: LC[label] },
                    { label: "Subjectivity", val: result.subjectivity?.toFixed(4), color: "#7c6af7" },
                  ].map(({ label: l, val, color }) => (
                    <div key={l} style={{
                      background: "#12152a", borderRadius: 10, padding: "1rem",
                      border: "1px solid #2d3154", textAlign: "center",
                    }}>
                      <div style={{ fontSize: ".75rem", color: "#64748b", marginBottom: ".35rem", textTransform: "uppercase", letterSpacing: ".05em" }}>{l}</div>
                      <div style={{ fontSize: "1.5rem", fontWeight: 800, color }}>{val}</div>
                    </div>
                  ))}
                </div>

                {/* Cleaned text */}
                {result.cleaned_text && (
                  <div style={{ marginTop: "1.25rem" }}>
                    <div style={{ fontSize: ".78rem", color: "#64748b", marginBottom: ".4rem", textTransform: "uppercase", letterSpacing: ".05em" }}>
                      Cleaned Input
                    </div>
                    <div style={{
                      background: "#12152a", borderRadius: 8, padding: ".8rem 1rem",
                      fontSize: ".82rem", color: "#94a3b8", lineHeight: 1.6,
                      border: "1px solid #2d3154",
                    }}>
                      {result.cleaned_text}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
