const MAP = {
  video: ['▶', '#F9A800'],
  text: ['≡', '#8B7FE8'],
  quiz: ['✦', '#22A06B'],
};

export default function TypeIcon({ type }) {
  const [icon, color] = MAP[type] || ['?', '#888'];
  return (
    <div style={{
      width: 28, height: 28, borderRadius: 6,
      background: color + '22',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, color, flexShrink: 0
    }}>
      {icon}
    </div>
  );
}
