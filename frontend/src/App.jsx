import { useEffect, useState } from "react";
import Cover from "./components/Cover.jsx";
import PredictionForm from "./components/PredictionForm.jsx";
import Dashboard from "./components/Dashboard.jsx";
import api from "./api.js";

export default function App() {
  const [view, setView] = useState("cover");
  const [tab, setTab] = useState("predict");
  const [apiStatus, setApiStatus] = useState("checking");

  useEffect(() => {
    api
      .health()
      .then((r) => setApiStatus(r.model_loaded ? "on" : "off"))
      .catch(() => setApiStatus("off"));
  }, []);

  if (view === "cover") {
    return <Cover onEnter={() => setView("app")} />;
  }

  return (
    <div className="shell">
      <div className="topbar">
        <button
          className="brand"
          onClick={() => setView("cover")}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}
        >
          <span className="brand-mark">CX</span>
          <div>
            <div className="brand-title">Scoring Satisfaction Client</div>
            <div className="brand-sub">Aviation · Gradient Boosting Classifier</div>
          </div>
        </button>
        <div className="status-pill">
          <span
            className={`status-dot ${
              apiStatus === "on" ? "on" : apiStatus === "off" ? "off" : ""
            }`}
          />
          {apiStatus === "checking"
            ? "Connexion à l'API…"
            : apiStatus === "on"
            ? "API connectée · Modèle chargé"
            : "API hors ligne"}
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${tab === "predict" ? "active" : ""}`}
          onClick={() => setTab("predict")}
        >
          <span className="tab-index">01</span>Prédiction
        </button>
        <button
          className={`tab ${tab === "dashboard" ? "active" : ""}`}
          onClick={() => setTab("dashboard")}
        >
          <span className="tab-index">02</span>Tableau de bord
        </button>
      </div>

      {tab === "predict" ? (
        <section>
          <p className="eyebrow">Module 01</p>
          <h1 className="section-title">Scorer un passager</h1>
          <p className="section-desc">
            Renseigne le profil et les notes de service d'un passager pour estimer sa
            probabilité de satisfaction, selon le modèle Gradient Boosting entraîné sur
            les données historiques de la compagnie.
          </p>
          <PredictionForm />
        </section>
      ) : (
        <section>
          <p className="eyebrow">Module 02</p>
          <h1 className="section-title">Tableau de bord</h1>
          <p className="section-desc">
            Vue d'ensemble des performances du modèle et des tendances de satisfaction
            observées sur l'ensemble du jeu de données.
          </p>
          <Dashboard />
        </section>
      )}

      <div className="footer-note">
        <span>Modèle : Gradient Boosting Classifier · scikit-learn</span>
        <span>API : FastAPI</span>
      </div>
    </div>
  );
}
