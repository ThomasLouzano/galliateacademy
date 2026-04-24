export default function ProgressBar({ pct = 0, color = '#F9A800', h = 5 }) {
  return (
    <div style={{ background: '#2A2A2A', borderRadius: h, height: h }}>
      <div style={{ width: `${pct}%`, height: h, background: color, borderRadius: h, transition: 'width .5s' }} />
    </div>
  );
}
