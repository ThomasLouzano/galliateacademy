import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTrilha, getCourse, courseProgress } from '../data/lmsData';
import ProgressBar from '../components/ProgressBar';
import Pill from '../components/Pill';
import TypeIcon from '../components/TypeIcon';

export default function Course() {
  const { trailId, courseId } = useParams();
  const navigate = useNavigate();
  const { progress } = useAuth();
  const trail = getTrilha(trailId);
  const course = getCourse(trailId, courseId);
  if (!course || !trail) return null;
  const cp = courseProgress(course, progress);

  return (
    <div style={{ padding: '32px 40px', maxWidth: 720, fontFamily: 'Barlow, sans-serif' }}>
      <button
        onClick={() => navigate(`/trail/${trailId}`)}
        style={{ background: 'none', border: 'none', color: trail.color, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, fontWeight: 800, marginBottom: 18, padding: 0, letterSpacing: 1.5 }}
      >← TRILHA {trail.name.toUpperCase()}</button>

      <div style={{ background: '#161616', border: `1px solid ${trail.color}33`, borderRadius: 14, padding: '26px 30px', marginBottom: 24 }}>
        <Pill label={trail.name} color={trail.color} />
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 30, fontWeight: 900, color: '#F0F0F0', marginTop: 12, marginBottom: 4 }}>{course.title}</div>
        <div style={{ color: '#555', fontSize: 13, marginBottom: 18 }}>{course.subtitle}</div>
        <div style={{ display: 'flex', gap: 20, marginBottom: 18, fontSize: 13, color: '#555' }}>
          <span>⏱ {course.duration}</span>
          <span>📚 {course.lessons.length} aulas</span>
          <span style={{ color: '#F9A800' }}>⭐ {course.xp} XP</span>
        </div>
        <ProgressBar pct={cp.pct} color={trail.color} h={6} />
        <div style={{ fontSize: 11, color: '#444', marginTop: 5 }}>{cp.pct}% · {cp.done}/{cp.total} aulas</div>
      </div>

      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 17, fontWeight: 800, color: '#E0E0E0', marginBottom: 10 }}>Aulas</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {course.lessons.map((lesson, idx) => {
          const done = progress[lesson.id];
          return (
            <div
              key={lesson.id}
              onClick={() => navigate(`/lesson/${trailId}/${courseId}/${lesson.id}`)}
              style={{
                background: '#161616', border: `1px solid ${done ? trail.color + '44' : '#1E1E1E'}`,
                borderRadius: 10, padding: '14px 18px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 14, transition: 'all .15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = trail.color + '66'; e.currentTarget.style.background = '#1A1A1A'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = done ? trail.color + '44' : '#1E1E1E'; e.currentTarget.style.background = '#161616'; }}
            >
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: done ? trail.color : '#1E1E1E',
                border: `2px solid ${done ? trail.color : '#2A2A2A'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, color: done ? '#000' : '#444', fontWeight: 800, flexShrink: 0,
                fontFamily: 'Barlow Condensed, sans-serif'
              }}>{done ? '✓' : idx + 1}</div>
              <TypeIcon type={lesson.type} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15, fontWeight: 700, color: '#E0E0E0' }}>{lesson.title}</div>
                <div style={{ fontSize: 12, color: '#444', marginTop: 1 }}>{lesson.desc.substring(0, 72)}…</div>
              </div>
              <div style={{ fontSize: 11, color: '#444', flexShrink: 0 }}>{lesson.duration}</div>
            </div>
          );
        })}
      </div>

      {cp.pct === 100 && (
        <div style={{ marginTop: 20, background: trail.color + '12', border: `1px solid ${trail.color}44`, borderRadius: 12, padding: '18px 22px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, fontWeight: 800, color: trail.color }}>Curso Concluído! 🎉</div>
          <button
            onClick={() => navigate(`/certificate/${trailId}/${courseId}`)}
            style={{ marginTop: 10, padding: '10px 22px', background: trail.color, border: 'none', borderRadius: 8, color: '#000', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 900, cursor: 'pointer' }}
          >VER CERTIFICADO →</button>
        </div>
      )}
    </div>
  );
}
