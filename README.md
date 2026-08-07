# Scoring Satisfaction Client — Aviation

Application complète (API + site React) qui déploie le modèle Gradient
Boosting du notebook `vrScoring_Satisfaction_Clientele_Aviation.ipynb` pour :

1. **Prédire** la satisfaction d'un passager individuel à partir de son
   profil et de ses notes de service.
2. **Explorer** un tableau de bord interactif sur les tendances de
   satisfaction du jeu de données historique.

## Structure du projet

```
backend/     API FastAPI qui sert le modèle (voir backend/README.md)
frontend/    Site React / Vite (voir frontend/README.md)
```

## Démarrage rapide (développement local)

Terminal 1 — API :
```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Terminal 2 — Site :
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Ouvre `http://localhost:5173`.

## Modèle

- **Algorithme** : Gradient Boosting Classifier (scikit-learn)
- **AUC (test)** : 0.991
- **Accuracy** : 95.3 %
- **Seuil de décision** : optimisé par l'indice de Youden (≈ 0.48, au lieu
  du seuil par défaut à 0.5) pour équilibrer précision et rappel
- Entraîné sur 103 900 passagers (après nettoyage des lignes corrompues et
  imputation des valeurs manquantes), avec un split 75/25 train/test

Le script `backend/train_model.py` reproduit fidèlement le pipeline du
notebook original (nettoyage → imputation → one-hot encoding → entraînement
→ seuil optimal) et exporte les artefacts consommés par l'API.

## Déploiement en production — Vercel Services

Ce projet est configuré pour un déploiement **mono-projet** sur Vercel grâce
à [Vercel Services](https://vercel.com/docs/services) : le frontend (Vite)
et le backend (FastAPI) sont déployés ensemble, sur le même domaine
(`https://esmel-soro.vercel.app`), via le `vercel.json` à la racine.

```json
{
  "services": {
    "frontend": { "root": "frontend/", "framework": "vite" },
    "backend": { "root": "backend/", "entrypoint": "main:app" }
  },
  "rewrites": [
    { "source": "/api/(.*)", "destination": { "service": "backend" } },
    { "source": "/(.*)", "destination": { "service": "frontend" } }
  ]
}
```

- Toutes les requêtes vers `/api/*` sont routées vers le service `backend`.
- Toutes les autres requêtes sont routées vers le service `frontend`.
- Les routes FastAPI sont donc montées sous `/api` (`/api/predict`,
  `/api/metrics`, etc.) — le chemin n'est **pas** tronqué par Vercel.
- Comme les deux services partagent le même domaine, **aucun CORS ni
  variable `VITE_API_URL` n'est nécessaire en production** : le frontend
  appelle simplement des chemins relatifs (`/api/predict`…).

Étapes de déploiement :
1. Pousser ce dépôt sur GitHub/GitLab.
2. Importer le dépôt dans Vercel (nouveau projet).
3. Vercel détecte le `vercel.json` racine et construit les deux services.
4. Le site est disponible sur `https://esmel-soro.vercel.app`.

### Développement local

En local, frontend et backend tournent sur deux ports séparés
(`localhost:5173` et `localhost:8000`) : `VITE_API_URL` dans `.env` pointe
alors vers `http://localhost:8000`, et le middleware CORS de `backend/main.py`
autorise cette origine (voir `backend/README.md`).

Alternative : `vercel dev` à la racine du projet fait tourner les deux
services ensemble localement, dans les mêmes conditions qu'en production.
