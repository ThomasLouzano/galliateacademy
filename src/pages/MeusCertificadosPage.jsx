import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/index.js';
import { useAuth } from '../context/AuthContext.jsx';

const formatarData = (iso) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

const formatarCH = (horas) => {
  if (!horas || horas <= 0) return '1 hora';
  if (horas < 1) return `${Math.round(horas * 60)} min`;
  const h = Math.floor(horas);
  const m = Math.round((horas - h) * 60);
  if (m === 0) return h === 1 ? '1 hora' : `${h} horas`;
  return `${h}h ${m}min`;
};

export default function MeusCertificadosPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    api.getMeusCertificados(user.id)
      .then(data => setCerts(Array.isArray(data) ? data : []))
      .catch(e => setErro(e.message || 'Erro ao carregar certificados'))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div style={{ padding: '32px 28px 60px', maxWidth: 900, margin: '0 auto', fontFamily: 'Barlow, sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 900, color: '#FFC107', letterSpacing: 4, marginBottom: 6 }}>
          GALLIATE ACADEMY
        </div>
        <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 32, fontWeight: 900, color: '#F0F0F0', margin: 0, letterSpacing: 2 }}>
          MEUS CERTIFICADOS
        </h1>
        <p style={{ color: '#444', fontSize: 13, marginTop: 8 }}>
          Certificados emitidos ao concluir módulos da plataforma.
        </p>
      </div>

      {/* States */}
      {loading && (
        <div style={{ color: '#333', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, letterSpacing: 2, padding: '40px 0' }}>
          CARREGANDO...
        </div>
      )}

      {!loading && erro && (
        <div style={{ color: '#E05A2B', fontSize: 14, padding: '20px 0' }}>{erro}</div>
      )}

      {!loading && !erro && certs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🎓</div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, fontWeight: 900, color: '#2A2A2A', letterSpacing: 2, marginBottom: 8 }}>
            NENHUM CERTIFICADO AINDA
          </div>
          <div style={{ fontSize: 13, color: '#333', maxWidth: 340, margin: '0 auto 24px' }}>
            Conclua todas as aulas de um módulo (e a avaliação, se houver) para emitir seu certificado.
          </div>
          <button
            onClick={() => navigate('/')}
            style={{ padding: '11px 28px', background: '#FFC107', border: 'none', borderRadius: 8, color: '#000', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 900, cursor: 'pointer' }}
          >
            VER MÓDULOS →
          </button>
        </div>
      )}

      {/* List */}
      {!loading && !erro && certs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {certs.map(cert => (
            <CertCard key={cert.id} cert={cert} navigate={navigate} />
          ))}
        </div>
      )}
    </div>
  );
}

function CertCard({ cert, navigate }) {
  const [hover, setHover] = useState(false);

  const handleVisualizar = () => {
    navigate(`/certificado/${cert.codigoValidacao}`);
  };

  const handleBaixarPDF = () => {
    window.open(`/certificado/${cert.codigoValidacao}?print=1`, '_blank');
  };

  return (
    <div
      style={{
        background: hover ? '#141414' : '#111',
        border: '1px solid #1E1E1E',
        borderRadius: 14,
        padding: '22px 26px',
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        transition: 'all .15s',
        cursor: 'default',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Ícone */}
      <div style={{
        width: 52, height: 52, borderRadius: 12, flexShrink: 0,
        background: '#FFC10715', border: '1px solid #FFC10733',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24,
      }}>
        🎓
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, fontWeight: 900, color: '#E0E0E0', letterSpacing: 1, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {(cert.modulo?.titulo || 'Módulo').toUpperCase()}
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#444' }}>
            <span style={{ color: '#333', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 10, letterSpacing: 1 }}>EMISSÃO </span>
            {formatarData(cert.emitidoEm)}
          </span>
          <span style={{ fontSize: 12, color: '#444' }}>
            <span style={{ color: '#333', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 10, letterSpacing: 1 }}>CH </span>
            {formatarCH(cert.cargaHoraria)}
          </span>
          {cert.nota !== null && cert.nota !== undefined && (
            <span style={{ fontSize: 12, color: '#444' }}>
              <span style={{ color: '#333', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 10, letterSpacing: 1 }}>NOTA </span>
              {cert.nota}%
            </span>
          )}
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#2A2A2A', marginTop: 6, letterSpacing: 0.5 }}>
          {cert.codigoValidacao}
        </div>
      </div>

      {/* Ações */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button
          onClick={handleVisualizar}
          style={{
            padding: '9px 18px', background: 'transparent',
            border: '1px solid #2A2A2A', borderRadius: 8,
            color: '#888', fontFamily: 'Barlow Condensed, sans-serif',
            fontSize: 13, fontWeight: 900, cursor: 'pointer', transition: 'all .15s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#FFC107'; e.currentTarget.style.color = '#FFC107'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#2A2A2A'; e.currentTarget.style.color = '#888'; }}
        >
          📄 Visualizar
        </button>
        <button
          onClick={handleBaixarPDF}
          style={{
            padding: '9px 18px', background: '#FFC107',
            border: 'none', borderRadius: 8,
            color: '#000', fontFamily: 'Barlow Condensed, sans-serif',
            fontSize: 13, fontWeight: 900, cursor: 'pointer', transition: 'background .15s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#FFD54F'}
          onMouseLeave={e => e.currentTarget.style.background = '#FFC107'}
        >
          ⬇️ Baixar PDF
        </button>
      </div>
    </div>
  );
}
