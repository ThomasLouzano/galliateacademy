export default function Pill({ label, color }) {
  return (
    <span style={{
      background: color + '22', color,
      border: `1px solid ${color}44`,
      padding: '3px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
      fontFamily: 'Barlow Condensed, sans-serif',
      textTransform: 'uppercase'
    }}>
      {label}
    </span>
  );
}
