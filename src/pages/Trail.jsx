import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTrilha, trailProgress, courseProgress } from '../data/lmsData';
import { api } from '../api/index.js';
import ProgressBar from '../components/ProgressBar';


export default function Trail() {
  const { trailId } = useParams();
  const navigate = useNavigate();
  const { progress } = useAuth();

  console.log('[Trail] trailId:', trailId);

  // Tenta dados locais primeiro (IDs string: 'cozinha', 'entrega', 'gestao')
  const localTrail = getTrilha(trailId);

  // Para IDs numéricos (backend), busca via API
  const isNumeric = /^\d+$/.test(String(trailId));
  const { user } = useAuth();
  const [backendTrail, setBackendTrail] = useState(null);
  const [porModulo, setPorModulo] = useState({});
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (localTrail) {
      console.log('[Trail] usando dados locais:', localTrail.name);
      return;
    }
    if (!isNumeric) {
      console.warn('[Trail] trailId não numérico e não encontrado localmente:', trailId);
      return;
    }
    console.log('[Trail] buscando trilha do backend, id:', trailId);
    setLoading(true);
    setErro(null);
    const fetches = [api.getTrilhaById(trailId)];
    if (user?.id) fetches.push(api.getProgressoResumo(user.id));
    Promise.allSettled(fetches)
      .then(([resTrilha, resProgresso]) => {
        if (resTrilha.status !== 'fulfilled') {
          setErro(resTrilha.reason?.message || 'Erro ao carregar trilha');
          return;
        }
        setBackendTrail(resTrilha.value);
        if (resProgresso?.status === 'fulfilled') {
          setPorModulo(resProgresso.value.porModulo || {});
        }
      })
      .finally(() => setLoading(false));
  }, [trailId]);

  // ── estados de feedback ──────────────────────────────
  if (loading) {
    return (
      <div style={{ padding: '40px', fontFamily: 'Barlow Condensed, sans-serif', color: '#555', fontSize: 16 }}>
        Página da trilha carregando...
      </div>
    );
  }

  if (erro) {
    return (
      <div style={{ padding: '40px', fontFamily: 'Barlow Condensed, sans-serif' }}>
        <div style={{ color: '#E05A2B', fontSize: 16, marginBottom: 16 }}>Erro ao carregar trilha: {erro}</div>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: '1px solid #333', color: '#888', padding: '8px 18px', borderRadius: 8, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13 }}
        >← Voltar ao Início</button>
      </div>
    );
  }

  if (!localTrail && !backendTrail && !loading) {
    return (
      <div style={{ padding: '40px', fontFamily: 'Barlow Condensed, sans-serif' }}>
        <div style={{ color: '#444', fontSize: 16, marginBottom: 16 }}>Trilha "{trailId}" não encontrada.</div>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: '1px solid #333', color: '#888', padding: '8px 18px', borderRadius: 8, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13 }}
        >← Voltar ao Início</button>
      </div>
    );
  }

  // ── TRILHA DO BACKEND ────────────────────────────────
  if (backendTrail) {
    const t = backendTrail;
    const modulos = t.modulos || [];
    return (
      <div style={{ padding: '32px 40px', maxWidth: 1000, fontFamily: 'Barlow, sans-serif' }}>
        {/* Cabeçalho */}
        <div style={{
          background: '#161616', border: '1px solid #F9A80022',
          borderRadius: 16, padding: '28px 32px', marginBottom: 28,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', right: -70, top: -70, width: 220, height: 220, borderRadius: '50%', background: '#F9A80010', pointerEvents: 'none' }} />
          <button
            onClick={() => navigate('/')}
            style={{ background: 'none', border: 'none', color: '#F9A800', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, fontWeight: 800, marginBottom: 14, padding: 0, letterSpacing: 1.5 }}
          >← INÍCIO</button>
          <div style={{ fontSize: 36, marginBottom: 8 }}>{t.icone}</div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 42, fontWeight: 900, color: '#F0F0F0', lineHeight: 1, marginBottom: 6 }}>
            Trilha: {t.nome}
          </div>
          {t.descricao && (
            <div style={{ color: '#555', fontSize: 13, marginBottom: 10 }}>{t.descricao}</div>
          )}
          <div style={{ color: '#444', fontSize: 13 }}>
            {modulos.length} módulo{modulos.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Módulos */}
        {modulos.length === 0 ? (
          <div style={{ background: '#161616', border: '1px solid #1E1E1E', borderRadius: 12, padding: '40px', textAlign: 'center', color: '#444', fontSize: 14 }}>
            Nenhum módulo disponível nesta trilha ainda.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            {modulos.map((m, idx) => {
              const prog = porModulo[m.id];
              const pct = prog?.total > 0 ? Math.round((prog.concluidas / prog.total) * 100) : 0;
              const done = pct === 100 && prog?.total > 0;
              return (
                <div
                  key={m.id}
                  onClick={() => navigate(`/modulo/${m.id}`)}
                  style={{
                    background: '#161616', border: `1px solid ${done ? '#22A06B44' : '#1E1E1E'}`,
                    borderRadius: 12, padding: 22, cursor: 'pointer', transition: 'all .2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = done ? '#22A06B66' : '#F9A80055'; e.currentTarget.style.background = '#1A1A1A'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = done ? '#22A06B44' : '#1E1E1E'; e.currentTarget.style.background = '#161616'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 8,
                      background: done ? '#22A06B22' : '#F9A80022',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 16,
                      color: done ? '#22A06B' : '#F9A800',
                    }}>{done ? '✓' : idx + 1}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {m.ativo === false && (
                        <span style={{ fontSize: 10, background: '#E05A2B22', color: '#E05A2B', border: '1px solid #E05A2B44', borderRadius: 10, padding: '2px 8px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800 }}>INATIVO</span>
                      )}
                      {m.xpBonus > 0 && (
                        <span style={{ fontSize: 11, color: '#F9A80066', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800 }}>⚡{m.xpBonus} XP</span>
                      )}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 20, fontWeight: 900, color: '#F0F0F0', marginBottom: 4, lineHeight: 1.2 }}>
                    {m.titulo}
                  </div>
                  {m.descricao && (
                    <div style={{ fontSize: 12, color: '#555', lineHeight: 1.5, marginBottom: prog ? 12 : 0 }}>{m.descricao}</div>
                  )}
                  {prog && prog.total > 0 && (
                    <div style={{ marginTop: m.descricao ? 0 : 12 }}>
                      <ProgressBar pct={pct} color={done ? '#22A06B' : '#F9A800'} h={4} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 11 }}>
                        <span style={{ color: '#444' }}>{prog.concluidas}/{prog.total} aulas</span>
                        <span style={{ color: done ? '#22A06B' : '#F9A800', fontWeight: 700 }}>{pct}%</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── TRILHA LOCAL (dados de lmsData.js) ───────────────
  const trail = localTrail;
  const tp = trailProgress(trail, progress);

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1000, fontFamily: 'Barlow, sans-serif' }}>
      <div style={{
        background: trail.colorDim, border: `1px solid ${trail.color}33`,
        borderRadius: 16, padding: '28px 32px', marginBottom: 28,
        position: 'relative', overflow: 'hidden',
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
                borderRadius: 12, padding: 22, cursor: 'pointer', transition: 'all .2s',
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
