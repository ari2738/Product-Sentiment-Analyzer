import React, { useEffect, useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend,
  BarChart, Bar,
} from "recharts";
import { getOverview, getTrend, getKeywords, getProducts } from "../utils/api";

const C = { positive: "#4ade80", negative: "#f87171", neutral: "#facc15" };
const RCOLS = ["#7c6af7", "#60a5fa", "#f87171", "#4ade80", "#facc15"];
const TT_STYLE = { background: "#1a1d2e", border: "1px solid #2d3154", borderRadius: 8, color: "#e2e8f0" };

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [pid,      setPid]      = useState("");
  const [overview, setOverview] = useState(null);
  const [trend,    setTrend]    = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => { getProducts().then(setProducts); }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([getOverview(pid || undefined), getTrend(pid || undefined), getKeywords(pid || undefined, undefined, 18)])
      .then(([ov, tr, kw]) => { setOverview(ov); setTrend(tr); setKeywords(kw); })
      .finally(() => setLoading(false));
  }, [pid]);

  if (loading && !overview) return <div className="loading">Loading dashboard…</div>;

  const dist  = overview?.sentiment_distribution ?? {};
  const total = overview?.total_reviews ?? 0;
  const pieData = Object.entries(dist).map(([name, value]) => ({ name, value }));

  return (
    <div>
      <div className="flex-between mb-3">
        <h1 className="page-title" style={{ marginBottom: 0 }}>Dashboard</h1>
        <select value={pid} onChange={e => setPid(e.target.value)} style={{ width: 220 }}>
          <option value="">All Products</option>
          {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label: "Total Reviews", value: total,              cls: "blue"     },
          { label: "Positive",      value: dist.positive ?? 0, cls: "positive" },
          { label: "Negative",      value: dist.negative ?? 0, cls: "negative" },
          { label: "Neutral",       value: dist.neutral  ?? 0, cls: "neutral"  },
          { label: "Positive %",    value: total ? `${Math.round(((dist.positive??0)/total)*100)}%` : "0%", cls: "positive" },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <span className="stat-label">{s.label}</span>
            <span className={`stat-value ${s.cls}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Pie + Bar */}
      <div className="charts-grid mb-2">
        <div className="card">
          <div className="card-title">Sentiment Distribution</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}>
                {pieData.map(e => <Cell key={e.name} fill={C[e.name] ?? "#7c6af7"} />)}
              </Pie>
              <Tooltip contentStyle={TT_STYLE} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-title">Rating Distribution</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={overview?.rating_distribution ?? []} margin={{ top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3154" />
              <XAxis dataKey="rating" stroke="#64748b" tickFormatter={v => `${v}★`} />
              <YAxis stroke="#64748b" />
              <Tooltip contentStyle={TT_STYLE} />
              <Bar dataKey="count" radius={[5, 5, 0, 0]}>
                {(overview?.rating_distribution ?? []).map((_, i) => (
                  <Cell key={i} fill={RCOLS[i % RCOLS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trend */}
      <div className="card mb-2">
        <div className="card-title">Sentiment Trend Over Time</div>
        {trend.length === 0
          ? <div className="empty">No trend data yet — scrape some reviews first!</div>
          : <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trend} margin={{ top: 10, right: 20 }}>
                <defs>
                  {["positive","negative","neutral"].map(k => (
                    <linearGradient key={k} id={`g${k}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={C[k]} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={C[k]} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3154" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={TT_STYLE} />
                <Legend />
                {["positive","negative","neutral"].map(k => (
                  <Area key={k} type="monotone" dataKey={k}
                    stroke={C[k]} fill={`url(#g${k})`} strokeWidth={2} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
        }
      </div>

      {/* Keywords */}
      <div className="card">
        <div className="card-title">Top Keywords</div>
        {keywords.length === 0
          ? <div className="empty">No keyword data yet.</div>
          : <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem" }}>
              {keywords.map((kw, i) => (
                <span key={kw.word} style={{
                  padding: ".3rem .75rem", borderRadius: 999, fontSize: ".85rem",
                  background: `rgba(124,106,247,${Math.max(0.1, 0.65 - i * 0.03)})`,
                  color: "#e2e8f0", fontWeight: 600,
                }}>
                  {kw.word} <span style={{ opacity: .55, fontSize: ".75rem" }}>({kw.count})</span>
                </span>
              ))}
            </div>
        }
      </div>
    </div>
  );
}
