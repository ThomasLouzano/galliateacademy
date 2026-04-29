import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/index.js';
import { useAuth } from '../context/AuthContext.jsx';

const LETRAS = ['A', 'B', 'C', 'D'];

function OptionBtn({ label, selected, onClick, disabled, correct, wrong }) {
  let bg = 'transparent';
  let border = '#2A2A2A';
  let color = '#888';

  if (correct) { bg = '#22A06B22'; border = '#22A06B66'; color = '#22A06B'; }
  else if (wrong) { bg = '#E05A2B22'; border = '#E05A2B66'; color = '#E05A2B'; }
  else if (selected) { bg = '#FFC10720'; border = '#FFC10766'; color = '#FFC107'; }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%', textAlign: 'left', padding: '14px 18px',
        background: bg, border: `1px solid ${border}`, borderRadius: 10,
        color, fontFamily: 'Barlow, sans-serif', fontSize: 14, lineHeight: 1.5,
        cursor: disabled ? 'default' : 'pointer', transition: 'all .15s',
        display: 'flex', alignItems: 'center', gap: 12,
      }}
    >
      {label}
    </button>
  );
}

export default function AvaliacaoPage() {
  const { moduloId } = useParams();
  const navigate = useNavigate();
  const { user, addXP } = useAuth();

  const [avaliacao, setAvaliacao] = useState(null);
  const [modulo, setModulo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  // quiz state
  const [respostas, setRespostas] = useState({});
  const [submetido, setSubmetido] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [submetendo, setSubmetendo] = useState(false);
  const [tentativasUsadas, setTentativasUsadas] = useState(0);
  const [emitindoCert, setEmitindoCert] = useState(false);
  const xpConcedidoRef = useRef(false);
  const certEmitidoRef = useRef(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getAvaliacoes(moduloId),
      api.getModuloById(moduloId),
    ])
      .then(([avs, mod]) => {
        setModulo(mod);
        const av = Array.isArray(avs) && avs.length > 0 ? avs[0] : null;
        setAvaliacao(av);
      })
      .catch(e => setErro(e.message || 'Erro ao carregar avaliação'))
      .finally(() => setLoading(false));
  }, [moduloId]);

  const handleResponder = (questaoId, valor) => {
    if (submetido) return;
    setRespostas(prev => ({ ...prev, [questaoId]: valor }));
  };

  const todasRespondidas = avaliacao?.questoes?.every(q => respostas[q.id] !== undefined);

  const handleSubmeter = async () => {
    if (!todasRespondidas) return;
    setSubmetendo(true);
    try {
      const res = await api.submeterAvaliacao(avaliacao.id, respostas);
      setResultado(res);
      setSubmetido(true);
      setTentativasUsadas(prev => prev + 1);
      if (res.aprovado && !xpConcedidoRef.current && user?.id) {
        xpConcedidoRef.current = true;
        addXP(res.xpBonus || avaliacao.xpBonus || 100);
      }
    } catch (e) {
      alert(e.message || 'Erro ao submeter avaliação');
    } finally {
      setSubmetendo(false);
    }
  };

  const handleTentarNovamente = () => {
    setRespostas({});
    setSubmetido(false);
    setResultado(null);
  };

  const handleEmitirCertificado = async () => {
    if (emitindoCert || certEmitidoRef.current || !user?.id) return;
    setEmitindoCert(true);
    try {
      const cert = await api.gerarCertificado(user.id, Number(moduloId), avaliacao.id, resultado.nota);
      certEmitidoRef.current = true;
      navigate(`/certificado/${cert.codigoValidacao}`);
    } catch (e) {
      alert(e.message || 'Erro ao gerar certificado');
      setEmitindoCert(false);
    }
  };

  const tentativasRestantes = avaliacao ? avaliacao.tentativas - tentativasUsadas : 0;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Barlow Condensed, sans-serif', color: '#444', fontSize: 18, letterSpacing: 2 }}>
        CARREGANDO AVALIAÇÃO...
      </div>
    );
  }

  if (erro || !avaliacao) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A0A0A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: 'Barlow Condensed, sans-serif' }}>
        <div style={{ fontSize: 40 }}>📋</div>
        <div style={{ color: '#555', fontSize: 16 }}>{erro || 'Nenhuma avaliação cadastrada para este módulo.'}</div>
        <button onClick={() => navigate(`/modulo/${moduloId}`)} style={{ padding: '10px 24px', background: '#FFC107', border: 'none', borderRadius: 8, color: '#000', fontWeight: 900, cursor: 'pointer', fontSize: 14, fontFamily: 'Barlow Condensed, sans-serif' }}>← VOLTAR AO MÓDULO</button>
      </div>
    );
  }

  const questoes = avaliacao.questoes || [];

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', fontFamily: 'Barlow, sans-serif', color: '#F0F0F0', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: '#0D0D0D', borderBottom: '1px solid #161616', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 18, position: 'sticky', top: 0, zIndex: 200 }}>
        <button
          onClick={() => navigate(`/modulo/${moduloId}`)}
          style={{ background: 'none', border: '1px solid #222', color: '#666', padding: '7px 16px', borderRadius: 7, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, fontWeight: 800, letterSpacing: 1, transition: 'all .15s', flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#FFC107'; e.currentTarget.style.color = '#FFC107'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#222'; e.currentTarget.style.color = '#666'; }}
        >← VOLTAR</button>
        <div style={{ width: 1, height: 28, background: '#1A1A1A', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 900, color: '#FFC107', letterSpacing: 3, marginBottom: 1 }}>AVALIAÇÃO</div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15, fontWeight: 800, color: '#CCC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {modulo?.titulo && <span style={{ color: '#444' }}>{modulo.titulo} · </span>}
            {avaliacao.titulo}
          </div>
        </div>
        <div style={{ flexShrink: 0, display: 'flex', gap: 8 }}>
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 800, color: '#444' }}>mín. {avaliacao.notaMinima}%</span>
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 800, color: '#555' }}>·</span>
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 800, color: '#444' }}>{questoes.length} questões</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, maxWidth: 720, width: '100%', margin: '0 auto', padding: '32px 20px 60px' }}>

        {/* Resultado */}
        {submetido && resultado && (
          <div style={{
            marginBottom: 36,
            background: resultado.aprovado ? '#22A06B15' : '#E05A2B15',
            border: `1px solid ${resultado.aprovado ? '#22A06B44' : '#E05A2B44'}`,
            borderRadius: 16, padding: '28px 32px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 52, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', color: resultado.aprovado ? '#22A06B' : '#E05A2B', lineHeight: 1, marginBottom: 6 }}>
              {resultado.nota}%
            </div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 22, fontWeight: 900, color: resultado.aprovado ? '#22A06B' : '#E05A2B', letterSpacing: 2, marginBottom: 8 }}>
              {resultado.aprovado ? '🎉 APROVADO!' : '✗ REPROVADO'}
            </div>
            <div style={{ fontSize: 13, color: '#555', marginBottom: 16 }}>
              Nota mínima: {resultado.notaMinima}% · Sua nota: {resultado.nota}%
            </div>
            {resultado.aprovado && (
              <>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#F9A80015', border: '1px solid #F9A80033', borderRadius: 20, padding: '6px 18px', marginBottom: 20 }}>
                  <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 900, color: '#F9A800' }}>⚡+{resultado.xpBonus || avaliacao.xpBonus} XP conquistados!</span>
                </div>
                <div>
                  <button
                    onClick={handleEmitirCertificado}
                    disabled={emitindoCert || certEmitidoRef.current}
                    style={{ padding: '13px 32px', background: emitindoCert ? '#111' : '#FFC107', border: `1px solid ${emitindoCert ? '#2A2A2A' : '#FFC107'}`, borderRadius: 9, color: emitindoCert ? '#444' : '#000', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15, fontWeight: 900, cursor: emitindoCert ? 'not-allowed' : 'pointer', boxShadow: emitindoCert ? 'none' : '0 4px 20px #FFC10740', transition: 'all .15s', letterSpacing: 1 }}
                    onMouseEnter={e => { if (!emitindoCert) e.currentTarget.style.background = '#FFD54F'; }}
                    onMouseLeave={e => { if (!emitindoCert) e.currentTarget.style.background = '#FFC107'; }}
                  >
                    {emitindoCert ? 'GERANDO CERTIFICADO...' : '🎓 EMITIR CERTIFICADO'}
                  </button>
                </div>
              </>
            )}
            {!resultado.aprovado && tentativasRestantes > 0 && (
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={handleTentarNovamente}
                  style={{ padding: '11px 28px', background: '#FFC107', border: 'none', borderRadius: 8, color: '#000', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 900, cursor: 'pointer' }}
                >
                  ↺ TENTAR NOVAMENTE ({tentativasRestantes} restante{tentativasRestantes !== 1 ? 's' : ''})
                </button>
              </div>
            )}
            {!resultado.aprovado && tentativasRestantes <= 0 && (
              <div style={{ fontSize: 12, color: '#555' }}>Você esgotou todas as tentativas disponíveis.</div>
            )}
          </div>
        )}

        {/* Questões */}
        {questoes.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#333', padding: '60px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <div>Esta avaliação ainda não tem questões cadastradas.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {questoes.map((q, idx) => {
              const alts = (() => { try { return q.alternativas ? JSON.parse(q.alternativas) : []; } catch { return []; } })();
              const resposta = respostas[q.id];
              const acertou = resultado?.resultado?.find(r => r.questaoId === q.id)?.acertou;
              const mostrarGabarito = submetido;

              return (
                <div key={q.id} style={{ background: '#111', border: `1px solid ${mostrarGabarito ? (acertou ? '#22A06B33' : '#E05A2B33') : '#1E1E1E'}`, borderRadius: 14, padding: '22px 24px', transition: 'border-color .2s' }}>
                  {/* Número + tipo */}
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 900, color: '#FFC107', background: '#FFC10720', border: '1px solid #FFC10733', borderRadius: 4, padding: '2px 8px', flexShrink: 0 }}>Q{idx + 1}</span>
                    <span style={{ fontSize: 10, color: '#333', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, letterSpacing: 1 }}>{q.tipo === 'vf' ? 'VERDADEIRO / FALSO' : 'MÚLTIPLA ESCOLHA'}</span>
                    {mostrarGabarito && (
                      <span style={{ marginLeft: 'auto', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 900, color: acertou ? '#22A06B' : '#E05A2B' }}>
                        {acertou ? '✓ CORRETO' : '✗ ERRADO'}
                      </span>
                    )}
                  </div>

                  {/* Enunciado */}
                  <div style={{ fontSize: 16, color: '#E0E0E0', lineHeight: 1.6, marginBottom: 18, fontWeight: 500 }}>
                    {q.enunciado}
                  </div>

                  {/* Alternativas */}
                  {q.tipo === 'multipla' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {alts.map((alt, i) => {
                        const isSelected = String(resposta) === String(i);
                        const isCorreta = mostrarGabarito && String(i) === String(q.respostaCorreta);
                        const isErrada = mostrarGabarito && isSelected && !isCorreta;
                        return (
                          <OptionBtn
                            key={i}
                            label={<><span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, marginRight: 4 }}>{LETRAS[i]}.</span>{alt}</>}
                            selected={isSelected}
                            correct={isCorreta}
                            wrong={isErrada}
                            disabled={submetido}
                            onClick={() => handleResponder(q.id, String(i))}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 10 }}>
                      {[['true', '✓ VERDADEIRO'], ['false', '✗ FALSO']].map(([val, lbl]) => {
                        const isSelected = String(resposta) === val;
                        const isCorreta = mostrarGabarito && val === String(q.respostaCorreta);
                        const isErrada = mostrarGabarito && isSelected && !isCorreta;
                        return (
                          <OptionBtn
                            key={val}
                            label={lbl}
                            selected={isSelected}
                            correct={isCorreta}
                            wrong={isErrada}
                            disabled={submetido}
                            onClick={() => handleResponder(q.id, val)}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Botão submeter */}
        {!submetido && questoes.length > 0 && (
          <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleSubmeter}
              disabled={!todasRespondidas || submetendo}
              style={{
                padding: '15px 36px',
                background: todasRespondidas && !submetendo ? '#FFC107' : '#111',
                border: `1px solid ${todasRespondidas && !submetendo ? '#FFC107' : '#1E1E1E'}`,
                borderRadius: 10, cursor: todasRespondidas && !submetendo ? 'pointer' : 'not-allowed',
                fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15, fontWeight: 900,
                color: todasRespondidas && !submetendo ? '#000' : '#333', letterSpacing: 1,
                transition: 'all .2s',
                boxShadow: todasRespondidas && !submetendo ? '0 4px 20px #FFC10740' : 'none',
              }}
            >
              {submetendo ? 'ENVIANDO...' : !todasRespondidas ? `RESPONDA TODAS AS QUESTÕES (${Object.keys(respostas).length}/${questoes.length})` : 'ENVIAR RESPOSTAS →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
