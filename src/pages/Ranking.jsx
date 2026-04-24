import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/index.js';

const MOCK_USERS = [
  { id: 1, name: 'Carlos Silva', role: 'Churrasqueiro / Grillman', avatar: 'CS', xp: 890, completed: 7, total: 14, rank: 1 },
  { id: 2, name: 'Ana Souza', role: 'Atendente / Caixa', avatar: 'AS', xp: 760, completed: 6, total: 14, rank: 2 },
  { id: 3, name: 'Bruno Lima', role: 'Entregador', avatar: 'BL', xp: 640, completed: 5, total: 14, rank: 3 },
  { id: 4, name: 'Julia Costa', role: 'Montador de lanche', avatar: 'JC', xp: 580, completed: 4, total: 14, rank: 4 },
  { id: 5, name: 'Pedro Rocha', role: 'Coordenador de Turno', avatar: 'PR', xp: 520, completed: 4, total: 14, rank: 5 },
  { id: 6, name: 'Mariana Neves', role: 'Supervisor / Gerente', avatar: 'MN', xp: 480, completed: 3, total: 14, rank: 6 },
];

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Ranking() {
  const { user } = useAuth();
  const [users, setUsers] = useState(MOCK_USERS);

  useEffect(() => {
    api.getRanking?.().then(setUsers).catch(() => {});
  }, []);

  return (
    <div style={{ padding: '32px 40px', maxWidth: 680, fontFamily: 'Barlow, sans-serif' }}>
      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 36, fontWeight: 900, color: '#F0F0F0', marginBottom: 4 }}>Ranking</div>
      <div style={{ color: '#444', marginBottom: 26, fontSize: 13 }}>Os mais dedicados da equipe Galliate 🔥</div>

      {users.map((u, i) => (
        <div key={u.id} style={{
          background: u.name === user.name ? '#F9A80010' : '#161616',
          border: `1px solid ${u.name === user.name ? '#F9A80044' : '#1E1E1E'}`,
          borderRadius: 12, padding: '14px 18px', marginBottom: 8,
          display: 'flex', alignItems: 'center', gap: 14
        }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 22, width: 32, textAlign: 'center' }}>
            {MEDALS[i] || `#${i + 1}`}
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#F9A80022', border: '2px solid #F9A800', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 12, color: '#F9A800' }}>
            {u.avatar}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 800, color: '#E0E0E0' }}>
              {u.name} {u.name === user.name && <span style={{ color: '#F9A800', fontSize: 12 }}>(você)</span>}
            </div>
            <div style={{ fontSize: 11, color: '#444' }}>{u.role}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 20, fontWeight: 900, color: '#F9A800' }}>{u.xp} XP</div>
            <div style={{ fontSize: 11, color: '#3A3A3A' }}>{u.completed}/{u.total} cursos</div>
          </div>
        </div>
      ))}
    </div>
  );
}
