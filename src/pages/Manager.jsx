import { useState, useEffect, useCallback } from 'react';
import { TRILHAS } from '../data/lmsData';
import { api } from '../api/index.js';
import ProgressBar from '../components/ProgressBar';

// ── helpers de UI ──────────────────────────────────────
const CARGOS = [
  'Churrasqueiro / Grillman',
  'Montador de lanche',
  'Cozinheiro',
  'Entregador',
  'Atendente / Caixa',
  'Coordenador de Turno',
  'Supervisor / Gerente',
];

const Card = ({ children, style = {} }) => (
  <div style={{ background: '#161616', border: '1px solid #1E1E1E', borderRadius: 12, padding: '18px 22px', ...style }}>
    {children}
  </div>
);

const Label = ({ children }) => (
  <div style={{ fontSize: 9, fontWeight: 800, color: '#2E2E2E', letterSpacing: 2.5, fontFamily: 'Barlow Condensed, sans-serif', marginBottom: 8 }}>
    {children}
  </div>
);

const Input = ({ label, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
    {label && <span style={{ fontSize: 11, color: '#555', fontWeight: 600 }}>{label}</span>}
    <input
      {...props}
      style={{
        padding: '10px 14px', background: '#0D0D0D', border: '1px solid #2A2A2A',
        borderRadius: 8, color: '#F0F0F0', fontFamily: 'Barlow, sans-serif',
        fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box',
        ...props.style,
      }}
    />
  </div>
);

const Select = ({ label, children, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
    {label && <span style={{ fontSize: 11, color: '#555', fontWeight: 600 }}>{label}</span>}
    <select
      {...props}
      style={{
        padding: '10px 14px', background: '#0D0D0D', border: '1px solid #2A2A2A',
        borderRadius: 8, color: '#F0F0F0', fontFamily: 'Barlow, sans-serif',
        fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box',
        appearance: 'none', cursor: 'pointer',
        ...props.style,
      }}
    >
      {children}
    </select>
  </div>
);

const Btn = ({ children, variant = 'primary', loading, ...props }) => {
  const colors = {
    primary: { bg: '#F9A800', color: '#000', border: 'none' },
    ghost:   { bg: '#1A1A1A', color: '#888', border: '1px solid #2A2A2A' },
    danger:  { bg: '#E05A2B22', color: '#E05A2B', border: '1px solid #E05A2B44' },
  }[variant] || {};
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      style={{
        padding: '10px 18px', borderRadius: 8, cursor: loading || props.disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 900,
        letterSpacing: 0.5, opacity: loading || props.disabled ? 0.6 : 1,
        transition: 'opacity .15s', ...colors, ...props.style,
      }}
    >
      {loading ? 'AGUARDE...' : children}
    </button>
  );
};

const Toast = ({ msg, ok }) => {
  if (!msg) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: ok ? '#22A06B22' : '#E05A2B22',
      border: `1px solid ${ok ? '#22A06B66' : '#E05A2B66'}`,
      color: ok ? '#22A06B' : '#E05A2B',
      borderRadius: 10, padding: '12px 20px',
      fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15, fontWeight: 700,
      boxShadow: '0 4px 20px rgba(0,0,0,.4)',
    }}>
      {ok ? '✓ ' : '✕ '}{msg}
    </div>
  );
};

// ── dados mock de equipe (sem endpoint de listagem de usuários) ──
const MOCK_TEAM = [
  { id: 1, nome: 'Carlos Silva', cargo: 'Churrasqueiro / Grillman', avatar: 'CS', xp: 890, completed: 7, total: 14 },
  { id: 2, nome: 'Ana Souza', cargo: 'Atendente / Caixa', avatar: 'AS', xp: 760, completed: 6, total: 14 },
  { id: 3, nome: 'Bruno Lima', cargo: 'Entregador', avatar: 'BL', xp: 640, completed: 5, total: 14 },
  { id: 4, nome: 'Julia Costa', cargo: 'Montador de lanche', avatar: 'JC', xp: 580, completed: 4, total: 14 },
  { id: 5, nome: 'Pedro Rocha', cargo: 'Coordenador de Turno', avatar: 'PR', xp: 520, completed: 4, total: 14 },
  { id: 6, nome: 'Mariana Neves', cargo: 'Supervisor / Gerente', avatar: 'MN', xp: 480, completed: 3, total: 14 },
];

