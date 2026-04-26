import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TRILHAS as TRILHAS_LOCAL } from '../data/lmsData';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/index.js';

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userRole, logout } = useAuth();
  const [trilhas, setTrilhas] = useState(null); // null = ainda carregando

  useEffect(() => {
    if (!user) return;
    api.getTrilhas()
      .then(data => setTrilhas(Array.isArray(data) && data.length > 0 ? data : []))
      .catch(() => setTrilhas([]));
  }, [user]);

  // Usa trilhas do backend se existirem, senão usa as locais
  const trilhasExibidas = trilhas && trilhas.length > 0 ? trilhas : TRILHAS_LOCAL;
  const isBackend = trilhas && trilhas.length > 0;

  const path = location.pathname;

  // ID da trilha ativa, se estivermos em /trail/:id
  const trailMatch = path.match(/^\/trail\/(\d+)/);
  const activeTrilhaId = trailMatch ? Number(trailMatch[1]) : null;

  // Segmento raiz da rota para destacar itens de navegação
  // /trail/3, /course/X etc. → 'trail'; / ou /home → 'home'
  const activeScreen = (() => {
    if (path === '/' || path === '/home') return 'home';
    return path.replace(/^\//, '').split('/')[0] || 'home';
  })();

  const navItems = [
    { id: 'home', icon: '⌂', label: 'Início' },
    { id: 'ranking', icon: '🏆', label: 'Ranking' },
    { id: 'profile', icon: '◉', label: 'Meu Perfil' },
  ];

  const go = (to) => { navigate(to); onClose?.(); };

  if (!user) return null;

  return (
    <div className={`sidebar${isOpen ? ' open' : ''}`}>
      <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid #1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 22, fontWeight: 900, color: '#F9A800', letterSpacing: 2 }}>GALLIATE</div>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#F9A800', letterSpacing: 4, marginTop: 2 }}>ACADEMY</div>
        </div>
        <button
          onClick={onClose}
          className="sidebar-close-btn"
          style={{ background: 'none', border: 'none', color: '#444', fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: 4 }}
          onMouseEnter={e => e.currentTarget.style.color = '#F0F0F0'}
          onMouseLeave={e => e.currentTarget.style.color = '#444'}
        >✕</button>
      </div>

      <div style={{ padding: '14px 10px 6px' }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: '#333', letterSpacing: 2.5, padding: '0 8px', marginBottom: 6 }}>TRILHAS</div>

        {trilhas === null ? (
          <div style={{ fontSize: 12, color: '#2A2A2A', padding: '6px 10px' }}>Carregando...</div>
        ) : trilhasExibidas.map(t => {
          const nome = isBackend ? t.nome : t.name;
          const icone = isBackend ? t.icone : t.icon;
          const link = `/trail/${t.id}`;
          const active = activeTrilhaId === t.id;
          return (
            <button key={t.id}
              onClick={() => go(link)}
              style={{
                width: '100%', textAlign: 'left', padding: '9px 10px',
                borderRadius: 8, border: 'none',
                background: active ? '#FFC10715' : 'transparent',
                color: active ? '#FFC107' : '#777',
                fontSize: 14, fontWeight: active ? 800 : 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2,
                fontFamily: 'Barlow Condensed, sans-serif', transition: 'all .15s'
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = '#FFC10718';
                  e.currentTarget.style.color = '#FFC107';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#777';
                }
              }}
            >
              <span style={{ fontSize: 15 }}>{icone}</span>
              <span style={{ flex: 1 }}>{nome}</span>
              {active && <span style={{ width: 3, height: 14, background: '#FFC107', borderRadius: 2, flexShrink: 0 }} />}
            </button>
          );
        })}
      </div>

      <div style={{ padding: '8px 10px', flex: 1 }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: '#333', letterSpacing: 2.5, padding: '8px 8px 6px' }}>NAVEGAÇÃO</div>
        {navItems.map(item => {
          const active = activeScreen === item.id;
          return (
            <button key={item.id}
              onClick={() => go(`/${item.id === 'home' ? '' : item.id}`)}
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
            onClick={() => go('/manager')}
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
