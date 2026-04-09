import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  timeout: 30000,
});

/* Products */
export const getProducts    = (q = "")     => api.get("/products/", { params: { q } }).then(r => r.data);
export const getProduct     = (id)         => api.get(`/products/${id}`).then(r => r.data);
export const createProduct  = (data)       => api.post("/products/", data).then(r => r.data);
export const deleteProduct  = (id)         => api.delete(`/products/${id}`).then(r => r.data);

/* Reviews */
export const getReviews     = (params = {}) => api.get("/reviews/", { params }).then(r => r.data);
export const addReview      = (data)         => api.post("/reviews/", data).then(r => r.data);
export const analyzeText    = (text)         => api.post("/reviews/analyze", { text }).then(r => r.data);

/* Scraper */
export const scrapeAmazon   = (url, product_id, max_pages = 3) =>
  api.post("/scraper/amazon",   { url, product_id, max_pages }).then(r => r.data);
export const scrapeFlipkart = (url, product_id, max_pages = 3) =>
  api.post("/scraper/flipkart", { url, product_id, max_pages }).then(r => r.data);
export const loadDemo       = (product_id) =>
  api.post("/scraper/demo", { product_id }).then(r => r.data);

/* Analytics */
export const getOverview    = (product_id) => api.get("/analytics/overview",  { params: { product_id } }).then(r => r.data);
export const getTrend       = (product_id) => api.get("/analytics/trend",     { params: { product_id } }).then(r => r.data);
export const getKeywords    = (product_id, sentiment, top_n = 20) =>
  api.get("/analytics/keywords", { params: { product_id, sentiment, top_n } }).then(r => r.data);
