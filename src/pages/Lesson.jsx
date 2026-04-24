import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTrilha, getCourse, QUIZ_QUESTIONS } from '../data/lmsData';
import ProgressBar from '../components/ProgressBar';
import Pill from '../components/Pill';

export default function Lesson() {
  const { trailId, courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { progress, completeLesson } = useAuth();
  const trail = getTrilha(trailId);
  const course = getCourse(trailId, courseId);
  const lessonIdx = course?.lessons.findIndex(l => l.id === lessonId) ?? -1;
  const lesson = course?.lessons[lessonIdx];

  const [timer, setTimer] = useState(0);
  const playerHostRef = useRef(null);
  const playerRef = useRef(null);
  const trackRef = useRef(null);
  const apiWaitRef = useRef(null);
  const restoringRef = useRef(false);
  const mountedRef = useRef(true);
  const requiresVideoValidation = !!lesson?.gated;
  const storageKey = lesson ? `academy_gated_${lesson.id}` : '';

  const [videoState, setVideoState] = useState({
    started: false, ready: false, maxWatched: 0, duration: 0,
    status: 'Assista à aula em sequência para liberar a conclusão.',
    completed: false, checklist: []
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    setTimer(0);
    const t = setInterval(() => setTimer(p => p + 1), 1000);
    return () => clearInterval(t);
  }, [lessonId]);

  useEffect(() => {
    setVideoState({
      started: false, ready: false, maxWatched: 0, duration: 0,
      status: 'Assista à aula em sequência para liberar a conclusão.',
      completed: false, checklist: lesson?.checklist?.map(() => false) || []
    });
  }, [lessonId]);

  useEffect(() => {
    if (!lesson || !trail || !course || !requiresVideoValidation) return;

    const restore = () => {
      try { const raw = localStorage.getItem(storageKey); return raw ? JSON.parse(raw) : null; }
      catch { return null; }
    };

    const saved = restore();
    if (saved) {
      setVideoState(prev => ({
        ...prev,
        maxWatched: Number(saved.maxWatched || 0),
        duration: Number(saved.duration || 0),
        completed: Boolean(saved.completed),
        checklist: Array.isArray(saved.checklist) && saved.checklist.length ? saved.checklist : (lesson.checklist?.map(() => false) || []),
        status: Boolean(saved.completed)
          ? 'Aula pronta para concluir.'
          : Number(saved.maxWatched || 0) > 0
            ? 'Progresso recuperado. Continue de onde parou.'
            : 'Assista à aula em sequência para liberar a conclusão.'
      }));
    }

    const getVideoId = url => {
      if (!url) return '';
      const match = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{6,})/);
      return match ? match[1] : '';
    };

    const persist = (next) => {
      try { localStorage.setItem(storageKey, JSON.stringify({ maxWatched: next.maxWatched, duration: next.duration, completed: next.completed, checklist: next.checklist })); } catch {}
    };

    const createPlayer = () => {
      if (!playerHostRef.current || playerRef.current || !window.YT?.Player) return;
      const videoId = getVideoId(lesson.videoUrl);
      playerRef.current = new window.YT.Player(playerHostRef.current, {
        videoId,
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: event => {
            const duration = event.target.getDuration() || 0;
            const savedNow = restore();
            setVideoState(prev => ({ ...prev, ready: true, duration: duration || prev.duration }));
            if (savedNow && Number(savedNow.maxWatched || 0) > 1) {
              restoringRef.current = true;
              event.target.seekTo(Math.max(0, Number(savedNow.maxWatched) - 1), true);
              setTimeout(() => { restoringRef.current = false; }, 1200);
            }
          },
          onStateChange: event => {
            if (!mountedRef.current) return;
            const state = event.data;
            const isPlaying = state === window.YT.PlayerState.PLAYING;
            const isEnded = state === window.YT.PlayerState.ENDED;

            if (isPlaying) {
              setVideoState(prev => ({ ...prev, started: true, status: 'Assistindo...' }));
              if (!trackRef.current) {
                trackRef.current = setInterval(() => {
                  try {
                    const player = playerRef.current;
                    if (!player || typeof player.getCurrentTime !== 'function') return;
                    const current = player.getCurrentTime() || 0;
                    const durationNow = player.getDuration() || 0;
                    setVideoState(prev => {
                      if (!restoringRef.current && current > (prev.maxWatched + 3)) {
                        player.seekTo(prev.maxWatched, true);
                        return { ...prev, duration: durationNow || prev.duration, status: 'Não é permitido adiantar o vídeo.' };
                      }
                      const nextMax = Math.max(prev.maxWatched, current);
                      const nextPct = durationNow ? (nextMax / durationNow) * 100 : 0;
                      const checklistDone = prev.checklist.every(Boolean);
                      const completed = nextPct >= 95 && checklistDone;
                      const next = {
                        ...prev, maxWatched: nextMax, duration: durationNow || prev.duration, completed,
                        status: completed ? 'Checklist concluído e progresso suficiente. Finalize a aula.'
                          : checklistDone ? 'Assista pelo menos 95% da aula para concluir.'
                          : 'Assista à aula e complete o checklist final.'
                      };
                      persist(next);
                      return next;
                    });
                  } catch {}
                }, 1000);
              }
            } else {
              if (trackRef.current) { clearInterval(trackRef.current); trackRef.current = null; }
              if (isEnded) {
                setVideoState(prev => {
                  const durationNow = playerRef.current?.getDuration?.() || prev.duration;
                  const nextMax = Math.max(prev.maxWatched, durationNow || 0);
                  const nextPct = durationNow ? (nextMax / durationNow) * 100 : 0;
                  const checklistDone = prev.checklist.every(Boolean);
                  const completed = nextPct >= 95 && checklistDone;
                  const next = { ...prev, maxWatched: nextMax, duration: durationNow, completed, status: completed ? 'Aula pronta para concluir.' : 'Preencha o checklist final para concluir.' };
                  persist(next);
                  return next;
                });
              } else {
                setVideoState(prev => ({ ...prev, status: prev.completed ? 'Aula pronta para concluir.' : (prev.started ? 'Aula pausada.' : prev.status) }));
              }
            }
          }
        }
      });
    };

    const ensureApi = () => {
      if (window.YT?.Player) { createPlayer(); return; }
      if (!document.getElementById('yt-iframe-api')) {
        const s = document.createElement('script');
        s.id = 'yt-iframe-api';
        s.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(s);
      }
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { if (typeof previous === 'function') previous(); createPlayer(); };
      apiWaitRef.current = setInterval(() => {
        if (window.YT?.Player) { clearInterval(apiWaitRef.current); apiWaitRef.current = null; createPlayer(); }
      }, 500);
    };

    ensureApi();

    return () => {
      if (trackRef.current) { clearInterval(trackRef.current); trackRef.current = null; }
      if (apiWaitRef.current) { clearInterval(apiWaitRef.current); apiWaitRef.current = null; }
      if (playerRef.current?.destroy) { playerRef.current.destroy(); }
      playerRef.current = null;
    };
  }, [lessonId, requiresVideoValidation]);

  if (!lesson || !trail || !course) return null;

  const isLast = lessonIdx === course.lessons.length - 1;
  const nextLesson = !isLast ? course.lessons[lessonIdx + 1] : null;
  const hasQuiz = !!(QUIZ_QUESTIONS[courseId] || QUIZ_QUESTIONS[trailId]);
  const checklistDone = requiresVideoValidation ? videoState.checklist.every(Boolean) : true;
  const progressPct = videoState.duration ? Math.min(100, Math.round(videoState.maxWatched / videoState.duration * 100)) : 0;
  const canComplete = progress[lesson.id] || !requiresVideoValidation || (videoState.completed && checklistDone);

  const setChecklist = (idx) => {
    setVideoState(prev => {
      const checklist = prev.checklist.map((item, i) => i === idx ? !item : item);
      const completed = (prev.duration ? (prev.maxWatched / prev.duration) * 100 : 0) >= 95 && checklist.every(Boolean);
      const next = { ...prev, checklist, completed, status: completed ? 'Aula pronta para concluir.' : ((prev.duration ? (prev.maxWatched / prev.duration) * 100 : 0) >= 95 ? 'Preencha o checklist final para concluir.' : 'Assista à aula e complete o checklist final.') };
      try { localStorage.setItem(storageKey, JSON.stringify({ maxWatched: next.maxWatched, duration: next.duration, completed: next.completed, checklist: next.checklist })); } catch {}
      return next;
    });
  };

  const startVideo = () => {
    playerRef.current?.playVideo?.();
    setVideoState(prev => ({ ...prev, started: true, status: prev.ready ? 'Assistindo...' : 'Carregando vídeo...' }));
  };

  const resumeVideo = () => {
    if (playerRef.current?.seekTo) {
      restoringRef.current = true;
      playerRef.current.seekTo(Math.max(0, videoState.maxWatched - 1), true);
      playerRef.current.playVideo?.();
      setTimeout(() => { restoringRef.current = false; }, 1200);
    }
  };

  const handleComplete = () => {
    if (!canComplete) return;
    completeLesson(lesson.id);
    if (!isLast) navigate(`/lesson/${trailId}/${courseId}/${nextLesson.id}`);
    else if (hasQuiz) navigate(`/quiz/${trailId}/${courseId}`);
    else navigate(`/course/${trailId}/${courseId}`);
  };

  const btnLabel = progress[lesson.id]
    ? (isLast ? (hasQuiz ? 'IR AO QUIZ →' : 'VOLTAR AO CURSO') : 'PRÓXIMA AULA →')
    : !canComplete ? 'LIBERADO APÓS 95% + CHECKLIST'
    : (isLast ? (hasQuiz ? 'CONCLUIR E FAZER QUIZ →' : 'CONCLUIR AULA ✓') : 'CONCLUIR E PRÓXIMA →');

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div style={{ padding: '32px 40px', maxWidth: 920, fontFamily: 'Barlow, sans-serif' }}>
      <button onClick={() => navigate(`/course/${trailId}/${courseId}`)} style={{ background: 'none', border: 'none', color: trail.color, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, fontWeight: 800, marginBottom: 18, padding: 0, letterSpacing: 1.5 }}>
        ← {course.title.toUpperCase()}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Pill label={trail.name} color={trail.color} />
        <span style={{ color: '#3A3A3A', fontSize: 12 }}>Aula {lessonIdx + 1} de {course.lessons.length}</span>
      </div>
      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 30, fontWeight: 900, color: '#F0F0F0', marginBottom: 18 }}>{lesson.title}</div>

      <div style={{ display: 'flex', gap: 5, marginBottom: 22 }}>
        {course.lessons.map((l, i) => (
          <div key={l.id} onClick={() => navigate(`/lesson/${trailId}/${courseId}/${l.id}`)} style={{
            width: i === lessonIdx ? 22 : 7, height: 7, borderRadius: 4,
            background: progress[l.id] ? trail.color : (i === lessonIdx ? trail.color + 'BB' : '#2A2A2A'),
            cursor: 'pointer', transition: 'all .3s'
          }} />
        ))}
      </div>

      {lesson.type === 'video' ? (
        requiresVideoValidation ? (
          <div style={{ background: '#121212', border: '1px solid #1E1E1E', borderRadius: 18, padding: 18, marginBottom: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
              <Pill label="Video aula" color="#F9A800" />
              <span style={{ color: videoState.completed ? trail.color : '#8A8A8A', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, letterSpacing: 1 }}>{videoState.status}</span>
            </div>
            <div style={{ color: '#A7A7A7', fontSize: 14, lineHeight: 1.65, marginBottom: 16 }}>{lesson.desc}</div>

            <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', background: '#000', aspectRatio: '16 / 9', border: '1px solid #252525' }}>
              <div ref={playerHostRef} style={{ width: '100%', height: '100%' }} />
              {!videoState.started && (
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,.30), rgba(0,0,0,.88))', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
                  <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#F9A800', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, marginBottom: 16, boxShadow: '0 0 0 8px rgba(249,168,0,.12)' }}>▶</div>
                  <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 30, color: '#F0F0F0', fontWeight: 900, marginBottom: 8 }}>INICIAR AULA</div>
                  <div style={{ fontSize: 14, color: '#B0B0B0', maxWidth: 520, lineHeight: 1.55, marginBottom: 18 }}>Para concluir este módulo, assista pelo menos 95% do vídeo e preencha o checklist final. O avanço manual é bloqueado.</div>
                  <button onClick={startVideo} style={{ padding: '14px 26px', background: '#F9A800', border: 'none', borderRadius: 10, color: '#000', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 900, cursor: 'pointer' }}>▶ INICIAR AULA</button>
                </div>
              )}
            </div>

            <div style={{ marginTop: 16, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ color: '#EAEAEA', fontSize: 13, fontWeight: 600 }}>Progresso validado da aula</span>
                <span style={{ color: '#F9A800', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 15 }}>{progressPct}%</span>
              </div>
              <ProgressBar pct={progressPct} color="#F9A800" h={10} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 16 }}>
              {[['Regra de conclusão', '95% assistido'], ['Avanço manual', 'Bloqueado'], ['Duração da aula', lesson.duration]].map(([label, val]) => (
                <div key={label} style={{ background: '#161616', border: '1px solid #222', borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ color: '#666', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                  <div style={{ color: '#F0F0F0', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, fontWeight: 800 }}>{val}</div>
                </div>
              ))}
            </div>

            <div style={{ background: '#161616', border: '1px solid #262626', borderRadius: 14, padding: '16px 18px', marginBottom: 16 }}>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, color: '#F0F0F0', fontWeight: 800, marginBottom: 6 }}>Checklist final obrigatório</div>
              <div style={{ color: '#8A8A8A', fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>Marque todos os itens após assistir o conteúdo.</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(lesson.checklist || []).map((item, idx) => (
                  <label key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#111', border: '1px solid #202020', padding: '12px 14px', borderRadius: 12, cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!videoState.checklist[idx]} onChange={() => setChecklist(idx)} style={{ marginTop: 3, accentColor: '#F9A800' }} />
                    <span style={{ color: '#D0D0D0', fontSize: 14, lineHeight: 1.5 }}>{item}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={resumeVideo} style={{ padding: '12px 16px', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10, color: '#AAA', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>RETOMAR DO PROGRESSO</button>
              <a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer" style={{ padding: '12px 16px', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10, color: '#AAA', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>ABRIR NO YOUTUBE</a>
              <div style={{ marginLeft: 'auto', color: '#3A3A3A', fontFamily: 'monospace', fontSize: 11, alignSelf: 'center' }}>{fmt(timer)}</div>
            </div>
          </div>
        ) : (
          <div style={{ background: '#0A0A0A', border: '1px solid #1E1E1E', borderRadius: 12, aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(45deg, #111 0,#111 10px,#0A0A0A 10px,#0A0A0A 20px)' }} />
            <div style={{ position: 'relative', textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: trail.color + '22', border: `2px solid ${trail.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: trail.color, margin: '0 auto 12px' }}>▶</div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15, color: '#3A3A3A' }}>{lesson.title}</div>
              <div style={{ fontSize: 12, color: '#2A2A2A', marginTop: 3 }}>{lesson.duration}</div>
            </div>
            <div style={{ position: 'absolute', bottom: 10, right: 14, fontFamily: 'monospace', fontSize: 11, color: '#2A2A2A' }}>{fmt(timer)}</div>
          </div>
        )
      ) : (
        <div style={{ background: '#161616', border: '1px solid #1E1E1E', borderRadius: 12, padding: '26px 30px', marginBottom: 22 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, fontWeight: 800, color: trail.color, letterSpacing: 2.5, marginBottom: 14 }}>CONTEÚDO DA AULA</div>
          <div style={{ color: '#B0B0B0', fontSize: 15, lineHeight: 1.9, marginBottom: 20 }}>{lesson.desc}</div>
          <div style={{ background: trail.colorDim, border: `1px solid ${trail.color}22`, borderRadius: 8, padding: '14px 18px' }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, fontWeight: 800, color: trail.color, letterSpacing: 2, marginBottom: 8 }}>PONTOS-CHAVE</div>
            {lesson.desc.split('.').filter(s => s.trim().length > 10).slice(0, 3).map((pt, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 5, fontSize: 13, color: '#777' }}>
                <span style={{ color: trail.color, flexShrink: 0 }}>→</span>{pt.trim()}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        {lessonIdx > 0 && (
          <button onClick={() => navigate(`/lesson/${trailId}/${courseId}/${course.lessons[lessonIdx - 1].id}`)} style={{ padding: '12px 18px', background: '#161616', border: '1px solid #2A2A2A', borderRadius: 8, color: '#666', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>← ANTERIOR</button>
        )}
        <button
          onClick={handleComplete}
          disabled={!canComplete}
          style={{
            flex: 1, padding: 13,
            background: progress[lesson.id] ? '#1A1A1A' : (canComplete ? trail.color : '#1A1A1A'),
            border: `1px solid ${progress[lesson.id] ? '#2A2A2A' : (canComplete ? trail.color : '#2A2A2A')}`,
            borderRadius: 8, color: progress[lesson.id] ? '#666' : (canComplete ? '#000' : '#666'),
            fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15, fontWeight: 900,
            cursor: canComplete ? 'pointer' : 'not-allowed', letterSpacing: 0.5, opacity: canComplete ? 1 : 0.8
          }}
        >{btnLabel}</button>
      </div>
    </div>
  );
}
