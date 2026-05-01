import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api/index.js';
import ProgressBar from '../components/ProgressBar';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ── YouTube duration helpers ───────────────────────────
const YT_API_KEY = 'AIzaSyCajnB6iYCaRfturMVKGzgs6vgz9cVrzlk';

const extractYouTubeId = (url = '') => {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
  return m?.[1] ?? null;
};

const parseISO8601Duration = (iso = '') => {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return '';
  const h = Number(m[1] || 0);
  const min = Number(m[2] || 0);
  const s = Number(m[3] || 0);
  const parts = [];
  if (h) parts.push(`${h}h`);
  if (min) parts.push(`${min}min`);
  if (s) parts.push(`${s}s`);
  return parts.join(' ') || '0s';
};

const fetchYouTubeDuration = async (url) => {
  const id = extractYouTubeId(url);
  if (!id) return null;
  const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${id}&key=${YT_API_KEY}`);
  if (!res.ok) return null;
  const data = await res.json();
  const iso = data.items?.[0]?.contentDetails?.duration;
  return iso ? parseISO8601Duration(iso) : null;
};

// ── helpers de UI ──────────────────────────────────────
const CARGOS = [
  'Churrasqueiro / Grillman',
  'Montador de lanche',
  'Cozinheiro',
  'Entregador',
  'Atendente / Caixa',
  'Coordenador de Turno',
  'Supervisor / Gerente',
];

const Card = ({ children, style = {} }) => (
  <div style={{ background: '#161616', border: '1px solid #1E1E1E', borderRadius: 12, padding: '18px 22px', ...style }}>
    {children}
  </div>
);

const Label = ({ children }) => (
  <div style={{ fontSize: 9, fontWeight: 800, color: '#2E2E2E', letterSpacing: 2.5, fontFamily: 'Barlow Condensed, sans-serif', marginBottom: 8 }}>
    {children}
  </div>
);

const Input = ({ label, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
    {label && <span style={{ fontSize: 11, color: '#555', fontWeight: 600 }}>{label}</span>}
    <input
      {...props}
      style={{
        padding: '10px 14px', background: '#0D0D0D', border: '1px solid #2A2A2A',
        borderRadius: 8, color: '#F0F0F0', fontFamily: 'Barlow, sans-serif',
        fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box',
        ...props.style,
      }}
    />
  </div>
);

const Select = ({ label, children, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
    {label && <span style={{ fontSize: 11, color: '#555', fontWeight: 600 }}>{label}</span>}
    <select
      {...props}
      style={{
        padding: '10px 14px', background: '#0D0D0D', border: '1px solid #2A2A2A',
        borderRadius: 8, color: '#F0F0F0', fontFamily: 'Barlow, sans-serif',
        fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box',
        appearance: 'none', cursor: 'pointer',
        ...props.style,
      }}
    >
      {children}
    </select>
  </div>
);

const Btn = ({ children, variant = 'primary', loading, ...props }) => {
  const colors = {
    primary: { bg: '#F9A800', color: '#000', border: 'none' },
    ghost:   { bg: '#1A1A1A', color: '#888', border: '1px solid #2A2A2A' },
    danger:  { bg: '#E05A2B22', color: '#E05A2B', border: '1px solid #E05A2B44' },
  }[variant] || {};
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      style={{
        padding: '10px 18px', borderRadius: 8, cursor: loading || props.disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 900,
        letterSpacing: 0.5, opacity: loading || props.disabled ? 0.6 : 1,
        transition: 'opacity .15s', ...colors, ...props.style,
      }}
    >
      {loading ? 'AGUARDE...' : children}
    </button>
  );
};

const Toast = ({ msg, ok }) => {
  if (!msg) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: ok ? '#22A06B22' : '#E05A2B22',
      border: `1px solid ${ok ? '#22A06B66' : '#E05A2B66'}`,
      color: ok ? '#22A06B' : '#E05A2B',
      borderRadius: 10, padding: '12px 20px',
      fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15, fontWeight: 700,
      boxShadow: '0 4px 20px rgba(0,0,0,.4)',
    }}>
      {ok ? '✓ ' : '✕ '}{msg}
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// SEÇÃO: Visão Geral
// ═══════════════════════════════════════════════════════
function SecaoVisaoGeral() {
  const [usuarios, setUsuarios] = useState([]);
  const [trilhas, setTrilhas] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [totalAulas, setTotalAulas] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.getUsuarios(),
      api.getTrilhas(),
      api.getModulos(),
    ]).then(async ([resUsuarios, resTrilhas, resModulos]) => {
      if (resUsuarios.status === 'fulfilled') {
        const lista = Array.isArray(resUsuarios.value) ? resUsuarios.value : [];
        setUsuarios([...lista].sort((a, b) => (b.xp || 0) - (a.xp || 0)));
      }
      if (resTrilhas.status === 'fulfilled') {
        setTrilhas(Array.isArray(resTrilhas.value) ? resTrilhas.value : []);
      }
      if (resModulos.status === 'fulfilled') {
        const mods = Array.isArray(resModulos.value) ? resModulos.value : [];
        setModulos(mods);
        if (mods.length > 0) {
          const secoesResults = await Promise.allSettled(mods.map(m => api.getSecoes(m.id)));
          const total = secoesResults.reduce((sum, r) => {
            if (r.status !== 'fulfilled') return sum;
            return sum + (r.value || []).reduce((s, sec) => s + (sec.aulas?.length || 0), 0);
          }, 0);
          setTotalAulas(total);
        }
      }
    }).finally(() => setLoading(false));
  }, []);

  const dash = loading ? '—' : undefined;

  return (
    <>
      <div className="grid-4" style={{ marginBottom: 26 }}>
        {[
          ['Colaboradores', dash ?? usuarios.length, '#F9A800'],
          ['Trilhas',        dash ?? trilhas.length,  '#22A06B'],
          ['Módulos',        dash ?? modulos.length,  '#8B7FE8'],
          ['Aulas',          dash ?? totalAulas,       '#E05A2B'],
        ].map(([label, val, color]) => (
          <Card key={label}>
            <Label>{label.toUpperCase()}</Label>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 34, fontWeight: 900, color }}>{val}</div>
          </Card>
        ))}
      </div>

      {!loading && trilhas.length > 0 && (
        <>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 17, fontWeight: 800, color: '#E0E0E0', marginBottom: 12 }}>
            Trilhas de Treinamento
          </div>
          <div className="grid-2" style={{ marginBottom: 26 }}>
            {trilhas.map(t => {
              const qtdMods = modulos.filter(m => m.trilhaId === t.id).length || t.modulos?.length || 0;
              return (
                <div key={t.id} style={{ background: '#161616', border: '1px solid #F9A80022', borderRadius: 12, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{t.icone}</span>
                  <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 800, color: '#E0E0E0', flex: 1 }}>{t.nome}</span>
                  <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 800, color: '#F9A80088', flexShrink: 0 }}>
                    {qtdMods} módulo{qtdMods !== 1 ? 's' : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 17, fontWeight: 800, color: '#E0E0E0', marginBottom: 12 }}>
        Colaboradores Mais Ativos
      </div>
      <div className="manager-table-wrap">
        <div style={{ background: '#161616', border: '1px solid #1E1E1E', borderRadius: 12, overflow: 'hidden', minWidth: 480 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', padding: '10px 18px', background: '#0A0A0A', fontSize: 9, fontWeight: 800, color: '#2E2E2E', letterSpacing: 2.5, fontFamily: 'Barlow Condensed, sans-serif' }}>
            <span>COLABORADOR</span><span>CARGO</span><span>XP</span>
          </div>
          {loading ? (
            <div style={{ padding: '24px 18px', color: '#444', fontSize: 13 }}>Carregando...</div>
          ) : usuarios.length === 0 ? (
            <div style={{ padding: '32px 18px', color: '#333', fontSize: 13, textAlign: 'center' }}>
              Nenhum colaborador cadastrado ainda.
            </div>
          ) : (
            usuarios.map((u, idx) => {
              const av = (u.nome || '?').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase();
              const destaque = idx < 3;
              return (
                <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', padding: '14px 18px', borderTop: '1px solid #141414', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                      background: destaque ? '#F9A80022' : '#1A1A1A',
                      border: `2px solid ${destaque ? '#F9A80055' : '#2A2A2A'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 11,
                      color: destaque ? '#F9A800' : '#555',
                    }}>{av}</div>
                    <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 700, color: '#DDD' }}>{u.nome}</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#555' }}>{u.cargo}</span>
                  <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, color: '#F9A800', fontSize: 16 }}>{u.xp || 0}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════
// SEÇÃO: Trilhas
// ═══════════════════════════════════════════════════════

const EMOJIS = ['🍔','🔥','🍕','🥗','🛵','⭐','📋','🎯','🏆','💡','🧑‍🍳','🥩','🧀','🍟','📱','💼','🤝','✅','🎓','📚'];

function EmojiPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: 44, height: 44, borderRadius: 8, border: `1px solid ${open ? '#F9A80066' : '#2A2A2A'}`,
          background: open ? '#F9A80015' : '#0D0D0D', cursor: 'pointer',
          fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all .15s',
        }}
        title="Escolher emoji"
      >{value}</button>

      {open && (
        <>
          {/* overlay para fechar ao clicar fora */}
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 98 }} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 99,
            background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10,
            padding: 10, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4,
            boxShadow: '0 8px 24px rgba(0,0,0,.5)',
          }}>
            {EMOJIS.map(e => (
              <button
                key={e}
                type="button"
                onClick={() => { onChange(e); setOpen(false); }}
                style={{
                  width: 36, height: 36, borderRadius: 6, border: 'none',
                  background: value === e ? '#F9A80022' : 'transparent',
                  cursor: 'pointer', fontSize: 20,
                  outline: value === e ? '1px solid #F9A80066' : 'none',
                  transition: 'background .1s',
                }}
                onMouseEnter={e2 => e2.currentTarget.style.background = '#F9A80015'}
                onMouseLeave={e2 => e2.currentTarget.style.background = value === e ? '#F9A80022' : 'transparent'}
              >{e}</button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SecaoTrilhas({ toast }) {
  const [trilhas, setTrilhas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [icone, setIcone] = useState('📚');
  const [saving, setSaving] = useState(false);
  const [excluindo, setExcluindo] = useState(null);
  const [editando, setEditando] = useState(null);
  const [editNome, setEditNome] = useState('');
  const [editDescricao, setEditDescricao] = useState('');
  const [editIcone, setEditIcone] = useState('📚');
  const [salvandoEdit, setSalvandoEdit] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);
  const [expandido, setExpandido] = useState({});
  const [modulosPorTrilha, setModulosPorTrilha] = useState({});
  const [loadingModulos, setLoadingModulos] = useState({});

  const toggleExpandido = async (trilhaId) => {
    console.log('[toggleExpandido] chamado com trilhaId:', trilhaId);
    const jaAberto = expandido[trilhaId];
    setExpandido(prev => ({ ...prev, [trilhaId]: !jaAberto }));
    if (!jaAberto && !modulosPorTrilha[trilhaId]) {
      setLoadingModulos(prev => ({ ...prev, [trilhaId]: true }));
      try {
        console.log('[toggleExpandido] fazendo GET /modulos?trilhaId=' + trilhaId);
        const data = await api.getModulos(trilhaId);
        console.log('[toggleExpandido] resposta da API:', data);
        setModulosPorTrilha(prev => ({ ...prev, [trilhaId]: Array.isArray(data) ? data : [] }));
      } catch (e) {
        console.error('[toggleExpandido] erro na requisição:', e);
        setModulosPorTrilha(prev => ({ ...prev, [trilhaId]: [] }));
      } finally {
        setLoadingModulos(prev => ({ ...prev, [trilhaId]: false }));
      }
    } else {
      console.log('[toggleExpandido] toggle sem fetch — jaAberto:', jaAberto, '| cache:', modulosPorTrilha[trilhaId]);
    }
  };

  const handleDragStart = (index) => { dragItem.current = index; };
  const handleDragEnter = (index) => { dragOverItem.current = index; setDragOverIndex(index); };
  const handleDragEnd = () => {
    const from = dragItem.current;
    const to = dragOverItem.current;
    dragItem.current = null;
    dragOverItem.current = null;
    setDragOverIndex(null);
    if (from === null || to === null || from === to) return;
    const reordenadas = [...trilhas];
    const [moved] = reordenadas.splice(from, 1);
    reordenadas.splice(to, 0, moved);
    setTrilhas(reordenadas);
    reordenadas.forEach((t, i) => api.reordenarTrilha(t.id, i).catch(() => {}));
  };

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getTrilhas();
      setTrilhas(Array.isArray(data) ? data : []);
    } catch (e) {
      toast(e.message || 'Erro ao carregar trilhas', false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const handleCriar = async () => {
    if (!nome.trim()) { toast('Nome é obrigatório', false); return; }
    setSaving(true);
    try {
      await api.criarTrilha(nome.trim(), descricao.trim(), icone);
      toast('Trilha criada com sucesso!', true);
      setNome(''); setDescricao(''); setIcone('📚');
      carregar();
    } catch (e) {
      toast(e.message || 'Erro ao criar trilha', false);
    } finally {
      setSaving(false);
    }
  };

  const abrirEdicao = (t) => {
    setEditando(t.id);
    setEditNome(t.nome);
    setEditDescricao(t.descricao || '');
    setEditIcone(t.icone || '📚');
  };

  const cancelarEdicao = () => {
    setEditando(null);
    setEditNome('');
    setEditDescricao('');
    setEditIcone('📚');
  };

  const handleSalvarEdicao = async () => {
    if (!editNome.trim()) { toast('Nome é obrigatório', false); return; }
    setSalvandoEdit(true);
    try {
      await api.atualizarTrilha(editando, editNome.trim(), editDescricao.trim(), editIcone);
      toast('Trilha atualizada com sucesso!', true);
      setTrilhas(prev => prev.map(t =>
        t.id === editando ? { ...t, nome: editNome.trim(), descricao: editDescricao.trim(), icone: editIcone } : t
      ));
      cancelarEdicao();
    } catch (e) {
      toast(e.message || 'Erro ao atualizar trilha', false);
    } finally {
      setSalvandoEdit(false);
    }
  };

  const handleExcluir = async (t) => {
    if (!window.confirm(`Excluir a trilha "${t.nome}"?\nOs módulos associados perderão o vínculo com esta trilha.`)) return;
    setExcluindo(t.id);
    try {
      await api.excluirTrilha(t.id);
      toast(`"${t.nome}" excluída`, true);
      setTrilhas(prev => prev.filter(x => x.id !== t.id));
      if (editando === t.id) cancelarEdicao();
    } catch (e) {
      toast(e.message || 'Erro ao excluir trilha', false);
    } finally {
      setExcluindo(null);
    }
  };

  return (
    <div className="grid-2">
      {/* Formulário de criação */}
      <Card>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, fontWeight: 800, color: '#F0F0F0', marginBottom: 18 }}>
          Criar Nova Trilha
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ fontSize: 11, color: '#555', fontWeight: 600 }}>Nome *</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <EmojiPicker value={icone} onChange={setIcone} />
              <input
                value={nome}
                onChange={e => setNome(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCriar()}
                placeholder="Ex: Cozinha, Atendimento..."
                style={{ flex: 1, padding: '10px 14px', background: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: 8, color: '#F0F0F0', fontFamily: 'Barlow, sans-serif', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ fontSize: 11, color: '#555', fontWeight: 600 }}>Descrição</span>
            <textarea
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              placeholder="Descreva o foco desta trilha..."
              rows={3}
              style={{ padding: '10px 14px', background: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: 8, color: '#F0F0F0', fontFamily: 'Barlow, sans-serif', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.6 }}
            />
          </div>
          <Btn onClick={handleCriar} loading={saving} style={{ alignSelf: 'flex-start' }}>+ CRIAR TRILHA</Btn>
        </div>
      </Card>

      {/* Lista */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, fontWeight: 800, color: '#F0F0F0' }}>Trilhas Cadastradas</div>
          <Btn variant="ghost" onClick={carregar} style={{ fontSize: 12, padding: '6px 12px' }}>↻ ATUALIZAR</Btn>
        </div>

        {loading ? (
          <div style={{ color: '#3A3A3A', fontSize: 13, padding: '20px 0' }}>Carregando...</div>
        ) : trilhas.length === 0 ? (
          <div style={{ background: '#161616', border: '1px solid #1E1E1E', borderRadius: 12, padding: '32px', textAlign: 'center', color: '#333', fontSize: 13 }}>
            Nenhuma trilha cadastrada ainda.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {trilhas.map((t, index) => {
              const isExcluindo = excluindo === t.id;
              const isEditando = editando === t.id;
              const isDragOver = dragOverIndex === index;
              return (
                <div
                  key={t.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragEnter={() => handleDragEnter(index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={e => e.preventDefault()}
                  style={{
                    background: '#161616',
                    border: `1px solid ${isDragOver ? '#F9A80088' : isEditando ? '#F9A80055' : '#1E1E1E'}`,
                    borderRadius: 10, overflow: 'hidden',
                    transition: 'border-color .15s',
                    userSelect: 'none',
                  }}
                >
                  {/* Linha principal */}
                  <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    {/* Handle de drag */}
                    <div
                      title="Arrastar para reordenar"
                      style={{ color: '#2A2A2A', fontSize: 20, cursor: 'grab', flexShrink: 0, lineHeight: 1 }}
                      onClick={e => e.stopPropagation()}
                      onMouseEnter={e => e.currentTarget.style.color = '#F9A80066'}
                      onMouseLeave={e => e.currentTarget.style.color = '#2A2A2A'}
                    >⠿</div>
                    {/* Área clicável — expande/recolhe módulos */}
                    <div
                      style={{ fontSize: 26, flexShrink: 0, cursor: 'pointer' }}
                      onClick={() => toggleExpandido(t.id)}
                    >{t.icone}</div>
                    <div
                      style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                      onClick={() => toggleExpandido(t.id)}
                    >
                      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 800, color: '#E0E0E0', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {t.nome}
                        <span style={{ fontSize: 11, display: 'inline-block', transition: 'transform .2s', transform: expandido[t.id] ? 'rotate(180deg)' : 'none', color: expandido[t.id] ? '#F9A800' : '#333' }}>▾</span>
                      </div>
                      {t.descricao && <div style={{ fontSize: 12, color: '#444', marginTop: 2 }}>{t.descricao}</div>}
                      <div style={{ fontSize: 10, color: '#2A2A2A', marginTop: 4 }}>
                        {t._count?.modulos ?? 0} módulo{(t._count?.modulos ?? 0) !== 1 ? 's' : ''} · Criada em {new Date(t.criadoEm).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    {/* Botão Editar */}
                    <button
                      onClick={(e) => { e.stopPropagation(); isEditando ? cancelarEdicao() : abrirEdicao(t); }}
                      onMouseDown={(e) => e.stopPropagation()}
                      style={{
                        background: isEditando ? '#F9A80020' : '#1A1A1A',
                        border: `1px solid ${isEditando ? '#F9A80066' : '#2A2A2A'}`,
                        borderRadius: 7, color: isEditando ? '#F9A800' : '#888',
                        cursor: 'pointer', padding: '6px 12px',
                        fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, fontWeight: 700,
                        flexShrink: 0, transition: 'all .15s',
                      }}
                      onMouseEnter={e => { if (!isEditando) { e.currentTarget.style.borderColor = '#F9A80044'; e.currentTarget.style.color = '#F9A800'; } }}
                      onMouseLeave={e => { if (!isEditando) { e.currentTarget.style.borderColor = '#2A2A2A'; e.currentTarget.style.color = '#888'; } }}
                    >{isEditando ? 'CANCELAR' : '✎ EDITAR'}</button>
                    {/* Botão Excluir */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleExcluir(t); }}
                      onMouseDown={(e) => e.stopPropagation()}
                      disabled={isExcluindo}
                      style={{ background: '#E05A2B11', border: '1px solid #E05A2B44', borderRadius: 7, color: isExcluindo ? '#555' : '#E05A2B', cursor: isExcluindo ? 'not-allowed' : 'pointer', padding: '6px 12px', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, fontWeight: 700, flexShrink: 0, opacity: isExcluindo ? 0.5 : 1, transition: 'all .15s' }}
                      onMouseEnter={e => { if (!isExcluindo) e.currentTarget.style.background = '#E05A2B22'; }}
                      onMouseLeave={e => e.currentTarget.style.background = '#E05A2B11'}
                    >{isExcluindo ? '...' : 'EXCLUIR'}</button>
                  </div>

                  {/* Painel de módulos */}
                  {expandido[t.id] && (
                    <div style={{ padding: '0 18px 14px', borderTop: '1px solid #1A1A1A' }}>
                      {loadingModulos[t.id] ? (
                        <div style={{ fontSize: 12, color: '#3A3A3A', padding: '10px 0' }}>Carregando módulos...</div>
                      ) : (modulosPorTrilha[t.id] || []).length === 0 ? (
                        <div style={{ fontSize: 12, color: '#2A2A2A', padding: '10px 0' }}>Nenhum módulo associado a esta trilha.</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 12 }}>
                          {(modulosPorTrilha[t.id] || []).map(m => (
                            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#0D0D0D', borderRadius: 7, padding: '9px 12px' }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 700, color: '#CCC' }}>{m.titulo}</div>
                                {m.descricao && <div style={{ fontSize: 11, color: '#3A3A3A', marginTop: 1 }}>{m.descricao}</div>}
                              </div>
                              <span style={{
                                flexShrink: 0, fontSize: 10, fontWeight: 800,
                                fontFamily: 'Barlow Condensed, sans-serif',
                                padding: '2px 8px', borderRadius: 10,
                                background: m.ativo !== false ? '#22A06B22' : '#E05A2B22',
                                color: m.ativo !== false ? '#22A06B' : '#E05A2B',
                                border: `1px solid ${m.ativo !== false ? '#22A06B44' : '#E05A2B44'}`,
                              }}>
                                {m.ativo !== false ? 'ATIVO' : 'INATIVO'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Formulário de edição inline */}
                  {isEditando && (
                    <div style={{ padding: '0 18px 16px', borderTop: '1px solid #F9A80022' }}>
                      <div style={{ paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                          <span style={{ fontSize: 11, color: '#555', fontWeight: 600 }}>Nome *</span>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <EmojiPicker value={editIcone} onChange={setEditIcone} />
                            <input
                              value={editNome}
                              onChange={e => setEditNome(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleSalvarEdicao()}
                              style={{ flex: 1, padding: '10px 14px', background: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: 8, color: '#F0F0F0', fontFamily: 'Barlow, sans-serif', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                            />
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                          <span style={{ fontSize: 11, color: '#555', fontWeight: 600 }}>Descrição</span>
                          <textarea
                            value={editDescricao}
                            onChange={e => setEditDescricao(e.target.value)}
                            rows={2}
                            style={{ padding: '10px 14px', background: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: 8, color: '#F0F0F0', fontFamily: 'Barlow, sans-serif', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.6 }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Btn onClick={handleSalvarEdicao} loading={salvandoEdit}>SALVAR</Btn>
                          <Btn variant="ghost" onClick={cancelarEdicao}>CANCELAR</Btn>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// SEÇÃO: Módulos
// ═══════════════════════════════════════════════════════
function SecaoModulos({ toast }) {
  const [modulos, setModulos] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [trilhaId, setTrilhaId] = useState('');
  const [trilhas, setTrilhas] = useState([]);
  const [saving, setSaving] = useState(false);
  const [moduloAtivo, setModuloAtivo] = useState(null);
  const [xpBonus, setXpBonus] = useState(50);
  const [moduloEditando, setModuloEditando] = useState(null);
  const [editTitulo, setEditTitulo] = useState('');
  const [editDescricao, setEditDescricao] = useState('');
  const [editTrilhaId, setEditTrilhaId] = useState('');
  const [editXpBonus, setEditXpBonus] = useState(50);
  const [salvandoEdit, setSalvandoEdit] = useState(false);

  const carregar = useCallback(async () => {
    setLoadingList(true);
    try {
      const [mods, trls] = await Promise.all([api.getModulos(), api.getTrilhas()]);
      setModulos(Array.isArray(mods) ? mods : []);
      setTrilhas(Array.isArray(trls) ? trls : []);
    } catch (e) {
      toast(e.message || 'Erro ao carregar módulos', false);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const handleCriar = async () => {
    if (!titulo.trim()) { toast('Título é obrigatório', false); return; }
    setSaving(true);
    try {
      await api.criarModulo(titulo.trim(), descricao.trim(), trilhaId ? Number(trilhaId) : null, Number(xpBonus) || 50);
      toast('Módulo criado com sucesso!', true);
      setTitulo(''); setDescricao(''); setTrilhaId(''); setXpBonus(50);
      carregar();
    } catch (e) {
      toast(e.message || 'Erro ao criar módulo', false);
    } finally {
      setSaving(false);
    }
  };

  const abrirModalEdicao = (m) => {
    setModuloEditando(m);
    setEditTitulo(m.titulo);
    setEditDescricao(m.descricao || '');
    setEditTrilhaId(m.trilhaId ? String(m.trilhaId) : '');
    setEditXpBonus(m.xpBonus ?? 50);
  };

  const fecharModal = () => setModuloEditando(null);

  const handleSalvarEdicaoModulo = async () => {
    if (!editTitulo.trim()) { toast('Título é obrigatório', false); return; }
    setSalvandoEdit(true);
    try {
      await api.atualizarModulo(moduloEditando.id, editTitulo.trim(), editDescricao.trim(), editTrilhaId ? Number(editTrilhaId) : null, Number(editXpBonus) || 50);
      toast('Módulo atualizado com sucesso!', true);
      fecharModal();
      carregar();
    } catch (e) {
      toast(e.message || 'Erro ao atualizar módulo', false);
    } finally {
      setSalvandoEdit(false);
    }
  };

  if (moduloAtivo) {
    return <ModuloEditor modulo={moduloAtivo} onVoltar={() => setModuloAtivo(null)} toast={toast} />;
  }

  return (
    <div className="grid-2">
      {/* Formulário de criação */}
      <Card>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, fontWeight: 800, color: '#F0F0F0', marginBottom: 18 }}>
          Criar Novo Módulo
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input
            label="Título *"
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            placeholder="Ex: Higiene e Manipulação de Alimentos"
            onKeyDown={e => e.key === 'Enter' && handleCriar()}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ fontSize: 11, color: '#555', fontWeight: 600 }}>Descrição</span>
            <textarea
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              placeholder="Descreva o conteúdo do módulo..."
              rows={4}
              style={{
                padding: '10px 14px', background: '#0D0D0D', border: '1px solid #2A2A2A',
                borderRadius: 8, color: '#F0F0F0', fontFamily: 'Barlow, sans-serif',
                fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box',
                resize: 'vertical', lineHeight: 1.6,
              }}
            />
          </div>
          <Select label="Trilha (opcional)" value={trilhaId} onChange={e => setTrilhaId(e.target.value)}>
            <option value="">— Sem trilha —</option>
            {trilhas.map(t => (
              <option key={t.id} value={t.id}>{t.icone} {t.nome}</option>
            ))}
          </Select>
          <Input
            label="XP do módulo (bônus ao completar todas as aulas)"
            type="number"
            value={xpBonus}
            onChange={e => setXpBonus(e.target.value)}
            placeholder="50"
            style={{ width: 120 }}
          />
          <Btn onClick={handleCriar} loading={saving} style={{ alignSelf: 'flex-start' }}>
            + CRIAR MÓDULO
          </Btn>
        </div>
      </Card>

      {/* Lista de módulos */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, fontWeight: 800, color: '#F0F0F0' }}>
            Módulos Cadastrados
          </div>
          <Btn variant="ghost" onClick={carregar} style={{ fontSize: 12, padding: '6px 12px' }}>
            ↻ ATUALIZAR
          </Btn>
        </div>

        {loadingList ? (
          <div style={{ color: '#3A3A3A', fontSize: 13, padding: '20px 0' }}>Carregando...</div>
        ) : modulos.length === 0 ? (
          <div style={{ background: '#161616', border: '1px solid #1E1E1E', borderRadius: 12, padding: '32px', textAlign: 'center', color: '#333', fontSize: 13 }}>
            Nenhum módulo cadastrado ainda.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {modulos.map(m => (
              <div key={m.id} style={{ background: '#161616', border: '1px solid #1E1E1E', borderRadius: 10, padding: '14px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 800, color: '#E0E0E0', marginBottom: 3 }}>{m.titulo}</div>
                    {m.descricao && (
                      <div style={{ fontSize: 12, color: '#444', lineHeight: 1.5 }}>{m.descricao}</div>
                    )}
                    {m.trilhaId && trilhas.length > 0 && (() => {
                      const t = trilhas.find(t => t.id === m.trilhaId);
                      return t ? <div style={{ fontSize: 11, color: '#F9A80088', marginTop: 3 }}>{t.icone} {t.nome}</div> : null;
                    })()}
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    <span style={{
                      background: m.ativo !== false ? '#22A06B22' : '#E05A2B22',
                      color: m.ativo !== false ? '#22A06B' : '#E05A2B',
                      border: `1px solid ${m.ativo !== false ? '#22A06B44' : '#E05A2B44'}`,
                      borderRadius: 20, padding: '2px 10px', fontSize: 10, fontWeight: 800,
                      fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: 1,
                    }}>
                      {m.ativo !== false ? 'ATIVO' : 'INATIVO'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, gap: 8 }}>
                  {m.criadoEm && (
                    <div style={{ fontSize: 10, color: '#2A2A2A' }}>
                      Criado em {new Date(m.criadoEm).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                    <button
                      onClick={() => abrirModalEdicao(m)}
                      style={{
                        padding: '5px 12px', borderRadius: 6,
                        border: '1px solid #FFC10733', background: '#FFC10710',
                        color: '#FFC107', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif',
                        fontSize: 12, fontWeight: 800, letterSpacing: 0.5, transition: 'all .15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#FFC10722'; e.currentTarget.style.borderColor = '#FFC10766'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#FFC10710'; e.currentTarget.style.borderColor = '#FFC10733'; }}
                    >
                      ✏️ EDITAR
                    </button>
                    <button
                      onClick={() => setModuloAtivo(m)}
                      style={{
                        padding: '5px 14px', borderRadius: 6,
                        border: '1px solid #F9A80033', background: '#F9A80010',
                        color: '#F9A800', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif',
                        fontSize: 12, fontWeight: 800, letterSpacing: 0.5, transition: 'all .15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#F9A80022'; e.currentTarget.style.borderColor = '#F9A80066'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#F9A80010'; e.currentTarget.style.borderColor = '#F9A80033'; }}
                    >
                      ✎ EDITAR CONTEÚDO
                    </button>
                    <Btn
                      variant="danger"
                      style={{ fontSize: 12, padding: '5px 12px' }}
                      onClick={async () => {
                        if (!window.confirm(`Excluir o módulo "${m.titulo}"? Esta ação também remove todas as seções e aulas vinculadas.`)) return;
                        try {
                          await api.excluirModulo(m.id);
                          toast(`Módulo "${m.titulo}" excluído`, true);
                          carregar();
                        } catch (e) {
                          toast(e.message || 'Erro ao excluir módulo', false);
                        }
                      }}
                    >
                      🗑 EXCLUIR
                    </Btn>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal de edição de módulo ── */}
      {moduloEditando && (
        <div
          onClick={fecharModal}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#111', border: '1px solid #FFC10733',
              borderRadius: 14, padding: '28px 32px', width: '100%', maxWidth: 480,
              boxShadow: '0 24px 80px rgba(0,0,0,.8)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 20, fontWeight: 900, color: '#FFC107', letterSpacing: 1 }}>
                EDITAR MÓDULO
              </div>
              <button
                onClick={fecharModal}
                style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 4, transition: 'color .15s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#FFC107'}
                onMouseLeave={e => e.currentTarget.style.color = '#444'}
              >✕</button>
            </div>

            {/* Campos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#FFC107', letterSpacing: 1.5, fontFamily: 'Barlow Condensed, sans-serif' }}>TÍTULO *</span>
                <input
                  value={editTitulo}
                  onChange={e => setEditTitulo(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSalvarEdicaoModulo()}
                  autoFocus
                  style={{ padding: '11px 14px', background: '#0D0D0D', border: '1px solid #FFC10733', borderRadius: 8, color: '#F0F0F0', fontFamily: 'Barlow, sans-serif', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#555', letterSpacing: 1.5, fontFamily: 'Barlow Condensed, sans-serif' }}>DESCRIÇÃO</span>
                <textarea
                  value={editDescricao}
                  onChange={e => setEditDescricao(e.target.value)}
                  rows={3}
                  placeholder="Descreva o conteúdo do módulo..."
                  style={{ padding: '10px 14px', background: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: 8, color: '#F0F0F0', fontFamily: 'Barlow, sans-serif', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.6 }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#555', letterSpacing: 1.5, fontFamily: 'Barlow Condensed, sans-serif' }}>TRILHA</span>
                <select
                  value={editTrilhaId}
                  onChange={e => setEditTrilhaId(e.target.value)}
                  style={{ padding: '11px 14px', background: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: 8, color: editTrilhaId ? '#F0F0F0' : '#555', fontFamily: 'Barlow, sans-serif', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box', cursor: 'pointer' }}
                >
                  <option value="">— Sem trilha —</option>
                  {trilhas.map(t => (
                    <option key={t.id} value={t.id}>{t.icone} {t.nome}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#555', letterSpacing: 1.5, fontFamily: 'Barlow Condensed, sans-serif' }}>XP DO MÓDULO (bônus ao completar)</span>
                <input
                  type="number"
                  value={editXpBonus}
                  onChange={e => setEditXpBonus(e.target.value)}
                  placeholder="50"
                  style={{ padding: '11px 14px', background: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: 8, color: '#F0F0F0', fontFamily: 'Barlow, sans-serif', fontSize: 14, outline: 'none', width: 120, boxSizing: 'border-box' }}
                />
              </div>

              {/* Botões */}
              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <button
                  onClick={handleSalvarEdicaoModulo}
                  disabled={salvandoEdit}
                  style={{
                    flex: 1, padding: '12px', background: salvandoEdit ? '#555' : '#FFC107',
                    border: 'none', borderRadius: 8, color: '#000',
                    fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15, fontWeight: 900,
                    cursor: salvandoEdit ? 'not-allowed' : 'pointer', letterSpacing: 0.5,
                    transition: 'background .15s',
                  }}
                  onMouseEnter={e => { if (!salvandoEdit) e.currentTarget.style.background = '#FFD54F'; }}
                  onMouseLeave={e => { if (!salvandoEdit) e.currentTarget.style.background = '#FFC107'; }}
                >
                  {salvandoEdit ? 'SALVANDO...' : 'SALVAR'}
                </button>
                <button
                  onClick={fecharModal}
                  style={{ padding: '12px 20px', background: 'transparent', border: '1px solid #2A2A2A', borderRadius: 8, color: '#666', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#444'; e.currentTarget.style.color = '#999'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#2A2A2A'; e.currentTarget.style.color = '#666'; }}
                >
                  CANCELAR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// EDITOR DE MÓDULO — AulaForm, AulaRow, SecaoCard, ModuloEditor
// ═══════════════════════════════════════════════════════

function AulaForm({ secaoId, onSaved, onCancel, toast }) {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [duracao, setDuracao] = useState('');
  const [ordem, setOrdem] = useState(0);
  const [checklistItems, setChecklistItems] = useState([]);
  const [novoItem, setNovoItem] = useState('');
  const [saving, setSaving] = useState(false);
  const [xp, setXp] = useState(10);
  const [fetchingDuracao, setFetchingDuracao] = useState(false);
  const [apostilaTipo, setApostilaTipo] = useState('url');
  const [apostilaUrl, setApostilaUrl] = useState('');
  const [apostilaFile, setApostilaFile] = useState(null);

  const handleVideoUrlBlur = async (url) => {
    if (!extractYouTubeId(url)) return;
    setFetchingDuracao(true);
    try {
      const dur = await fetchYouTubeDuration(url);
      if (dur) setDuracao(dur);
    } finally {
      setFetchingDuracao(false);
    }
  };

  const addItem = () => {
    if (!novoItem.trim()) return;
    setChecklistItems(p => [...p, novoItem.trim()]);
    setNovoItem('');
  };

  const handleSave = async () => {
    if (!titulo.trim()) { toast('Título da aula é obrigatório', false); return; }
    setSaving(true);
    try {
      const resp = await api.criarAula({
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        videoUrl: videoUrl.trim() || null,
        duracao: duracao.trim() || null,
        ordem: Number(ordem) || 0,
        secaoId,
        checklist: checklistItems.length ? JSON.stringify(checklistItems) : null,
        apostilaUrl: apostilaTipo === 'url' ? apostilaUrl.trim() || null : null,
        xp: Number(xp) || 10,
      });
      if (apostilaTipo === 'upload' && apostilaFile && resp.aula?.id) {
        await api.uploadApostila(resp.aula.id, apostilaFile);
      }
      toast('Aula criada com sucesso!', true);
      onSaved();
    } catch (e) {
      toast(e.message || 'Erro ao criar aula', false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: '#0D0D0D', border: '1px solid #F9A80033', borderRadius: 10, padding: '16px 18px', marginTop: 10 }}>
      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 800, color: '#F9A800', marginBottom: 12 }}>
        Nova Aula
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Input label="Título *" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Introdução ao módulo" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <Input
            label={fetchingDuracao ? 'Duração (buscando...)' : 'Duração'}
            value={duracao}
            onChange={e => setDuracao(e.target.value)}
            placeholder={fetchingDuracao ? '⟳ aguarde...' : 'Ex: 8min'}
            disabled={fetchingDuracao}
          />
          <Input label="Ordem" type="number" value={ordem} onChange={e => setOrdem(e.target.value)} placeholder="0" />
          <Input label="XP da aula" type="number" value={xp} onChange={e => setXp(e.target.value)} placeholder="10" />
        </div>
        <Input
          label="Link do vídeo (YouTube / Vimeo)"
          value={videoUrl}
          onChange={e => setVideoUrl(e.target.value)}
          onBlur={e => handleVideoUrlBlur(e.target.value)}
          placeholder="https://youtube.com/..."
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: 11, color: '#555', fontWeight: 600 }}>Descrição</span>
          <textarea
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            placeholder="Descreva o conteúdo desta aula..."
            rows={3}
            style={{ padding: '10px 14px', background: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: 8, color: '#F0F0F0', fontFamily: 'Barlow, sans-serif', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.6 }}
          />
        </div>

        {/* Checklist */}
        <div>
          <div style={{ fontSize: 11, color: '#555', fontWeight: 600, marginBottom: 6 }}>Checklist da aula</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              value={novoItem}
              onChange={e => setNovoItem(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addItem()}
              placeholder="Ex: Assistir o vídeo completo"
              style={{ flex: 1, padding: '8px 12px', background: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: 7, color: '#F0F0F0', fontFamily: 'Barlow, sans-serif', fontSize: 12, outline: 'none' }}
            />
            <Btn onClick={addItem} style={{ padding: '8px 14px', fontSize: 13 }}>＋</Btn>
          </div>
          {checklistItems.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {checklistItems.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#161616', borderRadius: 6, padding: '6px 10px' }}>
                  <span style={{ color: '#F9A800', fontSize: 12 }}>☐</span>
                  <span style={{ flex: 1, fontSize: 12, color: '#888' }}>{item}</span>
                  <button
                    onClick={() => setChecklistItems(p => p.filter((_, j) => j !== i))}
                    style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 2 }}
                    onMouseEnter={e => e.currentTarget.style.color = '#E05A2B'}
                    onMouseLeave={e => e.currentTarget.style.color = '#444'}
                  >✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Apostila */}
        <div>
          <div style={{ fontSize: 11, color: '#555', fontWeight: 600, marginBottom: 6 }}>Apostila</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            {[['url', '🔗 Link externo'], ['upload', '📁 Upload']].map(([val, lbl]) => (
              <button key={val} onClick={() => setApostilaTipo(val)} style={{ padding: '5px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, background: apostilaTipo === val ? '#F9A80022' : 'transparent', border: `1px solid ${apostilaTipo === val ? '#F9A80055' : '#2A2A2A'}`, color: apostilaTipo === val ? '#F9A800' : '#444' }}>{lbl}</button>
            ))}
          </div>
          {apostilaTipo === 'url' ? (
            <input value={apostilaUrl} onChange={e => setApostilaUrl(e.target.value)} placeholder="https://drive.google.com/... ou link direto para PDF" style={{ padding: '10px 14px', background: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: 8, color: '#F0F0F0', fontFamily: 'Barlow, sans-serif', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }} />
          ) : (
            <div>
              <input type="file" accept=".pdf,.docx,.doc" id="apostila-new" onChange={e => setApostilaFile(e.target.files[0] || null)} style={{ display: 'none' }} />
              <label htmlFor="apostila-new" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 14px', background: '#0D0D0D', border: '1px dashed #2A2A2A', borderRadius: 8, cursor: 'pointer', fontSize: 12, color: apostilaFile ? '#F9A800' : '#555', fontFamily: 'Barlow, sans-serif' }}>
                📎 {apostilaFile ? apostilaFile.name : 'Selecionar PDF ou Word (.docx)...'}
              </label>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <Btn onClick={handleSave} loading={saving}>SALVAR AULA</Btn>
          <Btn variant="ghost" onClick={onCancel}>CANCELAR</Btn>
        </div>
      </div>
    </div>
  );
}

function ChecklistItemRow({ item, aulaId, onSaved, onDelete }) {
  const [editando, setEditando] = useState(false);
  const [textoTemp, setTextoTemp] = useState(item.texto);
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    setSalvando(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/checklists/${aulaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('ga_token')}` },
        body: JSON.stringify({ index: item.idx, texto: textoTemp }),
      });
      const data = await resp.json();
      onSaved(data.checklist);
      setEditando(false);
    } finally {
      setSalvando(false);
    }
  }

  if (editando) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' }}>
        <input
          value={textoTemp}
          onChange={e => setTextoTemp(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && salvar()}
          style={{ flex: 1, background: '#1A1A1A', border: '1px solid #FFC107', color: '#fff', borderRadius: '4px', padding: '4px 8px' }}
          autoFocus
        />
        <button onClick={salvar} disabled={salvando} style={{ background: '#FFC107', color: '#000', border: 'none', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontWeight: 'bold' }}>✓</button>
        <button onClick={() => { setTextoTemp(item.texto); setEditando(false); }} style={{ background: 'transparent', color: '#999', border: '1px solid #444', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer' }}>✗</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #222' }}>
      <span style={{ color: '#ccc', flex: 1 }}>☐ {item.texto}</span>
      <div style={{ display: 'flex', gap: '4px' }}>
        <button onClick={() => setEditando(true)} style={{ background: 'transparent', border: 'none', color: '#FFC107', cursor: 'pointer', fontSize: '16px', padding: '2px 6px' }}>✏️</button>
        <button onClick={() => onDelete(item.idx)} style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '16px', padding: '2px 6px' }}>🗑️</button>
      </div>
    </div>
  );
}

function AulaRow({ aula: aulaInicial, onDeleted, toast, dragHandleListeners = {}, dragHandleAttributes = {}, isDragging = false }) {
  const [aula, setAula] = useState(aulaInicial);
  const [expanded, setExpanded] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [editando, setEditando] = useState(false);
  const [editTitulo, setEditTitulo] = useState('');
  const [editDescricao, setEditDescricao] = useState('');
  const [editVideoUrl, setEditVideoUrl] = useState('');
  const [editDuracao, setEditDuracao] = useState('');
  const [salvandoEdit, setSalvandoEdit] = useState(false);
  const [editXp, setEditXp] = useState(aulaInicial.xp ?? 10);
  const [fetchingEditDuracao, setFetchingEditDuracao] = useState(false);
  const [editApostilaTipo, setEditApostilaTipo] = useState('url');
  const [editApostilaUrl, setEditApostilaUrl] = useState('');
  const [editApostilaFile, setEditApostilaFile] = useState(null);
  const [localChecklist, setLocalChecklist] = useState(() => {
    try { return aulaInicial.checklist ? JSON.parse(aulaInicial.checklist) : []; }
    catch { return []; }
  });

  const handleEditVideoUrlBlur = async (url) => {
    if (!extractYouTubeId(url)) return;
    setFetchingEditDuracao(true);
    try {
      const dur = await fetchYouTubeDuration(url);
      if (dur) setEditDuracao(dur);
    } finally {
      setFetchingEditDuracao(false);
    }
  };

  const abrirEdicao = (e) => {
    e.stopPropagation();
    setEditTitulo(aula.titulo);
    setEditDescricao(aula.descricao || '');
    setEditVideoUrl(aula.videoUrl || '');
    setEditDuracao(aula.duracao || '');
    setEditApostilaUrl(aula.apostilaUrl || '');
    setEditApostilaTipo('url');
    setEditApostilaFile(null);
    setEditXp(aula.xp ?? 10);
    setEditando(true);
    setExpanded(false);
  };

  const cancelarEdicao = () => setEditando(false);

  const handleSalvarEdicao = async () => {
    if (!editTitulo.trim()) { toast('Título é obrigatório', false); return; }
    setSalvandoEdit(true);
    try {
      let apostilaUrl = editApostilaTipo === 'url' ? editApostilaUrl.trim() || null : aula.apostilaUrl;
      if (editApostilaTipo === 'upload' && editApostilaFile) {
        const up = await api.uploadApostila(aula.id, editApostilaFile);
        apostilaUrl = up.apostilaUrl;
      }
      const resp = await api.atualizarAula(aula.id, {
        titulo: editTitulo.trim(),
        descricao: editDescricao.trim() || null,
        videoUrl: editVideoUrl.trim() || null,
        duracao: editDuracao.trim() || null,
        apostilaUrl,
        xp: Number(editXp) || 10,
      });
      setAula(resp.aula ?? { ...aula, titulo: editTitulo.trim(), descricao: editDescricao.trim() || null, videoUrl: editVideoUrl.trim() || null, duracao: editDuracao.trim() || null, apostilaUrl, xp: Number(editXp) || 10 });
      toast('Aula atualizada com sucesso!', true);
      setEditando(false);
    } catch (e) {
      toast(e.message || 'Erro ao atualizar aula', false);
    } finally {
      setSalvandoEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Excluir a aula "${aula.titulo}"?`)) return;
    setExcluindo(true);
    try {
      await api.excluirAula(aula.id);
      toast(`Aula "${aula.titulo}" excluída`, true);
      onDeleted();
    } catch (e) {
      toast(e.message || 'Erro ao excluir aula', false);
      setExcluindo(false);
    }
  };

  return (
    <div style={{ background: '#0A0A0A', border: `1px solid ${isDragging ? '#FFC10766' : editando ? '#FFC10744' : '#1E1E1E'}`, borderRadius: 8, overflow: 'hidden', transition: 'border-color .15s', opacity: isDragging ? 0.5 : 1 }}>
      {/* Linha de cabeçalho */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: editando ? 'default' : 'pointer', userSelect: 'none' }}
        onClick={() => !editando && setExpanded(e => !e)}
      >
        {/* Drag handle */}
        <span
          {...dragHandleListeners}
          {...dragHandleAttributes}
          onClick={e => e.stopPropagation()}
          style={{ color: '#2A2A2A', fontSize: 16, cursor: 'grab', touchAction: 'none', flexShrink: 0, lineHeight: 1, padding: '0 2px', transition: 'color .15s' }}
          onMouseEnter={e => e.currentTarget.style.color = '#FFC107'}
          onMouseLeave={e => e.currentTarget.style.color = '#2A2A2A'}
          title="Arrastar para reordenar"
        >⠿</span>
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, color: '#333', fontSize: 13, minWidth: 20 }}>#{aula.ordem ?? 0}</span>
        <span style={{ flex: 1, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 700, color: editando ? '#FFC107' : '#CCC' }}>{aula.titulo}</span>
        {aula.duracao && !editando && (
          <span style={{ fontSize: 11, color: '#555', background: '#161616', borderRadius: 4, padding: '2px 7px' }}>⏱ {aula.duracao}</span>
        )}
        {!editando && (
          <span style={{ fontSize: 10, color: '#F9A80088', background: '#F9A80011', borderRadius: 4, padding: '2px 7px' }}>⚡{aula.xp ?? 10} XP</span>
        )}
        {aula.videoUrl && !editando && <span style={{ fontSize: 11, color: '#8B7FE8' }}>▶</span>}
        {localChecklist.length > 0 && !editando && (
          <span style={{ fontSize: 10, color: '#F9A80088', background: '#F9A80011', borderRadius: 4, padding: '2px 7px' }}>☐ {localChecklist.length}</span>
        )}
        {!editando && (
          <span style={{ fontSize: 11, color: '#333', display: 'inline-block', transition: 'transform .2s', transform: expanded ? 'rotate(180deg)' : 'none' }}>▾</span>
        )}
        {/* Botão editar */}
        <button
          onClick={editando ? cancelarEdicao : abrirEdicao}
          title={editando ? 'Cancelar edição' : 'Editar aula'}
          style={{
            background: editando ? '#FFC10720' : 'none',
            border: editando ? '1px solid #FFC10744' : 'none',
            borderRadius: 5,
            color: editando ? '#FFC107' : '#444',
            cursor: 'pointer', fontSize: 13, padding: '2px 6px', lineHeight: 1,
            transition: 'all .15s',
          }}
          onMouseEnter={e => { if (!editando) { e.currentTarget.style.color = '#FFC107'; } }}
          onMouseLeave={e => { if (!editando) { e.currentTarget.style.color = '#444'; } }}
        >{editando ? '✕' : '✏️'}</button>
        {/* Botão excluir */}
        <button
          onClick={e => { e.stopPropagation(); handleDelete(); }}
          disabled={excluindo}
          style={{ background: 'none', border: 'none', color: '#333', cursor: excluindo ? 'not-allowed' : 'pointer', fontSize: 13, padding: '2px 4px', lineHeight: 1 }}
          onMouseEnter={e => { if (!excluindo) e.currentTarget.style.color = '#E05A2B'; }}
          onMouseLeave={e => e.currentTarget.style.color = '#333'}
        >{excluindo ? '...' : '🗑'}</button>
      </div>

      {/* Formulário de edição inline */}
      {editando && (
        <div style={{ padding: '0 14px 14px', borderTop: '1px solid #FFC10722' }}>
          <div style={{ paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#FFC107', letterSpacing: 1 }}>TÍTULO *</span>
              <input
                value={editTitulo}
                onChange={e => setEditTitulo(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSalvarEdicao()}
                style={{ padding: '9px 12px', background: '#111', border: '1px solid #FFC10733', borderRadius: 7, color: '#F0F0F0', fontFamily: 'Barlow, sans-serif', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: fetchingEditDuracao ? '#FFC107' : '#555', letterSpacing: 1 }}>
                  {fetchingEditDuracao ? 'DURAÇÃO ⟳' : 'DURAÇÃO'}
                </span>
                <input
                  value={editDuracao}
                  onChange={e => setEditDuracao(e.target.value)}
                  placeholder={fetchingEditDuracao ? 'aguarde...' : 'Ex: 8min'}
                  disabled={fetchingEditDuracao}
                  style={{ padding: '9px 12px', background: '#111', border: '1px solid #2A2A2A', borderRadius: 7, color: '#F0F0F0', fontFamily: 'Barlow, sans-serif', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box', opacity: fetchingEditDuracao ? 0.5 : 1 }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#555', letterSpacing: 1 }}>LINK DO VÍDEO</span>
                <input
                  value={editVideoUrl}
                  onChange={e => setEditVideoUrl(e.target.value)}
                  onBlur={e => handleEditVideoUrlBlur(e.target.value)}
                  placeholder="https://youtube.com/..."
                  style={{ padding: '9px 12px', background: '#111', border: '1px solid #2A2A2A', borderRadius: 7, color: '#F0F0F0', fontFamily: 'Barlow, sans-serif', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#555', letterSpacing: 1 }}>XP</span>
                <input
                  type="number"
                  value={editXp}
                  onChange={e => setEditXp(e.target.value)}
                  placeholder="10"
                  style={{ padding: '9px 12px', background: '#111', border: '1px solid #2A2A2A', borderRadius: 7, color: '#F0F0F0', fontFamily: 'Barlow, sans-serif', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#555', letterSpacing: 1 }}>DESCRIÇÃO</span>
              <textarea
                value={editDescricao}
                onChange={e => setEditDescricao(e.target.value)}
                rows={3}
                placeholder="Descreva o conteúdo desta aula..."
                style={{ padding: '9px 12px', background: '#111', border: '1px solid #2A2A2A', borderRadius: 7, color: '#F0F0F0', fontFamily: 'Barlow, sans-serif', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.6 }}
              />
            </div>
            {/* Apostila */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#555', letterSpacing: 1 }}>APOSTILA</span>
              <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                {[['url', '🔗 Link'], ['upload', '📁 Upload']].map(([val, lbl]) => (
                  <button key={val} onClick={() => setEditApostilaTipo(val)} style={{ padding: '4px 10px', borderRadius: 5, fontSize: 10, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, background: editApostilaTipo === val ? '#FFC10720' : 'transparent', border: `1px solid ${editApostilaTipo === val ? '#FFC10744' : '#2A2A2A'}`, color: editApostilaTipo === val ? '#FFC107' : '#444' }}>{lbl}</button>
                ))}
              </div>
              {editApostilaTipo === 'url' ? (
                <input value={editApostilaUrl} onChange={e => setEditApostilaUrl(e.target.value)} placeholder="https://drive.google.com/... ou link direto para PDF" style={{ padding: '9px 12px', background: '#111', border: '1px solid #2A2A2A', borderRadius: 7, color: '#F0F0F0', fontFamily: 'Barlow, sans-serif', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }} />
              ) : (
                <div>
                  <input type="file" accept=".pdf,.docx,.doc" id={`apostila-edit-${aula.id}`} onChange={e => setEditApostilaFile(e.target.files[0] || null)} style={{ display: 'none' }} />
                  <label htmlFor={`apostila-edit-${aula.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#111', border: '1px dashed #2A2A2A', borderRadius: 7, cursor: 'pointer', fontSize: 12, color: editApostilaFile ? '#FFC107' : '#555', fontFamily: 'Barlow, sans-serif' }}>
                    📎 {editApostilaFile ? editApostilaFile.name : 'Selecionar PDF ou Word...'}
                  </label>
                </div>
              )}
              {aula.apostilaUrl && !editApostilaFile && editApostilaTipo === 'url' && !editApostilaUrl && (
                <span style={{ fontSize: 10, color: '#2A2A2A' }}>Atual: {aula.apostilaUrl.split('/').pop()}</span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleSalvarEdicao}
                disabled={salvandoEdit}
                style={{ padding: '9px 20px', background: '#FFC107', border: 'none', borderRadius: 7, color: '#000', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 900, cursor: salvandoEdit ? 'not-allowed' : 'pointer', opacity: salvandoEdit ? 0.6 : 1, letterSpacing: 0.5 }}
              >{salvandoEdit ? 'SALVANDO...' : 'SALVAR'}</button>
              <button
                onClick={cancelarEdicao}
                style={{ padding: '9px 16px', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 7, color: '#888', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >CANCELAR</button>
            </div>
          </div>
        </div>
      )}

      {/* Visualização expandida (quando não está editando) */}
      {expanded && !editando && (
        <div style={{ padding: '10px 14px 14px', borderTop: '1px solid #1A1A1A' }}>
          {aula.descricao && (
            <p style={{ fontSize: 12, color: '#555', lineHeight: 1.6, marginBottom: 10 }}>{aula.descricao}</p>
          )}
          {aula.videoUrl && (
            <a href={aula.videoUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#8B7FE8', display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 10, textDecoration: 'none' }}>▶ Ver vídeo</a>
          )}
          {aula.apostilaUrl && (
            <a href={aula.apostilaUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#F9A800', display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 10, textDecoration: 'none' }}>📄 Ver apostila</a>
          )}
          {localChecklist.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#666', letterSpacing: 2, marginBottom: 6 }}>CHECKLIST</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {localChecklist.map((texto, i) => (
                  <ChecklistItemRow
                    key={i}
                    item={{ texto, idx: i }}
                    aulaId={aula.id}
                    onSaved={setLocalChecklist}
                    onDelete={async (idx) => {
                      const resp = await api.removerChecklistItem(aula.id, idx);
                      setLocalChecklist(resp.checklist);
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SortableAulaRow({ aula, onDeleted, toast }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: aula.id });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 'auto',
        position: 'relative',
      }}
    >
      <AulaRow
        aula={aula}
        onDeleted={onDeleted}
        toast={toast}
        dragHandleListeners={listeners}
        dragHandleAttributes={attributes}
        isDragging={isDragging}
      />
    </div>
  );
}

function SecaoCard({ secao: secaoInicial, onDeleted, toast, dragHandleListeners = {}, dragHandleAttributes = {}, isDragging = false }) {
  const [aulas, setAulas] = useState(secaoInicial.aulas || []);
  const [showForm, setShowForm] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const recarregarAulas = async () => {
    try {
      const data = await api.getAulas(secaoInicial.id);
      setAulas(Array.isArray(data) ? data : []);
    } catch {}
  };

  const handleDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIdx = aulas.findIndex(a => a.id === active.id);
    const newIdx = aulas.findIndex(a => a.id === over.id);
    const reordenadas = arrayMove(aulas, oldIdx, newIdx);
    setAulas(reordenadas); // optimistic update
    try {
      await Promise.all(
        reordenadas.map((a, idx) => api.atualizarAula(a.id, { ordem: idx }))
      );
    } catch {
      toast('Erro ao salvar nova ordem', false);
      recarregarAulas();
    }
  };

  const handleDeleteSecao = async () => {
    if (!window.confirm(`Excluir a seção "${secaoInicial.titulo}" e todas as suas aulas?`)) return;
    setExcluindo(true);
    try {
      await api.excluirSecao(secaoInicial.id);
      toast('Seção excluída', true);
      onDeleted();
    } catch (e) {
      toast(e.message || 'Erro ao excluir seção', false);
      setExcluindo(false);
    }
  };

  return (
    <Card style={{ borderColor: isDragging ? '#FFC10766' : '#222', opacity: isDragging ? 0.5 : 1, transition: 'border-color .15s, opacity .15s' }}>
      {/* Cabeçalho da seção */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span
          {...dragHandleListeners}
          {...dragHandleAttributes}
          onClick={e => e.stopPropagation()}
          style={{ color: '#2A2A2A', fontSize: 18, cursor: 'grab', touchAction: 'none', flexShrink: 0, lineHeight: 1, padding: '0 2px', transition: 'color .15s', userSelect: 'none' }}
          onMouseEnter={e => e.currentTarget.style.color = '#FFC107'}
          onMouseLeave={e => e.currentTarget.style.color = '#2A2A2A'}
        >⠿</span>
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 800, color: '#F9A800', letterSpacing: 2, flexShrink: 0 }}>SEÇÃO</span>
        <div style={{ flex: 1, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, fontWeight: 800, color: '#E0E0E0' }}>{secaoInicial.titulo}</div>
        <Btn variant="danger" onClick={handleDeleteSecao} loading={excluindo} style={{ fontSize: 11, padding: '5px 10px', flexShrink: 0 }}>
          EXCLUIR
        </Btn>
      </div>

      {/* Aulas */}
      {aulas.length === 0 ? (
        <div style={{ fontSize: 12, color: '#2A2A2A', padding: '6px 0', marginBottom: 10 }}>Nenhuma aula nesta seção ainda.</div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={aulas.map(a => a.id)} strategy={verticalListSortingStrategy}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
              {aulas.map(a => (
                <SortableAulaRow key={a.id} aula={a} onDeleted={recarregarAulas} toast={toast} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {showForm ? (
        <AulaForm
          secaoId={secaoInicial.id}
          onSaved={() => { setShowForm(false); recarregarAulas(); }}
          onCancel={() => setShowForm(false)}
          toast={toast}
        />
      ) : (
        <Btn variant="ghost" onClick={() => setShowForm(true)} style={{ fontSize: 12, padding: '7px 14px' }}>
          ＋ Adicionar Aula
        </Btn>
      )}
    </Card>
  );
}

function SortableSecaoCard({ secao, onDeleted, toast }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: secao.id });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 'auto',
        position: 'relative',
      }}
    >
      <SecaoCard
        secao={secao}
        onDeleted={onDeleted}
        toast={toast}
        dragHandleListeners={listeners}
        dragHandleAttributes={attributes}
        isDragging={isDragging}
      />
    </div>
  );
}

function ModuloEditor({ modulo, onVoltar, toast }) {
  const [secoes, setSecoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [novaSecaoTitulo, setNovaSecaoTitulo] = useState('');
  const [savingSecao, setSavingSecao] = useState(false);

  const sensorSecoes = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getSecoes(modulo.id);
      setSecoes(Array.isArray(data) ? data : []);
    } catch (e) {
      toast(e.message || 'Erro ao carregar seções', false);
    } finally {
      setLoading(false);
    }
  }, [modulo.id]);

  useEffect(() => { carregar(); }, [carregar]);

  const handleDragEndSecoes = async ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIdx = secoes.findIndex(s => s.id === active.id);
    const newIdx = secoes.findIndex(s => s.id === over.id);
    const reordenadas = arrayMove(secoes, oldIdx, newIdx);
    setSecoes(reordenadas);
    try {
      await Promise.all(
        reordenadas.map((s, idx) => api.atualizarSecao(s.id, { ordem: idx }))
      );
    } catch {
      toast('Erro ao salvar nova ordem das seções', false);
      carregar();
    }
  };

  const handleAddSecao = async () => {
    if (!novaSecaoTitulo.trim()) { toast('Título da seção é obrigatório', false); return; }
    setSavingSecao(true);
    try {
      await api.criarSecao(novaSecaoTitulo.trim(), modulo.id, secoes.length);
      toast('Seção criada!', true);
      setNovaSecaoTitulo('');
      carregar();
    } catch (e) {
      toast(e.message || 'Erro ao criar seção', false);
    } finally {
      setSavingSecao(false);
    }
  };

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        <button
          onClick={onVoltar}
          style={{ background: 'none', border: '1px solid #2A2A2A', borderRadius: 7, color: '#888', padding: '7px 14px', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#444'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#2A2A2A'}
        >← Voltar</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 22, fontWeight: 900, color: '#F0F0F0', lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{modulo.titulo}</div>
          <div style={{ fontSize: 12, color: '#444', marginTop: 2 }}>{secoes.length} seção{secoes.length !== 1 ? 'ões' : ''} · {secoes.reduce((a, s) => a + (s.aulas?.length ?? 0), 0)} aulas</div>
        </div>
        <Btn variant="ghost" onClick={carregar} style={{ fontSize: 12, padding: '7px 14px', flexShrink: 0 }}>↻ Atualizar</Btn>
      </div>

      {loading ? (
        <div style={{ color: '#2A2A2A', fontSize: 13, padding: '20px 0' }}>Carregando seções...</div>
      ) : (
        <>
          {secoes.length === 0 ? (
            <div style={{ background: '#161616', border: '1px solid #1E1E1E', borderRadius: 12, padding: '32px', textAlign: 'center', color: '#333', fontSize: 13, marginBottom: 20 }}>
              Nenhuma seção criada ainda. Adicione a primeira abaixo.
            </div>
          ) : (
            <DndContext sensors={sensorSecoes} collisionDetection={closestCenter} onDragEnd={handleDragEndSecoes}>
              <SortableContext items={secoes.map(s => s.id)} strategy={verticalListSortingStrategy}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
                  {secoes.map(s => (
                    <SortableSecaoCard key={s.id} secao={s} onDeleted={carregar} toast={toast} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {/* Adicionar seção */}
          <Card style={{ borderColor: '#F9A80022' }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15, fontWeight: 800, color: '#F9A800', marginBottom: 12 }}>
              ＋ Nova Seção
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <Input
                  label="Título da seção"
                  value={novaSecaoTitulo}
                  onChange={e => setNovaSecaoTitulo(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddSecao()}
                  placeholder="Ex: Fundamentos, Prática, Avaliação..."
                />
              </div>
              <Btn onClick={handleAddSecao} loading={savingSecao} style={{ flexShrink: 0 }}>
                ADICIONAR SEÇÃO
              </Btn>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// SEÇÃO: Avaliações
// ═══════════════════════════════════════════════════════

// ── QuestaoForm ─────────────────────────────────────────
function QuestaoForm({ avaliacaoId, onSaved, onCancel, toast, questaoEditando = null }) {
  const editando = !!questaoEditando;
  const parseAlts = (q) => {
    try { return q?.alternativas ? JSON.parse(q.alternativas) : ['', '', '', '']; }
    catch { return ['', '', '', '']; }
  };

  const [enunciado, setEnunciado] = useState(questaoEditando?.enunciado || '');
  const [tipo, setTipo] = useState(questaoEditando?.tipo || 'multipla');
  const [alternativas, setAlternativas] = useState(parseAlts(questaoEditando));
  const [respostaCorreta, setRespostaCorreta] = useState(questaoEditando?.respostaCorreta || '0');
  const [peso, setPeso] = useState(questaoEditando?.peso ?? 1);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!enunciado.trim()) { toast('Enunciado é obrigatório', false); return; }
    if (tipo === 'multipla' && alternativas.some(a => !a.trim())) {
      toast('Preencha todas as 4 alternativas', false); return;
    }
    setSaving(true);
    try {
      const payload = {
        enunciado: enunciado.trim(),
        tipo,
        alternativas: tipo === 'multipla' ? alternativas.map(a => a.trim()) : null,
        respostaCorreta,
        peso: Number(peso) || 1,
        avaliacaoId,
      };
      if (editando) {
        await api.atualizarQuestao(questaoEditando.id, payload);
        toast('Questão atualizada!', true);
      } else {
        await api.criarQuestao(payload);
        toast('Questão criada!', true);
      }
      onSaved();
    } catch (e) {
      toast(e.message || 'Erro ao salvar questão', false);
    } finally {
      setSaving(false);
    }
  };

  const setAlt = (i, v) => setAlternativas(p => p.map((a, j) => j === i ? v : a));
  const LETRAS = ['A', 'B', 'C', 'D'];

  return (
    <div style={{ background: '#0D0D0D', border: '1px solid #FFC10733', borderRadius: 10, padding: '16px 18px', marginTop: 8 }}>
      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 800, color: '#FFC107', marginBottom: 12 }}>
        {editando ? 'EDITAR QUESTÃO' : 'NOVA QUESTÃO'}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Enunciado */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#555', letterSpacing: 1 }}>ENUNCIADO *</span>
          <textarea
            value={enunciado}
            onChange={e => setEnunciado(e.target.value)}
            rows={2}
            placeholder="Ex: Qual a temperatura correta para grelhar um smashburger?"
            style={{ padding: '9px 12px', background: '#111', border: '1px solid #2A2A2A', borderRadius: 7, color: '#F0F0F0', fontFamily: 'Barlow, sans-serif', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.5 }}
          />
        </div>

        {/* Tipo + Peso */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#555', letterSpacing: 1 }}>TIPO</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {[['multipla', '☰ Múltipla escolha'], ['vf', '○ Verdadeiro/Falso']].map(([val, lbl]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => { setTipo(val); setRespostaCorreta(val === 'vf' ? 'true' : '0'); }}
                  style={{
                    padding: '6px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                    fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700,
                    background: tipo === val ? '#FFC10720' : 'transparent',
                    border: `1px solid ${tipo === val ? '#FFC10755' : '#2A2A2A'}`,
                    color: tipo === val ? '#FFC107' : '#444',
                  }}
                >{lbl}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 80 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#555', letterSpacing: 1 }}>PESO</span>
            <input
              type="number"
              value={peso}
              onChange={e => setPeso(e.target.value)}
              min={1}
              style={{ padding: '8px 10px', background: '#111', border: '1px solid #2A2A2A', borderRadius: 7, color: '#F0F0F0', fontFamily: 'Barlow, sans-serif', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Alternativas */}
        {tipo === 'multipla' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#555', letterSpacing: 1 }}>ALTERNATIVAS (marque a correta)</span>
            {alternativas.map((alt, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setRespostaCorreta(String(i))}
                  style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${respostaCorreta === String(i) ? '#FFC107' : '#2A2A2A'}`,
                    background: respostaCorreta === String(i) ? '#FFC107' : 'transparent',
                    color: respostaCorreta === String(i) ? '#000' : '#444',
                    fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 12,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  title={`Marcar ${LETRAS[i]} como correta`}
                >{LETRAS[i]}</button>
                <input
                  value={alt}
                  onChange={e => setAlt(i, e.target.value)}
                  placeholder={`Alternativa ${LETRAS[i]}`}
                  style={{
                    flex: 1, padding: '8px 12px',
                    background: respostaCorreta === String(i) ? '#FFC10710' : '#111',
                    border: `1px solid ${respostaCorreta === String(i) ? '#FFC10744' : '#2A2A2A'}`,
                    borderRadius: 7, color: '#F0F0F0', fontFamily: 'Barlow, sans-serif',
                    fontSize: 13, outline: 'none', transition: 'all .15s',
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#555', letterSpacing: 1 }}>RESPOSTA CORRETA</span>
            <div style={{ display: 'flex', gap: 10 }}>
              {[['true', '✓ VERDADEIRO'], ['false', '✗ FALSO']].map(([val, lbl]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setRespostaCorreta(val)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer',
                    fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 900,
                    background: respostaCorreta === val ? (val === 'true' ? '#22A06B22' : '#E05A2B22') : 'transparent',
                    border: `1px solid ${respostaCorreta === val ? (val === 'true' ? '#22A06B66' : '#E05A2B66') : '#2A2A2A'}`,
                    color: respostaCorreta === val ? (val === 'true' ? '#22A06B' : '#E05A2B') : '#444',
                    transition: 'all .15s',
                  }}
                >{lbl}</button>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button onClick={handleSave} disabled={saving} style={{ padding: '9px 20px', background: saving ? '#555' : '#FFC107', border: 'none', borderRadius: 7, color: '#000', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'SALVANDO...' : 'SALVAR'}
          </button>
          <button onClick={onCancel} style={{ padding: '9px 16px', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 7, color: '#888', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            CANCELAR
          </button>
        </div>
      </div>
    </div>
  );
}

// ── QuestaoCard ──────────────────────────────────────────
function QuestaoCard({ questao, onDeleted, onEdited, toast }) {
  const [editando, setEditando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const alts = (() => { try { return questao.alternativas ? JSON.parse(questao.alternativas) : []; } catch { return []; } })();
  const LETRAS = ['A', 'B', 'C', 'D'];

  const handleExcluir = async () => {
    if (!window.confirm('Excluir esta questão?')) return;
    setExcluindo(true);
    try {
      await api.excluirQuestao(questao.id);
      toast('Questão excluída', true);
      onDeleted();
    } catch (e) {
      toast(e.message || 'Erro ao excluir questão', false);
      setExcluindo(false);
    }
  };

  if (editando) {
    return (
      <QuestaoForm
        avaliacaoId={questao.avaliacaoId}
        questaoEditando={questao}
        onSaved={() => { setEditando(false); onEdited(); }}
        onCancel={() => setEditando(false)}
        toast={toast}
      />
    );
  }

  const respostaLabel = questao.tipo === 'vf'
    ? (questao.respostaCorreta === 'true' ? '✓ Verdadeiro' : '✗ Falso')
    : `${LETRAS[Number(questao.respostaCorreta)] || '?'}: ${alts[Number(questao.respostaCorreta)] || ''}`;

  return (
    <div style={{ background: '#111', border: '1px solid #1E1E1E', borderRadius: 8, padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: '#CCC', lineHeight: 1.5, marginBottom: 6 }}>{questao.enunciado}</div>
          {questao.tipo === 'multipla' && alts.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 6 }}>
              {alts.map((a, i) => (
                <div key={i} style={{ fontSize: 11, display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                    background: String(i) === String(questao.respostaCorreta) ? '#FFC107' : '#1A1A1A',
                    border: `1px solid ${String(i) === String(questao.respostaCorreta) ? '#FFC107' : '#2A2A2A'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Barlow Condensed', fontWeight: 900, fontSize: 9,
                    color: String(i) === String(questao.respostaCorreta) ? '#000' : '#444',
                  }}>{LETRAS[i]}</span>
                  <span style={{ color: String(i) === String(questao.respostaCorreta) ? '#FFC107' : '#555' }}>{a}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 10, background: '#FFC10715', border: '1px solid #FFC10733', borderRadius: 4, padding: '2px 7px', color: '#FFC107', fontFamily: 'Barlow Condensed', fontWeight: 800 }}>
              {questao.tipo === 'vf' ? 'V/F' : 'MC'}
            </span>
            <span style={{ fontSize: 10, color: '#22A06B', background: '#22A06B15', border: '1px solid #22A06B33', borderRadius: 4, padding: '2px 7px', fontFamily: 'Barlow Condensed', fontWeight: 800 }}>
              ✓ {respostaLabel}
            </span>
            <span style={{ fontSize: 10, color: '#555' }}>peso {questao.peso}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button onClick={() => setEditando(true)} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 13, padding: '2px 5px' }} onMouseEnter={e => e.currentTarget.style.color = '#FFC107'} onMouseLeave={e => e.currentTarget.style.color = '#444'}>✏️</button>
          <button onClick={handleExcluir} disabled={excluindo} style={{ background: 'none', border: 'none', color: '#444', cursor: excluindo ? 'not-allowed' : 'pointer', fontSize: 13, padding: '2px 5px' }} onMouseEnter={e => { if (!excluindo) e.currentTarget.style.color = '#E05A2B'; }} onMouseLeave={e => e.currentTarget.style.color = '#444'}>{excluindo ? '...' : '🗑'}</button>
        </div>
      </div>
    </div>
  );
}

// ── AvaliacaoCard ────────────────────────────────────────
function AvaliacaoCard({ avaliacao: av, modulos, onDeleted, toast }) {
  const [expandida, setExpandida] = useState(false);
  const [questoes, setQuestoes] = useState(av.questoes || []);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(false);
  const [editTitulo, setEditTitulo] = useState(av.titulo);
  const [editModuloId, setEditModuloId] = useState(av.moduloId ? String(av.moduloId) : '');
  const [editNotaMinima, setEditNotaMinima] = useState(av.notaMinima);
  const [editTentativas, setEditTentativas] = useState(av.tentativas);
  const [editXpBonus, setEditXpBonus] = useState(av.xpBonus ?? 100);
  const [salvando, setSalvando] = useState(false);

  const moduloNome = modulos.find(m => m.id === av.moduloId)?.titulo;

  const recarregarQuestoes = async () => {
    try {
      const av2 = await api.getAvaliacaoById(av.id);
      setQuestoes(av2.questoes || []);
    } catch {}
  };

  const handleSalvarEdicao = async () => {
    if (!editTitulo.trim()) { toast('Título é obrigatório', false); return; }
    setSalvando(true);
    try {
      await api.atualizarAvaliacao(av.id, {
        titulo: editTitulo.trim(),
        moduloId: editModuloId ? Number(editModuloId) : null,
        notaMinima: Number(editNotaMinima),
        tentativas: Number(editTentativas),
        xpBonus: Number(editXpBonus),
      });
      toast('Avaliação atualizada!', true);
      setEditando(false);
      onDeleted(); // recarrega lista
    } catch (e) {
      toast(e.message || 'Erro ao atualizar avaliação', false);
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async () => {
    if (!window.confirm(`Excluir a avaliação "${av.titulo}" e todas as suas questões?`)) return;
    try {
      await api.excluirAvaliacao(av.id);
      toast(`"${av.titulo}" excluída`, true);
      onDeleted();
    } catch (e) {
      toast(e.message || 'Erro ao excluir avaliação', false);
    }
  };

  return (
    <div style={{ background: '#161616', border: '1px solid #1E1E1E', borderRadius: 10, overflow: 'hidden' }}>
      {/* Cabeçalho */}
      <div style={{ padding: '14px 16px' }}>
        {editando ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#FFC107', letterSpacing: 1 }}>TÍTULO *</span>
              <input value={editTitulo} onChange={e => setEditTitulo(e.target.value)} style={{ padding: '8px 12px', background: '#0D0D0D', border: '1px solid #FFC10733', borderRadius: 7, color: '#F0F0F0', fontFamily: 'Barlow, sans-serif', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#555', letterSpacing: 1 }}>MÓDULO</span>
                <select value={editModuloId} onChange={e => setEditModuloId(e.target.value)} style={{ padding: '8px 10px', background: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: 7, color: '#F0F0F0', fontFamily: 'Barlow, sans-serif', fontSize: 12, outline: 'none', width: '100%', boxSizing: 'border-box' }}>
                  <option value="">— Nenhum —</option>
                  {modulos.map(m => <option key={m.id} value={m.id}>{m.titulo}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#555', letterSpacing: 1 }}>NOTA MÍN.</span>
                <input type="number" value={editNotaMinima} onChange={e => setEditNotaMinima(e.target.value)} min={0} max={100} style={{ padding: '8px 10px', background: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: 7, color: '#F0F0F0', fontFamily: 'Barlow, sans-serif', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#555', letterSpacing: 1 }}>TENTATIVAS</span>
                <input type="number" value={editTentativas} onChange={e => setEditTentativas(e.target.value)} min={1} style={{ padding: '8px 10px', background: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: 7, color: '#F0F0F0', fontFamily: 'Barlow, sans-serif', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#555', letterSpacing: 1 }}>XP BÔNUS</span>
                <input type="number" value={editXpBonus} onChange={e => setEditXpBonus(e.target.value)} min={0} style={{ padding: '8px 10px', background: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: 7, color: '#F0F0F0', fontFamily: 'Barlow, sans-serif', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleSalvarEdicao} disabled={salvando} style={{ padding: '8px 18px', background: '#FFC107', border: 'none', borderRadius: 7, color: '#000', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 900, cursor: salvando ? 'not-allowed' : 'pointer', opacity: salvando ? 0.6 : 1 }}>{salvando ? 'SALVANDO...' : 'SALVAR'}</button>
              <button onClick={() => setEditando(false)} style={{ padding: '8px 14px', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 7, color: '#888', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>CANCELAR</button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 800, color: '#E0E0E0', marginBottom: 3 }}>{av.titulo}</div>
                {moduloNome && (
                  <div style={{ fontSize: 11, color: '#F9A80088' }}>📦 {moduloNome}</div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                <button onClick={() => setEditando(true)} style={{ padding: '4px 10px', borderRadius: 5, border: '1px solid #FFC10733', background: '#FFC10710', color: '#FFC107', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 800 }} onMouseEnter={e => { e.currentTarget.style.background = '#FFC10722'; }} onMouseLeave={e => { e.currentTarget.style.background = '#FFC10710'; }}>✏️ EDITAR</button>
                <button onClick={handleExcluir} style={{ padding: '4px 10px', borderRadius: 5, border: '1px solid #E05A2B44', background: '#E05A2B11', color: '#E05A2B', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 800 }} onMouseEnter={e => { e.currentTarget.style.background = '#E05A2B22'; }} onMouseLeave={e => { e.currentTarget.style.background = '#E05A2B11'; }}>🗑</button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 10, background: '#22A06B15', border: '1px solid #22A06B33', borderRadius: 4, padding: '2px 8px', color: '#22A06B', fontFamily: 'Barlow Condensed', fontWeight: 800 }}>✓ mín. {av.notaMinima}%</span>
              <span style={{ fontSize: 10, background: '#8B7FE815', border: '1px solid #8B7FE833', borderRadius: 4, padding: '2px 8px', color: '#8B7FE8', fontFamily: 'Barlow Condensed', fontWeight: 800 }}>↺ {av.tentativas} tentativas</span>
              <span style={{ fontSize: 10, background: '#F9A80015', border: '1px solid #F9A80033', borderRadius: 4, padding: '2px 8px', color: '#F9A800', fontFamily: 'Barlow Condensed', fontWeight: 800 }}>⚡{av.xpBonus ?? 100} XP</span>
              <span style={{ fontSize: 10, color: '#2A2A2A' }}>{questoes.length} questão{questoes.length !== 1 ? 'ões' : ''}</span>
              <button
                onClick={() => setExpandida(e => !e)}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 11, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}
                onMouseEnter={e => e.currentTarget.style.color = '#FFC107'}
                onMouseLeave={e => e.currentTarget.style.color = '#555'}
              >
                {expandida ? '▴ OCULTAR' : '▾ QUESTÕES'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Questões */}
      {expandida && !editando && (
        <div style={{ borderTop: '1px solid #1A1A1A', padding: '12px 16px' }}>
          {questoes.length === 0 ? (
            <div style={{ fontSize: 12, color: '#2A2A2A', marginBottom: 10 }}>Nenhuma questão cadastrada ainda.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
              {questoes.map(q => (
                <QuestaoCard
                  key={q.id}
                  questao={q}
                  onDeleted={recarregarQuestoes}
                  onEdited={recarregarQuestoes}
                  toast={toast}
                />
              ))}
            </div>
          )}
          {showForm ? (
            <QuestaoForm
              avaliacaoId={av.id}
              onSaved={() => { setShowForm(false); recarregarQuestoes(); }}
              onCancel={() => setShowForm(false)}
              toast={toast}
            />
          ) : (
            <button
              onClick={() => setShowForm(true)}
              style={{ padding: '7px 14px', borderRadius: 7, border: '1px dashed #FFC10733', background: 'transparent', color: '#FFC10777', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, fontWeight: 700, transition: 'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#FFC10766'; e.currentTarget.style.color = '#FFC107'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#FFC10733'; e.currentTarget.style.color = '#FFC10777'; }}
            >＋ Adicionar Questão</button>
          )}
        </div>
      )}
    </div>
  );
}

// ── SecaoAvaliacoes ──────────────────────────────────────
function SecaoAvaliacoes({ toast }) {
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [titulo, setTitulo] = useState('');
  const [moduloId, setModuloId] = useState('');
  const [notaMinima, setNotaMinima] = useState(70);
  const [tentativas, setTentativas] = useState(3);
  const [xpBonus, setXpBonus] = useState(100);
  const [saving, setSaving] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    // Carrega módulos e avaliações de forma independente para que a falha
    // de um não impeça o outro de popular o estado (especialmente o dropdown).
    const [resAvs, resMods] = await Promise.allSettled([
      api.getAvaliacoes(),
      api.getModulos(),
    ]);

    if (resAvs.status === 'fulfilled') {
      console.log('[SecaoAvaliacoes] avaliações:', resAvs.value);
      setAvaliacoes(Array.isArray(resAvs.value) ? resAvs.value : []);
    } else {
      console.error('[SecaoAvaliacoes] erro ao buscar avaliações:', resAvs.reason);
      toast(resAvs.reason?.message || 'Erro ao carregar avaliações', false);
    }

    if (resMods.status === 'fulfilled') {
      console.log('[SecaoAvaliacoes] módulos:', resMods.value);
      setModulos(Array.isArray(resMods.value) ? resMods.value : []);
    } else {
      console.error('[SecaoAvaliacoes] erro ao buscar módulos:', resMods.reason);
    }

    setLoading(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const handleCriar = async () => {
    if (!titulo.trim()) { toast('Título é obrigatório', false); return; }
    setSaving(true);
    try {
      await api.criarAvaliacao(titulo.trim(), moduloId ? Number(moduloId) : null, Number(notaMinima), Number(tentativas), Number(xpBonus));
      toast('Avaliação criada com sucesso!', true);
      setTitulo(''); setModuloId(''); setNotaMinima(70); setTentativas(3); setXpBonus(100);
      carregar();
    } catch (e) {
      toast(e.message || 'Erro ao criar avaliação', false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid-2">
      {/* Formulário */}
      <Card>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, fontWeight: 800, color: '#F0F0F0', marginBottom: 18 }}>
          Criar Nova Avaliação
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Título *" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Avaliação de Higiene Alimentar" onKeyDown={e => e.key === 'Enter' && handleCriar()} />
          <Select label="Módulo vinculado (opcional)" value={moduloId} onChange={e => setModuloId(e.target.value)}>
            <option value="">— Sem módulo —</option>
            {modulos.map(m => <option key={m.id} value={m.id}>{m.titulo}</option>)}
          </Select>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <Input label="Nota mínima (%)" type="number" value={notaMinima} onChange={e => setNotaMinima(e.target.value)} placeholder="70" />
            <Input label="Tentativas" type="number" value={tentativas} onChange={e => setTentativas(e.target.value)} placeholder="3" />
            <Input label="XP bônus (aprovação)" type="number" value={xpBonus} onChange={e => setXpBonus(e.target.value)} placeholder="100" />
          </div>
          <div style={{ background: '#0D0D0D', border: '1px solid #FFC10722', borderRadius: 8, padding: '10px 14px', fontSize: 11, color: '#555', lineHeight: 1.6 }}>
            📝 Após criar a avaliação, expanda-a na lista para adicionar questões. O colaborador só acessa a avaliação após concluir todas as aulas do módulo vinculado.
          </div>
          <Btn onClick={handleCriar} loading={saving} style={{ alignSelf: 'flex-start' }}>+ CRIAR AVALIAÇÃO</Btn>
        </div>
      </Card>

      {/* Lista */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, fontWeight: 800, color: '#F0F0F0' }}>
            Avaliações Cadastradas
          </div>
          <Btn variant="ghost" onClick={carregar} style={{ fontSize: 12, padding: '6px 12px' }}>↻ ATUALIZAR</Btn>
        </div>
        {loading ? (
          <div style={{ color: '#3A3A3A', fontSize: 13, padding: '20px 0' }}>Carregando...</div>
        ) : avaliacoes.length === 0 ? (
          <div style={{ background: '#161616', border: '1px solid #1E1E1E', borderRadius: 12, padding: '32px', textAlign: 'center', color: '#333', fontSize: 13 }}>
            Nenhuma avaliação cadastrada ainda.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {avaliacoes.map(av => (
              <AvaliacaoCard key={av.id} avaliacao={av} modulos={modulos} onDeleted={carregar} toast={toast} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// SEÇÃO: Colaboradores
// ═══════════════════════════════════════════════════════

// Remove não-dígitos e garante o prefixo internacional 55
const formatarTelWhatsApp = (tel) => {
  const digits = tel.replace(/\D/g, '');
  if (!digits) return '';
  return digits.startsWith('55') && digits.length >= 12 ? digits : '55' + digits;
};

const montarMensagemBoasVindas = ({ nome, email, senha }) =>
  `Olá ${nome}! 🍔 Você foi cadastrado(a) na Galliate Academy, nossa plataforma de treinamentos internos. Seus dados de acesso: E-mail: ${email} | Senha: ${senha}. Acesse e comece sua jornada! 🚀 Acesse: https://galliate-academy.netlify.app`;

function SecaoColaboradores({ toast }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cargo, setCargo] = useState(CARGOS[0]);
  const [tipo, setTipo] = useState('colaborador');
  const [saving, setSaving] = useState(false);
  const [cadastrado, setCadastrado] = useState(null);

  const handleTipo = (t) => {
    setTipo(t);
    setCargo(t === 'gestor' ? 'gestor' : CARGOS[0]);
  };

  const handleCadastrar = async () => {
    if (!nome.trim() || !email.trim() || !senha.trim()) {
      toast('Nome, e-mail e senha são obrigatórios', false);
      return;
    }
    if (senha.length < 6) {
      toast('Senha deve ter no mínimo 6 caracteres', false);
      return;
    }
    setSaving(true);
    try {
      await api.cadastrar(nome.trim(), email.trim(), senha, cargo, telefone.trim());
      toast(`${tipo === 'gestor' ? 'Gestor' : 'Colaborador'} "${nome.trim()}" cadastrado com sucesso!`, true);
      setCadastrado({ nome: nome.trim(), email: email.trim(), senha, telefone: telefone.trim() });
      setNome('');
      setEmail('');
      setSenha('');
      setTelefone('');
      setTipo('colaborador');
      setCargo(CARGOS[0]);
    } catch (e) {
      toast(e.message || 'Erro ao cadastrar colaborador', false);
    } finally {
      setSaving(false);
    }
  };

  const handleWhatsApp = () => {
    const numero = formatarTelWhatsApp(cadastrado.telefone);
    const mensagem = encodeURIComponent(montarMensagemBoasVindas(cadastrado));
    const url = numero
      ? `https://wa.me/${numero}?text=${mensagem}`
      : `https://wa.me/?text=${mensagem}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="grid-2">
      {/* Formulário */}
      <Card>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, fontWeight: 800, color: '#F0F0F0', marginBottom: 14 }}>
          Cadastrar Usuário
        </div>

        {/* Seletor de tipo */}
        <div style={{ display: 'flex', background: '#0D0D0D', borderRadius: 8, padding: 3, marginBottom: 18, gap: 4 }}>
          {[['colaborador', '👤 Colaborador'], ['gestor', '⚙️ Gestor']].map(([t, label]) => (
            <button key={t} onClick={() => handleTipo(t)} style={{
              flex: 1, padding: '8px 0', borderRadius: 6, border: 'none',
              background: tipo === t ? '#FFC107' : 'transparent',
              color: tipo === t ? '#000' : '#555',
              fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 13,
              cursor: 'pointer', transition: 'all .2s',
            }}>{label}</button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input
            label="Nome completo *"
            value={nome}
            onChange={e => setNome(e.target.value)}
            placeholder="Ex: João da Silva"
          />
          <Input
            label="E-mail *"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="joao@galliate.com.br"
          />
          <Input
            label="Senha inicial *"
            type="password"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            placeholder="Mínimo 6 caracteres"
          />
          <Input
            label="Telefone / WhatsApp"
            type="tel"
            value={telefone}
            onChange={e => setTelefone(e.target.value)}
            placeholder="(11) 99999-9999"
          />
          {tipo === 'colaborador' ? (
            <Select label="Cargo" value={cargo} onChange={e => setCargo(e.target.value)}>
              {CARGOS.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          ) : (
            <div style={{ padding: '10px 14px', background: '#FFC10710', border: '1px solid #FFC10733', borderRadius: 8, fontSize: 12, color: '#FFC107', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>
              ⚙️ Acesso ao Painel do Gestor será concedido automaticamente
            </div>
          )}
          <Btn onClick={handleCadastrar} loading={saving} style={{ alignSelf: 'flex-start' }}>
            + CADASTRAR {tipo === 'gestor' ? 'GESTOR' : 'COLABORADOR'}
          </Btn>
        </div>
      </Card>

      {/* Coluna direita */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Botão de boas-vindas — aparece após cadastro bem-sucedido */}
        {cadastrado && (
          <Card style={{ borderColor: '#25D36644' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 22 }}>✅</span>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 800, color: '#F0F0F0' }}>
                {cadastrado.nome} cadastrado(a)!
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#444', marginBottom: 14, lineHeight: 1.6 }}>
              {cadastrado.telefone
                ? `Número: ${cadastrado.telefone} → ${formatarTelWhatsApp(cadastrado.telefone)}`
                : 'Nenhum número informado — o botão abrirá o WhatsApp sem destinatário.'}
            </div>
            <button
              onClick={handleWhatsApp}
              style={{
                width: '100%', padding: '12px 16px',
                background: '#25D366', border: 'none', borderRadius: 8,
                color: '#fff', fontFamily: 'Barlow Condensed, sans-serif',
                fontSize: 15, fontWeight: 900, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                letterSpacing: 0.5,
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#1ebe5a'}
              onMouseLeave={e => e.currentTarget.style.background = '#25D366'}
            >
              <span style={{ fontSize: 18 }}>💬</span>
              ENVIAR BOAS-VINDAS NO WHATSAPP
            </button>
            <button
              onClick={() => setCadastrado(null)}
              style={{ marginTop: 8, width: '100%', padding: '7px', background: 'none', border: 'none', color: '#333', fontSize: 12, cursor: 'pointer', fontFamily: 'Barlow, sans-serif' }}
            >
              Fechar
            </button>
          </Card>
        )}

        <Card style={{ borderColor: '#F9A80022' }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15, fontWeight: 800, color: '#F9A800', marginBottom: 10 }}>
            ℹ Como funciona
          </div>
          <div style={{ fontSize: 13, color: '#555', lineHeight: 1.8 }}>
            O colaborador poderá fazer login imediatamente usando o e-mail e senha definidos aqui. O cargo determina quais trilhas aparecem em destaque no perfil.
          </div>
        </Card>
        <Card style={{ borderColor: '#22A06B22' }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15, fontWeight: 800, color: '#22A06B', marginBottom: 10 }}>
            Cargos de Gestor
          </div>
          <div style={{ fontSize: 13, color: '#555', lineHeight: 1.8 }}>
            Cargos com <span style={{ color: '#22A06B' }}>admin</span>, <span style={{ color: '#22A06B' }}>gestor</span>, <span style={{ color: '#22A06B' }}>gerente</span>, <span style={{ color: '#22A06B' }}>supervisor</span> ou <span style={{ color: '#22A06B' }}>coordenador</span> recebem acesso automático ao Painel do Gestor.
          </div>
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MODAL de detalhes
// ═══════════════════════════════════════════════════════
function ModalPerfil({ usuario, onClose }) {
  if (!usuario) return null;
  const nivel = Math.floor((usuario.xp || 0) / 300) + 1;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        {/* topo colorido */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#F9A800,#E05A2B)', borderRadius: '16px 16px 0 0' }} />

        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', color: '#444', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}
          onMouseEnter={e => e.currentTarget.style.color = '#F0F0F0'}
          onMouseLeave={e => e.currentTarget.style.color = '#444'}
        >✕</button>

        {/* avatar + nome */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: '#F9A80022', border: '2px solid #F9A800',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 20, color: '#F9A800',
            flexShrink: 0,
          }}>
            {(usuario.nome ?? '').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'}
          </div>
          <div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 24, fontWeight: 900, color: '#F0F0F0', lineHeight: 1 }}>{usuario.nome}</div>
            <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>{usuario.cargo}</div>
          </div>
        </div>

        {/* detalhes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            ['E-mail', usuario.email],
            ['WhatsApp', usuario.telefone || '—'],
            ['Cargo', usuario.cargo],
            ['Nível', `${nivel} (${usuario.xp || 0} XP)`],
            ['Status', usuario.ativo !== false ? 'Ativo' : 'Inativo'],
            ['Cadastrado em', usuario.criadoEm ? new Date(usuario.criadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'],
          ].map(([chave, valor]) => (
            <div key={chave} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #1A1A1A' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#444', letterSpacing: 0.5 }}>{chave.toUpperCase()}</span>
              <span style={{ fontSize: 13, color: '#C0C0C0', textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word' }}>{valor}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {usuario.telefone && (
            <button
              onClick={() => {
                const numero = formatarTelWhatsApp(usuario.telefone);
                const mensagem = encodeURIComponent(`Olá ${usuario.nome}! 🍔 Tudo bem? Passando aqui pela Galliate Academy!`);
                window.open(`https://wa.me/${numero}?text=${mensagem}`, '_blank', 'noopener,noreferrer');
              }}
              style={{ width: '100%', padding: '11px', background: '#25D366', border: 'none', borderRadius: 8, color: '#fff', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              onMouseEnter={e => e.currentTarget.style.background = '#1ebe5a'}
              onMouseLeave={e => e.currentTarget.style.background = '#25D366'}
            >
              <span style={{ fontSize: 16 }}>💬</span> ENVIAR MENSAGEM NO WHATSAPP
            </button>
          )}
          <button
            onClick={onClose}
            style={{ width: '100%', padding: '11px', background: '#F9A800', border: 'none', borderRadius: 8, color: '#000', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 900, cursor: 'pointer' }}
          >FECHAR</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MODAL: Simular Conclusão (DEV only)
// ═══════════════════════════════════════════════════════
function ModalSimular({ usuario, onClose, toast }) {
  const [modulos, setModulos] = useState([]);
  const [loadingMods, setLoadingMods] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const [simulando, setSimulando] = useState(false);
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    api.getModulos()
      .then(data => { setModulos(Array.isArray(data) ? data : []); })
      .catch(() => setModulos([]))
      .finally(() => setLoadingMods(false));
  }, []);

  const handleSimular = async () => {
    if (!selectedId) return;
    setSimulando(true);
    try {
      const [secoes, modulo] = await Promise.all([
        api.getSecoes(selectedId),
        api.getModuloById(selectedId),
      ]);
      const todasAulas = (Array.isArray(secoes) ? secoes : []).flatMap(s => s.aulas || []);
      const xpAulas = todasAulas.reduce((sum, a) => sum + (a.xp ?? 10), 0);
      const xpTotal = xpAulas + (modulo.xpBonus ?? 50);

      await api.adicionarXP(usuario.id, xpTotal);
      const cert = await api.gerarCertificado(usuario.id, Number(selectedId), null, null);

      setResultado({ xpTotal, cert, modulo });
      toast(`Simulação concluída para ${usuario.nome}! +${xpTotal} XP`, true);
    } catch (e) {
      toast(e.message || 'Erro ao simular conclusão', false);
    } finally {
      setSimulando(false);
    }
  };

  const selectedModulo = modulos.find(m => String(m.id) === String(selectedId));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#7C3AED,#3B82F6)', borderRadius: '16px 16px 0 0' }} />
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', color: '#444', fontSize: 20, cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.color = '#F0F0F0'} onMouseLeave={e => e.currentTarget.style.color = '#444'}>✕</button>

        {/* badge dev */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#7C3AED22', border: '1px dashed #7C3AED55', borderRadius: 6, padding: '4px 10px', marginBottom: 14 }}>
          <span style={{ fontSize: 11 }}>🧪</span>
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 900, color: '#7C3AED', letterSpacing: 2 }}>AMBIENTE DE DESENVOLVIMENTO</span>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 20, fontWeight: 900, color: '#F0F0F0', lineHeight: 1 }}>Simular Conclusão</div>
          <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>{usuario.nome} · {usuario.cargo}</div>
        </div>

        {!resultado ? (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 900, color: '#444', letterSpacing: 2, marginBottom: 8 }}>
                SELECIONAR MÓDULO
              </label>
              <select
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                disabled={loadingMods || simulando}
                style={{ width: '100%', padding: '10px 12px', background: '#111', border: '1px solid #2A2A2A', borderRadius: 8, color: selectedId ? '#E0E0E0' : '#555', fontSize: 14, fontFamily: 'Barlow, sans-serif', cursor: 'pointer', outline: 'none' }}
              >
                <option value="">{loadingMods ? 'Carregando módulos...' : 'Escolha um módulo...'}</option>
                {modulos.map(m => <option key={m.id} value={m.id}>{m.titulo}</option>)}
              </select>
            </div>

            {selectedModulo && (
              <div style={{ background: '#111', border: '1px solid #1E1E1E', borderRadius: 8, padding: '12px 14px', marginBottom: 16, fontSize: 12, color: '#444', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ color: '#2A2A2A', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 900, letterSpacing: 2, marginBottom: 4 }}>O QUE SERÁ EXECUTADO</div>
                <div>✓ <span style={{ color: '#555' }}>XP das aulas + bônus do módulo adicionados ao colaborador</span></div>
                <div>✓ <span style={{ color: '#555' }}>Certificado gerado automaticamente (ou reutilizado se já existe)</span></div>
                <div style={{ marginTop: 4, color: '#2A2A2A', fontStyle: 'italic' }}>Não cria registros de progresso individual de aulas.</div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onClose} style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid #2A2A2A', borderRadius: 8, color: '#666', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 800, cursor: 'pointer', transition: 'all .15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#444'; e.currentTarget.style.color = '#CCC'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#2A2A2A'; e.currentTarget.style.color = '#666'; }}>
                CANCELAR
              </button>
              <button
                onClick={handleSimular}
                disabled={!selectedId || simulando}
                style={{ flex: 2, padding: '11px', background: selectedId && !simulando ? '#7C3AED' : '#111', border: `1px solid ${selectedId && !simulando ? '#7C3AED' : '#2A2A2A'}`, borderRadius: 8, color: selectedId && !simulando ? '#FFF' : '#444', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 900, cursor: selectedId && !simulando ? 'pointer' : 'not-allowed', transition: 'all .15s', letterSpacing: 1 }}
                onMouseEnter={e => { if (selectedId && !simulando) e.currentTarget.style.background = '#6D28D9'; }}
                onMouseLeave={e => { if (selectedId && !simulando) e.currentTarget.style.background = '#7C3AED'; }}
              >
                {simulando ? 'SIMULANDO...' : '🧪 SIMULAR CONCLUSÃO'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ background: '#22A06B15', border: '1px solid #22A06B44', borderRadius: 12, padding: '20px', textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎓</div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, fontWeight: 900, color: '#22A06B', letterSpacing: 2, marginBottom: 4 }}>SIMULAÇÃO CONCLUÍDA!</div>
              <div style={{ fontSize: 13, color: '#555', marginBottom: 12 }}>
                {resultado.modulo.titulo} · <span style={{ color: '#F9A800', fontWeight: 700 }}>+{resultado.xpTotal} XP</span>
              </div>
              <button
                onClick={() => window.open(`/certificado/${resultado.cert.codigoValidacao}`, '_blank')}
                style={{ padding: '10px 24px', background: '#FFC107', border: 'none', borderRadius: 8, color: '#000', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 900, cursor: 'pointer' }}
              >📄 VER CERTIFICADO</button>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => { setResultado(null); setSelectedId(''); }}
                style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid #2A2A2A', borderRadius: 8, color: '#666', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 800, cursor: 'pointer', transition: 'all .15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#444'; e.currentTarget.style.color = '#CCC'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#2A2A2A'; e.currentTarget.style.color = '#666'; }}
              >SIMULAR OUTRO</button>
              <button onClick={onClose} style={{ flex: 1, padding: '10px', background: '#F9A800', border: 'none', borderRadius: 8, color: '#000', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 900, cursor: 'pointer' }}>FECHAR</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// SEÇÃO: Lista de Colaboradores
// ═══════════════════════════════════════════════════════
function SecaoListaColaboradores({ toast }) {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState(null);
  const [excluindo, setExcluindo] = useState(null);
  const [simularUsuario, setSimularUsuario] = useState(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getUsuarios();
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (e) {
      toast(e.message || 'Erro ao carregar colaboradores', false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const handleExcluir = async (u) => {
    const confirmado = window.confirm(`Excluir "${u.nome}"?\n\nEsta ação desativa o acesso do colaborador à plataforma.`);
    if (!confirmado) return;
    setExcluindo(u.id);
    try {
      await api.excluirUsuario(u.id);
      toast(`"${u.nome}" removido com sucesso`, true);
      setUsuarios(prev => prev.filter(x => x.id !== u.id));
    } catch (e) {
      toast(e.message || 'Erro ao excluir colaborador', false);
    } finally {
      setExcluindo(null);
    }
  };

  const nivel = (xp = 0) => Math.floor(xp / 300) + 1;

  const isGestorCargo = (cargo = '') => {
    const kws = ['admin', 'gestor', 'gestora', 'gerente', 'supervisor', 'supervisora', 'coordenador', 'coordenadora'];
    return (cargo ?? '').split(/[/,;]/).map(p => p.trim().toLowerCase()).some(p => kws.some(kw => p.includes(kw)));
  };

  const renderCard = (u) => {
    const av = (u.nome ?? '').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';
    const isExcluindo = excluindo === u.id;
    const gestor = isGestorCargo(u.cargo);
    return (
      <div
        key={u.id}
        style={{
          background: '#161616',
          border: `1px solid ${gestor ? '#FFC10722' : '#1E1E1E'}`,
          borderRadius: 12, padding: '18px 20px',
          display: 'flex', flexDirection: 'column', gap: 12,
          transition: 'border-color .15s',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = gestor ? '#FFC10744' : '#2A2A2A'}
        onMouseLeave={e => e.currentTarget.style.borderColor = gestor ? '#FFC10722' : '#1E1E1E'}
      >
        {/* cabeçalho */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
            background: gestor ? '#FFC10722' : '#F9A80022',
            border: `2px solid ${gestor ? '#FFC10755' : '#F9A80055'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 14,
            color: gestor ? '#FFC107' : '#F9A800',
          }}>{av}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 800, color: '#E0E0E0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.nome}</div>
            <div style={{ fontSize: 11, color: '#555', marginTop: 1 }}>{u.cargo}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
            {gestor && (
              <div style={{ background: '#FFC10722', border: '1px solid #FFC10744', borderRadius: 20, padding: '2px 9px', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 800, color: '#FFC107', letterSpacing: 0.5 }}>
                ⚙️ GESTOR
              </div>
            )}
            <div style={{ background: '#F9A80015', border: '1px solid #F9A80033', borderRadius: 20, padding: '3px 10px', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, fontWeight: 800, color: '#F9A800' }}>
              Nv {nivel(u.xp)}
            </div>
          </div>
        </div>

        {/* dados */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#555' }}>
            <span style={{ color: '#333', fontSize: 13 }}>✉</span>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</span>
          </div>
          {u.telefone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#555' }}>
              <span style={{ color: '#333', fontSize: 13 }}>💬</span>
              <span>{u.telefone}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#555' }}>
            <span style={{ color: '#333', fontSize: 13 }}>📅</span>
            <span>{u.criadoEm ? new Date(u.criadoEm).toLocaleDateString('pt-BR') : '—'}</span>
          </div>
          {u.xp > 0 && (
            <div style={{ marginTop: 2 }}>
              <ProgressBar pct={((u.xp % 300) / 300) * 100} color="#F9A800" h={3} />
              <span style={{ fontSize: 10, color: '#3A3A3A' }}>{u.xp} XP</span>
            </div>
          )}
        </div>

        {/* ações */}
        <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
          <button
            onClick={() => setPerfil(u)}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 7, border: '1px solid #2A2A2A',
              background: '#1A1A1A', color: '#AAA', cursor: 'pointer',
              fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 700,
              transition: 'all .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#F9A80055'; e.currentTarget.style.color = '#F9A800'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#2A2A2A'; e.currentTarget.style.color = '#AAA'; }}
          >VER PERFIL</button>
          <button
            onClick={() => handleExcluir(u)}
            disabled={isExcluindo}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 7,
              border: '1px solid #E05A2B44', background: '#E05A2B11',
              color: isExcluindo ? '#555' : '#E05A2B', cursor: isExcluindo ? 'not-allowed' : 'pointer',
              fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 700,
              transition: 'all .15s', opacity: isExcluindo ? 0.5 : 1,
            }}
            onMouseEnter={e => { if (!isExcluindo) e.currentTarget.style.background = '#E05A2B22'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#E05A2B11'; }}
          >{isExcluindo ? 'EXCLUINDO...' : 'EXCLUIR'}</button>
        </div>
        {import.meta.env.DEV && (
          <button
            onClick={() => setSimularUsuario(u)}
            style={{
              width: '100%', padding: '7px 0', borderRadius: 7,
              border: '1px dashed #7C3AED44', background: 'transparent',
              color: '#7C3AED99', cursor: 'pointer',
              fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, fontWeight: 700,
              transition: 'all .15s', letterSpacing: 0.5,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#7C3AED88'; e.currentTarget.style.color = '#7C3AED'; e.currentTarget.style.background = '#7C3AED11'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#7C3AED44'; e.currentTarget.style.color = '#7C3AED99'; e.currentTarget.style.background = 'transparent'; }}
          >🧪 Simular Conclusão</button>
        )}
      </div>
    );
  };

  const gestores = usuarios.filter(u => isGestorCargo(u.cargo));
  const colaboradores = usuarios.filter(u => !isGestorCargo(u.cargo));

  return (
    <>
      <ModalPerfil usuario={perfil} onClose={() => setPerfil(null)} />
      {import.meta.env.DEV && simularUsuario && (
        <ModalSimular usuario={simularUsuario} onClose={() => setSimularUsuario(null)} toast={toast} />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 22, fontWeight: 900, color: '#F0F0F0' }}>
            Colaboradores Cadastrados
          </div>
          {!loading && (
            <div style={{ fontSize: 12, color: '#444', marginTop: 2 }}>
              {gestores.length > 0 && `${gestores.length} gestor${gestores.length !== 1 ? 'es' : ''} · `}
              {colaboradores.length} colaborador{colaboradores.length !== 1 ? 'es' : ''}
            </div>
          )}
        </div>
        <Btn variant="ghost" onClick={carregar} style={{ fontSize: 12, padding: '7px 14px' }}>↻ ATUALIZAR</Btn>
      </div>

      {loading ? (
        <div style={{ color: '#2A2A2A', fontSize: 13, padding: '40px 0', textAlign: 'center' }}>Carregando...</div>
      ) : usuarios.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>👤</div>
          <div style={{ color: '#333', fontSize: 14 }}>Nenhum usuário cadastrado ainda.</div>
        </Card>
      ) : (
        <>
          {gestores.length > 0 && (
            <>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 800, color: '#FFC107', letterSpacing: 2.5, marginBottom: 12 }}>
                ⚙️ GESTORES
              </div>
              <div className="grid-auto" style={{ marginBottom: colaboradores.length > 0 ? 28 : 0 }}>
                {gestores.map(u => renderCard(u))}
              </div>
            </>
          )}
          {colaboradores.length > 0 && (
            <>
              {gestores.length > 0 && (
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 800, color: '#555', letterSpacing: 2.5, marginBottom: 12 }}>
                  👤 COLABORADORES
                </div>
              )}
              <div className="grid-auto">
                {colaboradores.map(u => renderCard(u))}
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════
const TABS = [
  { id: 'visao', label: '◈ Visão Geral' },
  { id: 'trilhas', label: '🛤 Trilhas' },
  { id: 'modulos', label: '📦 Módulos' },
  { id: 'avaliacoes', label: '📝 Avaliações' },
  { id: 'colaboradores', label: '👤 Cadastrar' },
  { id: 'lista', label: '📋 Colaboradores' },
];

export default function Manager() {
  const [tab, setTab] = useState('visao');
  const [toast, setToast] = useState({ msg: '', ok: true });

  const showToast = (msg, ok) => {
    setToast({ msg, ok });
    setTimeout(() => setToast({ msg: '', ok: true }), 3500);
  };

  return (
    <div className="page-padding" style={{ fontFamily: 'Barlow, sans-serif' }}>
      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 36, fontWeight: 900, color: '#F0F0F0', marginBottom: 4 }}>
        Painel do Gestor
      </div>
      <div style={{ color: '#444', marginBottom: 24, fontSize: 13 }}>
        Gerencie módulos, colaboradores e acompanhe o progresso da equipe
      </div>

      {/* Tabs */}
      <div className="manager-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '8px 18px', borderRadius: 7, border: 'none', cursor: 'pointer',
              background: tab === t.id ? '#F9A800' : 'transparent',
              color: tab === t.id ? '#000' : '#555',
              fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 13,
              letterSpacing: 0.5, transition: 'all .15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'visao' && <SecaoVisaoGeral />}
      {tab === 'trilhas' && <SecaoTrilhas toast={showToast} />}
      {tab === 'modulos' && <SecaoModulos toast={showToast} />}
      {tab === 'avaliacoes' && <SecaoAvaliacoes toast={showToast} />}
      {tab === 'colaboradores' && <SecaoColaboradores toast={showToast} />}
      {tab === 'lista' && <SecaoListaColaboradores toast={showToast} />}

      <Toast msg={toast.msg} ok={toast.ok} />
    </div>
  );
}
