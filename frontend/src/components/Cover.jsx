export default function Cover({ onEnter }) {
  return (
    <div className="cover">
      <div className="cover-glow cover-glow-1" />
      <div className="cover-glow cover-glow-2" />

      <div className="cover-plane" aria-hidden="true">
        <svg width="46" height="46" viewBox="0 0 24 24" fill="none">
          <path
            d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2.5 1.8V22l4-1 4 1v-1.2L13 19v-5.5l8 2.5z"
            fill="url(#planeGrad)"
          />
          <defs>
            <linearGradient id="planeGrad" x1="0" y1="0" x2="24" y2="24">
              <stop offset="0%" stopColor="#ff8a65" />
              <stop offset="100%" stopColor="#8b7cf6" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="cover-card">
        <p className="cover-eyebrow">Examen · Projet Scoring</p>
        <h1 className="cover-title">
          Scoring de la <span className="grad-text">Satisfaction Client</span>
          <br />— Secteur Aviation
        </h1>
        <p className="cover-desc">
          Optimisez l’expérience voyageur : outil de scoring prédictif et tableau de bord analytique en temps réel.
        </p>

        <div className="cover-divider" />

        <div className="cover-meta">
          <div className="cover-meta-block">
            <p className="cover-meta-label">Réalisé par</p>
            <p className="cover-meta-value">Kouton Vignon Esmel</p>
            <p className="cover-meta-value">Soro Zonlewa Daouda</p>
          </div>
          <div className="cover-meta-block">
            <p className="cover-meta-label">Cours encadré par</p>
            <p className="cover-meta-value">Pr. Dabone Yacouba</p>
          </div>
          <div className="cover-meta-block">
            <p className="cover-meta-label">Formation</p>
            <p className="cover-meta-value">Master 1 — Data Science &amp; IA</p>
            <p className="cover-meta-value-sub">Université Félix Houphouët-Boigny</p>
          </div>
        </div>

        <button className="cover-cta" onClick={onEnter}>
          Accéder à l'application
          <span className="cover-cta-arrow">→</span>
        </button>
      </div>
    </div>
  );
}
