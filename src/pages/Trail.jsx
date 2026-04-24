import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTrilha, trailProgress, courseProgress } from '../data/lmsData';
import ProgressBar from '../components/ProgressBar';

export default function Trail() {
  const { trailId } = useParams();
  const navigate = useNavigate();
  const { progress } = useAuth();
  const trail = getTrilha(trailId);
  if (!trail) return null;
  const tp = trailProgress(trail, progress);

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1000, fontFamily: 'Barlow, sans-serif' }}>
      <div style={{
        background: trail.colorDim, border: `1px solid ${trail.color}33`,
        borderRadius: 16, padding: '28px 32px', marginBottom: 28,
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', right: -70, top: -70, width: 220, height: 220, borderRadius: '50%', background: trail.color + '12', pointerEvents: 'none' }} />
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', color: trail.color, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, fontWeight: 800, marginBottom: 14, padding: 0, letterSpacing: 1.5 }}
        >← INÍCIO</button>
        <div style={{ fontSize: 36, marginBottom: 8 }}>{trail.icon}</div>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 42, fontWeight: 900, color: '#F0F0F0', lineHeight: 1, marginBottom: 6 }}>
          Trilha: {trail.name}
        </div>
        <div style={{ color: '#666', marginBottom: 18, fontSize: 13 }}>
          {trail.courses.length} cursos · {trail.courses.flatMap(c => c.lessons).length} aulas no total · para: {trail.roles.join(', ')}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flex: 1, maxWidth: 400 }}><ProgressBar pct={tp.pct} color={trail.color} h={8} /></div>
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 20, color: trail.color }}>{tp.pct}%</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {trail.courses.map((course, idx) => {
          const cp = courseProgress(course, progress);
          const done = cp.pct === 100;
          return (
            <div
              key={course.id}
              onClick={() => navigate(`/course/${trailId}/${course.id}`)}
              style={{
                background: '#161616', border: `1px solid ${done ? trail.color + '55' : '#1E1E1E'}`,
                borderRadius: 12, padding: 22, cursor: 'pointer', transition: 'all .2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = trail.color + '66'; e.currentTarget.style.background = '#1A1A1A'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = done ? trail.color + '55' : '#1E1E1E'; e.currentTarget.style.background = '#161616'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: trail.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 16, color: trail.color }}>{idx + 1}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {done && <span style={{ color: trail.color, fontSize: 16 }}>✓</span>}
                  <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, color: '#F9A800', fontWeight: 800 }}>+{course.xp} XP</span>
                </div>
              </div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 20, fontWeight: 900, color: '#F0F0F0', marginBottom: 4, lineHeight: 1.2 }}>{course.title}</div>
              <div style={{ fontSize: 12, color: '#555', marginBottom: 14 }}>{course.subtitle}</div>
              <div style={{ fontSize: 12, color: '#444', marginBottom: 14 }}>⏱ {course.duration} · {course.lessons.length} aulas</div>
              <ProgressBar pct={cp.pct} color={trail.color} h={4} />
              <div style={{ fontSize: 11, color: '#444', marginTop: 5 }}>{cp.done}/{cp.total} concluídas</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
