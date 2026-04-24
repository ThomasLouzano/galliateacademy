import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTrilha, getCourse } from '../data/lmsData';

export default function Certificate() {
  const { trailId, courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const trail = getTrilha(trailId);
  const course = getCourse(trailId, courseId);
  if (!trail || !course) return null;
  const date = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div style={{ padding: '32px 40px', fontFamily: 'Barlow, sans-serif' }}>
      <button onClick={() => navigate(`/course/${trailId}/${courseId}`)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, fontWeight: 700, marginBottom: 18, padding: 0, letterSpacing: 1 }}>
        ← VOLTAR AO CURSO
      </button>

      <div style={{
        maxWidth: 740, background: '#161616', border: `2px solid ${trail.color}`,
        borderRadius: 16, padding: '52px 60px', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${trail.color}, #F9A800, ${trail.color})` }} />
        <div style={{ position: 'absolute', top: -80, right: -80, width: 240, height: 240, borderRadius: '50%', background: trail.color + '07', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 180, height: 180, borderRadius: '50%', background: trail.color + '05', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36, position: 'relative' }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 22, fontWeight: 900, color: '#F9A800', letterSpacing: 2 }}>GALLIATE ACADEMY</div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 800, color: '#333', letterSpacing: 3 }}>CERTIFICADO DE CONCLUSÃO</div>
            <div style={{ fontSize: 12, color: '#2A2A2A', marginTop: 3 }}>{date}</div>
          </div>
        </div>

        <div style={{ textAlign: 'center', position: 'relative' }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, fontWeight: 800, color: '#444', letterSpacing: 3.5, marginBottom: 14 }}>CERTIFICAMOS QUE</div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 50, fontWeight: 900, color: '#F0F0F0', lineHeight: 1, marginBottom: 14 }}>{user.name}</div>
          <div style={{ width: 100, height: 2, background: trail.color, margin: '0 auto 18px' }} />
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, color: '#555', letterSpacing: 1.5, marginBottom: 6 }}>CONCLUIU COM ÊXITO O CURSO</div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 34, fontWeight: 900, color: trail.color, marginBottom: 8 }}>{course.title}</div>
          <div style={{ color: '#3A3A3A', fontSize: 13, marginBottom: 28 }}>Trilha: {trail.name} · {course.duration} · {course.xp} XP</div>
          <div style={{ display: 'inline-block', background: trail.color + '15', border: `1px solid ${trail.color}44`, borderRadius: 8, padding: '10px 26px' }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, fontWeight: 800, color: trail.color, letterSpacing: 3 }}>GALLIATE ACADEMY</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 740, marginTop: 12, display: 'flex', gap: 10 }}>
        <button onClick={() => window.print()} style={{ flex: 1, padding: 11, background: '#161616', border: '1px solid #2A2A2A', borderRadius: 8, color: '#666', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          🖨 IMPRIMIR
        </button>
        <button onClick={() => navigate('/')} style={{ flex: 1, padding: 11, background: trail.color, border: 'none', borderRadius: 8, color: '#000', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 900, cursor: 'pointer' }}>
          IR AO INÍCIO →
        </button>
      </div>
    </div>
  );
}
