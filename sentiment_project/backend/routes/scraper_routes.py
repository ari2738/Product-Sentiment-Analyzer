from flask import Blueprint, request, jsonify
from datetime import datetime
from services.scraper_service import (
    scrape_amazon_reviews, scrape_flipkart_reviews, get_sample_reviews
)
from services.sentiment_service import analyze_sentiment

scraper_bp = Blueprint("scraper", __name__)

def get_mongo():
    from app import mongo
    return mongo

def _save_reviews(reviews, product_id=""):
    mongo = get_mongo()
    saved = 0
    for r in reviews:
        r["sentiment"]  = analyze_sentiment(r.get("review_body", ""))
        r["product_id"] = product_id
        r["scraped_at"] = datetime.utcnow()
        exists = mongo.db.reviews.find_one({
            "review_body": r["review_body"],
            "product_url": r.get("product_url", ""),
        })
        if not exists:
            mongo.db.reviews.insert_one(r)
            saved += 1
    return saved

@scraper_bp.route("/amazon", methods=["POST"])
def scrape_amazon():
    data = request.json or {}
    url = data.get("url", "")
    if not url:
        return jsonify({"error": "url is required"}), 400
    try:
        reviews = scrape_amazon_reviews(url, min(int(data.get("max_pages", 3)), 10))
        saved   = _save_reviews(reviews, data.get("product_id", ""))
        return jsonify({"scraped": len(reviews), "saved": saved, "source": "amazon"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@scraper_bp.route("/flipkart", methods=["POST"])
def scrape_flipkart():
    data = request.json or {}
    url = data.get("url", "")
    if not url:
        return jsonify({"error": "url is required"}), 400
    try:
        reviews = scrape_flipkart_reviews(url, min(int(data.get("max_pages", 3)), 10))
        saved   = _save_reviews(reviews, data.get("product_id", ""))
        return jsonify({"scraped": len(reviews), "saved": saved, "source": "flipkart"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@scraper_bp.route("/demo", methods=["POST"])
def load_demo():
    data       = request.json or {}
    product_id = data.get("product_id", "demo")
    reviews    = get_sample_reviews()
    saved      = _save_reviews(reviews, product_id)
    return jsonify({"scraped": len(reviews), "saved": saved, "source": "demo"})
