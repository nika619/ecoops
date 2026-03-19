"""
EcoCI Guardian — Sample Application (Demo)

A simple Flask-based REST API for managing eco-friendly product ratings.
This app exists solely to demonstrate EcoCI Guardian's CI optimization.
The codebase has multiple directories (src/, tests/, docs/) so jobs can
be mapped to specific file paths.
"""

from flask import Flask, jsonify, request

app = Flask(__name__)

# In-memory product database
products = {
    "eco-bottle": {
        "id": "eco-bottle",
        "name": "Reusable Water Bottle",
        "category": "drinkware",
        "eco_score": 9.2,
        "carbon_offset_kg": 2.5,
        "materials": ["recycled aluminum", "BPA-free plastic"],
        "reviews": []
    },
    "solar-charger": {
        "id": "solar-charger",
        "name": "Portable Solar Charger",
        "category": "electronics",
        "eco_score": 8.7,
        "carbon_offset_kg": 15.0,
        "materials": ["monocrystalline silicon", "recycled plastic"],
        "reviews": []
    },
    "bamboo-brush": {
        "id": "bamboo-brush",
        "name": "Bamboo Toothbrush",
        "category": "personal care",
        "eco_score": 9.5,
        "carbon_offset_kg": 0.8,
        "materials": ["bamboo", "plant-based bristles"],
        "reviews": []
    }
}


@app.route("/")
def index():
    """Health check endpoint."""
    return jsonify({
        "service": "EcoProducts API",
        "version": "1.0.0",
        "status": "healthy",
        "total_products": len(products)
    })


@app.route("/products", methods=["GET"])
def list_products():
    """List all products with optional category filter."""
    category = request.args.get("category")
    if category:
        filtered = {
            k: v for k, v in products.items()
            if v["category"] == category
        }
        return jsonify(list(filtered.values()))
    return jsonify(list(products.values()))


@app.route("/products/<product_id>", methods=["GET"])
def get_product(product_id):
    """Get a single product by ID."""
    product = products.get(product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404
    return jsonify(product)


@app.route("/products/<product_id>/review", methods=["POST"])
def add_review(product_id):
    """Add a review to a product."""
    product = products.get(product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404

    data = request.get_json()
    if not data or "rating" not in data:
        return jsonify({"error": "Rating is required"}), 400

    rating = data["rating"]
    if not (1 <= rating <= 5):
        return jsonify({"error": "Rating must be between 1 and 5"}), 400

    review = {
        "rating": rating,
        "comment": data.get("comment", ""),
        "eco_verified": data.get("eco_verified", False)
    }
    product["reviews"].append(review)

    return jsonify({
        "message": "Review added successfully",
        "product_id": product_id,
        "review": review
    }), 201


@app.route("/impact", methods=["GET"])
def total_impact():
    """Calculate total environmental impact across all products."""
    total_offset = sum(p["carbon_offset_kg"] for p in products.values())
    avg_eco_score = sum(p["eco_score"] for p in products.values()) / len(products)

    return jsonify({
        "total_carbon_offset_kg": round(total_offset, 2),
        "average_eco_score": round(avg_eco_score, 2),
        "total_products": len(products),
        "trees_equivalent": round(total_offset / 21.77, 2)
    })


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
