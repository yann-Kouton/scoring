"""
Entraînement du modèle de scoring de satisfaction client (aviation).
Reproduit fidèlement le pipeline du notebook :
- Nettoyage (lignes corrompues, valeurs manquantes)
- Feature engineering (one-hot encoding)
- Gradient Boosting Classifier
- Seuil de décision optimal (indice de Youden)
Exporte le modèle, le scaler (non utilisé par GB mais gardé pour cohérence),
les colonnes finales, et le seuil dans model_artifacts.joblib
"""

import numpy as np
import pandas as pd
import joblib
import json

from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, roc_curve, classification_report, confusion_matrix
)

RANDOM_STATE = 42

# ---------------------------------------------------------------------------
# 1. Chargement des données
# ---------------------------------------------------------------------------
PATH_CSV = "Données-Scoring-Statisfaction-Clientelle-Aviaton.csv"
data_raw = pd.read_csv(PATH_CSV, skiprows=[0, 1, 3])
print("Shape brute :", data_raw.shape)

# ---------------------------------------------------------------------------
# 2. Nettoyage
# ---------------------------------------------------------------------------
rating_cols = [
    "Inflight wifi service", "Departure/Arrival time convenient", "Ease of Online booking",
    "Gate location", "Food and drink", "Online boarding", "Seat comfort",
    "Inflight entertainment", "On-board service", "Leg room service", "Baggage handling",
    "Checkin service", "Inflight service", "Cleanliness"
]

data = data_raw.copy()

mask_corrompues = (data[rating_cols] > 5).any(axis=1) | (data["Flight Distance"] > 20000)
data = data[~mask_corrompues].copy()
data = data.dropna(how="all").copy()
data = data.dropna(subset=["satisfaction"]).copy()


def imputer_valeurs_manquantes(df, colonnes_num, colonnes_cat):
    df = df.copy()
    for col in colonnes_num:
        mediane = df[col].median()
        df[col] = df[col].fillna(mediane)
    for col in colonnes_cat:
        mode = df[col].mode()[0]
        df[col] = df[col].fillna(mode)
    return df


colonnes_num = ["Age", "Flight Distance", "Departure Delay in Minutes", "Arrival Delay in Minutes"] + rating_cols
colonnes_cat = ["Gender", "Customer Type", "Type of Travel", "Class"]

data = imputer_valeurs_manquantes(data, colonnes_num, colonnes_cat)
assert data.isnull().sum().sum() == 0

data["Age"] = data["Age"].astype(int)
print("Shape après nettoyage :", data.shape)

# ---------------------------------------------------------------------------
# 3. Feature engineering
# ---------------------------------------------------------------------------
data_model = data.drop(columns=["Numero", "id"]).copy()
data_model["target"] = (data_model["satisfaction"] == "satisfied").astype(int)
data_model = data_model.drop(columns=["satisfaction"])

data_model = pd.get_dummies(
    data_model, columns=["Gender", "Customer Type", "Type of Travel", "Class"], drop_first=True
)

X = data_model.drop(columns=["target"])
y = data_model["target"]

feature_columns = X.columns.tolist()
print("Colonnes finales du modèle :", feature_columns)

# ---------------------------------------------------------------------------
# 4. Split + entraînement Gradient Boosting
# ---------------------------------------------------------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.25, random_state=RANDOM_STATE, stratify=y
)

gb = GradientBoostingClassifier(
    n_estimators=200, learning_rate=0.1, max_depth=3, random_state=RANDOM_STATE
)
gb.fit(X_train, y_train)

y_proba_test = gb.predict_proba(X_test)[:, 1]
auc = roc_auc_score(y_test, y_proba_test)
print(f"AUC test : {auc:.4f}")

# ---------------------------------------------------------------------------
# 5. Seuil optimal (indice de Youden)
# ---------------------------------------------------------------------------
fpr, tpr, thresholds_roc = roc_curve(y_test, y_proba_test)
youden_j = tpr - fpr
idx_best = np.argmax(youden_j)
seuil_youden = float(thresholds_roc[idx_best])
print(f"Seuil optimal (Youden) : {seuil_youden:.4f}")

