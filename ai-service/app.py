"""
BROSKI Campus Mobility Platform — AI Microservice
═══════════════════════════════════════════════════
Provides intelligent ride matching, route optimization,
demand prediction, and AI assistant capabilities.

Tech: Python + Flask + scikit-learn (100% free & open-source)
"""

import os
import json
import math
import logging
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS

# ── Local module imports ──────────────────────────────────
from models.ride_matcher import RideMatcher
from models.route_optimizer import RouteOptimizer
from models.demand_predictor import DemandPredictor
from models.assistant import AIAssistant

# ── App Setup ─────────────────────────────────────────────
app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Initialize AI models ─────────────────────────────────
ride_matcher = RideMatcher()
route_optimizer = RouteOptimizer()
demand_predictor = DemandPredictor()
ai_assistant = AIAssistant()

# ══════════════════════════════════════════════════════════
# HEALTH CHECK
# ══════════════════════════════════════════════════════════

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "service": "broski-ai",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    })


# ══════════════════════════════════════════════════════════
# 1. RIDE MATCHING
# Match passengers to optimal rides based on route
# similarity, distance, time, and preferences.
# ══════════════════════════════════════════════════════════

@app.route("/api/ai/match-rides", methods=["POST"])
def match_rides():
    """
    Find the best ride matches for a passenger.
    
    Request body:
    {
        "passengerLat": float,
        "passengerLng": float,
        "destinationLat": float,
        "destinationLng": float,
        "preferredTime": "HH:MM" (optional),
        "availableRides": [
            {
                "rideId": str,
                "driverEmail": str,
                "fromLat": float,
                "fromLng": float,
                "destLat": float,
                "destLng": float,
                "time": str,
                "fare": float,
                "seats": int
            }
        ]
    }
    
    Returns rides ranked by match score (0-100).
    """
    try:
        data = request.json
        if not data or "availableRides" not in data:
            return jsonify({"error": "Missing ride data"}), 400

        results = ride_matcher.match(
            passenger_origin=(data.get("passengerLat", 0), data.get("passengerLng", 0)),
            passenger_dest=(data.get("destinationLat", 0), data.get("destinationLng", 0)),
            preferred_time=data.get("preferredTime"),
            available_rides=data["availableRides"]
        )

        return jsonify({"matches": results})
    except Exception as e:
        logger.error(f"Ride matching error: {e}")
        return jsonify({"error": str(e)}), 500


# ══════════════════════════════════════════════════════════
# 2. SMART ROUTE SUGGESTIONS
# Recommend optimal routes using distance, estimated
# time, and campus-aware waypoints.
# ══════════════════════════════════════════════════════════

@app.route("/api/ai/suggest-route", methods=["POST"])
def suggest_route():
    """
    Suggest optimal route between two points.
    
    Request body:
    {
        "fromLat": float,
        "fromLng": float,
        "toLat": float,
        "toLng": float,
        "vehicleType": "car" | "bike" (optional)
    }
    
    Returns route suggestions with distance, time, and fare estimates.
    """
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Missing route data"}), 400

        suggestions = route_optimizer.suggest(
            origin=(data["fromLat"], data["fromLng"]),
            destination=(data["toLat"], data["toLng"]),
            vehicle_type=data.get("vehicleType", "car")
        )

        return jsonify({"suggestions": suggestions})
    except Exception as e:
        logger.error(f"Route suggestion error: {e}")
        return jsonify({"error": str(e)}), 500


# ══════════════════════════════════════════════════════════
# 3. DEMAND PREDICTION
# Predict high-demand areas, peak hours, and popular
# routes using historical ride data.
# ══════════════════════════════════════════════════════════

