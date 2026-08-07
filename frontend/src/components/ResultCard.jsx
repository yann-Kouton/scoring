export default function ResultCard({ result, passengerSummary }) {
  if (!result) return null;

  const isSatisfied = result.prediction === "satisfied";
  const pct = Math.round(result.probability_satisfied * 100);

  return (
    <div
      className={`boarding-pass ${
        isSatisfied ? "state-satisfied" : "state-dissatisfied"
      }`}
    >
      <div className="bp-main">
        <div>
          <p className="bp-eyebrow">Résultat de scoring</p>
          <p className={`bp-verdict ${isSatisfied ? "satisfied" : "dissatisfied"}`}>
            {isSatisfied ? "SATISFIED" : "NEUTRAL / DISSATISFIED"}
          </p>
        </div>
        <div className="bp-fields">
          <div>
            <div className="bp-field-label">Passager</div>
            <div className="bp-field-value">{passengerSummary.classe}</div>
          </div>
          <div>
            <div className="bp-field-label">Motif</div>
            <div className="bp-field-value">{passengerSummary.motif}</div>
          </div>
          <div>
            <div className="bp-field-label">Confiance</div>
            <div className="bp-field-value">{result.confiance}</div>
          </div>
        </div>
      </div>

      <div className="bp-perforation" />

      <div className="bp-stub">
        <div className="bp-stub-label">Probabilité</div>
        <div className="bp-stub-value">{pct}%</div>
        <div className="bp-stub-label">Seuil {Math.round(result.seuil_utilise * 100)}%</div>
        <div className="bp-barcode" />
      </div>
    </div>
  );
}
