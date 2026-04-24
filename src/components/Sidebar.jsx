import { useNavigate, useLocation } from 'react-router-dom';
import { TRILHAS } from '../data/lmsData';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userRole, logout } = useAuth();

  const path = location.pathname;
  const activeScreen = (
    path.startsWith('/trail') || path.startsWith('/course') || path.startsWith('/lesson') ||
    path.startsWith('/quiz') || path.startsWith('/certificate')
  ) ? 'home' : path.replace('/', '') || 'home';

  const navItems = [
    { id: 'home', icon: '⌂', label: 'Início' },
    { id: 'ranking', icon: '🏆', label: 'Ranking' },
    { id: 'profile', icon: '◉', label: 'Meu Perfil' },
  ];

  if (!user) return null;

  return (
    <div style={{
      width: 220, minWidth: 220, background: '#0A0A0A',
      borderRight: '1px solid #1A1A1A',
      display: 'flex', flexDirection: 'column',
      height: '100vh', position: 'sticky', top: 0,
      fontFamily: 'Barlow Condensed, sans-serif'
    }}>
      <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid #1A1A1A' }}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 22, fontWeight: 900, color: '#F9A800', letterSpacing: 2 }}>
          GALLIATE
        </div>
        <div style={{ fontSize: 10, fontWeight: 800, color: '#F9A800', letterSpacing: 4, marginTop: 2 }}>ACADEMY</div>
      </div>

      <div style={{ padding: '14px 10px 6px' }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: '#333', letterSpacing: 2.5, padding: '0 8px', marginBottom: 6 }}>TRILHAS</div>
        {TRILHAS.map(t => (
          <button key={t.id}
            onClick={() => navigate(`/trail/${t.id}`)}
            style={{
              width: '100%', textAlign: 'left', padding: '9px 10px',
              borderRadius: 8, border: 'none', background: 'transparent',
              color: '#777', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2,
              fontFamily: 'Barlow Condensed, sans-serif', transition: 'all .15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = t.color + '18'; e.currentTarget.style.color = t.color; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#777'; }}
          >
            <span style={{ fontSize: 15 }}>{t.icon}</span>{t.name}
          </button>
        ))}
      </div>

      <div style={{ padding: '8px 10px', flex: 1 }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: '#333', letterSpacing: 2.5, padding: '8px 8px 6px' }}>NAVEGAÇÃO</div>
        {navItems.map(item => {
          const active = activeScreen === item.id;
          return (
            <button key={item.id}
              onClick={() => navigate(`/${item.id === 'home' ? '' : item.id}`)}
              style={{
                width: '100%', textAlign: 'left', padding: '9px 10px',
                borderRadius: 8, border: 'none',
                background: active ? '#F9A80015' : 'transparent',
                color: active ? '#F9A800' : '#666',
                fontSize: 14, fontWeight: active ? 800 : 500, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2,
                fontFamily: 'Barlow Condensed, sans-serif', transition: 'all .15s'
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#ffffff08'; e.currentTarget.style.color = '#aaa'; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#666'; } }}
            >
              <span style={{ width: 16, textAlign: 'center', fontSize: 14 }}>{item.icon}</span>
              {item.label}
              {active && <span style={{ marginLeft: 'auto', width: 3, height: 14, background: '#F9A800', borderRadius: 2 }} />}
            </button>
          );
        })}
      </div>

      {userRole === 'manager' && (
        <div style={{ padding: '8px 10px', borderTop: '1px solid #1A1A1A' }}>
          <button
            onClick={() => navigate('/manager')}
            style={{
              width: '100%', textAlign: 'left', padding: '10px 10px',
              borderRadius: 8, border: '1px solid #F9A80033',
              background: activeScreen === 'manager' ? '#F9A80020' : '#F9A80010',
              color: '#F9A800',
              fontSize: 14, fontWeight: 800, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 10,
              fontFamily: 'Barlow Condensed, sans-serif', transition: 'all .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#F9A80030'; e.currentTarget.style.borderColor = '#F9A80066'; }}
            onMouseLeave={e => { e.currentTarget.style.background = activeScreen === 'manager' ? '#F9A80020' : '#F9A80010'; e.currentTarget.style.borderColor = '#F9A80033'; }}
          >
            <span style={{ fontSize: 14 }}>◈</span>
            Painel do Gestor
            {activeScreen === 'manager' && <span style={{ marginLeft: 'auto', width: 3, height: 14, background: '#F9A800', borderRadius: 2 }} />}
          </button>
        </div>
      )}

      <div style={{ padding: '14px 16px', borderTop: '1px solid #1A1A1A', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: '#F9A80022', border: '2px solid #F9A800',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 12, color: '#F9A800', flexShrink: 0
        }}>
          {user.avatar}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13, color: '#DDD' }}>{user.name?.split(' ')[0] ?? '—'}</div>
          <div style={{ fontSize: 11, color: '#444' }}>{user.xp ?? 0} XP</div>
        </div>
        <button
          onClick={logout}
          title="Sair"
          style={{ background: 'none', border: 'none', color: '#333', cursor: 'pointer', fontSize: 16, padding: 4 }}
          onMouseEnter={e => e.currentTarget.style.color = '#E05A2B'}
          onMouseLeave={e => e.currentTarget.style.color = '#333'}
        >⏻</button>
      </div>
    </div>
  );
}
