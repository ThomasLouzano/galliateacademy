import { useAuth } from '../context/AuthContext';
import { TRILHAS, totalXP, trailProgress } from '../data/lmsData';
import ProgressBar from '../components/ProgressBar';
import Pill from '../components/Pill';

export default function Profile() {
  const { user, progress } = useAuth();
  const xp = totalXP(progress);
  const level = Math.floor(xp / 300) + 1;
  const completedCourses = TRILHAS.flatMap(t => t.courses.map(c => ({ ...c, trail: t }))).filter(c => c.lessons.every(l => progress[l.id]));

  return (
    <div style={{ padding: '32px 40px', maxWidth: 880, fontFamily: 'Barlow, sans-serif' }}>
      <div style={{ background: '#161616', border: '1px solid #1E1E1E', borderRadius: 16, padding: 28, marginBottom: 20, display: 'flex', gap: 22, alignItems: 'center' }}>
        <div style={{ width: 70, height: 70, borderRadius: '50%', background: '#F9A80022', border: '3px solid #F9A800', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 26, color: '#F9A800', flexShrink: 0 }}>
          {user.avatar}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 30, fontWeight: 900, color: '#F0F0F0', lineHeight: 1 }}>{user.name}</div>
          <div style={{ color: '#555', fontSize: 13, marginTop: 3, marginBottom: 10 }}>{user.role}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Pill label={`Nível ${level}`} color="#F9A800" />
            <Pill label={`#${user.rank || 1} Ranking`} color="#E05A2B" />
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 40, fontWeight: 900, color: '#F9A800', lineHeight: 1 }}>{xp}</div>
          <div style={{ fontSize: 11, color: '#444', marginTop: 2 }}>XP Total</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        {TRILHAS.map(t => {
          const tp = trailProgress(t, progress);
          return (
            <div key={t.id} style={{ background: '#161616', border: '1px solid #1E1E1E', borderRadius: 12, padding: '18px 22px' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 18 }}>{t.icon}</span>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15, fontWeight: 700, color: '#DDD' }}>{t.name}</span>
              </div>
              <ProgressBar pct={tp.pct} color={t.color} h={5} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11 }}>
                <span style={{ color: '#3A3A3A' }}>{tp.done}/{tp.total}</span>
                <span style={{ color: t.color, fontWeight: 700 }}>{tp.pct}%</span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 17, fontWeight: 800, color: '#E0E0E0', marginBottom: 10 }}>Cursos Concluídos</div>
      {completedCourses.length === 0
        ? <div style={{ color: '#2A2A2A', fontSize: 14 }}>Nenhum curso concluído ainda. Continue!</div>
        : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {completedCourses.map(c => (
              <div key={c.id} style={{ background: '#161616', border: `1px solid ${c.trail.color}44`, borderRadius: 10, padding: '14px 18px', display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 18 }}>{c.trail.icon}</span>
                <div>
                  <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 700, color: '#E0E0E0' }}>{c.title}</div>
                  <div style={{ fontSize: 11, color: c.trail.color, fontWeight: 700 }}>+{c.xp} XP · ✓ Concluído</div>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}
