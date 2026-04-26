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

  cadastrar: (nome, email, senha, cargo, telefone) => {
    const payload = { nome, email, senha, cargo, telefone: telefone || undefined };
    console.log('[api.cadastrar] enviando:', { ...payload, senha: '***' });
    return request('/usuarios/cadastrar', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Usuários
  getUsuarios: () => request('/usuarios'),

  excluirUsuario: (id) => request(`/usuarios/${id}`, { method: 'DELETE' }),

  // Trilhas
  getTrilhas: () => request('/trilhas'),

  getTrilhaById: (id) => request(`/trilhas/${id}`),

  criarTrilha: (nome, descricao, icone) =>
    request('/trilhas', {
      method: 'POST',
      body: JSON.stringify({ nome, descricao, icone }),
    }),

  atualizarTrilha: (id, nome, descricao, icone) =>
    request(`/trilhas/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ nome, descricao, icone }),
    }),

  reordenarTrilha: (id, ordem) =>
    request(`/trilhas/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ordem }),
    }),

  excluirTrilha: (id) => request(`/trilhas/${id}`, { method: 'DELETE' }),

  // Módulos
  getModulos: (trilhaId) => request(trilhaId ? `/modulos?trilhaId=${trilhaId}` : '/modulos'),

  getModuloById: (id) => request(`/modulos/${id}`),

  criarModulo: (titulo, descricao, trilhaId) =>
    request('/modulos', {
      method: 'POST',
      body: JSON.stringify({ titulo, descricao, trilhaId: trilhaId || null }),
    }),

  // Seções
  getSecoes: (moduloId) => request(`/secoes?moduloId=${moduloId}`),

  criarSecao: (titulo, moduloId, ordem) =>
    request('/secoes', {
      method: 'POST',
      body: JSON.stringify({ titulo, moduloId, ordem }),
    }),

  excluirSecao: (id) => request(`/secoes/${id}`, { method: 'DELETE' }),

  // Aulas
  getAulas: (secaoId) => request(`/aulas?secaoId=${secaoId}`),

  criarAula: (data) =>
    request('/aulas', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  atualizarAula: (id, data) =>
    request(`/aulas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  excluirAula: (id) => request(`/aulas/${id}`, { method: 'DELETE' }),

  // Progresso
  saveProgress: (lessonId) =>
    request('/progresso', {
      method: 'POST',
      body: JSON.stringify({ lessonId }),
    }),
};
