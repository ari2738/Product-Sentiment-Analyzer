import React, { useEffect, useState } from "react";
import { getProducts, scrapeAmazon, scrapeFlipkart, loadDemo } from "../utils/api";

export default function Scraper() {
  const [products, setProducts] = useState([]);
  const [form,     setForm]     = useState({ source: "amazon", url: "", product_id: "", max_pages: 3 });
  const [status,   setStatus]   = useState(null);
  const [loading,  setLoading]  = useState(false);

  useEffect(() => { getProducts().then(setProducts); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleScrape = async () => {
    if (!form.url.trim()) { setStatus({ type: "error", text: "Please enter a product URL." }); return; }
    setLoading(true);
    setStatus({ type: "info", text: "Scraping in progress — this may take 30–60 seconds…" });
    try {
      const res = form.source === "amazon"
        ? await scrapeAmazon(form.url,   form.product_id, form.max_pages)
        : await scrapeFlipkart(form.url, form.product_id, form.max_pages);
      setStatus({ type: "success", text: `✓ Scraped ${res.scraped} reviews, saved ${res.saved} new to database.` });
    } catch (e) {
      setStatus({ type: "error", text: e.response?.data?.error || e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setLoading(true);
    setStatus({ type: "info", text: "Loading demo data…" });
    try {
      const res = await loadDemo(form.product_id || "demo");
      setStatus({ type: "success", text: `✓ Loaded ${res.scraped} demo reviews, saved ${res.saved} new.` });
    } catch {
      setStatus({ type: "error", text: "Failed to load demo data." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">Review Scraper</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", alignItems: "start" }}>
        {/* Form */}
        <div className="card">
          <div className="card-title">Scrape Product Reviews</div>

          <div className="form-group">
            <label>Source Platform</label>
            <select value={form.source} onChange={e => set("source", e.target.value)}>
              <option value="amazon">Amazon</option>
              <option value="flipkart">Flipkart</option>
            </select>
          </div>

          <div className="form-group">
            <label>Product Page URL</label>
            <input
              value={form.url}
              onChange={e => set("url", e.target.value)}
              placeholder={`Paste ${form.source === "amazon" ? "Amazon" : "Flipkart"} product URL here…`}
            />
          </div>

          <div className="form-group">
            <label>Link to Product (optional)</label>
            <select value={form.product_id} onChange={e => set("product_id", e.target.value)}>
              <option value="">— None —</option>
              {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Max Pages to Scrape (1–10)</label>
            <input
              type="number" min={1} max={10}
              value={form.max_pages}
              onChange={e => set("max_pages", parseInt(e.target.value) || 1)}
            />
          </div>

          {status && (
            <div className={`${status.type === "error" ? "error-msg" : status.type === "success" ? "success-msg" : "info-msg"} mb-2`}>
              {status.text}
            </div>
          )}

          <div className="flex-row">
            <button className="btn-primary" onClick={handleScrape} disabled={loading}>
              {loading ? "Scraping…" : `Scrape ${form.source === "amazon" ? "Amazon" : "Flipkart"}`}
            </button>
            <button className="btn-secondary" onClick={handleDemo} disabled={loading}>
              Load Demo Data
            </button>
          </div>
        </div>

        {/* Info */}
        <div>
          <div className="card mb-2">
            <div className="card-title">⚙️ How It Works</div>
            <p style={{ color: "#94a3b8", fontSize: ".875rem", lineHeight: 1.8 }}>
              The scraper uses <strong style={{ color: "#c4b5fd" }}>Selenium</strong> (headless Chrome)
              to navigate product pages and <strong style={{ color: "#c4b5fd" }}>BeautifulSoup</strong> to
              extract reviews. Each review is analyzed with <strong style={{ color: "#c4b5fd" }}>TextBlob</strong> and
              stored in MongoDB automatically.
            </p>
          </div>

          <div className="card mb-2">
            <div className="card-title">📌 Requirements for Live Scraping</div>
            <ul style={{ color: "#94a3b8", fontSize: ".875rem", lineHeight: 2, paddingLeft: "1.2rem" }}>
              <li>Google Chrome installed</li>
              <li>ChromeDriver matching your Chrome version</li>
              <li>Valid Amazon or Flipkart product URL</li>
              <li>Stable internet connection</li>
            </ul>
          </div>

          <div className="card">
            <div className="card-title">🧪 Demo Mode</div>
            <p style={{ color: "#94a3b8", fontSize: ".875rem", lineHeight: 1.8 }}>
              Use <strong style={{ color: "#c4b5fd" }}>Load Demo Data</strong> to instantly populate
              10 sample reviews (mixed sentiments, Amazon + Flipkart) without needing ChromeDriver.
              Great for testing the dashboard right away.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
