import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import api from "../api.js";

const TEAL = "#2dd4bf";
const CORAL = "#fb7166";
const AMBER = "#ffb020";
const GRID = "#2a3650";
const MUTED = "#8d97ac";

const FEATURE_LABELS = {
  "Online boarding": "Embarquement en ligne",
  "Inflight wifi service": "Wifi à bord",
  "Type of Travel_Personal Travel": "Voyage personnel",
  "Class_Eco": "Classe Eco",
  "Inflight entertainment": "Divertissement à bord",
  "Seat comfort": "Confort du siège",
  "Customer Type_disloyal Customer": "Client non fidèle",
  "Leg room service": "Espace jambes",
  "Checkin service": "Enregistrement",
  "On-board service": "Service à bord",
  "Cleanliness": "Propreté",
  "Ease of Online booking": "Réservation en ligne",
  "Baggage handling": "Bagages",
  "Inflight service": "Service en vol",
  "Class_Eco Plus": "Classe Eco Plus",
  "Food and drink": "Restauration",
  "Gate location": "Emplacement porte",
  "Departure/Arrival time convenient": "Horaires",
  "Gender_Male": "Genre (Homme)",
  "Age": "Âge",
  "Flight Distance": "Distance de vol",
  "Departure Delay in Minutes": "Retard départ",
  "Arrival Delay in Minutes": "Retard arrivée",
};

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#1d2839",
        border: "1px solid #3a4968",
        borderRadius: 4,
        padding: "8px 11px",
        fontFamily: "IBM Plex Mono, monospace",
        fontSize: 11.5,
      }}
    >
      <div style={{ color: MUTED, marginBottom: 4 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {typeof p.value === "number" ? p.value.toFixed(1) : p.value}
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [importance, setImportance] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([api.metrics(), api.featureImportance(), api.dashboardStats()])
      .then(([m, fi, s]) => {
        setMetrics(m);
        setImportance(fi);
        setStats(s);
      })
      .catch((err) =>
        setError(
          "Impossible de charger les données du dashboard depuis l'API. Vérifie que le backend tourne."
        )
      );
  }, []);

  if (error) return <div className="panel error-banner">{error}</div>;
  if (!metrics || !importance || !stats)
    return <div className="loading-state">Chargement du tableau de bord…</div>;

  const importanceData = Object.entries(importance)
    .slice(0, 10)
    .map(([key, value]) => ({
      name: FEATURE_LABELS[key] || key,
      importance: Math.round(value * 1000) / 10,
    }))
    .reverse();

  const satisfactionSplit = [
    { name: "Satisfait", value: stats.satisfaction_counts["satisfied"], fill: TEAL },
    {
      name: "Neutre / insatisfait",
      value: stats.satisfaction_counts["neutral or dissatisfied"],
      fill: CORAL,
    },
  ];
  const totalPax = satisfactionSplit[0].value + satisfactionSplit[1].value;

  const byClass = ["Business", "Eco Plus", "Eco"].map((cls) => ({
    name: cls,
    Satisfait: Math.round(stats.satisfaction_by_class["satisfied"][cls] * 1000) / 10,
    "Neutre/insatisfait":
      Math.round(stats.satisfaction_by_class["neutral or dissatisfied"][cls] * 1000) / 10,
  }));

  const byTravel = [
    {
      name: "Affaires",
      Satisfait: Math.round(stats.satisfaction_by_travel_type["satisfied"]["Business travel"] * 1000) / 10,
      "Neutre/insatisfait":
        Math.round(stats.satisfaction_by_travel_type["neutral or dissatisfied"]["Business travel"] * 1000) / 10,
    },
    {
      name: "Personnel",
      Satisfait: Math.round(stats.satisfaction_by_travel_type["satisfied"]["Personal Travel"] * 1000) / 10,
      "Neutre/insatisfait":
        Math.round(stats.satisfaction_by_travel_type["neutral or dissatisfied"]["Personal Travel"] * 1000) / 10,
    },
  ];

  const topRatings = ["Online boarding", "Inflight wifi service", "Seat comfort", "Inflight entertainment", "Cleanliness"];
  const ratingsComparison = topRatings.map((r) => ({
    name: FEATURE_LABELS[r] || r,
    Satisfait: Math.round(stats.avg_ratings_by_satisfaction[r]["satisfied"] * 100) / 100,
    "Neutre/insatisfait": Math.round(stats.avg_ratings_by_satisfaction[r]["neutral or dissatisfied"] * 100) / 100,
  }));

  const ageHistogram = stats.age_histogram.map((b) => ({
    name: b.bucket,
    Satisfait: b.satisfied,
    "Neutre/insatisfait": b["neutral or dissatisfied"],
  }));

  return (
    <div>
      <div className="kpi-row">
        <div className="kpi-tile">
          <div className="kpi-label">AUC (test)</div>
          <div className="kpi-value">{metrics.auc.toFixed(3)}</div>
          <div className="kpi-foot">Aire sous la courbe ROC</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Accuracy</div>
          <div className="kpi-value teal">{(metrics.accuracy * 100).toFixed(1)}%</div>
          <div className="kpi-foot">{metrics.n_test.toLocaleString("fr-FR")} passagers testés</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">F1-score</div>
          <div className="kpi-value">{metrics.f1.toFixed(3)}</div>
          <div className="kpi-foot">Précision {(metrics.precision * 100).toFixed(1)}% · Rappel {(metrics.recall * 100).toFixed(1)}%</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Seuil de décision</div>
          <div className="kpi-value teal">{(metrics.seuil_youden * 100).toFixed(1)}%</div>
          <div className="kpi-foot">Optimisé (indice de Youden)</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 18 }}>
        <div className="panel">
          <p className="panel-title">Répartition globale</p>
          <p className="panel-sub">{totalPax.toLocaleString("fr-FR")} PASSAGERS · DONNÉES NETTOYÉES</p>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <ResponsiveContainer width="60%" height={140}>
              <BarChart data={satisfactionSplit} layout="vertical" margin={{ left: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" hide />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="value" radius={[0, 3, 3, 0]} barSize={30}>
                  {satisfactionSplit.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div>
              {satisfactionSplit.map((s) => (
                <div key={s.name} style={{ marginBottom: 10 }}>
                  <div className="legend-chip" style={{ marginBottom: 2 }}>
                    <span className="legend-dot" style={{ background: s.fill }} />
                    {s.name}
                  </div>
                  <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 20, color: s.fill }}>
                    {((s.value / totalPax) * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="panel">
          <p className="panel-title">Importance des variables</p>
          <p className="panel-sub">TOP 10 · GRADIENT BOOSTING</p>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={importanceData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
              <XAxis type="number" tick={{ fill: MUTED, fontSize: 10.5 }} axisLine={{ stroke: GRID }} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={130}
                tick={{ fill: MUTED, fontSize: 10.5 }}
                axisLine={{ stroke: GRID }}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="importance" fill={AMBER} radius={[0, 3, 3, 0]} barSize={12} name="Importance (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 18 }}>
        <div className="panel">
          <p className="panel-title">Satisfaction par classe</p>
          <p className="panel-sub">PART DE PASSAGERS (%)</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byClass}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: MUTED, fontSize: 11 }} axisLine={{ stroke: GRID }} tickLine={false} />
              <YAxis tick={{ fill: MUTED, fontSize: 10.5 }} axisLine={{ stroke: GRID }} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="Satisfait" fill={TEAL} radius={[3, 3, 0, 0]} />
              <Bar dataKey="Neutre/insatisfait" fill={CORAL} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel">
          <p className="panel-title">Satisfaction par motif de voyage</p>
          <p className="panel-sub">PART DE PASSAGERS (%)</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byTravel}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: MUTED, fontSize: 11 }} axisLine={{ stroke: GRID }} tickLine={false} />
              <YAxis tick={{ fill: MUTED, fontSize: 10.5 }} axisLine={{ stroke: GRID }} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="Satisfait" fill={TEAL} radius={[3, 3, 0, 0]} />
              <Bar dataKey="Neutre/insatisfait" fill={CORAL} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 18 }}>
        <div className="panel">
          <p className="panel-title">Notes moyennes par verdict</p>
          <p className="panel-sub">TOP 5 CRITÈRES LES PLUS DISCRIMINANTS</p>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={ratingsComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: MUTED, fontSize: 9.5 }} axisLine={{ stroke: GRID }} tickLine={false} interval={0} />
              <YAxis domain={[0, 5]} tick={{ fill: MUTED, fontSize: 10.5 }} axisLine={{ stroke: GRID }} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="Satisfait" fill={TEAL} radius={[3, 3, 0, 0]} />
              <Bar dataKey="Neutre/insatisfait" fill={CORAL} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel">
          <p className="panel-title">Répartition par âge</p>
          <p className="panel-sub">NOMBRE DE PASSAGERS PAR TRANCHE</p>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={ageHistogram}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: MUTED, fontSize: 10 }} axisLine={{ stroke: GRID }} tickLine={false} />
              <YAxis tick={{ fill: MUTED, fontSize: 10.5 }} axisLine={{ stroke: GRID }} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="Satisfait" stackId="a" fill={TEAL} />
              <Bar dataKey="Neutre/insatisfait" stackId="a" fill={CORAL} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-3">
        <div className="panel">
          <p className="panel-title">Distance de vol moyenne</p>
          <p className="panel-sub">KM</p>
          <div style={{ display: "flex", gap: 24, marginTop: 6 }}>
            <div>
              <div className="legend-chip"><span className="legend-dot" style={{ background: TEAL }} />Satisfait</div>
              <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 22, color: TEAL, marginTop: 4 }}>
                {Math.round(stats.flight_distance_avg_by_satisfaction["satisfied"]).toLocaleString("fr-FR")}
              </div>
            </div>
            <div>
              <div className="legend-chip"><span className="legend-dot" style={{ background: CORAL }} />Neutre/insat.</div>
              <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 22, color: CORAL, marginTop: 4 }}>
                {Math.round(stats.flight_distance_avg_by_satisfaction["neutral or dissatisfied"]).toLocaleString("fr-FR")}
              </div>
            </div>
          </div>
        </div>

        <div className="panel">
          <p className="panel-title">Retard départ moyen</p>
          <p className="panel-sub">MINUTES</p>
          <div style={{ display: "flex", gap: 24, marginTop: 6 }}>
            <div>
              <div className="legend-chip"><span className="legend-dot" style={{ background: TEAL }} />Satisfait</div>
              <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 22, color: TEAL, marginTop: 4 }}>
                {stats.delay_avg_by_satisfaction.departure["satisfied"].toFixed(1)}
              </div>
            </div>
            <div>
              <div className="legend-chip"><span className="legend-dot" style={{ background: CORAL }} />Neutre/insat.</div>
              <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 22, color: CORAL, marginTop: 4 }}>
                {stats.delay_avg_by_satisfaction.departure["neutral or dissatisfied"].toFixed(1)}
              </div>
            </div>
          </div>
        </div>

        <div className="panel">
          <p className="panel-title">Retard arrivée moyen</p>
          <p className="panel-sub">MINUTES</p>
          <div style={{ display: "flex", gap: 24, marginTop: 6 }}>
            <div>
              <div className="legend-chip"><span className="legend-dot" style={{ background: TEAL }} />Satisfait</div>
              <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 22, color: TEAL, marginTop: 4 }}>
                {stats.delay_avg_by_satisfaction.arrival["satisfied"].toFixed(1)}
              </div>
            </div>
            <div>
              <div className="legend-chip"><span className="legend-dot" style={{ background: CORAL }} />Neutre/insat.</div>
              <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 22, color: CORAL, marginTop: 4 }}>
                {stats.delay_avg_by_satisfaction.arrival["neutral or dissatisfied"].toFixed(1)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
