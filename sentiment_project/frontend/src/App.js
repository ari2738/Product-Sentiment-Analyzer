import React from "react";
import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import Dashboard     from "./pages/Dashboard";
import Products      from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Scraper       from "./pages/Scraper";
import Analyzer      from "./pages/Analyzer";
import "./App.css";

export default function App() {
  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="nav-brand">
            <span className="brand-icon">📊</span>
            <span className="brand-text">SentimentIQ</span>
          </div>
          <div className="nav-links">
            <NavLink to="/"           end>Dashboard</NavLink>
            <NavLink to="/products"      >Products</NavLink>
            <NavLink to="/scraper"       >Scraper</NavLink>
            <NavLink to="/analyzer"      >Analyzer</NavLink>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/"             element={<Dashboard />}     />
            <Route path="/products"     element={<Products />}      />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/scraper"      element={<Scraper />}       />
            <Route path="/analyzer"     element={<Analyzer />}      />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
