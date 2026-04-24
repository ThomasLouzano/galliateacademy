const BASE_URL = 'http://localhost:3001';

const request = async (path, options = {}) => {
  const token = localStorage.getItem('ga_token');
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (!res.ok) {
    // Backend retorna { erro: '...' }
    const body = await res.json().catch(() => ({}));
    throw new Error(body.erro || body.message || `Erro ${res.status}`);
  }
  return res.json();
};

export const api = {
  // Auth
  login: (email, senha) =>
    request('/usuarios/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
    }),

  cadastrar: (nome, email, senha, cargo) =>
    request('/usuarios/cadastrar', {
      method: 'POST',
      body: JSON.stringify({ nome, email, senha, cargo }),
    }),

  // Usuários
  getUsuarios: () => request('/usuarios'),

  excluirUsuario: (id) => request(`/usuarios/${id}`, { method: 'DELETE' }),

  // Módulos
  getModulos: () => request('/modulos'),

  criarModulo: (titulo, descricao) =>
    request('/modulos', {
      method: 'POST',
      body: JSON.stringify({ titulo, descricao }),
    }),

  // Progresso
  saveProgress: (lessonId) =>
    request('/progresso', {
      method: 'POST',
      body: JSON.stringify({ lessonId }),
    }),
};
