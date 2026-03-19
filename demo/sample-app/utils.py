"""
Utility functions for the EcoProducts sample application.

These utilities handle eco-score calculations, carbon offset
estimations, and data validation. Having utilities in a separate
file helps demonstrate ECOOPS path-based optimization —
changes to this file should trigger lint + build + test jobs,
but NOT docs or deploy jobs.
"""

import math
from typing import Dict, List, Optional

# Carbon intensity factors by material type (kg CO₂ per kg of material)
MATERIAL_CARBON_FACTORS = {
    "recycled aluminum": 2.5,
    "virgin aluminum": 8.2,
    "BPA-free plastic": 3.1,
    "virgin plastic": 6.0,
    "recycled plastic": 1.8,
    "bamboo": 0.3,
    "plant-based bristles": 0.9,
    "monocrystalline silicon": 12.5,
    "stainless steel": 4.5,
    "recycled steel": 1.9,
    "organic cotton": 1.2,
    "conventional cotton": 5.4,
    "cork": 0.2,
    "natural rubber": 1.1,
}

# Eco-score weights
ECO_SCORE_WEIGHTS = {
    "material_sustainability": 0.35,
    "carbon_footprint": 0.30,
    "durability": 0.20,
    "recyclability": 0.15,
}


def calculate_eco_score(
    material_score: float,
    carbon_score: float,
    durability_score: float,
    recyclability_score: float,
) -> float:
    """
    Calculate weighted eco-score for a product.

    Each input score should be between 0 and 10.
    Returns a weighted score between 0 and 10.
    """
    if not all(0 <= s <= 10 for s in [material_score, carbon_score,
                                       durability_score, recyclability_score]):
        raise ValueError("All scores must be between 0 and 10")

    weighted = (
        material_score * ECO_SCORE_WEIGHTS["material_sustainability"]
        + carbon_score * ECO_SCORE_WEIGHTS["carbon_footprint"]
        + durability_score * ECO_SCORE_WEIGHTS["durability"]
        + recyclability_score * ECO_SCORE_WEIGHTS["recyclability"]
    )
    return round(weighted, 2)


def estimate_carbon_offset(
    materials: List[str],
    product_weight_kg: float = 0.5,
    lifespan_years: float = 5.0,
) -> float:
    """
    Estimate the carbon offset of using an eco-friendly product
    vs. a conventional alternative.

    Returns estimated CO₂ savings in kilograms over the product's lifespan.
    """
    eco_carbon = sum(
        MATERIAL_CARBON_FACTORS.get(m, 3.0) * product_weight_kg
        for m in materials
    )

    # Assume conventional alternative uses virgin materials with 2.5x impact
    conventional_carbon = eco_carbon * 2.5

    # Account for lifespan: longer-lasting products offset more
    lifespan_factor = math.log2(max(lifespan_years, 1)) + 1

    savings = (conventional_carbon - eco_carbon) * lifespan_factor
    return round(max(savings, 0), 2)


def validate_product_data(data: Dict) -> Optional[str]:
    """
    Validate product data for required fields and constraints.
    Returns None if valid, or an error message string.
    """
    required_fields = ["id", "name", "category", "materials"]

    for field in required_fields:
        if field not in data:
            return f"Missing required field: {field}"

    if not isinstance(data.get("materials"), list) or len(data["materials"]) == 0:
        return "Materials must be a non-empty list"

    if "eco_score" in data:
        score = data["eco_score"]
        if not isinstance(score, (int, float)) or not (0 <= score <= 10):
            return "Eco score must be a number between 0 and 10"

    return None


def format_impact_summary(
    carbon_offset_kg: float,
    products_count: int,
) -> Dict:
    """
    Format an environmental impact summary with human-readable equivalents.
    """
    trees_monthly = carbon_offset_kg / 21.77  # EPA tree absorption rate
    cars_km = carbon_offset_kg / 0.21  # Average car: 0.21 kg CO₂/km
    phone_charges = carbon_offset_kg / 0.008  # ~8g CO₂ per phone charge

    return {
        "total_carbon_offset_kg": round(carbon_offset_kg, 2),
        "products_count": products_count,
        "equivalents": {
            "trees_monthly_absorption": round(trees_monthly, 2),
            "car_km_avoided": round(cars_km, 1),
            "phone_charges": int(phone_charges),
        },
        "message": (
            f"🌱 Your {products_count} eco-products offset "
            f"{carbon_offset_kg:.1f} kg CO₂ — equivalent to "
            f"{trees_monthly:.1f} trees absorbing carbon for a month!"
        ),
    }
