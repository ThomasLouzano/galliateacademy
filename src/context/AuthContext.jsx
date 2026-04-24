import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/index.js';

const AuthContext = createContext(null);

// Cargos que concedem acesso ao painel do gestor
const MANAGER_KEYWORDS = [
  'admin',
  'gestor', 'gestora',
  'gerente',
  'supervisor', 'supervisora',
  'coordenador', 'coordenadora',
];

// Divide "Supervisor / Gerente" em ['supervisor', 'gerente'] e checa cada parte
const isManagerCargo = (cargo = '') =>
  (cargo ?? '').split(/[/,;]/)
    .map(part => part.trim().toLowerCase())
    .some(part => MANAGER_KEYWORDS.some(kw => part.includes(kw)));

const makeAvatar = (nome) =>
  (nome ?? '').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';

// Usuários demo — usados quando os campos ficam vazios
const DEMO_USERS = {
  student: { id: 0, name: 'Carlos Silva', role: 'Churrasqueiro / Grillman', avatar: 'CS', xp: 0, rank: 1 },
  manager: { id: 0, name: 'Mariana Neves', role: 'Supervisor / Gerente', avatar: 'MN', xp: 480, rank: 6 },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('ga_session');
    if (saved) {
      try {
        const { user: u, role, progress: p, token } = JSON.parse(saved);
        if (!u || !role) throw new Error('sessão inválida');
        // Restaura o token em ga_token caso tenha sido limpo separadamente
        if (token && !localStorage.getItem('ga_token')) {
          localStorage.setItem('ga_token', token);
        }
        setUser(u);
        setUserRole(role);
        setProgress(p || {});
      } catch {
        localStorage.removeItem('ga_session');
        localStorage.removeItem('ga_token');
      }
    }
    setLoading(false);
  }, []);

  const persist = (u, role, prog, token = null) => {
    const session = { user: u, role, progress: prog };
    if (token) session.token = token;
    localStorage.setItem('ga_session', JSON.stringify(session));
  };

  const login = async (tabRole, email, senha) => {
    // Modo demo: campos vazios → entra sem chamar o backend
    if (!email.trim() && !senha.trim()) {
      const u = DEMO_USERS[tabRole] || DEMO_USERS.student;
      setUser(u);
      setUserRole(tabRole);
      setProgress({});
      persist(u, tabRole, {});
      return;
    }

    // Login real → POST /usuarios/login
    // data = { token, nome, cargo }
    const data = await api.login(email.trim(), senha);

    const u = {
      id: null,
      name: data.nome ?? '',
      role: data.cargo ?? '',
      avatar: makeAvatar(data.nome),
      xp: 0,
      rank: null,
    };

    const role = isManagerCargo(data.cargo) ? 'manager' : 'student';

    // Persiste primeiro — garante que o dado não se perde mesmo se os setState atrasarem
    persist(u, role, {}, data.token);
    localStorage.setItem('ga_token', data.token);

    setUser(u);
    setUserRole(role);
    setProgress({});
  };

  const logout = () => {
    setUser(null);
    setUserRole(null);
    setProgress({});
    localStorage.removeItem('ga_session');
    localStorage.removeItem('ga_token');
  };

  const completeLesson = async (lessonId) => {
    const updated = { ...progress, [lessonId]: true };
    setProgress(updated);
    persist(user, userRole, updated);
    try {
      await api.saveProgress(lessonId);
    } catch {
      // progresso já salvo localmente
    }
  };

  return (
    <AuthContext.Provider value={{ user, userRole, progress, loading, login, logout, completeLesson }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
