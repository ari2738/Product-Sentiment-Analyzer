import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProducts, createProduct, deleteProduct } from "../utils/api";

const FIELDS = ["name", "description", "category", "amazon_url", "flipkart_url"];

export default function Products() {
  const [products, setProducts] = useState([]);
  const [search,   setSearch]   = useState("");
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState({ name:"", description:"", category:"", amazon_url:"", flipkart_url:"" });
  const [msg,      setMsg]      = useState(null);
  const navigate = useNavigate();

  const load = (q = "") => {
    setLoading(true);
    getProducts(q).then(setProducts).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSearch = e => {
    const v = e.target.value;
    setSearch(v);
    if (v.length === 0 || v.length >= 2) load(v);
  };

  const handleCreate = async () => {
    if (!form.name.trim()) { setMsg({ type: "error", text: "Product name is required." }); return; }
    try {
      await createProduct(form);
      setMsg({ type: "success", text: "Product created successfully!" });
      setShowForm(false);
      setForm({ name:"", description:"", category:"", amazon_url:"", flipkart_url:"" });
      load();
    } catch {
      setMsg({ type: "error", text: "Failed to create product." });
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this product and all its reviews?")) return;
    await deleteProduct(id);
    load(search);
  };

  return (
    <div>
      <div className="flex-between mb-3">
        <h1 className="page-title" style={{ marginBottom: 0 }}>Products</h1>
        <button className="btn-primary" onClick={() => { setShowForm(!showForm); setMsg(null); }}>
          {showForm ? "✕ Cancel" : "+ Add Product"}
        </button>
      </div>

      {msg && (
        <div className={`${msg.type === "error" ? "error-msg" : "success-msg"} mb-2`}>
          {msg.text}
        </div>
      )}

      {showForm && (
        <div className="card mb-3">
          <div className="card-title">New Product</div>
          {FIELDS.map(field => (
            <div className="form-group" key={field}>
              <label>{field.replace(/_/g," ").replace(/\b\w/g, c => c.toUpperCase())}</label>
              <input
                value={form[field]}
                onChange={e => setForm({ ...form, [field]: e.target.value })}
                placeholder={field === "name" ? "Required" : "Optional"}
              />
            </div>
          ))}
          <button className="btn-primary" onClick={handleCreate}>Create Product</button>
        </div>
      )}

      <input
        style={{ marginBottom: "1rem" }}
        placeholder="Search products…"
        value={search}
        onChange={handleSearch}
      />

      {loading
        ? <div className="loading">Loading…</div>
        : products.length === 0
          ? <div className="empty">No products found. Add one to get started!</div>
          : <div className="card">
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th><th>Category</th><th>Reviews</th>
                      <th>Avg Rating</th><th>Positive</th><th>Negative</th><th>Neutral</th><th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => {
                      const s = p.sentiment_summary || {};
                      return (
                        <tr key={p._id} onClick={() => navigate(`/products/${p._id}`)}>
                          <td style={{ fontWeight: 600 }}>{p.name}</td>
                          <td style={{ color: "#64748b" }}>{p.category || "—"}</td>
                          <td>{p.review_count ?? 0}</td>
                          <td>{p.avg_rating ? `${p.avg_rating}★` : "—"}</td>
                          <td><span className="badge positive">{s.positive ?? 0}</span></td>
                          <td><span className="badge negative">{s.negative ?? 0}</span></td>
                          <td><span className="badge neutral">{s.neutral ?? 0}</span></td>
                          <td>
                            <button className="btn-danger" onClick={e => handleDelete(p._id, e)}>
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
      }
    </div>
  );
}
