import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api/index.js';

const formatarCH = (horas) => {
  if (!horas || horas <= 0) return '1 hora';
  if (horas < 1) return `${Math.round(horas * 60)} min`;
  const h = Math.floor(horas);
  const m = Math.round((horas - h) * 60);
  if (m === 0) return h === 1 ? '1 hora' : `${h} horas`;
  return `${h}h ${m}min`;
};

const formatarData = (iso) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

export default function CertificadoPage() {
  const { codigo } = useParams();
  const [searchParams] = useSearchParams();
  const autoPrint = searchParams.get('print') === '1';
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    api.getCertificado(codigo)
      .then(data => {
        setCert(data);
        if (autoPrint) setTimeout(() => window.print(), 600);
      })
      .catch(e => setErro(e.message || 'Certificado não encontrado'))
      .finally(() => setLoading(false));
  }, [codigo]);

  const handleCompartilhar = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      window.prompt('Copie o link do certificado:', window.location.href);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Barlow Condensed, sans-serif', color: '#444', fontSize: 18, letterSpacing: 2 }}>
        CARREGANDO CERTIFICADO...
      </div>
    );
  }

  if (erro || !cert) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A0A0A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: 'Barlow Condensed, sans-serif' }}>
        <div style={{ fontSize: 48 }}>🎓</div>
        <div style={{ color: '#555', fontSize: 16 }}>{erro || 'Certificado não encontrado'}</div>
        <div style={{ fontSize: 12, color: '#333', fontFamily: 'monospace' }}>{codigo}</div>
      </div>
    );
  }

  const secoes = cert.secoes || [];
  const temNota = cert.nota !== null && cert.nota !== undefined;

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
          body, html { margin: 0; padding: 0; background: white !important; }
          .cert-page-wrapper { background: white !important; padding: 0 !important; min-height: unset !important; align-items: flex-start !important; }
          .cert-sheet { box-shadow: none !important; width: 100% !important; }
          @page { size: A4 landscape; margin: 0; }
        }
        @media screen {
          .cert-sheet { min-width: 900px; }
        }
      `}</style>

      <div className="cert-page-wrapper" style={{ minHeight: '100vh', background: '#111', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 16px 48px', fontFamily: 'Barlow, sans-serif' }}>

        {/* ── Barra de ações ── */}
        <div className="no-print" style={{ width: '100%', maxWidth: 1122, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <button
            onClick={() => window.history.back()}
            style={{ background: 'none', border: '1px solid #2A2A2A', color: '#666', padding: '8px 18px', borderRadius: 7, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 13, transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.color = '#CCC'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#2A2A2A'; e.currentTarget.style.color = '#666'; }}
          >← Voltar</button>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleCompartilhar}
              style={{ padding: '10px 22px', background: 'transparent', border: '1px solid #2A2A2A', borderRadius: 8, color: copiado ? '#22A06B' : '#888', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 14, cursor: 'pointer', transition: 'all .15s' }}
              onMouseEnter={e => { if (!copiado) { e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.color = '#CCC'; } }}
              onMouseLeave={e => { if (!copiado) { e.currentTarget.style.borderColor = '#2A2A2A'; e.currentTarget.style.color = '#888'; } }}
            >
              {copiado ? '✓ Link copiado!' : '🔗 Compartilhar'}
            </button>
            <button
              onClick={() => window.print()}
              style={{ padding: '10px 22px', background: '#FFC107', border: 'none', borderRadius: 8, color: '#000', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 14, cursor: 'pointer', transition: 'background .15s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#FFD54F'}
              onMouseLeave={e => e.currentTarget.style.background = '#FFC107'}
            >📄 Baixar PDF</button>
          </div>
        </div>

        {/* ── Certificado ── */}
        <div className="cert-sheet" style={{ width: 1122, background: 'white', boxShadow: '0 32px 100px rgba(0,0,0,0.8)', position: 'relative', boxSizing: 'border-box' }}>

          {/* Cantos decorativos */}
          {[[0,0],[0,'auto'],[`auto`,0],['auto','auto']].map(([t,r,b,l], i) => {
            const pos = [
              { top: 0, left: 0 }, { top: 0, right: 0 },
              { bottom: 0, left: 0 }, { bottom: 0, right: 0 },
            ][i];
            return <div key={i} style={{ position: 'absolute', ...pos, width: 18, height: 18, background: '#FFC107', zIndex: 2 }} />;
          })}

          {/* Borda dourada externa */}
          <div style={{ border: '10px solid #FFC107', boxSizing: 'border-box', padding: 10 }}>
            {/* Borda interna fina */}
            <div style={{ border: '1px solid #FFC10777', boxSizing: 'border-box', padding: '30px 60px 24px', display: 'flex', flexDirection: 'column', minHeight: 714 }}>

              {/* ── HEADER ── */}
              <div style={{ textAlign: 'center', marginBottom: 22 }}>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 24, fontWeight: 900, color: '#111', letterSpacing: 6, marginBottom: 10 }}>
                  🍔 GALLIATE ACADEMY
                </div>
                {/* Divisor dourado */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ flex: 1, maxWidth: 120, height: 1, background: 'linear-gradient(to right, transparent, #FFC107)' }} />
                  <div style={{ width: 7, height: 7, background: '#FFC107', transform: 'rotate(45deg)', flexShrink: 0 }} />
                  <div style={{ width: 7, height: 7, background: '#FFC107', transform: 'rotate(45deg)', flexShrink: 0 }} />
                  <div style={{ width: 7, height: 7, background: '#FFC107', transform: 'rotate(45deg)', flexShrink: 0 }} />
                  <div style={{ flex: 1, maxWidth: 120, height: 1, background: 'linear-gradient(to left, transparent, #FFC107)' }} />
                </div>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 800, color: '#AAAAAA', letterSpacing: 7 }}>
                  CERTIFICADO DE CONCLUSÃO
                </div>
              </div>

              {/* ── CORPO PRINCIPAL ── */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 5 }}>
                <p style={{ margin: 0, fontSize: 14, color: '#888', fontStyle: 'italic', letterSpacing: 1 }}>
                  Certificamos que
                </p>

                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 46, fontWeight: 900, color: '#111', letterSpacing: 3, lineHeight: 1, marginTop: 6, marginBottom: 2 }}>
                  {(cert.usuario?.nome || '').toUpperCase()}
                </div>

                <div style={{ fontSize: 13, color: '#999', fontStyle: 'italic', marginBottom: 10 }}>
                  {cert.usuario?.cargo}
                </div>

                <p style={{ margin: 0, fontSize: 14, color: '#777', letterSpacing: 0.5 }}>
                  concluiu com êxito o módulo
                </p>

                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 32, fontWeight: 900, color: '#FFC107', letterSpacing: 3, lineHeight: 1.1, marginTop: 8, marginBottom: 2 }}>
                  {(cert.modulo?.titulo || '').toUpperCase()}
                </div>

                <p style={{ margin: 0, fontSize: 13, color: '#888', marginTop: 6 }}>
                  com carga horária de{' '}
                  <span style={{ fontWeight: 700, color: '#555' }}>{formatarCH(cert.cargaHoraria)}</span>
                  {temNota && (
                    <> e nota{' '}<span style={{ fontWeight: 700, color: '#555' }}>{cert.nota}%</span></>
                  )}
                </p>
              </div>

              {/* ── CONTEÚDO ESTUDADO ── */}
              {secoes.length > 0 && (
                <div style={{ marginTop: 18, borderTop: '1px solid #FFC10733', paddingTop: 14 }}>
                  <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 9, fontWeight: 800, color: '#BBBBBB', letterSpacing: 4, textAlign: 'center', marginBottom: 10 }}>
                    CONTEÚDO ESTUDADO
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: secoes.length > 2 ? '1fr 1fr' : '1fr', gap: '5px 40px' }}>
                    {secoes.map(secao => (
                      <div key={secao.id} style={{ fontSize: 11, color: '#777', lineHeight: 1.5 }}>
                        <span style={{ fontWeight: 700, color: '#444' }}>{secao.titulo}:</span>{' '}
                        <span>{(secao.aulas || []).map(a => a.titulo).join(' · ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── RODAPÉ ── */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 18, borderTop: '1px solid #FFC10733', paddingTop: 12 }}>
                <div>
                  <div style={{ fontSize: 10, color: '#BBBBBB', letterSpacing: 1, marginBottom: 2, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800 }}>DATA DE EMISSÃO</div>
                  <div style={{ fontSize: 12, color: '#777' }}>{formatarData(cert.emitidoEm)}</div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 900, color: '#CCCCCC', letterSpacing: 3 }}>GALLIATE ACADEMY</div>
                  <div style={{ fontSize: 10, color: '#CCCCCC', fontStyle: 'italic' }}>Plataforma de Treinamento Interno</div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: '#BBBBBB', letterSpacing: 1, marginBottom: 2, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800 }}>CÓDIGO DE VALIDAÇÃO</div>
                  <div style={{ fontSize: 10, color: '#999', fontFamily: 'monospace', wordBreak: 'break-all', maxWidth: 260 }}>{cert.codigoValidacao}</div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Nota de validação */}
        <div className="no-print" style={{ marginTop: 20, fontSize: 11, color: '#2A2A2A', textAlign: 'center', lineHeight: 1.6 }}>
          Para verificar a autenticidade deste certificado, acesse o link desta página.
        </div>
      </div>
    </>
  );
}