@app.route("/api/ai/predict-demand", methods=["POST"])
def predict_demand():
    """
    Predict ride demand for a given time/area.
    
    Request body:
    {
        "historicalRides": [
            {
                "fromLat": float,
                "fromLng": float,
                "destLat": float,
                "destLng": float,
                "createdAt": "ISO datetime",
                "status": str
            }
        ],
        "targetHour": int (0-23, optional),
        "targetDay": int (0-6, Monday=0, optional)
    }
    
    Returns demand predictions: peak hours, popular routes, hotspots.
    """
    try:
        data = request.json
        if not data or "historicalRides" not in data:
            return jsonify({"error": "Missing ride history"}), 400

        predictions = demand_predictor.predict(
            rides=data["historicalRides"],
            target_hour=data.get("targetHour"),
            target_day=data.get("targetDay")
        )

        return jsonify({"predictions": predictions})
    except Exception as e:
        logger.error(f"Demand prediction error: {e}")
        return jsonify({"error": str(e)}), 500


# ══════════════════════════════════════════════════════════
# 4. AI ASSISTANT
# Natural language interface for ride queries.
# Parses user intent without any paid API.
# ══════════════════════════════════════════════════════════

@app.route("/api/ai/assistant", methods=["POST"])
def assistant():
    """
    Process natural language ride queries.
    
    Request body:
    {
        "message": "Find me a ride to campus",
        "context": {
            "userEmail": str,
            "userLocation": { "lat": float, "lng": float } (optional),
            "availableRides": [...] (optional)
        }
    }
    
    Returns structured response with intent, entities, and suggested action.
    """
    try:
        data = request.json
        if not data or "message" not in data:
            return jsonify({"error": "Missing message"}), 400

        response = ai_assistant.process(
            message=data["message"],
            context=data.get("context", {})
        )

        return jsonify({"response": response})
    except Exception as e:
        logger.error(f"Assistant error: {e}")
        return jsonify({"error": str(e)}), 500


# ══════════════════════════════════════════════════════════
# 5. CARBON FOOTPRINT CALCULATION
# ══════════════════════════════════════════════════════════

@app.route("/api/ai/carbon-impact", methods=["POST"])
def carbon_impact():
    """
    Calculate environmental impact of ride sharing.
    
    Request body:
    {
        "rides": [
            {
                "distanceKm": float,
                "passengers": int,
                "vehicleType": "car" | "bike"
            }
        ]
    }
    """
    try:
        data = request.json
        rides = data.get("rides", [])

        total_co2_saved = 0
        total_fuel_saved = 0
        total_distance_shared = 0

        for ride in rides:
            distance = ride.get("distanceKm", 0)
            passengers = ride.get("passengers", 1)
            vehicle = ride.get("vehicleType", "car")

            # Average car emits ~0.12 kg CO2 per km
            # Sharing saves (passengers - 1) individual trips
            co2_per_km = 0.12 if vehicle == "car" else 0.05
            fuel_per_km = 0.08 if vehicle == "car" else 0.03  # liters

            saved_trips = max(0, passengers - 1)
            total_co2_saved += distance * co2_per_km * saved_trips
            total_fuel_saved += distance * fuel_per_km * saved_trips
            total_distance_shared += distance

        return jsonify({
            "impact": {
                "co2SavedKg": round(total_co2_saved, 2),
                "fuelSavedLiters": round(total_fuel_saved, 2),
                "distanceSharedKm": round(total_distance_shared, 2),
                "treesEquivalent": round(total_co2_saved / 21, 1),  # 1 tree absorbs ~21 kg CO2/year
                "equivalentCarTrips": max(0, len(rides) * (passengers - 1)) if rides else 0
            }
        })
    except Exception as e:
        logger.error(f"Carbon impact error: {e}")
        return jsonify({"error": str(e)}), 500


# ══════════════════════════════════════════════════════════
# START SERVER
# ══════════════════════════════════════════════════════════

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    debug = os.environ.get("FLASK_ENV", "development") == "development"
    
    logger.info(f"🧠 BROSKI AI Service starting on port {port}")
    logger.info(f"   Ride Matching:     ✅ Ready")
    logger.info(f"   Route Optimizer:   ✅ Ready")
    logger.info(f"   Demand Predictor:  ✅ Ready")
    logger.info(f"   AI Assistant:      ✅ Ready")
    
    app.run(host="0.0.0.0", port=port, debug=debug)
