import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import ProgressBar from '../components/ProgressBar.jsx';

function AulaRow({ aula, numero, moduloId, concluida }) {
  const navigate = useNavigate();
  const [aberta, setAberta] = useState(false);
  const checklist = (() => {
    try { return aula.checklist ? JSON.parse(aula.checklist) : []; }
    catch { return []; }
  })();

  return (
    <div style={{
      background: '#0D0D0D',
      border: `1px solid ${concluida ? '#22A06B33' : '#1E1E1E'}`,
      borderRadius: 8, overflow: 'hidden', transition: 'border-color .15s',
    }}>
      <div
        onClick={() => setAberta(a => !a)}
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', userSelect: 'none' }}
      >
        {/* número / check */}
        {concluida ? (
          <div style={{
            width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
            background: '#22A06B22', border: '2px solid #22A06B55',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, color: '#22A06B',
          }}>✓</div>
        ) : (
          <div style={{
            width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
            background: '#1A1A1A', border: '2px solid #2A2A2A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 11, color: '#555',
          }}>{numero}</div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15, fontWeight: 700, color: concluida ? '#22A06B' : '#DDD', display: 'flex', alignItems: 'center', gap: 8 }}>
            {aula.titulo}
            {concluida && <span style={{ fontSize: 10, fontWeight: 900, color: '#22A06B', background: '#22A06B15', border: '1px solid #22A06B33', borderRadius: 10, padding: '1px 7px', letterSpacing: 1 }}>CONCLUÍDA</span>}
          </div>
          {aula.descricao && !aberta && (
            <div style={{ fontSize: 11, color: '#444', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {aula.descricao}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {aula.duracao && (
            <span style={{ fontSize: 11, color: '#444', background: '#161616', borderRadius: 4, padding: '2px 7px' }}>⏱ {aula.duracao}</span>
          )}
          {aula.videoUrl && (
            <span style={{ fontSize: 11, color: '#8B7FE8', background: '#8B7FE811', borderRadius: 4, padding: '2px 7px' }}>▶ vídeo</span>
          )}
          {checklist.length > 0 && (
            <span style={{ fontSize: 10, color: '#F9A80088', background: '#F9A80011', borderRadius: 4, padding: '2px 7px' }}>☐ {checklist.length}</span>
          )}
          {(aula.xp ?? 10) > 0 && (
            <span style={{ fontSize: 10, color: '#F9A80066', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800 }}>⚡{aula.xp ?? 10}</span>
          )}
          <span style={{ fontSize: 11, color: '#333', display: 'inline-block', transition: 'transform .2s', transform: aberta ? 'rotate(180deg)' : 'none' }}>▾</span>
        </div>
      </div>

      {aberta && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid #1A1A1A' }}>
          {aula.descricao && (
            <p style={{ fontSize: 13, color: '#555', lineHeight: 1.7, margin: '12px 0 10px' }}>{aula.descricao}</p>
          )}
          {aula.videoUrl && (
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/modulo/${moduloId}/aula/${aula.id}`); }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#FFC10715', border: '1px solid #FFC10733',
                color: '#FFC107', fontSize: 13, borderRadius: 6, padding: '5px 12px',
                cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700,
                marginBottom: checklist.length > 0 ? 14 : 0,
              }}
            >▶ {concluida ? 'Rever vídeo' : 'Assistir vídeo'}</button>
          )}
          {checklist.length > 0 && (
            <div style={{ marginTop: aula.videoUrl ? 0 : 12 }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#2A2A2A', letterSpacing: 2, marginBottom: 8 }}>CHECKLIST</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {checklist.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#555', lineHeight: 1.5 }}>
                    <span style={{ color: concluida ? '#22A06B' : '#F9A800', flexShrink: 0, marginTop: 1 }}>{concluida ? '✓' : '☐'}</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Module() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [modulo, setModulo] = useState(null);
  const [secoes, setSecoes] = useState([]);
  const [aulasConcluidas, setAulasConcluidas] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    setLoading(true);
    setErro(null);
    const fetches = [api.getModuloById(id), api.getSecoes(id)];
    if (user?.id) fetches.push(api.getProgressoResumo(user.id));

    Promise.allSettled(fetches).then(([resMod, resSecs, resProgresso]) => {
      if (resMod.status !== 'fulfilled') { setErro(resMod.reason?.message || 'Erro ao carregar módulo'); return; }
      if (resSecs.status !== 'fulfilled') { setErro(resSecs.reason?.message || 'Erro ao carregar seções'); return; }
      setModulo(resMod.value);
      setSecoes(Array.isArray(resSecs.value) ? resSecs.value : []);
      if (resProgresso?.status === 'fulfilled') {
        setAulasConcluidas(new Set(resProgresso.value.aulasConcluidas || []));
      }
    }).finally(() => setLoading(false));
  }, [id, user?.id]);

  if (loading) {
    return <div style={{ padding: '40px', fontFamily: 'Barlow Condensed, sans-serif', color: '#555', fontSize: 16 }}>Carregando módulo...</div>;
  }
  if (erro) {
    return (
      <div style={{ padding: '40px', fontFamily: 'Barlow Condensed, sans-serif' }}>
        <div style={{ color: '#E05A2B', fontSize: 15, marginBottom: 16 }}>Erro: {erro}</div>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: '1px solid #333', color: '#888', padding: '8px 18px', borderRadius: 8, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13 }}>← Voltar</button>
      </div>
    );
  }
  if (!modulo) {
    return <div style={{ padding: '40px', fontFamily: 'Barlow Condensed, sans-serif', color: '#444', fontSize: 15 }}>Módulo não encontrado.</div>;
  }

  const todasAulas = secoes.flatMap(s => s.aulas || []);
  const totalAulas = todasAulas.length;
  const concluidasCount = todasAulas.filter(a => aulasConcluidas.has(a.id)).length;
  const pct = totalAulas > 0 ? Math.round((concluidasCount / totalAulas) * 100) : 0;

  return (
    <div style={{ padding: '32px 40px', maxWidth: 720, fontFamily: 'Barlow, sans-serif' }}>

      <button
        onClick={() => navigate(-1)}
        style={{ background: 'none', border: 'none', color: '#F9A800', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, fontWeight: 800, marginBottom: 18, padding: 0, letterSpacing: 1.5 }}
      >← VOLTAR</button>

      <div style={{ background: '#161616', border: '1px solid #F9A80022', borderRadius: 14, padding: '26px 30px', marginBottom: 28, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -60, top: -60, width: 200, height: 200, borderRadius: '50%', background: '#F9A80010', pointerEvents: 'none' }} />

        <div style={{ display: 'inline-block', background: '#F9A80015', border: '1px solid #F9A80033', borderRadius: 20, padding: '3px 12px', marginBottom: 14 }}>
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 800, color: '#F9A800', letterSpacing: 1.5 }}>MÓDULO</span>
        </div>

        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 32, fontWeight: 900, color: '#F0F0F0', lineHeight: 1.1, marginBottom: 8 }}>
          {modulo.titulo}
        </div>

        {modulo.descricao && (
          <div style={{ color: '#555', fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>{modulo.descricao}</div>
        )}

        <div style={{ display: 'flex', gap: 20, fontSize: 13, color: '#444', marginBottom: totalAulas > 0 ? 18 : 0 }}>
          <span>📂 {secoes.length} seção{secoes.length !== 1 ? 'ões' : ''}</span>
          <span>📚 {totalAulas} aula{totalAulas !== 1 ? 's' : ''}</span>
          <span style={{ color: modulo.ativo !== false ? '#22A06B' : '#E05A2B', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 11, letterSpacing: 1 }}>
            ● {modulo.ativo !== false ? 'ATIVO' : 'INATIVO'}
          </span>
        </div>

        {totalAulas > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 800, color: pct === 100 ? '#22A06B' : '#444', letterSpacing: 1 }}>
                {pct === 100 ? '✓ MÓDULO CONCLUÍDO' : `${concluidasCount}/${totalAulas} aulas concluídas`}
              </span>
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 900, color: pct === 100 ? '#22A06B' : '#F9A800' }}>{pct}%</span>
            </div>
            <ProgressBar pct={pct} color={pct === 100 ? '#22A06B' : '#F9A800'} h={6} />
          </div>
        )}
      </div>

      {secoes.length === 0 ? (
        <div style={{ background: '#161616', border: '1px solid #1E1E1E', borderRadius: 12, padding: '32px', textAlign: 'center', color: '#333', fontSize: 14 }}>
          Nenhuma seção disponível neste módulo ainda.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {secoes.map((secao) => {
            const aulasSecao = secao.aulas || [];
            const concluidasSecao = aulasSecao.filter(a => aulasConcluidas.has(a.id)).length;
            return (
              <div key={secao.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ height: 1, flex: 1, background: '#1E1E1E' }} />
                  <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 800, color: '#F9A800', letterSpacing: 2, flexShrink: 0 }}>
                    {secao.titulo.toUpperCase()}
                  </span>
                  {aulasSecao.length > 0 && (
                    <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, color: '#333', flexShrink: 0 }}>
                      {concluidasSecao}/{aulasSecao.length}
                    </span>
                  )}
                  <div style={{ height: 1, flex: 1, background: '#1E1E1E' }} />
                </div>

                {aulasSecao.length === 0 ? (
                  <div style={{ fontSize: 12, color: '#2A2A2A', padding: '6px 4px' }}>Nenhuma aula nesta seção.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {aulasSecao.map((aula, idx) => (
                      <AulaRow
                        key={aula.id}
                        aula={aula}
                        numero={idx + 1}
                        moduloId={id}
                        concluida={aulasConcluidas.has(aula.id)}
                      />
                    ))}
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
