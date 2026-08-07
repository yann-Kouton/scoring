# Backend — API de scoring

API FastAPI qui sert le modèle Gradient Boosting entraîné sur les données
`Données-Scoring-Statisfaction-Clientelle-Aviaton.csv`.

## Installation

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows : venv\Scripts\activate
pip install -r requirements.txt
```

## 1. Entraîner le modèle (une seule fois)

Le CSV source doit être présent dans ce dossier (déjà fait ici).

```bash
python train_model.py
```

Cela génère 4 fichiers, déjà inclus dans ce projet :
- `model_artifacts.joblib` — modèle + colonnes + seuil de décision
- `model_metrics.json` — métriques de performance (AUC, accuracy, matrice de confusion…)
- `feature_importance.json` — importance des variables
- `dashboard_stats.json` — statistiques agrégées pour le dashboard

## 2. Lancer l'API

```bash
uvicorn main:app --reload --port 8000
```

L'API est disponible sur `http://localhost:8000`.
Documentation interactive (Swagger) : `http://localhost:8000/docs`

## Endpoints

| Méthode | Route                      | Description                                    |
|---------|------------------------------|------------------------------------------------|
| GET     | `/api/health`                 | Statut de l'API et du modèle                   |
| POST    | `/api/predict`                 | Prédit la satisfaction d'un passager           |
| GET     | `/api/metrics`                  | Métriques de performance du modèle            |
| GET     | `/api/feature-importance`         | Importance des variables                     |
| GET     | `/api/dashboard-stats`             | Statistiques agrégées pour le dashboard      |

En dev local : `http://localhost:8000/api/health`, etc.

## Déploiement

En production, ce backend est déployé **avec le frontend, dans le même
projet Vercel**, via [Vercel Services](https://vercel.com/docs/services)
(voir le `vercel.json` à la racine du projet). Aucune configuration manuelle
d'hébergeur séparé n'est nécessaire.

Les routes sont préfixées par `/api` car Vercel Services forwarde le chemin
complet de la requête au service (il n'est pas tronqué) : `/api/predict`
arrive tel quel côté FastAPI.
