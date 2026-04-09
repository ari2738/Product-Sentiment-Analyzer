from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime
from services.sentiment_service import analyze_sentiment

review_bp = Blueprint("reviews", __name__)

def get_mongo():
    from app import mongo
    return mongo

def _serialize(doc):
    doc["_id"] = str(doc["_id"])
    return doc

@review_bp.route("/", methods=["GET"])
def get_reviews():
    mongo = get_mongo()
    product_id = request.args.get("product_id")
    sentiment  = request.args.get("sentiment")
    source     = request.args.get("source")
    page       = int(request.args.get("page", 1))
    limit      = int(request.args.get("limit", 20))

    filt = {}
    if product_id: filt["product_id"] = product_id
    if sentiment:  filt["sentiment.final_label"] = sentiment
    if source:     filt["source"] = source

    total = mongo.db.reviews.count_documents(filt)
    items = list(
        mongo.db.reviews.find(filt)
        .sort("scraped_at", -1)
        .skip((page - 1) * limit)
        .limit(limit)
    )
    return jsonify({"total": total, "page": page, "limit": limit,
                    "reviews": [_serialize(r) for r in items]})

@review_bp.route("/", methods=["POST"])
def add_review():
    mongo = get_mongo()
    data = request.json or {}
    if not data.get("review_body"):
        return jsonify({"error": "review_body is required"}), 400

    sentiment = analyze_sentiment(data["review_body"])
    doc = {
        "product_id":    data.get("product_id", ""),
        "source":        data.get("source", "manual"),
        "product_title": data.get("product_title", ""),
        "review_title":  data.get("review_title", ""),
        "review_body":   data["review_body"],
        "rating":        data.get("rating"),
        "date":          data.get("date", ""),
        "sentiment":     sentiment,
        "scraped_at":    datetime.utcnow(),
    }
    result = mongo.db.reviews.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    _update_product_summary(data.get("product_id", ""), mongo)
    return jsonify(doc), 201

@review_bp.route("/analyze", methods=["POST"])
def analyze_text():
    data = request.json or {}
    if not data.get("text"):
        return jsonify({"error": "text is required"}), 400
    return jsonify(analyze_sentiment(data["text"]))

def _update_product_summary(product_id, mongo):
    if not product_id:
        return
    pipeline = [
        {"$match": {"product_id": product_id}},
        {"$group": {
            "_id":        "$sentiment.final_label",
            "count":      {"$sum": 1},
            "avg_rating": {"$avg": "$rating"},
        }},
    ]
    results = list(mongo.db.reviews.aggregate(pipeline))
    summary = {"positive": 0, "negative": 0, "neutral": 0}
    total = rating_sum = rating_count = 0
    for r in results:
        if r["_id"] in summary:
            summary[r["_id"]] = r["count"]
        total += r["count"]
        if r.get("avg_rating"):
            rating_sum   += r["avg_rating"] * r["count"]
            rating_count += r["count"]
    avg = round(rating_sum / rating_count, 2) if rating_count else 0.0
    try:
        mongo.db.products.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": {"sentiment_summary": summary,
                      "review_count": total, "avg_rating": avg}},
        )
    except Exception:
        pass
