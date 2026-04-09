from flask import Flask
from flask_cors import CORS
from flask_pymongo import PyMongo
from dotenv import load_dotenv
import os

load_dotenv()

# Define mongo here so all routes import it from this file
mongo = PyMongo()

def create_app():
    app = Flask(__name__)
    CORS(app)

    app.config["MONGO_URI"] = os.getenv("MONGO_URI", "mongodb://localhost:27017/sentiment_db")

    mongo.init_app(app)

    # Import blueprints INSIDE function to avoid circular imports
    from routes.product_routes   import product_bp
    from routes.review_routes    import review_bp
    from routes.scraper_routes   import scraper_bp
    from routes.analytics_routes import analytics_bp

    app.register_blueprint(product_bp,   url_prefix="/api/products")
    app.register_blueprint(review_bp,    url_prefix="/api/reviews")
    app.register_blueprint(scraper_bp,   url_prefix="/api/scraper")
    app.register_blueprint(analytics_bp, url_prefix="/api/analytics")

    @app.route("/api/health")
    def health():
        return {"status": "ok", "message": "Sentiment Dashboard API running"}

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)
