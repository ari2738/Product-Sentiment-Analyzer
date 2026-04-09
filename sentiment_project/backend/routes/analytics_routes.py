from flask import Blueprint, request, jsonify
from services.sentiment_service import extract_keywords

analytics_bp = Blueprint("analytics", __name__)

def get_mongo():
    from app import mongo
    return mongo

@analytics_bp.route("/overview", methods=["GET"])
def overview():
    mongo = get_mongo()
    product_id = request.args.get("product_id")
    match = {"product_id": product_id} if product_id else {}

    dist = {r["_id"]: r["count"] for r in mongo.db.reviews.aggregate([
        {"$match": match},
        {"$group": {"_id": "$sentiment.final_label", "count": {"$sum": 1}}}
    ])}

    ratings = [{"rating": int(r["_id"]), "count": r["count"]}
               for r in mongo.db.reviews.aggregate([
        {"$match": {**match, "rating": {"$ne": None}}},
        {"$group": {"_id": {"$floor": "$rating"}, "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ])]

    sources = {r["_id"]: r["count"] for r in mongo.db.reviews.aggregate([
        {"$match": match},
        {"$group": {"_id": "$source", "count": {"$sum": 1}}}
    ])}

    return jsonify({
        "total_reviews":          sum(dist.values()),
        "sentiment_distribution": dist,
        "rating_distribution":    ratings,
        "source_distribution":    sources,
    })

@analytics_bp.route("/trend", methods=["GET"])
def trend():
    mongo = get_mongo()
    product_id = request.args.get("product_id")
    match = {"product_id": product_id} if product_id else {}

    buckets = {}
    for r in mongo.db.reviews.aggregate([
        {"$match": match},
        {"$group": {
            "_id": {
                "year":  {"$year":  "$scraped_at"},
                "month": {"$month": "$scraped_at"},
                "label": "$sentiment.final_label",
            },
            "count": {"$sum": 1},
        }},
        {"$sort": {"_id.year": 1, "_id.month": 1}},
    ]):
        key = f"{r['_id']['year']}-{r['_id']['month']:02d}"
        buckets.setdefault(key, {"month": key, "positive": 0, "negative": 0, "neutral": 0})
        label = r["_id"]["label"]
        if label in buckets[key]:
            buckets[key][label] = r["count"]
    return jsonify(sorted(buckets.values(), key=lambda x: x["month"]))

@analytics_bp.route("/keywords", methods=["GET"])
def keywords():
    mongo = get_mongo()
    product_id = request.args.get("product_id")
    sentiment  = request.args.get("sentiment")
    top_n      = int(request.args.get("top_n", 20))

    filt = {}
    if product_id: filt["product_id"] = product_id
    if sentiment:  filt["sentiment.final_label"] = sentiment

    docs  = mongo.db.reviews.find(filt, {"sentiment.cleaned_text": 1})
    texts = [d["sentiment"]["cleaned_text"]
             for d in docs if d.get("sentiment", {}).get("cleaned_text")]
    return jsonify(extract_keywords(texts, top_n))
