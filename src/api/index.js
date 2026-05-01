const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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

  atualizarUsuario: (id, data) =>
    request(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  excluirUsuario: (id) => request(`/usuarios/${id}`, { method: 'DELETE' }),

  adicionarXP: (userId, ganho) =>
    request(`/usuarios/${userId}/xp`, {
      method: 'POST',
      body: JSON.stringify({ ganho }),
    }),

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

  criarModulo: (titulo, descricao, trilhaId, xpBonus) =>
    request('/modulos', {
      method: 'POST',
      body: JSON.stringify({ titulo, descricao, trilhaId: trilhaId || null, xpBonus: xpBonus ?? 50 }),
    }),

  atualizarModulo: (id, titulo, descricao, trilhaId, xpBonus) =>
    request(`/modulos/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ titulo, descricao, trilhaId: trilhaId || null, xpBonus: xpBonus ?? 50 }),
    }),

  excluirModulo: (id) => request(`/modulos/${id}`, { method: 'DELETE' }),

  // Seções
  getSecoes: (moduloId) => request(`/secoes?moduloId=${moduloId}`),

  criarSecao: (titulo, moduloId, ordem) =>
    request('/secoes', {
      method: 'POST',
      body: JSON.stringify({ titulo, moduloId, ordem }),
    }),

  excluirSecao: (id) => request(`/secoes/${id}`, { method: 'DELETE' }),

  atualizarSecao: (id, data) =>
    request(`/secoes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

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

  atualizarChecklistItem: (aulaId, index, texto) =>
    request(`/checklists/${aulaId}`, {
      method: 'PUT',
      body: JSON.stringify({ index, texto }),
    }),

  removerChecklistItem: (aulaId, index) =>
    request(`/checklists/${aulaId}`, {
      method: 'DELETE',
      body: JSON.stringify({ index }),
    }),

  // Apostila (upload multipart)
  uploadApostila: (aulaId, file) => {
    const token = localStorage.getItem('ga_token');
    const formData = new FormData();
    formData.append('arquivo', file);
    return fetch(`${BASE_URL}/aulas/${aulaId}/apostila`, {
      method: 'POST',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: formData,
    }).then(async res => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.erro || `Erro ${res.status}`);
      }
      return res.json();
    });
  },

  // Progresso
  saveProgress: (usuarioId, aulaId) =>
    request('/progresso', {
      method: 'POST',
      body: JSON.stringify({ usuarioId, aulaId, concluida: true }),
    }),

  getProgresso: (usuarioId) => request(`/progresso?usuarioId=${usuarioId}`),

  getProgressoResumo: (usuarioId) => request(`/progresso/resumo?usuarioId=${usuarioId}`),

  // Certificados
  getMeusCertificados: (usuarioId) =>
    request(`/certificados?usuarioId=${usuarioId}`),

  gerarCertificado: (usuarioId, moduloId, avaliacaoId, nota) =>
    request('/certificados', {
      method: 'POST',
      body: JSON.stringify({ usuarioId, moduloId, avaliacaoId, nota }),
    }),

  getCertificado: (codigo) =>
    fetch(`${BASE_URL}/certificados/${codigo}`, {
      headers: { 'Content-Type': 'application/json' },
    }).then(async res => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.erro || `Erro ${res.status}`);
      }
      return res.json();
    }),

  // Upload foto de perfil
  uploadFoto: (id, file) => {
    const token = localStorage.getItem('ga_token');
    const formData = new FormData();
    formData.append('foto', file);
    return fetch(`${BASE_URL}/usuarios/${id}/foto`, {
      method: 'POST',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: formData,
    }).then(async res => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.erro || `Erro ${res.status}`);
      }
      return res.json();
    });
  },

  // Auth (senha)
  forgotPassword: (email) =>
    request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),

  resetPassword: (token, senha) =>
    request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, senha }) }),

  // Avaliações
  getAvaliacoes: (moduloId) =>
    request(moduloId ? `/avaliacoes?moduloId=${moduloId}` : '/avaliacoes'),

  getAvaliacaoById: (id) => request(`/avaliacoes/${id}`),

  criarAvaliacao: (titulo, moduloId, notaMinima, tentativas, xpBonus) =>
    request('/avaliacoes', {
      method: 'POST',
      body: JSON.stringify({ titulo, moduloId: moduloId || null, notaMinima, tentativas, xpBonus }),
    }),

  atualizarAvaliacao: (id, data) =>
    request(`/avaliacoes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  excluirAvaliacao: (id) => request(`/avaliacoes/${id}`, { method: 'DELETE' }),

  submeterAvaliacao: (id, respostas) =>
    request(`/avaliacoes/${id}/submeter`, {
      method: 'POST',
      body: JSON.stringify({ respostas }),
    }),

  // Questões
  criarQuestao: (data) =>
    request('/questoes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  atualizarQuestao: (id, data) =>
    request(`/questoes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  excluirQuestao: (id) => request(`/questoes/${id}`, { method: 'DELETE' }),
};
