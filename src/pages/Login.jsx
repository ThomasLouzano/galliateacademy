import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await login(role, email, senha);
      navigate('/');
    } catch (e) {
      setError(e.message || 'Erro ao entrar');
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === 'Enter') handleLogin(); };

  return (
    <div style={{
      minHeight: '100vh', background: '#0D0D0D',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Barlow, sans-serif', overflow: 'hidden', position: 'relative', padding: '20px 16px'
    }}>
      <div style={{ position: 'absolute', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: '#F9A80008', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -100, left: -150, width: 500, height: 500, borderRadius: '50%', background: '#F9A80005', pointerEvents: 'none' }} />

      <div style={{
        width: '100%', maxWidth: 420, padding: '40px 28px',
        background: '#161616', borderRadius: 16, border: '1px solid #2A2A2A',
        position: 'relative', zIndex: 1
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 76, height: 76, borderRadius: 12, margin: '0 auto 14px',
            background: '#F9A800', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 28, color: '#0D0D0D'
          }}>G</div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 26, fontWeight: 900, color: '#F0F0F0', letterSpacing: 2 }}>GALLIATE</div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, fontWeight: 800, color: '#F9A800', letterSpacing: 4 }}>ACADEMY</div>
          <div style={{ fontSize: 13, color: '#444', marginTop: 4 }}>Plataforma de treinamentos internos</div>
        </div>

        <div style={{ display: 'flex', background: '#0D0D0D', borderRadius: 8, padding: 3, marginBottom: 22, gap: 4 }}>
          {[['student', '🎓 Funcionário'], ['manager', '⭐ Gestor']].map(([r, label]) => (
            <button key={r} onClick={() => setRole(r)} style={{
              flex: 1, padding: '8px 0', borderRadius: 6, border: 'none',
              background: role === r ? '#F9A800' : 'transparent',
              color: role === r ? '#0D0D0D' : '#555',
              fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 13,
              cursor: 'pointer', transition: 'all .2s'
            }}>{label}</button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={handleKey}
            placeholder="E-mail ou usuário"
            style={{
              padding: '12px 16px', background: '#0D0D0D', border: '1px solid #2A2A2A',
              borderRadius: 8, color: '#F0F0F0', fontFamily: 'Barlow, sans-serif',
              fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box'
            }}
          />
          <input
            type="password"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Senha"
            style={{
              padding: '12px 16px', background: '#0D0D0D', border: '1px solid #2A2A2A',
              borderRadius: 8, color: '#F0F0F0', fontFamily: 'Barlow, sans-serif',
              fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box'
            }}
          />
          {error && <div style={{ color: '#E05A2B', fontSize: 12 }}>{error}</div>}
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              marginTop: 6, padding: 14, background: loading ? '#7A5A00' : '#F9A800',
              border: 'none', borderRadius: 8, color: '#0D0D0D',
              fontFamily: 'Barlow Condensed, sans-serif', fontSize: 17, fontWeight: 900,
              cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: 1
            }}
          >
            {loading ? 'ENTRANDO...' : 'ENTRAR'}
          </button>
        </div>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: '#2A2A2A' }}>
          Deixe os campos em branco para entrar como demo
        </div>
      </div>
    </div>
  );
}
