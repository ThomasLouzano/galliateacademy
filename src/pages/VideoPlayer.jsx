import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/index.js';
import PdfReader from '../components/PdfReader.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// ── helpers ─────────────────────────────────────────────
const getYouTubeId = (url = '') => {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
  return m?.[1] ?? null;
};
const getVimeoId = (url = '') => {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m?.[1] ?? null;
};

// ── sub-componentes ──────────────────────────────────────
function VideoProgressBar({ pct }) {
  return (
    <div style={{ height: 5, background: '#1C1C1C', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${pct}%`,
        background: 'linear-gradient(90deg, #FFC107, #FFD54F)',
        borderRadius: 3, transition: 'width .4s linear',
        boxShadow: pct > 0 ? '0 0 8px #FFC10766' : 'none',
      }} />
    </div>
  );
}

function ChecklistItem({ label, checked, onChange }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 14,
        padding: '13px 16px',
        background: checked ? '#FFC10712' : '#111111',
        border: `1px solid ${checked ? '#FFC10755' : '#1E1E1E'}`,
        borderRadius: 9, cursor: 'pointer', transition: 'all .15s',
        userSelect: 'none',
      }}
    >
      <div style={{
        width: 22, height: 22, borderRadius: 5, flexShrink: 0, marginTop: 1,
        border: `2px solid ${checked ? '#FFC107' : '#2A2A2A'}`,
        background: checked ? '#FFC107' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all .15s',
      }}>
        {checked && <span style={{ color: '#000', fontSize: 13, fontWeight: 900, lineHeight: 1 }}>✓</span>}
      </div>
      <span style={{ fontSize: 14, color: checked ? '#FFC107' : '#555', lineHeight: 1.6, flex: 1 }}>
        {label}
      </span>
    </div>
  );
}

// ── componente principal ─────────────────────────────────
export default function VideoPlayer() {
  const { moduloId, aulaId } = useParams();
  const navigate = useNavigate();
  const { user, addXP } = useAuth();

  // dados
  const [modulo, setModulo] = useState(null);
  const [secoes, setSecoes] = useState([]);
  const [todasAulas, setTodasAulas] = useState([]);
  const [aula, setAula] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  // player
  const [progresso, setProgresso] = useState(0);
  const [videoTerminou, setVideoTerminou] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const [apostilaAberta, setApostilaAberta] = useState(false);
  const [temAvaliacao, setTemAvaliacao] = useState(false);
  const [emitindoCert, setEmitindoCert] = useState(false);

  const ytContainerRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const pollRef = useRef(null);
  const maxPosRef = useRef(0);
  const xpConcedidoRef = useRef(false);

  // responsive
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  // carrega módulo + seções + verifica avaliação
  useEffect(() => {
    setLoading(true);
    setErro(null);
    Promise.allSettled([api.getModuloById(moduloId), api.getSecoes(moduloId), api.getAvaliacoes(moduloId)])
      .then(([resMod, resSecs, resAvs]) => {
        if (resMod.status !== 'fulfilled') { setErro(resMod.reason?.message || 'Erro ao carregar módulo'); return; }
        if (resSecs.status !== 'fulfilled') { setErro(resSecs.reason?.message || 'Erro ao carregar seções'); return; }
        const mod = resMod.value;
        const s = Array.isArray(resSecs.value) ? resSecs.value : [];
        setModulo(mod);
        setSecoes(s);
        const todas = s.flatMap(sec => sec.aulas || []);
        setTodasAulas(todas);
        setAula(todas.find(a => a.id === Number(aulaId)) ?? null);
        if (resAvs.status === 'fulfilled') {
          setTemAvaliacao(Array.isArray(resAvs.value) && resAvs.value.length > 0);
        }
      })
      .finally(() => setLoading(false));
  }, [moduloId]);

  // atualiza aula quando aulaId muda (navegação entre aulas)
  useEffect(() => {
    if (!todasAulas.length) return;
    setAula(todasAulas.find(a => a.id === Number(aulaId)) ?? null);
    setProgresso(0);
    setVideoTerminou(false);
    setCheckedItems({});
    maxPosRef.current = 0;
    xpConcedidoRef.current = false;
  }, [aulaId, todasAulas]);

  // YouTube IFrame API
  useEffect(() => {
    if (!aula) return;
    const ytId = getYouTubeId(aula.videoUrl);
    if (!ytId) return;

    // limpa player anterior
    if (pollRef.current) clearInterval(pollRef.current);
    if (ytPlayerRef.current?.destroy) {
      ytPlayerRef.current.destroy();
      ytPlayerRef.current = null;
    }
    maxPosRef.current = 0;

    const buildPlayer = () => {
      if (!ytContainerRef.current) return;
      ytContainerRef.current.innerHTML = '';
      const target = document.createElement('div');
      ytContainerRef.current.appendChild(target);

      ytPlayerRef.current = new window.YT.Player(target, {
        videoId: ytId,
        playerVars: { controls: 1, rel: 0, modestbranding: 1, fs: 0 },
        events: {
          onReady(e) {
            const iframe = e.target.getIframe();
            iframe.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:none;';
          },
          onStateChange(e) {
            const { PlayerState } = window.YT;
            if (e.data === PlayerState.PLAYING) {
              if (pollRef.current) clearInterval(pollRef.current);
              pollRef.current = setInterval(() => {
                const p = ytPlayerRef.current;
                if (!p?.getCurrentTime) return;
                const cur = p.getCurrentTime();
                const dur = p.getDuration() || 1;
                // Só bloqueia pulo pra frente além do máximo já assistido
                if (cur > maxPosRef.current + 2.5) {
                  p.seekTo(maxPosRef.current, true);
                } else {
                  maxPosRef.current = Math.max(maxPosRef.current, cur);
                  setProgresso(Math.min(99, Math.round((maxPosRef.current / dur) * 100)));
                }
              }, 500);
            } else {
              if (pollRef.current) clearInterval(pollRef.current);
              if (e.data === window.YT.PlayerState.ENDED) {
                setVideoTerminou(true);
                setProgresso(100);
              }
            }
          },
        },
      });
    };

    if (window.YT?.Player) {
      buildPlayer();
    } else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { prev?.(); buildPlayer(); };
      if (!document.querySelector('script[src*="iframe_api"]')) {
        const s = document.createElement('script');
        s.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(s);
      }
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (ytPlayerRef.current?.destroy) {
        ytPlayerRef.current.destroy();
        ytPlayerRef.current = null;
      }
    };
  }, [aula]);

  const handleEmitirCertificado = async () => {
    if (emitindoCert || !user?.id) return;
    setEmitindoCert(true);
    try {
      const cert = await api.gerarCertificado(user.id, Number(moduloId), null, null);
      navigate(`/certificado/${cert.codigoValidacao}`);
    } catch (e) {
      alert(e.message || 'Erro ao gerar certificado');
      setEmitindoCert(false);
    }
  };

  // ── derivações ───────────────────────────────────────
  const checklist = (() => {
    try { return aula?.checklist ? JSON.parse(aula.checklist) : []; }
    catch { return []; }
  })();

  const marcados = checklist.filter((_, i) => checkedItems[i]).length;
  const todosMarcados = checklist.length === 0 || marcados === checklist.length;
  const currentIdx = todasAulas.findIndex(a => a.id === Number(aulaId));
  const proximaAula = currentIdx >= 0 && currentIdx < todasAulas.length - 1 ? todasAulas[currentIdx + 1] : null;
  const podeAvancar = videoTerminou && todosMarcados;

  // Progresso + XP: salva no backend quando vídeo + checklist concluídos
  useEffect(() => {
    if (!videoTerminou || !todosMarcados) return;
    if (xpConcedidoRef.current || !user?.id || !aula) return;
    xpConcedidoRef.current = true;

    api.saveProgress(user.id, Number(aulaId))
      .then(({ xpGanho, moduloConcluido, xpBonus }) => {
        const total = (xpGanho || 0) + (moduloConcluido ? (xpBonus || 0) : 0);
        if (total > 0) addXP(total);
      })
      .catch(e => console.error('[VideoPlayer] erro ao salvar progresso:', e));
  }, [videoTerminou, todosMarcados]);

  const ytId = getYouTubeId(aula?.videoUrl ?? '');
  const vimeoId = !ytId ? getVimeoId(aula?.videoUrl ?? '') : null;
  const apostilaUrl = aula?.apostilaUrl ?? null;
  const apostilaEhPdf = apostilaUrl && (apostilaUrl.toLowerCase().endsWith('.pdf') || apostilaUrl.includes('/uploads/'));

  // ── estados de feedback ──────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Barlow Condensed, sans-serif', color: '#444', fontSize: 18, letterSpacing: 2 }}>
        CARREGANDO AULA...
      </div>
    );
  }

  if (erro || !aula) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A0A0A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: 'Barlow Condensed, sans-serif' }}>
        <div style={{ color: '#E05A2B', fontSize: 16 }}>{erro || 'Aula não encontrada'}</div>
        <button onClick={() => navigate(`/modulo/${moduloId}`)} style={{ padding: '10px 24px', background: '#FFC107', border: 'none', borderRadius: 8, color: '#000', fontWeight: 900, cursor: 'pointer', fontSize: 14 }}>← VOLTAR</button>
      </div>
    );
  }

  // ── render ───────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', fontFamily: 'Barlow, sans-serif', color: '#F0F0F0', display: 'flex', flexDirection: 'column' }}>

      {/* ── HEADER ───────────────────────────────────── */}
      <div style={{
        background: '#0D0D0D', borderBottom: '1px solid #161616',
        padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 18,
        position: 'sticky', top: 0, zIndex: 200, flexShrink: 0,
      }}>
        <button
          onClick={() => navigate(`/modulo/${moduloId}`)}
          style={{
            background: 'none', border: '1px solid #222', color: '#666',
            padding: '7px 16px', borderRadius: 7, cursor: 'pointer',
            fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, fontWeight: 800,
            letterSpacing: 1, flexShrink: 0, transition: 'all .15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#FFC107'; e.currentTarget.style.color = '#FFC107'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#222'; e.currentTarget.style.color = '#666'; }}
        >← VOLTAR</button>

        <div style={{ width: 1, height: 28, background: '#1A1A1A', flexShrink: 0 }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 900, color: '#FFC107', letterSpacing: 3, marginBottom: 1 }}>
            GALLIATE ACADEMY
          </div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15, fontWeight: 800, color: '#CCC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {modulo?.titulo && <span style={{ color: '#444' }}>{modulo.titulo} · </span>}
            {aula.titulo}
          </div>
        </div>

        {/* progresso no header */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 80, height: 4, background: '#1A1A1A', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progresso}%`, background: '#FFC107', borderRadius: 2, transition: 'width .4s' }} />
          </div>
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 800, color: videoTerminou ? '#FFC107' : '#333' }}>
            {videoTerminou ? '✓' : `${progresso}%`}
          </span>
        </div>
      </div>

      {/* ── BODY ─────────────────────────────────────── */}
      <div style={{
        flex: 1, display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 300px',
        minHeight: 0,
      }}>

        {/* ── COLUNA PRINCIPAL ─────────────────────── */}
        <div style={{ overflowY: 'auto', padding: isMobile ? '20px 16px' : '28px 36px' }}>

          {/* Player */}
          <div style={{ borderRadius: 14, overflow: 'hidden', background: '#000', marginBottom: 10, boxShadow: '0 8px 40px rgba(0,0,0,.6)' }}>
            {ytId ? (
              <div style={{ position: 'relative', paddingTop: '56.25%', background: '#000' }}>
                <div ref={ytContainerRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
              </div>
            ) : vimeoId ? (
              <div style={{ position: 'relative', paddingTop: '56.25%' }}>
                <iframe
                  src={`https://player.vimeo.com/video/${vimeoId}?color=FFC107&title=0&byline=0&portrait=0`}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  title={aula.titulo}
                />
                <div style={{
                  position: 'absolute', inset: 0, zIndex: 10,
                  background: 'transparent', cursor: 'default',
                }} />
              </div>
            ) : (
              <div style={{ paddingTop: '56.25%', position: 'relative', background: '#111' }}>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 36 }}>📄</span>
                  <span style={{ fontFamily: 'Barlow Condensed, sans-serif', color: '#333', fontSize: 14, letterSpacing: 2 }}>CONTEÚDO TEXTUAL</span>
                </div>
              </div>
            )}
          </div>

          {/* Barra de progresso customizada */}
          <div style={{ marginBottom: 22 }}>
            <VideoProgressBar pct={progresso} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, letterSpacing: 1 }}>
              <span style={{ color: videoTerminou ? '#FFC107' : '#333' }}>
                {videoTerminou ? '✓ VÍDEO CONCLUÍDO' : `${progresso}% ASSISTIDO`}
              </span>
              {aula.duracao && <span style={{ color: '#2A2A2A' }}>⏱ {aula.duracao}</span>}
            </div>
          </div>

          {/* Título e descrição */}
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: isMobile ? 24 : 30, fontWeight: 900, color: '#F0F0F0', lineHeight: 1.1, margin: '0 0 12px' }}>
              {aula.titulo}
            </h1>
            {aula.descricao && (
              <p style={{ fontSize: 14, color: '#555', lineHeight: 1.8, margin: 0 }}>{aula.descricao}</p>
            )}
          </div>

          {/* Checklist */}
          {checklist.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              {!videoTerminou ? (
                <div style={{ background: '#0F0F0F', border: '1px solid #1A1A1A', borderRadius: 10, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ fontSize: 28, flexShrink: 0 }}>🔒</div>
                  <div>
                    <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 800, color: '#333', letterSpacing: 1.5 }}>CHECKLIST BLOQUEADO</div>
                    <div style={{ fontSize: 12, color: '#2A2A2A', marginTop: 3 }}>Assista ao vídeo completo para desbloquear os itens de verificação</div>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 900, color: '#FFC107', letterSpacing: 2 }}>CHECKLIST</div>
                    <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, color: marcados === checklist.length ? '#FFC107' : '#444' }}>
                      {marcados}/{checklist.length} itens marcados
                    </div>
                    {marcados === checklist.length && (
                      <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 800, background: '#FFC10720', color: '#FFC107', border: '1px solid #FFC10744', borderRadius: 20, padding: '2px 10px', letterSpacing: 1 }}>COMPLETO</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {checklist.map((item, i) => (
                      <ChecklistItem
                        key={i}
                        label={item}
                        checked={!!checkedItems[i]}
                        onChange={v => setCheckedItems(prev => ({ ...prev, [i]: v }))}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Apostila */}
          {apostilaUrl && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 900, color: '#F9A800', letterSpacing: 2 }}>APOSTILA</div>
                <button
                  onClick={() => apostilaEhPdf ? setApostilaAberta(a => !a) : window.open(apostilaUrl, '_blank')}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    padding: '7px 16px', background: '#F9A80015', border: '1px solid #F9A80044',
                    borderRadius: 8, cursor: 'pointer', color: '#F9A800',
                    fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 800,
                    letterSpacing: 0.5, transition: 'all .15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F9A80025'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#F9A80015'; }}
                >
                  📄 {apostilaEhPdf ? (apostilaAberta ? 'Fechar Apostila' : 'Ver Apostila') : 'Abrir Apostila'}
                </button>
              </div>
              {apostilaAberta && apostilaEhPdf && (
                <PdfReader url={apostilaUrl} />
              )}
            </div>
          )}

          {/* Botão próxima aula */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: 40 }}>
            {proximaAula ? (
              <button
                onClick={() => podeAvancar && navigate(`/modulo/${moduloId}/aula/${proximaAula.id}`)}
                disabled={!podeAvancar}
                style={{
                  padding: '15px 32px',
                  background: podeAvancar ? '#FFC107' : '#111',
                  border: `1px solid ${podeAvancar ? '#FFC107' : '#1E1E1E'}`,
                  borderRadius: 10, cursor: podeAvancar ? 'pointer' : 'not-allowed',
                  fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15, fontWeight: 900,
                  color: podeAvancar ? '#000' : '#333', letterSpacing: 1,
                  transition: 'all .2s', display: 'flex', alignItems: 'center', gap: 10,
                  boxShadow: podeAvancar ? '0 4px 20px #FFC10740' : 'none',
                }}
                onMouseEnter={e => { if (podeAvancar) e.currentTarget.style.background = '#FFD54F'; }}
                onMouseLeave={e => { if (podeAvancar) e.currentTarget.style.background = '#FFC107'; }}
                title={!videoTerminou ? 'Assista o vídeo completo' : !todosMarcados ? 'Marque todos os itens do checklist' : ''}
              >
                {!videoTerminou
                  ? <><span>🔒</span> ASSISTA O VÍDEO COMPLETO</>
                  : !todosMarcados
                    ? <><span>☐</span> CHECKLIST ({marcados}/{checklist.length})</>
                    : <>PRÓXIMA AULA <span>→</span></>
                }
              </button>
            ) : videoTerminou && todosMarcados ? (
              <div style={{ background: '#FFC10715', border: '1px solid #FFC10733', borderRadius: 12, padding: '22px 28px', textAlign: 'center', width: '100%' }}>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 22, fontWeight: 900, color: '#FFC107', marginBottom: 6 }}>🎉 MÓDULO CONCLUÍDO!</div>
                <div style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>Você completou todas as aulas deste módulo.</div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {temAvaliacao ? (
                    <button
                      onClick={() => navigate(`/modulo/${moduloId}/avaliacao`)}
                      style={{ padding: '13px 28px', background: '#FFC107', border: 'none', borderRadius: 9, color: '#000', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 20px #FFC10740', transition: 'background .15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FFD54F'}
                      onMouseLeave={e => e.currentTarget.style.background = '#FFC107'}
                    >📝 FAZER AVALIAÇÃO →</button>
                  ) : (
                    <button
                      onClick={handleEmitirCertificado}
                      disabled={emitindoCert}
                      style={{ padding: '13px 28px', background: emitindoCert ? '#111' : '#FFC107', border: `1px solid ${emitindoCert ? '#2A2A2A' : '#FFC107'}`, borderRadius: 9, color: emitindoCert ? '#444' : '#000', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15, fontWeight: 900, cursor: emitindoCert ? 'not-allowed' : 'pointer', boxShadow: emitindoCert ? 'none' : '0 4px 20px #FFC10740', transition: 'all .15s', letterSpacing: 1 }}
                      onMouseEnter={e => { if (!emitindoCert) e.currentTarget.style.background = '#FFD54F'; }}
                      onMouseLeave={e => { if (!emitindoCert) e.currentTarget.style.background = emitindoCert ? '#111' : '#FFC107'; }}
                    >🎓 {emitindoCert ? 'GERANDO...' : 'EMITIR CERTIFICADO'}</button>
                  )}
                  <button
                    onClick={() => navigate(`/modulo/${moduloId}`)}
                    style={{ padding: '13px 22px', background: 'transparent', border: '1px solid #2A2A2A', borderRadius: 9, color: '#666', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 800, cursor: 'pointer', transition: 'all .15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#444'; e.currentTarget.style.color = '#CCC'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#2A2A2A'; e.currentTarget.style.color = '#666'; }}
                  >← VOLTAR AO MÓDULO</button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* ── SIDEBAR — lista de aulas ──────────────── */}
        <div style={{
          background: '#0D0D0D',
          borderLeft: isMobile ? 'none' : '1px solid #141414',
          borderTop: isMobile ? '1px solid #141414' : 'none',
          overflowY: 'auto',
          order: isMobile ? 1 : 0,
        }}>
          <div style={{ padding: '18px 18px 10px', position: 'sticky', top: 0, background: '#0D0D0D', zIndex: 10, borderBottom: '1px solid #141414' }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 9, fontWeight: 800, color: '#2A2A2A', letterSpacing: 3 }}>CONTEÚDO DO MÓDULO</div>
            <div style={{ fontSize: 12, color: '#333', marginTop: 3, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>{modulo?.titulo}</div>
          </div>

          <div style={{ paddingBottom: 20 }}>
            {secoes.map(secao => (
              <div key={secao.id}>
                {/* cabeçalho da seção */}
                <div style={{ padding: '12px 18px 6px', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 9, fontWeight: 800, color: '#2A2A2A', letterSpacing: 2.5 }}>
                  {secao.titulo.toUpperCase()}
                </div>
                {/* aulas */}
                {(secao.aulas || []).map((a, idx) => {
                  const isCur = a.id === Number(aulaId);
                  return (
                    <div
                      key={a.id}
                      onClick={() => navigate(`/modulo/${moduloId}/aula/${a.id}`)}
                      style={{
                        padding: '11px 16px 11px 0',
                        paddingLeft: 0,
                        display: 'flex', alignItems: 'center', gap: 0,
                        cursor: 'pointer', transition: 'background .15s',
                        background: isCur ? '#FFC10710' : 'transparent',
                        borderLeft: `3px solid ${isCur ? '#FFC107' : 'transparent'}`,
                      }}
                      onMouseEnter={e => { if (!isCur) e.currentTarget.style.background = '#ffffff05'; }}
                      onMouseLeave={e => { if (!isCur) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{ width: 15, flexShrink: 0 }} />
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                        background: isCur ? '#FFC107' : '#161616',
                        border: `2px solid ${isCur ? '#FFC107' : '#222'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 900,
                        color: isCur ? '#000' : '#333',
                        marginRight: 10, flexShrink: 0,
                      }}>{idx + 1}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13,
                          fontWeight: isCur ? 800 : 500,
                          color: isCur ? '#FFC107' : '#555',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>{a.titulo}</div>
                        {a.duracao && (
                          <div style={{ fontSize: 10, color: '#2A2A2A', marginTop: 2 }}>⏱ {a.duracao}</div>
                        )}
                      </div>
                      <div style={{ flexShrink: 0, paddingRight: 14, display: 'flex', gap: 4, alignItems: 'center' }}>
                        {a.videoUrl && <span style={{ fontSize: 9, color: isCur ? '#FFC10777' : '#222' }}>▶</span>}
                        {a.checklist && a.checklist !== '[]' && <span style={{ fontSize: 9, color: isCur ? '#FFC10777' : '#222' }}>☐</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
