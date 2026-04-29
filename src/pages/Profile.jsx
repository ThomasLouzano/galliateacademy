import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/index.js';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const CARGOS = [
  'Churrasqueiro / Grillman',
  'Montador de lanche',
  'Cozinheiro',
  'Entregador',
  'Atendente / Caixa',
  'Coordenador de Turno',
  'Supervisor / Gerente',
];

const fmt = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const inputStyle = {
  padding: '10px 14px', background: '#0D0D0D', border: '1px solid #2A2A2A',
  borderRadius: 8, color: '#F0F0F0', fontFamily: 'Barlow, sans-serif',
  fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box',
};

export default function Profile() {
  const { user, updateUserData } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [historico, setHistorico] = useState([]);
  const [certificados, setCertificados] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editando, setEditando] = useState(false);
  const [editNome, setEditNome] = useState('');
  const [editCargo, setEditCargo] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erroEdit, setErroEdit] = useState('');

  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [sucesso, setSucesso] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    Promise.allSettled([
      api.getProgresso(user.id),
      api.getMeusCertificados(user.id),
    ]).then(([resHist, resCerts]) => {
      if (resHist.status === 'fulfilled') setHistorico(Array.isArray(resHist.value) ? resHist.value : []);
      if (resCerts.status === 'fulfilled') setCertificados(Array.isArray(resCerts.value) ? resCerts.value : []);
    }).finally(() => setLoading(false));
  }, [user?.id]);

  const mostrarSucesso = (msg) => {
    setSucesso(msg);
    setTimeout(() => setSucesso(''), 3000);
  };

  // ── Foto de perfil ──────────────────────────────────
  const handleFotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFoto(true);
    try {
      const { fotoUrl } = await api.uploadFoto(user.id, file);
      updateUserData({ fotoUrl });
      mostrarSucesso('Foto atualizada com sucesso!');
    } catch (err) {
      console.error('[uploadFoto]', err);
    } finally {
      setUploadingFoto(false);
      e.target.value = '';
    }
  };

  // ── Edição de perfil ────────────────────────────────
  const abrirEdit = () => {
    setEditNome(user?.name ?? '');
    setEditCargo(user?.role ?? CARGOS[0]);
    setErroEdit('');
    setEditando(true);
  };

  const handleSalvar = async () => {
    if (!editNome.trim()) { setErroEdit('Nome é obrigatório'); return; }
    setSalvando(true);
    setErroEdit('');
    try {
      await api.atualizarUsuario(user.id, { nome: editNome.trim(), cargo: editCargo });
      updateUserData({ name: editNome.trim(), role: editCargo });
      setEditando(false);
      mostrarSucesso('Perfil atualizado com sucesso!');
    } catch (e) {
      setErroEdit(e.message || 'Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  };

  const xp = user?.xp ?? 0;
  const level = Math.floor(xp / 300) + 1;
  const avatar = (user?.name ?? '?').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const fotoSrc = user?.fotoUrl ? `${BASE_URL}${user.fotoUrl}` : null;

  return (
    <div style={{ padding: '32px 40px', maxWidth: 720, fontFamily: 'Barlow, sans-serif' }}>

      {/* ── Toast de sucesso ── */}
      {sucesso && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          background: '#22A06B22', border: '1px solid #22A06B66',
          color: '#22A06B', borderRadius: 10, padding: '12px 20px',
          fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15, fontWeight: 700,
          boxShadow: '0 4px 20px rgba(0,0,0,.4)',
        }}>✓ {sucesso}</div>
      )}

      {/* ── Header: avatar + dados + XP ── */}
      <div style={{ background: '#161616', border: '1px solid #1E1E1E', borderRadius: 16, padding: '28px 30px', marginBottom: 22, display: 'flex', gap: 22, alignItems: 'center' }}>

        {/* Avatar com botão de câmera */}
        <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
          {fotoSrc ? (
            <img
              src={fotoSrc}
              alt="Foto de perfil"
              style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid #FFC107', display: 'block' }}
            />
          ) : (
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: '#FFC10722', border: '3px solid #FFC107',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 26, color: '#FFC107',
            }}>{avatar}</div>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingFoto}
            title="Alterar foto"
            style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 26, height: 26, borderRadius: '50%',
              background: uploadingFoto ? '#888' : '#FFC107',
              border: '2px solid #161616',
              cursor: uploadingFoto ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, padding: 0, transition: 'background .15s',
            }}
          >{uploadingFoto ? '⏳' : '📷'}</button>

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            ref={fileInputRef}
            onChange={handleFotoChange}
            style={{ display: 'none' }}
          />
        </div>

        {/* Nome e cargo */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 28, fontWeight: 900, color: '#F0F0F0', lineHeight: 1, marginBottom: 4 }}>
            {user?.name ?? '—'}
          </div>
          <div style={{ fontSize: 13, color: '#555', marginBottom: 12 }}>{user?.role ?? '—'}</div>
          <button
            onClick={abrirEdit}
            style={{
              padding: '6px 16px', background: '#FFC10715', border: '1px solid #FFC10744',
              borderRadius: 7, color: '#FFC107', fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 800, fontSize: 12, letterSpacing: 1, cursor: 'pointer', transition: 'border-color .15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#FFC10788'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#FFC10744'}
          >✏ EDITAR PERFIL</button>
        </div>

        {/* XP e Nível */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 40, fontWeight: 900, color: '#FFC107', lineHeight: 1 }}>{xp}</div>
          <div style={{ fontSize: 11, color: '#444', marginTop: 2, marginBottom: 10 }}>XP TOTAL</div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 800, color: '#8B7FE8' }}>Nível {level}</div>
        </div>
      </div>

      {/* ── Formulário de edição ── */}
      {editando && (
        <div style={{ background: '#161616', border: '1px solid #FFC10733', borderRadius: 14, padding: '24px 28px', marginBottom: 22 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 800, color: '#E0E0E0', marginBottom: 16 }}>
            Editar Perfil
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: '#555', marginBottom: 5 }}>Nome</div>
              <input
                value={editNome}
                onChange={e => setEditNome(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSalvar()}
                style={inputStyle}
              />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#555', marginBottom: 5 }}>Cargo</div>
              <select
                value={editCargo}
                onChange={e => setEditCargo(e.target.value)}
                style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
              >
                {CARGOS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {erroEdit && <div style={{ color: '#E05A2B', fontSize: 12 }}>{erroEdit}</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button
                onClick={handleSalvar}
                disabled={salvando}
                style={{
                  padding: '10px 22px', background: salvando ? '#7A6500' : '#FFC107',
                  border: 'none', borderRadius: 8, color: '#000',
                  fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 900,
                  cursor: salvando ? 'not-allowed' : 'pointer', letterSpacing: 0.5,
                }}
              >{salvando ? 'SALVANDO...' : 'SALVAR'}</button>
              <button
                onClick={() => setEditando(false)}
                style={{
                  padding: '10px 22px', background: '#1A1A1A', border: '1px solid #2A2A2A',
                  borderRadius: 8, color: '#888', fontFamily: 'Barlow Condensed, sans-serif',
                  fontSize: 14, fontWeight: 800, cursor: 'pointer',
                }}
              >CANCELAR</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Meus Certificados ── */}
      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, fontWeight: 800, color: '#E0E0E0', marginBottom: 12 }}>
        Meus Certificados
      </div>

      {loading ? (
        <div style={{ color: '#444', fontSize: 13, marginBottom: 24 }}>Carregando...</div>
      ) : certificados.length === 0 ? (
        <div style={{ background: '#161616', border: '1px solid #1E1E1E', borderRadius: 12, padding: '24px', textAlign: 'center', color: '#333', fontSize: 13, marginBottom: 22 }}>
          Nenhum certificado emitido ainda.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 22 }}>
          {certificados.map(cert => (
            <div key={cert.id} style={{ background: '#161616', border: '1px solid #FFC10722', borderRadius: 12, padding: '18px 20px' }}>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 800, color: '#F0F0F0', marginBottom: 4, lineHeight: 1.3 }}>
                {cert.nomeModulo ?? `Módulo #${cert.moduloId}`}
              </div>
              <div style={{ fontSize: 11, color: '#555', marginBottom: 12 }}>
                Emitido em {fmt(cert.emitidoEm)}
                {cert.nota != null && ` · Nota: ${cert.nota}`}
              </div>
              <button
                onClick={() => navigate(`/certificado/${cert.codigoValidacao}`)}
                style={{
                  padding: '6px 14px', background: '#FFC10715', border: '1px solid #FFC10744',
                  borderRadius: 6, color: '#FFC107', fontFamily: 'Barlow Condensed, sans-serif',
                  fontWeight: 800, fontSize: 11, letterSpacing: 1, cursor: 'pointer',
                }}
              >VER CERTIFICADO</button>
            </div>
          ))}
        </div>
      )}

      {/* ── Histórico de Aulas ── */}
      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, fontWeight: 800, color: '#E0E0E0', marginBottom: 12 }}>
        Histórico de Aulas
      </div>

      {loading ? (
        <div style={{ color: '#444', fontSize: 13 }}>Carregando...</div>
      ) : historico.length === 0 ? (
        <div style={{ background: '#161616', border: '1px solid #1E1E1E', borderRadius: 12, padding: '24px', textAlign: 'center', color: '#333', fontSize: 13 }}>
          Nenhuma aula concluída ainda. Continue estudando!
        </div>
      ) : (
        <div style={{ background: '#161616', border: '1px solid #1E1E1E', borderRadius: 12, overflow: 'hidden' }}>
          {historico.map((item, idx) => (
            <div
              key={item.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '13px 18px',
                borderTop: idx === 0 ? 'none' : '1px solid #141414',
              }}
            >
              <div style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                background: '#22A06B22', border: '2px solid #22A06B44',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, color: '#22A06B',
              }}>✓</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 700, color: '#DDD', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.tituloAula ?? `Aula #${item.aulaId}`}
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#444', flexShrink: 0 }}>
                {fmt(item.concluidoEm)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
