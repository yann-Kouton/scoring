import { useState } from "react";
import RatingSlider from "./RatingSlider.jsx";
import ResultCard from "./ResultCard.jsx";
import api from "../api.js";

const RATING_FIELDS = [
  ["inflight_wifi_service", "Wifi à bord"],
  ["departure_arrival_time_convenient", "Horaires dép./arr."],
  ["ease_of_online_booking", "Facilité réservation en ligne"],
  ["gate_location", "Emplacement de la porte"],
  ["food_and_drink", "Restauration"],
  ["online_boarding", "Embarquement en ligne"],
  ["seat_comfort", "Confort du siège"],
  ["inflight_entertainment", "Divertissement à bord"],
  ["onboard_service", "Service à bord"],
  ["leg_room_service", "Espace pour les jambes"],
  ["baggage_handling", "Gestion des bagages"],
  ["checkin_service", "Service d'enregistrement"],
  ["inflight_service", "Service en vol"],
  ["cleanliness", "Propreté"],
];

const DEFAULTS = {
  age: 35,
  gender: "Male",
  customer_type: "Loyal Customer",
  type_of_travel: "Business travel",
  class: "Business",
  flight_distance: 1200,
  departure_delay_in_minutes: 0,
  arrival_delay_in_minutes: 0,
  ...Object.fromEntries(RATING_FIELDS.map(([key]) => [key, 3])),
};

export default function PredictionForm() {
  const [form, setForm] = useState(DEFAULTS);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const prediction = await api.predict(form);
      setResult(prediction);
    } catch (err) {
      setError(
        err.message.includes("fetch") || err.message.includes("Failed")
          ? "Impossible de joindre l'API. Vérifie que le backend FastAPI tourne (voir README)."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid-2" style={{ alignItems: "start" }}>
      <div className="panel">
        <p className="panel-title">Fiche passager</p>
        <p className="panel-sub">SAISIE · TOUS CHAMPS REQUIS</p>

        <form onSubmit={handleSubmit}>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Identité & voyage</legend>
            <div className="field-grid-3">
              <div className="field">
                <div className="field-label"><span>Âge</span></div>
                <input
                  type="number"
                  min={0}
                  max={120}
                  className="text-input"
                  value={form.age}
                  onChange={(e) => update("age", Number(e.target.value))}
                  required
                />
              </div>
              <div className="field">
                <div className="field-label"><span>Genre</span></div>
                <select
                  className="select-input"
                  value={form.gender}
                  onChange={(e) => update("gender", e.target.value)}
                >
                  <option value="Male">Homme</option>
                  <option value="Female">Femme</option>
                </select>
              </div>
              <div className="field">
                <div className="field-label"><span>Type de client</span></div>
                <select
                  className="select-input"
                  value={form.customer_type}
                  onChange={(e) => update("customer_type", e.target.value)}
                >
                  <option value="Loyal Customer">Client fidèle</option>
                  <option value="disloyal Customer">Client non fidèle</option>
                </select>
              </div>
              <div className="field">
                <div className="field-label"><span>Motif du voyage</span></div>
                <select
                  className="select-input"
                  value={form.type_of_travel}
                  onChange={(e) => update("type_of_travel", e.target.value)}
                >
                  <option value="Business travel">Affaires</option>
                  <option value="Personal Travel">Personnel</option>
                </select>
              </div>
              <div className="field">
                <div className="field-label"><span>Classe</span></div>
                <select
                  className="select-input"
                  value={form.class}
                  onChange={(e) => update("class", e.target.value)}
                >
                  <option value="Business">Business</option>
                  <option value="Eco Plus">Eco Plus</option>
                  <option value="Eco">Eco</option>
                </select>
              </div>
              <div className="field">
                <div className="field-label"><span>Distance du vol (km)</span></div>
                <input
                  type="number"
                  min={0}
                  className="text-input"
                  value={form.flight_distance}
                  onChange={(e) => update("flight_distance", Number(e.target.value))}
                  required
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Retards</legend>
            <div className="field-grid-2">
              <div className="field">
                <div className="field-label"><span>Retard départ (min)</span></div>
                <input
                  type="number"
                  min={0}
                  className="text-input"
                  value={form.departure_delay_in_minutes}
                  onChange={(e) => update("departure_delay_in_minutes", Number(e.target.value))}
                />
              </div>
              <div className="field">
                <div className="field-label"><span>Retard arrivée (min)</span></div>
                <input
                  type="number"
                  min={0}
                  className="text-input"
                  value={form.arrival_delay_in_minutes}
                  onChange={(e) => update("arrival_delay_in_minutes", Number(e.target.value))}
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Notes de service (0 à 5)</legend>
            <div className="field-grid-2">
              {RATING_FIELDS.map(([key, label]) => (
                <RatingSlider
                  key={key}
                  label={label}
                  value={form[key]}
                  onChange={(v) => update(key, v)}
                />
              ))}
            </div>
          </fieldset>

          {error && <div className="error-banner">{error}</div>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Calcul en cours…" : "Lancer le scoring"}
          </button>
        </form>
      </div>

      <div style={{ position: "sticky", top: 24 }}>
        <p className="panel-title" style={{ marginBottom: 14 }}>Carte d'embarquement</p>
        {result ? (
          <ResultCard
            result={result}
            passengerSummary={{
              classe: `${form.class} · ${form.type_of_travel === "Business travel" ? "Affaires" : "Personnel"}`,
              motif: form.customer_type === "Loyal Customer" ? "Client fidèle" : "Client non fidèle",
            }}
          />
        ) : (
          <div className="panel empty-state">
            Renseigne la fiche passager puis lance le scoring pour émettre la carte de résultat.
          </div>
        )}
      </div>
    </div>
  );
}
