import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/index.js';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  const handleEnviar = async () => {
    if (!email.trim()) { setErro('Informe seu email'); return; }
    setLoading(true);
    setErro('');
    try {
      await api.forgotPassword(email.trim());
      setEnviado(true);
    } catch (e) {
      setErro(e.message || 'Erro ao enviar email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0D0D0D',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Barlow, sans-serif', padding: '20px 16px', position: 'relative',
    }}>
      <div style={{ position: 'absolute', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: '#F9A80008', pointerEvents: 'none' }} />

      <div style={{
        width: '100%', maxWidth: 420, padding: '40px 28px',
        background: '#161616', borderRadius: 16, border: '1px solid #2A2A2A',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 76, height: 76, borderRadius: 12, margin: '0 auto 14px',
            background: '#F9A800', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 28, color: '#0D0D0D',
          }}>G</div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 26, fontWeight: 900, color: '#F0F0F0', letterSpacing: 2 }}>GALLIATE</div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, fontWeight: 800, color: '#F9A800', letterSpacing: 4 }}>ACADEMY</div>
        </div>

        {enviado ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📬</div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 20, fontWeight: 800, color: '#22A06B', marginBottom: 8 }}>
              Verifique seu email
            </div>
            <div style={{ fontSize: 13, color: '#555', lineHeight: 1.7, marginBottom: 24 }}>
              Se o endereço <strong style={{ color: '#888' }}>{email}</strong> estiver cadastrado,
              você receberá um link para redefinir sua senha em instantes.
            </div>
            <button
              onClick={() => navigate('/login')}
              style={{
                width: '100%', padding: 12, background: 'transparent',
                border: '1px solid #2A2A2A', borderRadius: 8, color: '#888',
                fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 800,
                cursor: 'pointer', letterSpacing: 0.5,
              }}
            >← VOLTAR AO LOGIN</button>
          </div>
        ) : (
          <>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, fontWeight: 800, color: '#E0E0E0', marginBottom: 6 }}>
              Esqueci minha senha
            </div>
            <div style={{ fontSize: 13, color: '#555', marginBottom: 22 }}>
              Informe seu email e enviaremos um link para redefinir sua senha.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleEnviar()}
                placeholder="seu@email.com"
                style={{
                  padding: '12px 16px', background: '#0D0D0D', border: '1px solid #2A2A2A',
                  borderRadius: 8, color: '#F0F0F0', fontFamily: 'Barlow, sans-serif',
                  fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box',
                }}
              />
              {erro && <div style={{ color: '#E05A2B', fontSize: 12 }}>{erro}</div>}
              <button
                onClick={handleEnviar}
                disabled={loading}
                style={{
                  padding: 14, background: loading ? '#7A5A00' : '#F9A800',
                  border: 'none', borderRadius: 8, color: '#0D0D0D',
                  fontFamily: 'Barlow Condensed, sans-serif', fontSize: 17, fontWeight: 900,
                  cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: 1,
                }}
              >
                {loading ? 'ENVIANDO...' : 'ENVIAR LINK'}
              </button>
              <button
                onClick={() => navigate('/login')}
                style={{
                  padding: 12, background: 'transparent', border: '1px solid #2A2A2A',
                  borderRadius: 8, color: '#555', fontFamily: 'Barlow Condensed, sans-serif',
                  fontSize: 14, fontWeight: 800, cursor: 'pointer', letterSpacing: 0.5,
                }}
              >← VOLTAR AO LOGIN</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
