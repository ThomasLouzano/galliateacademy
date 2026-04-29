import { useState, useEffect, useRef, useCallback } from 'react';

const PDFJS_VERSION = '3.11.174';
const PDFJS_SRC = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`;
const PDFJS_WORKER = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;

function loadPdfJs() {
  return new Promise((resolve, reject) => {
    if (window.pdfjsLib) { resolve(window.pdfjsLib); return; }
    const script = document.createElement('script');
    script.src = PDFJS_SRC;
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
      resolve(window.pdfjsLib);
    };
    script.onerror = () => reject(new Error('Falha ao carregar PDF.js'));
    document.head.appendChild(script);
  });
}

const BTN = ({ onClick, disabled, children, title, style = {} }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    style={{
      padding: '7px 14px', borderRadius: 6,
      border: `1px solid ${disabled ? '#1E1E1E' : '#2A2A2A'}`,
      background: disabled ? '#0D0D0D' : '#1A1A1A',
      color: disabled ? '#2A2A2A' : '#CCC',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 700,
      transition: 'all .15s', lineHeight: 1,
      ...style,
    }}
    onMouseEnter={e => { if (!disabled) { e.currentTarget.style.borderColor = '#FFC10755'; e.currentTarget.style.color = '#FFC107'; } }}
    onMouseLeave={e => { if (!disabled) { e.currentTarget.style.borderColor = '#2A2A2A'; e.currentTarget.style.color = '#CCC'; } }}
  >
    {children}
  </button>
);

export default function PdfReader({ url }) {
  const canvasRef = useRef(null);
  const pdfRef = useRef(null);
  const renderTaskRef = useRef(null);

  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [zoom, setZoom] = useState(1.3);
  const [carregando, setCarregando] = useState(true);
  const [renderizando, setRenderizando] = useState(false);
  const [erro, setErro] = useState(null);

  // 1. Carrega PDF.js do CDN uma única vez
  useEffect(() => {
    loadPdfJs().catch(e => setErro(e.message));
  }, []);

  // 2. Carrega o documento quando a URL muda
  useEffect(() => {
    if (!url) return;
    let cancelado = false;

    setCarregando(true);
    setErro(null);
    setPagina(1);
    setTotal(0);

    if (pdfRef.current) { pdfRef.current.destroy(); pdfRef.current = null; }

    const tentar = async () => {
      try {
        await loadPdfJs();
        const pdf = await window.pdfjsLib.getDocument({ url, withCredentials: false }).promise;
        if (cancelado) { pdf.destroy(); return; }
        pdfRef.current = pdf;
        setTotal(pdf.numPages);
      } catch (e) {
        if (!cancelado) setErro('Não foi possível carregar o PDF: ' + (e.message || 'erro desconhecido'));
      } finally {
        if (!cancelado) setCarregando(false);
      }
    };

    tentar();
    return () => { cancelado = true; };
  }, [url]);

  // 3. Renderiza a página atual no canvas
  const renderPagina = useCallback(async () => {
    if (!pdfRef.current || !canvasRef.current || total === 0) return;

    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }

    setRenderizando(true);
    try {
      const page = await pdfRef.current.getPage(pagina);
      const viewport = page.getViewport({ scale: zoom });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const task = page.render({ canvasContext: ctx, viewport });
      renderTaskRef.current = task;
      await task.promise;
    } catch (e) {
      if (e?.name !== 'RenderingCancelledException') console.error('[PdfReader]', e);
    } finally {
      setRenderizando(false);
    }
  }, [pagina, zoom, total]);

  useEffect(() => {
    if (!carregando && !erro) renderPagina();
  }, [renderPagina, carregando, erro]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (renderTaskRef.current) renderTaskRef.current.cancel();
      if (pdfRef.current) { pdfRef.current.destroy(); pdfRef.current = null; }
    };
  }, []);

  const zoomMenos = () => setZoom(z => Math.max(0.5, Math.round((z - 0.2) * 10) / 10));
  const zoomMais  = () => setZoom(z => Math.min(3.0, Math.round((z + 0.2) * 10) / 10));

  return (
    <div style={{ background: '#0A0A0A', border: '1px solid #1E1E1E', borderRadius: 12, overflow: 'hidden' }}>

      {/* ── Barra de ferramentas ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
        padding: '10px 14px', background: '#111111', borderBottom: '1px solid #1A1A1A',
      }}>

        {/* Navegação */}
        <BTN onClick={() => setPagina(p => p - 1)} disabled={pagina <= 1}>← Anterior</BTN>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 4px' }}>
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, color: '#444' }}>Página</span>
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 900, color: '#FFC107' }}>{total ? pagina : '—'}</span>
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, color: '#444' }}>de</span>
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 900, color: '#FFC107' }}>{total || '—'}</span>
        </div>

        <BTN onClick={() => setPagina(p => p + 1)} disabled={pagina >= total || total === 0}>Próxima →</BTN>

        <div style={{ flex: 1 }} />

        {/* Zoom */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <BTN onClick={zoomMenos} disabled={zoom <= 0.5} title="Diminuir zoom" style={{ padding: '7px 11px', fontSize: 16 }}>−</BTN>
          <span style={{
            fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 800,
            color: '#FFC107', minWidth: 42, textAlign: 'center',
          }}>
            {Math.round(zoom * 100)}%
          </span>
          <BTN onClick={zoomMais} disabled={zoom >= 3.0} title="Aumentar zoom" style={{ padding: '7px 11px', fontSize: 16 }}>＋</BTN>
        </div>

        {/* Indicador de renderização */}
        {renderizando && (
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, color: '#333', letterSpacing: 1 }}>
            ⟳
          </span>
        )}
      </div>

      {/* ── Área do canvas ── */}
      <div style={{
        overflowX: 'auto', overflowY: 'auto', maxHeight: 660,
        background: '#161616', display: 'flex',
        alignItems: 'flex-start', justifyContent: 'center',
        padding: carregando || erro ? 0 : '24px 20px',
        minHeight: 200,
      }}>
        {carregando && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: 200, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, color: '#333', letterSpacing: 2 }}>
            CARREGANDO PDF...
          </div>
        )}

        {erro && !carregando && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: 200, gap: 14, padding: 24 }}>
            <div style={{ fontSize: 28 }}>📄</div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, color: '#E05A2B', textAlign: 'center', maxWidth: 360 }}>{erro}</div>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 800, color: '#FFC107', textDecoration: 'none', border: '1px solid #FFC10733', borderRadius: 6, padding: '7px 16px', background: '#FFC10710' }}
            >
              Abrir PDF diretamente →
            </a>
          </div>
        )}

        {!carregando && !erro && (
          <canvas
            ref={canvasRef}
            style={{
              display: 'block',
              boxShadow: '0 4px 32px rgba(0,0,0,.7)',
              borderRadius: 3,
              maxWidth: '100%',
            }}
          />
        )}
      </div>
    </div>
  );
}
