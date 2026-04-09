import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { getProduct, getReviews, getOverview } from "../utils/api";

const C  = { positive: "#4ade80", negative: "#f87171", neutral: "#facc15" };
const TT = { background: "#1a1d2e", border: "1px solid #2d3154", borderRadius: 8 };
const stars = n => "★".repeat(Math.round(n || 0)) + "☆".repeat(5 - Math.round(n || 0));
const LIMIT = 12;

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product,  setProduct]  = useState(null);
  const [reviews,  setReviews]  = useState([]);
  const [overview, setOverview] = useState(null);
  const [filter,   setFilter]   = useState({ sentiment: "", source: "" });
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);

  useEffect(() => {
    getProduct(id).then(setProduct);
    getOverview(id).then(setOverview);
  }, [id]);

  useEffect(() => {
    getReviews({ product_id: id, ...filter, page, limit: LIMIT })
      .then(r => { setReviews(r.reviews); setTotal(r.total); });
  }, [id, filter, page]);

  if (!product) return <div className="loading">Loading…</div>;

  const pieData = Object.entries(overview?.sentiment_distribution ?? {})
    .map(([name, value]) => ({ name, value }));
  const srcDist = overview?.source_distribution ?? {};

  return (
    <div>
      <button className="btn-secondary mb-2" onClick={() => navigate("/products")}>← Back</button>

      <div className="flex-between mb-1">
        <h1 className="page-title" style={{ marginBottom: 0 }}>{product.name}</h1>
        {product.category && <span className="badge neutral">{product.category}</span>}
      </div>
      {product.description && (
        <p style={{ color: "#94a3b8", marginBottom: "1.5rem", lineHeight: 1.6 }}>{product.description}</p>
      )}

      {/* Stats */}
      <div className="stats-grid mb-3">
        {[
          { label: "Total Reviews", value: product.review_count ?? 0, cls: "blue" },
          { label: "Avg Rating",    value: product.avg_rating ? `${product.avg_rating}★` : "—", cls: "blue" },
          { label: "Positive",      value: (product.sentiment_summary || {}).positive ?? 0, cls: "positive" },
          { label: "Negative",      value: (product.sentiment_summary || {}).negative ?? 0, cls: "negative" },
          { label: "Neutral",       value: (product.sentiment_summary || {}).neutral  ?? 0, cls: "neutral"  },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <span className="stat-label">{s.label}</span>
            <span className={`stat-value ${s.cls}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="charts-grid mb-3">
        <div className="card">
          <div className="card-title">Sentiment Distribution</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {pieData.map(e => <Cell key={e.name} fill={C[e.name] ?? "#7c6af7"} />)}
              </Pie>
              <Tooltip contentStyle={TT} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-title">Source Breakdown</div>
          <div style={{ padding: ".5rem 0" }}>
            {Object.keys(srcDist).length === 0
              ? <div className="empty" style={{ padding: "2rem" }}>No data</div>
              : Object.entries(srcDist).map(([src, cnt]) => {
                  const pct = overview?.total_reviews ? (cnt / overview.total_reviews) * 100 : 0;
                  return (
                    <div key={src} style={{ marginBottom: "1.1rem" }}>
                      <div className="flex-between mb-1">
                        <span style={{ textTransform: "capitalize", fontWeight: 600 }}>{src}</span>
                        <span style={{ color: "#94a3b8" }}>{cnt} reviews</span>
                      </div>
                      <div style={{ background: "#12152a", borderRadius: 6, height: 10 }}>
                        <div style={{ width: `${pct}%`, height: 10, borderRadius: 6, background: "#7c6af7", transition: "width .4s" }} />
                      </div>
                    </div>
                  );
                })
            }
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex-row mb-2">
        <select value={filter.sentiment} onChange={e => { setFilter({ ...filter, sentiment: e.target.value }); setPage(1); }}
          style={{ width: "auto" }}>
          <option value="">All Sentiments</option>
          <option value="positive">Positive</option>
          <option value="negative">Negative</option>
          <option value="neutral">Neutral</option>
        </select>
        <select value={filter.source} onChange={e => { setFilter({ ...filter, source: e.target.value }); setPage(1); }}
          style={{ width: "auto" }}>
          <option value="">All Sources</option>
          <option value="amazon">Amazon</option>
          <option value="flipkart">Flipkart</option>
        </select>
        <span style={{ color: "#64748b", fontSize: ".85rem" }}>{total} reviews</span>
      </div>

      {/* Reviews */}
      <div className="reviews-list">
        {reviews.length === 0
          ? <div className="empty">No reviews match your filters.</div>
          : reviews.map(r => (
            <div className="review-card" key={r._id}>
              <div className="review-header">
                <span className={`badge ${r.sentiment?.final_label}`}>{r.sentiment?.final_label}</span>
                <span className="review-source">{r.source}</span>
                {r.rating && <span className="review-rating">{stars(r.rating)}</span>}
                <span style={{ fontSize: ".75rem", color: "#64748b", marginLeft: "auto" }}>{r.date}</span>
              </div>
              {r.review_title && <div className="review-title">{r.review_title}</div>}
              <div className="review-body">{r.review_body}</div>
            </div>
          ))
        }
      </div>

      {/* Pagination */}
      {total > LIMIT && (
        <div className="flex-row mt-2" style={{ justifyContent: "center" }}>
          <button className="btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span style={{ color: "#64748b", fontSize: ".9rem" }}>Page {page} / {Math.ceil(total / LIMIT)}</span>
          <button className="btn-secondary" disabled={page * LIMIT >= total} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
