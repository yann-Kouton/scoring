"""
API FastAPI — Scoring de satisfaction client (aviation)

Toutes les routes sont montées sous /api car, en déploiement Vercel Services,
le service reçoit le chemin complet de la requête (non tronqué) :
- GET  /api/health              -> vérifie que l'API et le modèle sont chargés
- POST /api/predict              -> prédit la satisfaction d'un passager
- GET  /api/metrics               -> métriques du modèle (AUC, accuracy, seuil...)
- GET  /api/feature-importance      -> importance des variables
- GET  /api/dashboard-stats           -> statistiques agrégées pour le dashboard
"""

import json
from typing import Literal

import joblib
import pandas as pd
from fastapi import APIRouter, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="API Scoring Satisfaction Client Aviation",
    description="Prédit la satisfaction d'un passager à partir du modèle Gradient Boosting entraîné.",
    version="1.0.0",
)
router = APIRouter(prefix="/api")

# CORS — utile en dev local si le frontend (Vite, port 5173) et le backend
# (Uvicorn, port 8000) tournent sur des ports différents. En production sur
# Vercel Services, frontend et backend partagent le même domaine et les
# requêtes passent par les rewrites internes : le CORS n'entre pas en jeu.
ALLOWED_ORIGINS = [
    "https://esmel-soro.vercel.app",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Chargement des artefacts au démarrage
# ---------------------------------------------------------------------------
try:
    artifacts = joblib.load("model_artifacts.joblib")
    MODEL = artifacts["model"]
    FEATURE_COLUMNS = artifacts["feature_columns"]
    SEUIL_YOUDEN = artifacts["seuil_youden"]
except FileNotFoundError:
    MODEL = None
    FEATURE_COLUMNS = []
    SEUIL_YOUDEN = 0.5

with open("model_metrics.json", encoding="utf-8") as f:
    METRICS = json.load(f)

with open("feature_importance.json", encoding="utf-8") as f:
    FEATURE_IMPORTANCE = json.load(f)

with open("dashboard_stats.json", encoding="utf-8") as f:
    DASHBOARD_STATS = json.load(f)


# ---------------------------------------------------------------------------
# Schéma de requête
# ---------------------------------------------------------------------------
class PassengerInput(BaseModel):
    age: int = Field(..., ge=0, le=120, description="Âge du passager")
    gender: Literal["Male", "Female"]
    customer_type: Literal["Loyal Customer", "disloyal Customer"]
    type_of_travel: Literal["Personal Travel", "Business travel"]
    travel_class: Literal["Eco", "Eco Plus", "Business"] = Field(..., alias="class")
    flight_distance: int = Field(..., ge=0)
    inflight_wifi_service: int = Field(..., ge=0, le=5)
    departure_arrival_time_convenient: int = Field(..., ge=0, le=5)
    ease_of_online_booking: int = Field(..., ge=0, le=5)
    gate_location: int = Field(..., ge=0, le=5)
    food_and_drink: int = Field(..., ge=0, le=5)
    online_boarding: int = Field(..., ge=0, le=5)
    seat_comfort: int = Field(..., ge=0, le=5)
    inflight_entertainment: int = Field(..., ge=0, le=5)
    onboard_service: int = Field(..., ge=0, le=5)
    leg_room_service: int = Field(..., ge=0, le=5)
    baggage_handling: int = Field(..., ge=0, le=5)
    checkin_service: int = Field(..., ge=0, le=5)
    inflight_service: int = Field(..., ge=0, le=5)
    cleanliness: int = Field(..., ge=0, le=5)
    departure_delay_in_minutes: int = Field(..., ge=0)
    arrival_delay_in_minutes: int = Field(..., ge=0)

    class Config:
        populate_by_name = True


class PredictionOutput(BaseModel):
    prediction: Literal["satisfied", "neutral or dissatisfied"]
    probability_satisfied: float
    seuil_utilise: float
    confiance: str


# ---------------------------------------------------------------------------
# Transformation de la requête en vecteur de features (miroir du notebook)
# ---------------------------------------------------------------------------
def build_feature_row(p: PassengerInput) -> pd.DataFrame:
    row = {
        "Age": p.age,
        "Flight Distance": p.flight_distance,
        "Inflight wifi service": p.inflight_wifi_service,
        "Departure/Arrival time convenient": p.departure_arrival_time_convenient,
        "Ease of Online booking": p.ease_of_online_booking,
        "Gate location": p.gate_location,
        "Food and drink": p.food_and_drink,
        "Online boarding": p.online_boarding,
        "Seat comfort": p.seat_comfort,
        "Inflight entertainment": p.inflight_entertainment,
        "On-board service": p.onboard_service,
        "Leg room service": p.leg_room_service,
        "Baggage handling": p.baggage_handling,
        "Checkin service": p.checkin_service,
        "Inflight service": p.inflight_service,
        "Cleanliness": p.cleanliness,
        "Departure Delay in Minutes": p.departure_delay_in_minutes,
        "Arrival Delay in Minutes": p.arrival_delay_in_minutes,
        # One-hot (drop_first=True dans le notebook, donc valeur de référence = 0)
        "Gender_Male": 1 if p.gender == "Male" else 0,
        "Customer Type_disloyal Customer": 1 if p.customer_type == "disloyal Customer" else 0,
        "Type of Travel_Personal Travel": 1 if p.type_of_travel == "Personal Travel" else 0,
        "Class_Eco": 1 if p.travel_class == "Eco" else 0,
        "Class_Eco Plus": 1 if p.travel_class == "Eco Plus" else 0,
    }
    df = pd.DataFrame([row])
    return df[FEATURE_COLUMNS]


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@router.get("/health")
def health():
    return {"status": "ok", "model_loaded": MODEL is not None}


@router.post("/predict", response_model=PredictionOutput)
def predict(passenger: PassengerInput):
    if MODEL is None:
        raise HTTPException(status_code=503, detail="Modèle non chargé sur le serveur.")

    X_row = build_feature_row(passenger)
    proba = float(MODEL.predict_proba(X_row)[0, 1])
    is_satisfied = proba >= SEUIL_YOUDEN

    ecart = abs(proba - SEUIL_YOUDEN)
    if ecart > 0.3:
        confiance = "élevée"
    elif ecart > 0.1:
        confiance = "moyenne"
    else:
        confiance = "faible (proche du seuil de décision)"

    return PredictionOutput(
        prediction="satisfied" if is_satisfied else "neutral or dissatisfied",
        probability_satisfied=round(proba, 4),
        seuil_utilise=round(SEUIL_YOUDEN, 4),
        confiance=confiance,
    )


@router.get("/metrics")
def get_metrics():
    return METRICS


@router.get("/feature-importance")
def get_feature_importance():
    return FEATURE_IMPORTANCE


@router.get("/dashboard-stats")
def get_dashboard_stats():
    return DASHBOARD_STATS


app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
