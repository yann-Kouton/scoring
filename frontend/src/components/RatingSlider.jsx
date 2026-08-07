export default function RatingSlider({ label, value, onChange }) {
  return (
    <div className="field">
      <div className="field-label">
        <span>{label}</span>
        <span className="val">{value} / 5</span>
      </div>
      <input
        type="range"
        min={0}
        max={5}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider"
        aria-label={label}
      />
    </div>
  );
}
