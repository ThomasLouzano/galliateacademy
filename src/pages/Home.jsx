import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TRILHAS, totalXP, trailProgress } from '../data/lmsData';
import ProgressBar from '../components/ProgressBar';

export default function Home() {
  const { user, progress } = useAuth();
  const navigate = useNavigate();
  const xp = totalXP(progress);
  const totalLessons = TRILHAS.flatMap(t => t.courses.flatMap(c => c.lessons)).length;
  const doneLessons = Object.values(progress).filter(Boolean).length;
  const level = Math.floor(xp / 300) + 1;
  const nextXP = level * 300, prevXP = (level - 1) * 300;
  const levelPct = Math.round((xp - prevXP) / (nextXP - prevXP) * 100);

  let continueTarget = null;
  outer: for (const t of TRILHAS) {
    for (const c of t.courses) {
      for (const l of c.lessons) {
        if (!progress[l.id]) {
          continueTarget = { trailId: t.id, courseId: c.id, lessonId: l.id, courseTitle: c.title, trailColor: t.color };
          break outer;
        }
      }
    }
  }

  return (
    <div className="page-padding" style={{ fontFamily: 'Barlow, sans-serif' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 38, fontWeight: 900, color: '#F0F0F0', lineHeight: 1 }}>
          Olá, {user.name?.split(' ')[0] ?? 'aluno'}! <span style={{ color: '#F9A800' }}>👋</span>
        </div>
        <div style={{ color: '#555', marginTop: 4, fontSize: 14 }}>Continue de onde parou — cada aula conta.</div>
      </div>

      <div className="grid-4" style={{ marginBottom: 20 }}>
        {[
          ['XP Total', xp, 'pts', '#F9A800'],
          ['Aulas', doneLessons, `/${totalLessons}`, '#22A06B'],
          ['Nível', level, '', '#8B7FE8'],
          ['Ranking', `#${user.rank || 1}`, '', '#E05A2B'],
        ].map(([label, val, suf, color]) => (
          <div key={label} style={{ background: '#161616', border: '1px solid #1E1E1E', borderRadius: 12, padding: '18px 22px' }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#3A3A3A', letterSpacing: 2.5, fontFamily: 'Barlow Condensed, sans-serif', marginBottom: 8 }}>{label.toUpperCase()}</div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 34, fontWeight: 900, color, lineHeight: 1 }}>
              {val}<span style={{ fontSize: 14, color: '#3A3A3A', fontWeight: 600 }}>{suf}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: continueTarget ? '1fr auto' : '1fr', gap: 14, marginBottom: 28 }}>
        <div style={{ background: '#161616', border: '1px solid #1E1E1E', borderRadius: 12, padding: '18px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15, fontWeight: 700, color: '#E0E0E0' }}>
              Nível {level} <span style={{ color: '#333' }}>→</span> <span style={{ color: '#F9A800' }}>Nível {level + 1}</span>
            </div>
            <div style={{ fontSize: 12, color: '#444' }}>{xp - prevXP} / {nextXP - prevXP} XP</div>
          </div>
          <ProgressBar pct={levelPct} color="#F9A800" h={8} />
        </div>
        {continueTarget && (
          <div
            onClick={() => navigate(`/lesson/${continueTarget.trailId}/${continueTarget.courseId}/${continueTarget.lessonId}`)}
            style={{
              background: '#F9A80015', border: '1px solid #F9A80033', borderRadius: 12,
              padding: '18px 24px', cursor: 'pointer', display: 'flex',
              alignItems: 'center', gap: 14, transition: 'border-color .2s'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#F9A80066'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#F9A80033'}
          >
            <div style={{ width: 38, height: 38, borderRadius: 8, background: '#F9A80022', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#F9A800', flexShrink: 0 }}>▶</div>
            <div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, color: '#F9A800', letterSpacing: 2, fontWeight: 700 }}>CONTINUAR</div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 800, color: '#F0F0F0' }}>{continueTarget.courseTitle}</div>
            </div>
          </div>
        )}
      </div>

      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 20, fontWeight: 800, color: '#E0E0E0', marginBottom: 14 }}>
        Trilhas de Treinamento
      </div>
      <div className="grid-3">
        {TRILHAS.map(t => {
          const tp = trailProgress(t, progress);
          return (
            <div
              key={t.id}
              onClick={() => navigate(`/trail/${t.id}`)}
              style={{
                background: '#161616', border: `1px solid ${t.color}22`,
                borderRadius: 12, padding: 22, cursor: 'pointer',
                transition: 'all .2s', position: 'relative', overflow: 'hidden'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = t.color + '66'; e.currentTarget.style.background = '#1A1A1A'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = t.color + '22'; e.currentTarget.style.background = '#161616'; }}
            >
              <div style={{ position: 'absolute', top: -50, right: -50, width: 140, height: 140, borderRadius: '50%', background: t.color + '0A', pointerEvents: 'none' }} />
              <div style={{ fontSize: 28, marginBottom: 10 }}>{t.icon}</div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 22, fontWeight: 900, color: '#F0F0F0', marginBottom: 2 }}>{t.name}</div>
              <div style={{ fontSize: 12, color: '#555', marginBottom: 14 }}>
                {t.courses.length} cursos · {t.courses.flatMap(c => c.lessons).length} aulas
              </div>
              <ProgressBar pct={tp.pct} color={t.color} h={5} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7, fontSize: 11 }}>
                <span style={{ color: '#444' }}>{tp.done}/{tp.total} aulas</span>
                <span style={{ color: t.color, fontWeight: 700 }}>{tp.pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
