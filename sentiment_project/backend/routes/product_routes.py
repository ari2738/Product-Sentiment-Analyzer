from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime

product_bp = Blueprint("products", __name__)

def get_mongo():
    from app import mongo
    return mongo

def _serialize(doc):
    doc["_id"] = str(doc["_id"])
    return doc

@product_bp.route("/", methods=["GET"])
def get_products():
    mongo = get_mongo()
    q = request.args.get("q", "")
    filt = {"name": {"$regex": q, "$options": "i"}} if q else {}
    products = list(mongo.db.products.find(filt).sort("created_at", -1))
    return jsonify([_serialize(p) for p in products])

@product_bp.route("/<product_id>", methods=["GET"])
def get_product(product_id):
    mongo = get_mongo()
    p = mongo.db.products.find_one({"_id": ObjectId(product_id)})
    if not p:
        return jsonify({"error": "Not found"}), 404
    return jsonify(_serialize(p))

@product_bp.route("/", methods=["POST"])
def create_product():
    mongo = get_mongo()
    data = request.json or {}
    if not data.get("name"):
        return jsonify({"error": "name is required"}), 400
    doc = {
        "name":              data["name"],
        "description":       data.get("description", ""),
        "category":          data.get("category", ""),
        "amazon_url":        data.get("amazon_url", ""),
        "flipkart_url":      data.get("flipkart_url", ""),
        "created_at":        datetime.utcnow(),
        "review_count":      0,
        "avg_rating":        0.0,
        "sentiment_summary": {"positive": 0, "negative": 0, "neutral": 0},
    }
    result = mongo.db.products.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return jsonify(doc), 201

@product_bp.route("/<product_id>", methods=["DELETE"])
def delete_product(product_id):
    mongo = get_mongo()
    mongo.db.products.delete_one({"_id": ObjectId(product_id)})
    mongo.db.reviews.delete_many({"product_id": product_id})
    return jsonify({"message": "Deleted"}), 200
