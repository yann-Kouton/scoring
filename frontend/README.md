# Frontend — Site React

Interface React (Vite) avec deux modules :
1. **Prédiction** — formulaire de saisie passager → carte de résultat façon
   "carte d'embarquement" (satisfait / neutre-insatisfait + probabilité).
2. **Tableau de bord** — KPIs du modèle et graphiques interactifs (recharts)
   sur les tendances de satisfaction du jeu de données.

## Installation

```bash
cd frontend
npm install
cp .env.example .env
# Modifier VITE_API_URL dans .env si le backend n'est pas sur localhost:8000
```

## Lancer en développement

```bash
npm run dev
```

Ouvre `http://localhost:5173`. Le backend FastAPI doit tourner en parallèle
(voir `backend/README.md`).

## Build de production

```bash
npm run build
```

Génère le dossier `dist/`, prêt à déployer sur Vercel, Netlify, Cloudflare
Pages, ou tout hébergeur de fichiers statiques. Pense à définir la variable
d'environnement `VITE_API_URL` sur la plateforme de déploiement pour pointer
vers l'URL publique de l'API backend.

## Structure

```
src/
  api.js                     — client HTTP vers l'API FastAPI
  App.jsx                    — shell + navigation par onglets
  index.css                  — design tokens et styles globaux
  components/
    PredictionForm.jsx       — formulaire de saisie passager
    ResultCard.jsx            — carte de résultat ("carte d'embarquement")
    RatingSlider.jsx          — slider de notation réutilisable (0-5)
    Dashboard.jsx              — KPIs + graphiques du tableau de bord
```