y_pred_final = (y_proba_test >= seuil_youden).astype(int)
report = classification_report(
    y_test, y_pred_final, target_names=["neutral or dissatisfied", "satisfied"], output_dict=True
)
cm = confusion_matrix(y_test, y_pred_final).tolist()

metrics_summary = {
    "auc": auc,
    "accuracy": accuracy_score(y_test, y_pred_final),
    "precision": precision_score(y_test, y_pred_final),
    "recall": recall_score(y_test, y_pred_final),
    "f1": f1_score(y_test, y_pred_final),
    "seuil_youden": seuil_youden,
    "confusion_matrix": cm,
    "classification_report": report,
    "n_train": len(X_train),
    "n_test": len(X_test),
}

# ---------------------------------------------------------------------------
# 6. Importance des variables
# ---------------------------------------------------------------------------
importances = pd.Series(gb.feature_importances_, index=feature_columns).sort_values(ascending=False)
feature_importance = importances.to_dict()

# ---------------------------------------------------------------------------
# 7. Statistiques pour le dashboard (calculées sur les données nettoyées)
# ---------------------------------------------------------------------------
dashboard_stats = {
    "n_total": int(len(data)),
    "satisfaction_counts": data["satisfaction"].value_counts().to_dict(),
    "satisfaction_by_class": (
        data.groupby("Class")["satisfaction"].value_counts(normalize=True).unstack().to_dict()
    ),
    "satisfaction_by_gender": (
        data.groupby("Gender")["satisfaction"].value_counts(normalize=True).unstack().to_dict()
    ),
    "satisfaction_by_customer_type": (
        data.groupby("Customer Type")["satisfaction"].value_counts(normalize=True).unstack().to_dict()
    ),
    "satisfaction_by_travel_type": (
        data.groupby("Type of Travel")["satisfaction"].value_counts(normalize=True).unstack().to_dict()
    ),
    "avg_ratings_by_satisfaction": (
        data.groupby("satisfaction")[rating_cols].mean().to_dict()
    ),
    "age_histogram": (
        lambda bins: [
            {
                "bucket": f"{bins[i]}-{bins[i+1]-1}",
                "satisfied": int(
                    ((data["Age"] >= bins[i]) & (data["Age"] < bins[i + 1]) & (data["satisfaction"] == "satisfied")).sum()
                ),
                "neutral or dissatisfied": int(
                    ((data["Age"] >= bins[i]) & (data["Age"] < bins[i + 1]) & (data["satisfaction"] != "satisfied")).sum()
                ),
            }
            for i in range(len(bins) - 1)
        ]
    )(list(range(0, 90, 10))),
    "flight_distance_avg_by_satisfaction": (
        data.groupby("satisfaction")["Flight Distance"].mean().to_dict()
    ),
    "delay_avg_by_satisfaction": {
        "departure": data.groupby("satisfaction")["Departure Delay in Minutes"].mean().to_dict(),
        "arrival": data.groupby("satisfaction")["Arrival Delay in Minutes"].mean().to_dict(),
    },
}

# ---------------------------------------------------------------------------
# 8. Sauvegarde
# ---------------------------------------------------------------------------
artifacts = {
    "model": gb,
    "feature_columns": feature_columns,
    "rating_cols": rating_cols,
    "seuil_youden": seuil_youden,
    "categorical_columns": colonnes_cat,
}
joblib.dump(artifacts, "model_artifacts.joblib")

with open("model_metrics.json", "w", encoding="utf-8") as f:
    json.dump(metrics_summary, f, ensure_ascii=False, indent=2, default=str)

with open("feature_importance.json", "w", encoding="utf-8") as f:
    json.dump(feature_importance, f, ensure_ascii=False, indent=2)

with open("dashboard_stats.json", "w", encoding="utf-8") as f:
    json.dump(dashboard_stats, f, ensure_ascii=False, indent=2, default=str)

print("\n✅ Artefacts sauvegardés : model_artifacts.joblib, model_metrics.json, feature_importance.json, dashboard_stats.json")
