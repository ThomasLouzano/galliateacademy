import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/index.js';
import ProgressBar from '../components/ProgressBar';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [trilhas, setTrilhas] = useState([]);
  const [resumo, setResumo] = useState({ aulasConcluidas: [], porTrilha: {}, porModulo: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    Promise.allSettled([api.getTrilhas(), api.getProgressoResumo(user.id)])
      .then(([resTrilhas, resResumo]) => {
        if (resTrilhas.status === 'fulfilled') {
          setTrilhas(Array.isArray(resTrilhas.value) ? resTrilhas.value : []);
        }
        if (resResumo.status === 'fulfilled') {
          const r = resResumo.value || {};
          setResumo({
            aulasConcluidas: r.aulasConcluidas || [],
            porTrilha: r.porTrilha || {},
            porModulo: r.porModulo || {},
          });
        }
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  const xp = user?.xp ?? 0;
  const doneLessons = resumo.aulasConcluidas.length;
  const totalAulas = Object.values(resumo.porTrilha).reduce((sum, t) => sum + (t.total || 0), 0);

  const level = Math.floor(xp / 300) + 1;
  const prevXP = (level - 1) * 300;
  const nextXP = level * 300;
  const levelPct = Math.round((xp - prevXP) / (nextXP - prevXP) * 100);

  // Mostra apenas se houver trilha com progresso iniciado mas não concluído
  const continueTrail = trilhas.find(t => {
    const p = resumo.porTrilha[t.id];
    return p && p.concluidas > 0 && p.concluidas < p.total;
  }) ?? null;

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
          ['Aulas', doneLessons, totalAulas > 0 ? `/${totalAulas}` : '', '#22A06B'],
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

      <div style={{ display: 'grid', gridTemplateColumns: continueTrail ? '1fr auto' : '1fr', gap: 14, marginBottom: 28 }}>
        <div style={{ background: '#161616', border: '1px solid #1E1E1E', borderRadius: 12, padding: '18px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15, fontWeight: 700, color: '#E0E0E0' }}>
              Nível {level} <span style={{ color: '#333' }}>→</span> <span style={{ color: '#F9A800' }}>Nível {level + 1}</span>
            </div>
            <div style={{ fontSize: 12, color: '#444' }}>{xp - prevXP} / {nextXP - prevXP} XP</div>
          </div>
          <ProgressBar pct={levelPct} color="#F9A800" h={8} />
        </div>

        {continueTrail && (
          <div
            onClick={() => navigate(`/trail/${continueTrail.id}`)}
            style={{
              background: '#F9A80015', border: '1px solid #F9A80033', borderRadius: 12,
              padding: '18px 24px', cursor: 'pointer', display: 'flex',
              alignItems: 'center', gap: 14, transition: 'border-color .2s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#F9A80066'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#F9A80033'}
          >
            <div style={{ width: 38, height: 38, borderRadius: 8, background: '#F9A80022', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#F9A800', flexShrink: 0 }}>▶</div>
            <div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, color: '#F9A800', letterSpacing: 2, fontWeight: 700 }}>CONTINUAR</div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 800, color: '#F0F0F0' }}>{continueTrail.nome}</div>
            </div>
          </div>
        )}
      </div>

      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 20, fontWeight: 800, color: '#E0E0E0', marginBottom: 14 }}>
        Trilhas de Treinamento
      </div>

      {loading ? (
        <div style={{ color: '#444', fontSize: 14, padding: '32px 0' }}>Carregando trilhas...</div>
      ) : trilhas.length === 0 ? (
        <div style={{
          background: '#161616', border: '1px solid #1E1E1E', borderRadius: 12,
          padding: '48px', textAlign: 'center', color: '#444', fontSize: 14,
        }}>
          Nenhuma trilha disponível ainda.
        </div>
      ) : (
        <div className="grid-3">
          {trilhas.map(t => {
            const prog = resumo.porTrilha[t.id];
            const pct = prog?.total > 0 ? Math.round((prog.concluidas / prog.total) * 100) : 0;
            const done = pct === 100 && prog?.total > 0;
            return (
              <div
                key={t.id}
                onClick={() => navigate(`/trail/${t.id}`)}
                style={{
                  background: '#161616', border: `1px solid ${done ? '#22A06B33' : '#F9A80022'}`,
                  borderRadius: 12, padding: 22, cursor: 'pointer',
                  transition: 'all .2s', position: 'relative', overflow: 'hidden',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = done ? '#22A06B55' : '#F9A80055'; e.currentTarget.style.background = '#1A1A1A'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = done ? '#22A06B33' : '#F9A80022'; e.currentTarget.style.background = '#161616'; }}
              >
                <div style={{ position: 'absolute', top: -50, right: -50, width: 140, height: 140, borderRadius: '50%', background: '#F9A8000A', pointerEvents: 'none' }} />
                <div style={{ fontSize: 28, marginBottom: 10 }}>{t.icone}</div>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 22, fontWeight: 900, color: '#F0F0F0', marginBottom: 2 }}>{t.nome}</div>
                <div style={{ fontSize: 12, color: '#555', marginBottom: 14 }}>
                  {(t.modulos?.length ?? 0)} módulo{t.modulos?.length !== 1 ? 's' : ''}
                  {prog?.total > 0 && ` · ${prog.total} aulas`}
                </div>
                <ProgressBar pct={pct} color={done ? '#22A06B' : '#F9A800'} h={5} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7, fontSize: 11 }}>
                  <span style={{ color: '#444' }}>{prog ? `${prog.concluidas}/${prog.total} aulas` : '—'}</span>
                  <span style={{ color: done ? '#22A06B' : '#F9A800', fontWeight: 700 }}>{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