// ═══════════════════════════════════════════════════════
// SEÇÃO: Visão Geral
// ═══════════════════════════════════════════════════════
function SecaoVisaoGeral({ team }) {
  const totalCourses = TRILHAS.flatMap(t => t.courses).length;
  const avgCompletion = Math.round(team.reduce((a, u) => a + u.completed, 0) / team.length);

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 26 }}>
        {[
          ['Colaboradores', team.length, '#F9A800'],
          ['Total de Cursos', totalCourses, '#22A06B'],
          ['Média Cursos', avgCompletion, '#8B7FE8'],
          ['Trilhas Ativas', TRILHAS.length, '#E05A2B'],
        ].map(([label, val, color]) => (
          <Card key={label}>
            <Label>{label.toUpperCase()}</Label>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 34, fontWeight: 900, color }}>{val}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 26 }}>
        {TRILHAS.map(t => {
          const avgPct = Math.round(team.slice(0, 3).reduce((a, u) => a + (u.completed / u.total * 100), 0) / 3);
          return (
            <div key={t.id} style={{ background: '#161616', border: `1px solid ${t.color}22`, borderRadius: 12, padding: '18px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 18 }}>{t.icon}</span>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 800, color: '#E0E0E0' }}>Trilha {t.name}</span>
                <span style={{ marginLeft: 'auto', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 800, color: t.color }}>{t.courses.length} cursos</span>
              </div>
              <ProgressBar pct={avgPct} color={t.color} h={5} />
              <div style={{ fontSize: 11, color: '#3A3A3A', marginTop: 5 }}>Média da equipe: {avgPct}%</div>
            </div>
          );
        })}
      </div>

      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 17, fontWeight: 800, color: '#E0E0E0', marginBottom: 12 }}>
        Progresso Individual
      </div>
      <div style={{ background: '#161616', border: '1px solid #1E1E1E', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.6fr .8fr .8fr 1.4fr', padding: '10px 18px', background: '#0A0A0A', fontSize: 9, fontWeight: 800, color: '#2E2E2E', letterSpacing: 2.5, fontFamily: 'Barlow Condensed, sans-serif' }}>
          <span>COLABORADOR</span><span>CARGO</span><span>XP</span><span>CURSOS</span><span>PROGRESSO</span>
        </div>
        {team.map(u => {
          const pct = Math.round(u.completed / u.total * 100);
          const col = pct >= 50 ? '#22A06B' : pct >= 30 ? '#F9A800' : '#E05A2B';
          const av = u.avatar || u.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
          return (
            <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.6fr .8fr .8fr 1.4fr', padding: '14px 18px', borderTop: '1px solid #141414', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#F9A80022', border: '2px solid #F9A80055', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 11, color: '#F9A800', flexShrink: 0 }}>{av}</div>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 700, color: '#DDD' }}>{u.nome || u.name}</span>
              </div>
              <span style={{ fontSize: 11, color: '#555' }}>{u.cargo || u.role}</span>
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, color: '#F9A800', fontSize: 15 }}>{u.xp || 0}</span>
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, color: '#DDD', fontSize: 15 }}>
                {u.completed}<span style={{ color: '#2E2E2E', fontSize: 11 }}>/{u.total}</span>
              </span>
              <div>
                <ProgressBar pct={pct} color={col} h={5} />
                <span style={{ fontSize: 10, color: '#3A3A3A' }}>{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════
// SEÇÃO: Módulos
// ═══════════════════════════════════════════════════════
function SecaoModulos({ toast }) {
  const [modulos, setModulos] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [saving, setSaving] = useState(false);

  const carregar = useCallback(async () => {
    setLoadingList(true);
    try {
      const data = await api.getModulos();
      setModulos(Array.isArray(data) ? data : []);
    } catch (e) {
      toast(e.message || 'Erro ao carregar módulos', false);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const handleCriar = async () => {
    if (!titulo.trim()) { toast('Título é obrigatório', false); return; }
    setSaving(true);
    try {
      await api.criarModulo(titulo.trim(), descricao.trim());
      toast('Módulo criado com sucesso!', true);
      setTitulo('');
      setDescricao('');
      carregar();
    } catch (e) {
      toast(e.message || 'Erro ao criar módulo', false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
      {/* Formulário de criação */}
      <Card>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, fontWeight: 800, color: '#F0F0F0', marginBottom: 18 }}>
          Criar Novo Módulo
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input
            label="Título *"
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            placeholder="Ex: Higiene e Manipulação de Alimentos"
            onKeyDown={e => e.key === 'Enter' && handleCriar()}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ fontSize: 11, color: '#555', fontWeight: 600 }}>Descrição</span>
            <textarea
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              placeholder="Descreva o conteúdo do módulo..."
              rows={4}
              style={{
                padding: '10px 14px', background: '#0D0D0D', border: '1px solid #2A2A2A',
                borderRadius: 8, color: '#F0F0F0', fontFamily: 'Barlow, sans-serif',
                fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box',
                resize: 'vertical', lineHeight: 1.6,
              }}
            />
          </div>
          <Btn onClick={handleCriar} loading={saving} style={{ alignSelf: 'flex-start' }}>
            + CRIAR MÓDULO
          </Btn>
        </div>
      </Card>

      {/* Lista de módulos */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, fontWeight: 800, color: '#F0F0F0' }}>
            Módulos Cadastrados
          </div>
          <Btn variant="ghost" onClick={carregar} style={{ fontSize: 12, padding: '6px 12px' }}>
            ↻ ATUALIZAR
          </Btn>
        </div>

        {loadingList ? (
          <div style={{ color: '#3A3A3A', fontSize: 13, padding: '20px 0' }}>Carregando...</div>
        ) : modulos.length === 0 ? (
          <div style={{ background: '#161616', border: '1px solid #1E1E1E', borderRadius: 12, padding: '32px', textAlign: 'center', color: '#333', fontSize: 13 }}>
            Nenhum módulo cadastrado ainda.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {modulos.map(m => (
              <div key={m.id} style={{ background: '#161616', border: '1px solid #1E1E1E', borderRadius: 10, padding: '14px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 800, color: '#E0E0E0', marginBottom: 3 }}>{m.titulo}</div>
                    {m.descricao && (
                      <div style={{ fontSize: 12, color: '#444', lineHeight: 1.5 }}>{m.descricao}</div>
                    )}
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    <span style={{
                      background: m.ativo !== false ? '#22A06B22' : '#E05A2B22',
                      color: m.ativo !== false ? '#22A06B' : '#E05A2B',
                      border: `1px solid ${m.ativo !== false ? '#22A06B44' : '#E05A2B44'}`,
                      borderRadius: 20, padding: '2px 10px', fontSize: 10, fontWeight: 800,
                      fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: 1,
                    }}>
                      {m.ativo !== false ? 'ATIVO' : 'INATIVO'}
                    </span>
                  </div>
                </div>
                {m.criadoEm && (
                  <div style={{ fontSize: 10, color: '#2A2A2A', marginTop: 8 }}>
                    Criado em {new Date(m.criadoEm).toLocaleDateString('pt-BR')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// SEÇÃO: Colaboradores
// ═══════════════════════════════════════════════════════

// Remove não-dígitos e garante o prefixo internacional 55
const formatarTelWhatsApp = (tel) => {
  const digits = tel.replace(/\D/g, '');
  if (!digits) return '';
  return digits.startsWith('55') && digits.length >= 12 ? digits : '55' + digits;
};

const montarMensagemBoasVindas = ({ nome, email, senha }) =>
  `Olá ${nome}! 🍔 Você foi cadastrado(a) na Galliate Academy, nossa plataforma de treinamentos internos. Seus dados de acesso: E-mail: ${email} | Senha: ${senha}. Acesse e comece sua jornada! 🚀 Acesse: https://academy.galliate.com.br`;

function SecaoColaboradores({ toast }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cargo, setCargo] = useState(CARGOS[0]);
  const [saving, setSaving] = useState(false);
  // Guarda os dados do último cadastro bem-sucedido para o botão de WhatsApp
  const [cadastrado, setCadastrado] = useState(null);

  const handleCadastrar = async () => {
    if (!nome.trim() || !email.trim() || !senha.trim()) {
      toast('Nome, e-mail e senha são obrigatórios', false);
      return;
    }
    if (senha.length < 6) {
      toast('Senha deve ter no mínimo 6 caracteres', false);
      return;
    }
    setSaving(true);
    try {
      await api.cadastrar(nome.trim(), email.trim(), senha, cargo);
      toast(`Colaborador "${nome.trim()}" cadastrado com sucesso!`, true);
      // Salva antes de limpar para o botão de WhatsApp poder usar
      setCadastrado({ nome: nome.trim(), email: email.trim(), senha, telefone: telefone.trim() });
      setNome('');
      setEmail('');
      setSenha('');
      setTelefone('');
      setCargo(CARGOS[0]);
    } catch (e) {
      toast(e.message || 'Erro ao cadastrar colaborador', false);
    } finally {
      setSaving(false);
    }
  };

  const handleWhatsApp = () => {
    const numero = formatarTelWhatsApp(cadastrado.telefone);
    const mensagem = encodeURIComponent(montarMensagemBoasVindas(cadastrado));
    const url = numero
      ? `https://wa.me/${numero}?text=${mensagem}`
      : `https://wa.me/?text=${mensagem}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
      {/* Formulário */}
      <Card>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, fontWeight: 800, color: '#F0F0F0', marginBottom: 18 }}>
          Cadastrar Colaborador
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input
            label="Nome completo *"
            value={nome}
            onChange={e => setNome(e.target.value)}
            placeholder="Ex: João da Silva"
          />
          <Input
            label="E-mail *"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="joao@galliate.com.br"
          />
          <Input
            label="Senha inicial *"
            type="password"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            placeholder="Mínimo 6 caracteres"
          />
          <Input
            label="Telefone / WhatsApp"
            type="tel"
            value={telefone}
            onChange={e => setTelefone(e.target.value)}
            placeholder="(11) 99999-9999"
          />
          <Select label="Cargo" value={cargo} onChange={e => setCargo(e.target.value)}>
            {CARGOS.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Btn onClick={handleCadastrar} loading={saving} style={{ alignSelf: 'flex-start' }}>
            + CADASTRAR COLABORADOR
          </Btn>
        </div>
      </Card>

      {/* Coluna direita */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Botão de boas-vindas — aparece após cadastro bem-sucedido */}
        {cadastrado && (
          <Card style={{ borderColor: '#25D36644' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 22 }}>✅</span>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 800, color: '#F0F0F0' }}>
                {cadastrado.nome} cadastrado(a)!
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#444', marginBottom: 14, lineHeight: 1.6 }}>
              {cadastrado.telefone
                ? `Número: ${cadastrado.telefone} → ${formatarTelWhatsApp(cadastrado.telefone)}`
                : 'Nenhum número informado — o botão abrirá o WhatsApp sem destinatário.'}
            </div>
            <button
              onClick={handleWhatsApp}
              style={{
                width: '100%', padding: '12px 16px',
                background: '#25D366', border: 'none', borderRadius: 8,
                color: '#fff', fontFamily: 'Barlow Condensed, sans-serif',
                fontSize: 15, fontWeight: 900, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                letterSpacing: 0.5,
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#1ebe5a'}
              onMouseLeave={e => e.currentTarget.style.background = '#25D366'}
            >
              <span style={{ fontSize: 18 }}>💬</span>
              ENVIAR BOAS-VINDAS NO WHATSAPP
            </button>
            <button
              onClick={() => setCadastrado(null)}
              style={{ marginTop: 8, width: '100%', padding: '7px', background: 'none', border: 'none', color: '#333', fontSize: 12, cursor: 'pointer', fontFamily: 'Barlow, sans-serif' }}
            >
              Fechar
            </button>
          </Card>
        )}

        <Card style={{ borderColor: '#F9A80022' }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15, fontWeight: 800, color: '#F9A800', marginBottom: 10 }}>
            ℹ Como funciona
          </div>
          <div style={{ fontSize: 13, color: '#555', lineHeight: 1.8 }}>
            O colaborador poderá fazer login imediatamente usando o e-mail e senha definidos aqui. O cargo determina quais trilhas aparecem em destaque no perfil.
          </div>
        </Card>
        <Card style={{ borderColor: '#22A06B22' }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15, fontWeight: 800, color: '#22A06B', marginBottom: 10 }}>
            Cargos de Gestor
          </div>
          <div style={{ fontSize: 13, color: '#555', lineHeight: 1.8 }}>
            Cargos com <span style={{ color: '#22A06B' }}>admin</span>, <span style={{ color: '#22A06B' }}>gestor</span>, <span style={{ color: '#22A06B' }}>gerente</span>, <span style={{ color: '#22A06B' }}>supervisor</span> ou <span style={{ color: '#22A06B' }}>coordenador</span> recebem acesso automático ao Painel do Gestor.
          </div>
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MODAL de detalhes
// ═══════════════════════════════════════════════════════
function ModalPerfil({ usuario, onClose }) {
  if (!usuario) return null;
  const nivel = Math.floor((usuario.xp || 0) / 300) + 1;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#161616', border: '1px solid #2A2A2A', borderRadius: 16,
          padding: '32px 36px', width: '100%', maxWidth: 480, position: 'relative',
        }}
      >
        {/* topo colorido */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#F9A800,#E05A2B)', borderRadius: '16px 16px 0 0' }} />

        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', color: '#444', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}
          onMouseEnter={e => e.currentTarget.style.color = '#F0F0F0'}
          onMouseLeave={e => e.currentTarget.style.color = '#444'}
        >✕</button>

        {/* avatar + nome */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: '#F9A80022', border: '2px solid #F9A800',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 20, color: '#F9A800',
            flexShrink: 0,
          }}>
            {(usuario.nome ?? '').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'}
          </div>
          <div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 24, fontWeight: 900, color: '#F0F0F0', lineHeight: 1 }}>{usuario.nome}</div>
            <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>{usuario.cargo}</div>
          </div>
        </div>

        {/* detalhes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            ['E-mail', usuario.email],
            ['WhatsApp', usuario.telefone || '—'],
            ['Cargo', usuario.cargo],
            ['Nível', `${nivel} (${usuario.xp || 0} XP)`],
            ['Status', usuario.ativo !== false ? 'Ativo' : 'Inativo'],
            ['Cadastrado em', usuario.criadoEm ? new Date(usuario.criadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'],
          ].map(([chave, valor]) => (
            <div key={chave} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #1A1A1A' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#444', letterSpacing: 0.5 }}>{chave.toUpperCase()}</span>
              <span style={{ fontSize: 13, color: '#C0C0C0', textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word' }}>{valor}</span>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          style={{ marginTop: 22, width: '100%', padding: '11px', background: '#F9A800', border: 'none', borderRadius: 8, color: '#000', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 900, cursor: 'pointer' }}
        >FECHAR</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// SEÇÃO: Lista de Colaboradores
// ═══════════════════════════════════════════════════════
function SecaoListaColaboradores({ toast }) {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState(null);       // modal aberto
  const [excluindo, setExcluindo] = useState(null); // id em deleção

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getUsuarios();
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (e) {
      toast(e.message || 'Erro ao carregar colaboradores', false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const handleExcluir = async (u) => {
    const confirmado = window.confirm(`Excluir "${u.nome}"?\n\nEsta ação desativa o acesso do colaborador à plataforma.`);
    if (!confirmado) return;
    setExcluindo(u.id);
    try {
      await api.excluirUsuario(u.id);
      toast(`"${u.nome}" removido com sucesso`, true);
      setUsuarios(prev => prev.filter(x => x.id !== u.id));
    } catch (e) {
      toast(e.message || 'Erro ao excluir colaborador', false);
    } finally {
      setExcluindo(null);
    }
  };

  const nivel = (xp = 0) => Math.floor(xp / 300) + 1;

  return (
    <>
      <ModalPerfil usuario={perfil} onClose={() => setPerfil(null)} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 22, fontWeight: 900, color: '#F0F0F0' }}>
            Colaboradores Cadastrados
          </div>
          {!loading && (
            <div style={{ fontSize: 12, color: '#444', marginTop: 2 }}>{usuarios.length} colaborador{usuarios.length !== 1 ? 'es' : ''}</div>
          )}
        </div>
        <Btn variant="ghost" onClick={carregar} style={{ fontSize: 12, padding: '7px 14px' }}>↻ ATUALIZAR</Btn>
      </div>

      {loading ? (
        <div style={{ color: '#2A2A2A', fontSize: 13, padding: '40px 0', textAlign: 'center' }}>Carregando...</div>
      ) : usuarios.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>👤</div>
          <div style={{ color: '#333', fontSize: 14 }}>Nenhum colaborador cadastrado ainda.</div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {usuarios.map(u => {
            const av = (u.nome ?? '').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';
            const isExcluindo = excluindo === u.id;
            return (
              <div
                key={u.id}
                style={{
                  background: '#161616', border: '1px solid #1E1E1E', borderRadius: 12,
                  padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12,
                  transition: 'border-color .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#2A2A2A'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#1E1E1E'}
              >
                {/* cabeçalho do card */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                    background: '#F9A80022', border: '2px solid #F9A80055',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 14, color: '#F9A800',
                  }}>{av}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 800, color: '#E0E0E0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.nome}</div>
                    <div style={{ fontSize: 11, color: '#555', marginTop: 1 }}>{u.cargo}</div>
                  </div>
                  {/* badge nível */}
                  <div style={{ flexShrink: 0, background: '#F9A80015', border: '1px solid #F9A80033', borderRadius: 20, padding: '3px 10px', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, fontWeight: 800, color: '#F9A800' }}>
                    Nv {nivel(u.xp)}
                  </div>
                </div>

                {/* dados */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#555' }}>
                    <span style={{ color: '#333', fontSize: 13 }}>✉</span>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</span>
                  </div>
                  {u.telefone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#555' }}>
                      <span style={{ color: '#333', fontSize: 13 }}>💬</span>
                      <span>{u.telefone}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#555' }}>
                    <span style={{ color: '#333', fontSize: 13 }}>📅</span>
                    <span>{u.criadoEm ? new Date(u.criadoEm).toLocaleDateString('pt-BR') : '—'}</span>
                  </div>
                  {u.xp > 0 && (
                    <div style={{ marginTop: 2 }}>
                      <ProgressBar pct={((u.xp % 300) / 300) * 100} color="#F9A800" h={3} />
                      <span style={{ fontSize: 10, color: '#3A3A3A' }}>{u.xp} XP</span>
                    </div>
                  )}
                </div>

                {/* ações */}
                <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                  <button
                    onClick={() => setPerfil(u)}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 7, border: '1px solid #2A2A2A',
                      background: '#1A1A1A', color: '#AAA', cursor: 'pointer',
                      fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 700,
                      transition: 'all .15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#F9A80055'; e.currentTarget.style.color = '#F9A800'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#2A2A2A'; e.currentTarget.style.color = '#AAA'; }}
                  >VER PERFIL</button>
                  <button
                    onClick={() => handleExcluir(u)}
                    disabled={isExcluindo}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 7,
                      border: '1px solid #E05A2B44', background: '#E05A2B11',
                      color: isExcluindo ? '#555' : '#E05A2B', cursor: isExcluindo ? 'not-allowed' : 'pointer',
                      fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 700,
                      transition: 'all .15s', opacity: isExcluindo ? 0.5 : 1,
                    }}
                    onMouseEnter={e => { if (!isExcluindo) e.currentTarget.style.background = '#E05A2B22'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#E05A2B11'; }}
                  >{isExcluindo ? 'EXCLUINDO...' : 'EXCLUIR'}</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════
const TABS = [
  { id: 'visao', label: '◈ Visão Geral' },
  { id: 'modulos', label: '📦 Módulos' },
  { id: 'colaboradores', label: '👤 Cadastrar' },
  { id: 'lista', label: '📋 Colaboradores' },
];

export default function Manager() {
  const [tab, setTab] = useState('visao');
  const [toast, setToast] = useState({ msg: '', ok: true });

  const showToast = (msg, ok) => {
    setToast({ msg, ok });
    setTimeout(() => setToast({ msg: '', ok: true }), 3500);
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1080, fontFamily: 'Barlow, sans-serif' }}>
      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 36, fontWeight: 900, color: '#F0F0F0', marginBottom: 4 }}>
        Painel do Gestor
      </div>
      <div style={{ color: '#444', marginBottom: 24, fontSize: 13 }}>
        Gerencie módulos, colaboradores e acompanhe o progresso da equipe
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: '#0A0A0A', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '8px 18px', borderRadius: 7, border: 'none', cursor: 'pointer',
              background: tab === t.id ? '#F9A800' : 'transparent',
              color: tab === t.id ? '#000' : '#555',
              fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 13,
              letterSpacing: 0.5, transition: 'all .15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'visao' && <SecaoVisaoGeral team={MOCK_TEAM} />}
      {tab === 'modulos' && <SecaoModulos toast={showToast} />}
      {tab === 'colaboradores' && <SecaoColaboradores toast={showToast} />}
      {tab === 'lista' && <SecaoListaColaboradores toast={showToast} />}

      <Toast msg={toast.msg} ok={toast.ok} />
    </div>
  );
}
