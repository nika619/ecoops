"""
Tests for the EcoProducts sample application.

Having tests in a separate directory helps demonstrate ECOOPS
path-based optimization — changes to test files should trigger the test
job and lint job, but NOT the docs or deploy jobs.
"""

import pytest
from app import app, products
from utils import (
    calculate_eco_score,
    estimate_carbon_offset,
    validate_product_data,
    format_impact_summary,
)


@pytest.fixture
def client():
    """Create a test client for the Flask app."""
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


@pytest.fixture(autouse=True)
def reset_reviews():
    """Reset product reviews before each test."""
    for product in products.values():
        product["reviews"] = []


class TestHealthCheck:
    """Tests for the health check endpoint."""

    def test_index_returns_200(self, client):
        response = client.get("/")
        assert response.status_code == 200

    def test_index_contains_service_name(self, client):
        response = client.get("/")
        data = response.get_json()
        assert data["service"] == "EcoProducts API"
        assert data["status"] == "healthy"

    def test_index_contains_product_count(self, client):
        response = client.get("/")
        data = response.get_json()
        assert data["total_products"] == len(products)


class TestProducts:
    """Tests for product endpoints."""

    def test_list_all_products(self, client):
        response = client.get("/products")
        data = response.get_json()
        assert len(data) == 3

    def test_filter_by_category(self, client):
        response = client.get("/products?category=drinkware")
        data = response.get_json()
        assert len(data) == 1
        assert data[0]["id"] == "eco-bottle"

    def test_filter_nonexistent_category(self, client):
        response = client.get("/products?category=nonexistent")
        data = response.get_json()
        assert len(data) == 0

    def test_get_product_by_id(self, client):
        response = client.get("/products/eco-bottle")
        assert response.status_code == 200
        data = response.get_json()
        assert data["name"] == "Reusable Water Bottle"

    def test_get_nonexistent_product(self, client):
        response = client.get("/products/does-not-exist")
        assert response.status_code == 404


class TestReviews:
    """Tests for the review endpoint."""

    def test_add_review(self, client):
        response = client.post(
            "/products/eco-bottle/review",
            json={"rating": 5, "comment": "Excellent!"},
        )
        assert response.status_code == 201

    def test_add_review_invalid_rating(self, client):
        response = client.post(
            "/products/eco-bottle/review",
            json={"rating": 6},
        )
        assert response.status_code == 400

    def test_add_review_no_rating(self, client):
        response = client.post(
            "/products/eco-bottle/review",
            json={"comment": "No rating"},
        )
        assert response.status_code == 400

    def test_add_review_nonexistent_product(self, client):
        response = client.post(
            "/products/fake/review",
            json={"rating": 3},
        )
        assert response.status_code == 404

    def test_review_eco_verified(self, client):
        response = client.post(
            "/products/eco-bottle/review",
            json={"rating": 4, "eco_verified": True},
        )
        data = response.get_json()
        assert data["review"]["eco_verified"] is True


class TestImpact:
    """Tests for the impact endpoint."""

    def test_total_impact(self, client):
        response = client.get("/impact")
        assert response.status_code == 200
        data = response.get_json()
        assert "total_carbon_offset_kg" in data
        assert "trees_equivalent" in data
        assert data["total_products"] == 3


class TestEcoScore:
    """Tests for the eco-score calculation utility."""

    def test_perfect_scores(self):
        score = calculate_eco_score(10, 10, 10, 10)
        assert score == 10.0

    def test_zero_scores(self):
        score = calculate_eco_score(0, 0, 0, 0)
        assert score == 0.0

    def test_weighted_calculation(self):
        score = calculate_eco_score(8.0, 7.0, 6.0, 9.0)
        expected = 8.0 * 0.35 + 7.0 * 0.30 + 6.0 * 0.20 + 9.0 * 0.15
        assert score == round(expected, 2)

    def test_invalid_score_raises(self):
        with pytest.raises(ValueError):
            calculate_eco_score(11, 5, 5, 5)

    def test_negative_score_raises(self):
        with pytest.raises(ValueError):
            calculate_eco_score(-1, 5, 5, 5)


class TestCarbonOffset:
    """Tests for the carbon offset estimation utility."""

    def test_basic_offset(self):
        offset = estimate_carbon_offset(["bamboo"], 0.5, 5.0)
        assert offset > 0

    def test_more_materials_higher_offset(self):
        offset_one = estimate_carbon_offset(["bamboo"], 0.5, 5.0)
        offset_many = estimate_carbon_offset(
            ["bamboo", "recycled aluminum", "cork"], 0.5, 5.0
        )
        assert offset_many > offset_one

    def test_longer_lifespan_higher_offset(self):
        offset_short = estimate_carbon_offset(["bamboo"], 0.5, 1.0)
        offset_long = estimate_carbon_offset(["bamboo"], 0.5, 10.0)
        assert offset_long > offset_short

    def test_unknown_material_uses_default(self):
        offset = estimate_carbon_offset(["unknown_material"], 0.5, 5.0)
        assert offset > 0


class TestValidation:
    """Tests for product data validation."""

    def test_valid_product(self):
        data = {
            "id": "test",
            "name": "Test Product",
            "category": "test",
            "materials": ["bamboo"],
        }
        assert validate_product_data(data) is None

    def test_missing_required_field(self):
        data = {"id": "test", "name": "Test"}
        error = validate_product_data(data)
        assert "Missing required field" in error

    def test_empty_materials(self):
        data = {
            "id": "test",
            "name": "Test",
            "category": "test",
            "materials": [],
        }
        error = validate_product_data(data)
        assert "non-empty list" in error

    def test_invalid_eco_score(self):
        data = {
            "id": "test",
            "name": "Test",
            "category": "test",
            "materials": ["bamboo"],
            "eco_score": 15,
        }
        error = validate_product_data(data)
        assert "between 0 and 10" in error


class TestImpactSummary:
    """Tests for impact summary formatting."""

    def test_format_summary(self):
        summary = format_impact_summary(10.0, 5)
        assert summary["total_carbon_offset_kg"] == 10.0
        assert summary["products_count"] == 5
        assert "trees_monthly_absorption" in summary["equivalents"]
        assert "🌱" in summary["message"]

    def test_zero_offset(self):
        summary = format_impact_summary(0.0, 0)
        assert summary["total_carbon_offset_kg"] == 0.0
