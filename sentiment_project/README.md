# 📊 SentimentIQ — Product Sentiment Analyzer & Review Dashboard

Flask · MongoDB · TextBlob · React · Recharts · Selenium

---

## 📁 Project Structure

```
sentiment_project/
├── backend/
│   ├── app.py                    ← Flask entry point
│   ├── requirements.txt
│   ├── .env                      ← MongoDB URI (edit this)
│   ├── routes/
│   │   ├── product_routes.py     ← CRUD for products
│   │   ├── review_routes.py      ← Store & analyze reviews
│   │   ├── scraper_routes.py     ← Trigger Amazon/Flipkart scraper
│   │   └── analytics_routes.py  ← Charts & keyword data
│   └── services/
│       ├── sentiment_service.py  ← TextBlob analysis
│       └── scraper_service.py    ← Selenium + BS4 scrapers
│
└── frontend/
    ├── package.json
    ├── public/
    │   └── index.html
    └── src/
        ├── App.js / App.css
        ├── index.js
        ├── utils/api.js           ← Axios API client
        └── pages/
            ├── Dashboard.js       ← Charts overview
            ├── Products.js        ← Product list
            ├── ProductDetail.js   ← Per-product reviews
            ├── Scraper.js         ← Scrape trigger UI
            └── Analyzer.js        ← Live text analyzer
```

---

## 🚀 How to Run

### Step 1 — Start MongoDB

Option A — Local:
```bash
mongod --dbpath /data/db
```

Option B — MongoDB Atlas (cloud):
- Create free cluster at https://cloud.mongodb.com
- Copy connection string into `backend/.env`

---

### Step 2 — Run the Backend

```bash
cd sentiment_project/backend

# Create virtual environment
python -m venv venv

# Activate it
source venv/bin/activate          # macOS / Linux
# OR
venv\Scripts\activate             # Windows

# Install dependencies
pip install -r requirements.txt

# Download TextBlob language data (one-time)
python -m textblob.download_corpora

# Edit .env if needed
# MONGO_URI=mongodb://localhost:27017/sentiment_db

# Start the server
python app.py
# → Running on http://localhost:5000
```

---

### Step 3 — Run the Frontend

Open a **new terminal**:

```bash
cd sentiment_project/frontend

npm install
npm start
# → Opens http://localhost:3000
```

---

## ✅ Quick Test (No ChromeDriver needed)

1. Open http://localhost:3000
2. Go to **Products** → click **+ Add Product** → enter a name → Create
3. Go to **Scraper** → select the product → click **Load Demo Data**
4. Go to **Dashboard** → see charts populate automatically
5. Go to **Analyzer** → try the quick example buttons

---

## 🌐 API Endpoints

| Method | Endpoint                    | Description                 |
|--------|-----------------------------|-----------------------------|
| GET    | `/api/health`               | Health check                |
| GET    | `/api/products/`            | List all products           |
| POST   | `/api/products/`            | Create product              |
| DELETE | `/api/products/:id`         | Delete product + reviews    |
| GET    | `/api/reviews/`             | Paginated reviews + filters |
| POST   | `/api/reviews/`             | Add & analyze a review      |
| POST   | `/api/reviews/analyze`      | Analyze text (no store)     |
| POST   | `/api/scraper/amazon`       | Scrape Amazon reviews       |
| POST   | `/api/scraper/flipkart`     | Scrape Flipkart reviews     |
| POST   | `/api/scraper/demo`         | Load sample demo reviews    |
| GET    | `/api/analytics/overview`   | Sentiment + rating stats    |
| GET    | `/api/analytics/trend`      | Monthly trend data          |
| GET    | `/api/analytics/keywords`   | Top word frequencies        |

---

## ☁️ Cloud Deployment

| Service       | Use for              |
|---------------|----------------------|
| Render        | Flask backend        |
| Netlify/Vercel| React frontend build |
| MongoDB Atlas | Database             |

**Deploy backend (Render):**
- Build command: `pip install -r requirements.txt`
- Start command: `gunicorn app:app`
- Env var: `MONGO_URI=<Atlas URI>`

**Deploy frontend (Netlify):**
```bash
npm run build   # creates build/ folder
```
Set env var: `REACT_APP_API_URL=https://your-app.onrender.com/api`
