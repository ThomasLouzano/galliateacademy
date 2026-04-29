import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/index.js';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();

  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  const handleRedefinir = async () => {
    if (!senha || !confirmar) { setErro('Preencha todos os campos'); return; }
    if (senha.length < 6) { setErro('A senha deve ter pelo menos 6 caracteres'); return; }
    if (senha !== confirmar) { setErro('As senhas não coincidem'); return; }
    if (!token) { setErro('Link inválido — solicite um novo link de redefinição'); return; }

    setLoading(true);
    setErro('');
    try {
      await api.resetPassword(token, senha);
      setSucesso(true);
    } catch (e) {
      setErro(e.message || 'Erro ao redefinir senha');
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

        {!token ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, fontWeight: 800, color: '#E05A2B', marginBottom: 8 }}>
              Link inválido
            </div>
            <div style={{ fontSize: 13, color: '#555', marginBottom: 20 }}>
              Este link de redefinição é inválido ou não contém um token.
            </div>
            <button
              onClick={() => navigate('/forgot-password')}
              style={{
                width: '100%', padding: 14, background: '#F9A800',
                border: 'none', borderRadius: 8, color: '#0D0D0D',
                fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15, fontWeight: 900,
                cursor: 'pointer', letterSpacing: 1,
              }}
            >SOLICITAR NOVO LINK</button>
          </div>
        ) : sucesso ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 20, fontWeight: 800, color: '#22A06B', marginBottom: 8 }}>
              Senha redefinida!
            </div>
            <div style={{ fontSize: 13, color: '#555', marginBottom: 24 }}>
              Sua senha foi atualizada com sucesso. Você já pode fazer login.
            </div>
            <button
              onClick={() => navigate('/login')}
              style={{
                width: '100%', padding: 14, background: '#F9A800',
                border: 'none', borderRadius: 8, color: '#0D0D0D',
                fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15, fontWeight: 900,
                cursor: 'pointer', letterSpacing: 1,
              }}
            >IR PARA O LOGIN</button>
          </div>
        ) : (
          <>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, fontWeight: 800, color: '#E0E0E0', marginBottom: 6 }}>
              Redefinir senha
            </div>
            <div style={{ fontSize: 13, color: '#555', marginBottom: 22 }}>
              Escolha uma nova senha para sua conta.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="Nova senha (mín. 6 caracteres)"
                style={{
                  padding: '12px 16px', background: '#0D0D0D', border: '1px solid #2A2A2A',
                  borderRadius: 8, color: '#F0F0F0', fontFamily: 'Barlow, sans-serif',
                  fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box',
                }}
              />
              <input
                type="password"
                value={confirmar}
                onChange={e => setConfirmar(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRedefinir()}
                placeholder="Confirmar nova senha"
                style={{
                  padding: '12px 16px', background: '#0D0D0D', border: '1px solid #2A2A2A',
                  borderRadius: 8, color: '#F0F0F0', fontFamily: 'Barlow, sans-serif',
                  fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box',
                }}
              />
              {erro && <div style={{ color: '#E05A2B', fontSize: 12 }}>{erro}</div>}
              <button
                onClick={handleRedefinir}
                disabled={loading}
                style={{
                  padding: 14, background: loading ? '#7A5A00' : '#F9A800',
                  border: 'none', borderRadius: 8, color: '#0D0D0D',
                  fontFamily: 'Barlow Condensed, sans-serif', fontSize: 17, fontWeight: 900,
                  cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: 1,
                }}
              >
                {loading ? 'SALVANDO...' : 'REDEFINIR SENHA'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
