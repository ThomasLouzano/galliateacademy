export const TRILHAS = [
  {
    id: 'cozinha',
    name: 'Cozinha',
    icon: '🔥',
    color: '#E05A2B',
    colorDim: '#2A1A12',
    roles: ['Churrasqueiro / Grillman', 'Montador de lanche', 'Cozinheiro'],
    courses: [
      {
        id: 'smash',
        title: 'Técnica Smashburger',
        subtitle: 'Chapa, pressão, tempo, sequência',
        duration: '28min', xp: 150,
        lessons: [
          { id: 'sm1', title: 'Preparando a chapa', type: 'video', duration: '6min', desc: 'Temperatura ideal, limpeza entre turnos e cuidados com a superfície da chapa.' },
          { id: 'sm2', title: 'A técnica do smash', type: 'video', duration: '8min', desc: 'Pressão correta, timing e o segredo da borda crocante. Demonstração passo a passo.', videoUrl: 'https://www.youtube.com/watch?v=8E__VJM_AUw', gated: true, checklist: ['Entendi que o smash deve ser feito logo após posicionar a carne na chapa quente.', 'Entendi que a pressão correta aumenta a área de contato e favorece a reação de Maillard.', 'Entendi que não devo adiantar etapas nem movimentar a carne antes do ponto correto.'] },
          { id: 'sm3', title: 'Ponto certo da carne', type: 'text', duration: '5min', desc: 'Cor, textura e temperatura interna. Como identificar o ponto sem cortar o burger.' },
          { id: 'sm4', title: 'Sequência de produção', type: 'video', duration: '9min', desc: 'Fluxo durante o pico: organização, comunicação e velocidade sem perder padrão.' },
        ]
      },
      {
        id: 'miseen',
        title: 'Mise en Place',
        subtitle: 'Mesa de montagem e embalo',
        duration: '22min', xp: 120,
        lessons: [
          { id: 'mp1', title: 'Organização da bancada', type: 'video', duration: '7min', desc: 'Posicionamento de cada ingrediente, fluxo de mão e ergonomia.' },
          { id: 'mp2', title: 'Reposição durante o turno', type: 'text', duration: '5min', desc: 'Como e quando repor sem parar o fluxo de produção.' },
          { id: 'mp3', title: 'Embalo e apresentação', type: 'video', duration: '10min', desc: 'Padrão de embalagem, temperatura dos ingredientes e apresentação final.' },
        ]
      },
      {
        id: 'montagem',
        title: 'Montagem de Burgers',
        subtitle: 'Padrão visual e ordem dos ingredientes',
        duration: '30min', xp: 160,
        lessons: [
          { id: 'mo1', title: 'Ordem dos ingredientes', type: 'video', duration: '10min', desc: 'Por que a ordem importa: estabilidade, sabor e apresentação.' },
          { id: 'mo2', title: 'Padrão Galliate', type: 'text', duration: '8min', desc: 'O receituário oficial: cada burger do cardápio com foto e especificações.' },
          { id: 'mo3', title: 'Burgers especiais e personalizações', type: 'video', duration: '12min', desc: 'Como lidar com pedidos customizados sem sair do padrão de tempo.' },
        ]
      },
      {
        id: 'qualidade',
        title: 'Controle de Qualidade',
        subtitle: 'Temperatura, validade, BPF',
        duration: '25min', xp: 130,
        lessons: [
          { id: 'q1', title: 'Tabela de temperaturas', type: 'text', duration: '8min', desc: 'Temperatura correta para cada produto: armazenamento, preparo e entrega.' },
          { id: 'q2', title: 'Etiquetagem e validade', type: 'video', duration: '7min', desc: 'Como etiquetar corretamente e o critério PEPS (primeiro a entrar, primeiro a sair).' },
          { id: 'q3', title: 'Boas Práticas de Fabricação', type: 'text', duration: '10min', desc: 'Higiene pessoal, uniforme, proibições e responsabilidades na cozinha.' },
        ]
      },
      {
        id: 'producao',
        title: 'Produção e Estoque',
        subtitle: 'Blend, pré-preparo, contagem física',
        duration: '32min', xp: 170,
        lessons: [
          { id: 'pr1', title: 'Blend e porcionamento', type: 'video', duration: '10min', desc: 'Peso padrão dos smash burgers, porcionamento do blend e congelamento correto.' },
          { id: 'pr2', title: 'Pré-preparo diário', type: 'video', duration: '12min', desc: 'Checklist de abertura: o que preparar, quanto e como armazenar.' },
          { id: 'pr3', title: 'Contagem física de estoque', type: 'text', duration: '10min', desc: 'Preenchimento da planilha de inventário e comunicação de rupturas.' },
        ]
      },
    ]
  },
  {
    id: 'entrega',
    name: 'Entrega',
    icon: '🛵',
    color: '#22A06B',
    colorDim: '#0D2218',
    roles: ['Entregador'],
    courses: [
      {
        id: 'padrao-entrega',
        title: 'Padrão de Entrega',
        subtitle: 'Embalo, conferência, tempo',
        duration: '20min', xp: 110,
        lessons: [
          { id: 'pe1', title: 'Conferência do pedido', type: 'video', duration: '7min', desc: 'Checagem item por item antes de sair: burgers, bebidas, molhos, sacola.' },
          { id: 'pe2', title: 'Embalo térmico', type: 'text', duration: '6min', desc: 'Como usar a bag corretamente para manter a temperatura durante o trajeto.' },
          { id: 'pe3', title: 'Meta de tempo', type: 'text', duration: '7min', desc: 'Tempo máximo por entrega, como calcular e o que fazer em caso de atraso.' },
        ]
      },
      {
        id: 'atendimento-entrega',
        title: 'Atendimento e Postura',
        subtitle: 'Tom com cliente, resolução de problemas',
        duration: '18min', xp: 100,
        lessons: [
          { id: 'ae1', title: 'Abordagem na entrega', type: 'video', duration: '6min', desc: 'Como cumprimentar, confirmar o pedido e passar uma boa impressão.' },
          { id: 'ae2', title: 'Problemas e reclamações', type: 'text', duration: '7min', desc: 'O que fazer quando o cliente reclama: pedido errado, atraso ou item faltando.' },
          { id: 'ae3', title: 'Representando a Galliate', type: 'text', duration: '5min', desc: 'Uniforme, comportamento no trânsito e postura como embaixador da marca.' },
        ]
      },
      {
        id: 'rotas',
        title: 'Roteirização e Segurança',
        subtitle: 'App, rotas, trânsito seguro',
        duration: '22min', xp: 120,
        lessons: [
          { id: 'ro1', title: 'Usando o app de entregas', type: 'video', duration: '8min', desc: 'Como aceitar pedidos, navegar no mapa e atualizar o status da entrega.' },
          { id: 'ro2', title: 'Rotas eficientes', type: 'text', duration: '7min', desc: 'Lógica de roteirização, múltiplos pedidos e comunicação com a loja.' },
          { id: 'ro3', title: 'Segurança no trânsito', type: 'text', duration: '7min', desc: 'EPI obrigatório, normas de condução e procedimentos em caso de acidente.' },
        ]
      },
      {
        id: 'rastreamento',
        title: 'Rastreamento e Comunicação',
        subtitle: 'WhatsApp, transit tracking',
        duration: '15min', xp: 90,
        lessons: [
          { id: 'ra1', title: 'Canal de comunicação', type: 'text', duration: '5min', desc: 'Grupos de WhatsApp, protocolo de mensagens e horários de resposta.' },
          { id: 'ra2', title: 'Atualização em tempo real', type: 'video', duration: '10min', desc: 'Como manter a loja informada sobre status da entrega e imprevistos.' },
        ]
      },
    ]
  },
  {
    id: 'gestao',
    name: 'Gestão e Cultura',
    icon: '⭐',
    color: '#8B7FE8',
    colorDim: '#1A1730',
    roles: ['Supervisor / Gerente', 'Coordenador de Turno', 'Atendente / Caixa'],
    courses: [
      {
        id: 'onboarding',
        title: 'Onboarding Galliate',
        subtitle: 'Cultura, missão, regras da casa',
        duration: '35min', xp: 200,
        lessons: [
          { id: 'on1', title: 'Nossa história', type: 'video', duration: '8min', desc: 'Como a Galliate nasceu, nossos valores e o que nos diferencia no mercado.' },
          { id: 'on2', title: 'Missão e cultura', type: 'text', duration: '10min', desc: 'O que acreditamos, como tratamos clientes e colegas, e o nosso propósito.' },
          { id: 'on3', title: 'Regras da casa', type: 'text', duration: '8min', desc: 'Código de conduta, uniforme, uso de celular, horários e procedimentos gerais.' },
          { id: 'on4', title: 'Primeiros dias', type: 'video', duration: '9min', desc: 'O que esperar na primeira semana, quem procurar e como tirar dúvidas.' },
        ]
      },
      {
        id: 'faltas',
        title: 'Faltas e Ausências',
        subtitle: 'Política interna, abonos, eSocial',
        duration: '20min', xp: 100,
        lessons: [
          { id: 'fa1', title: 'Política de faltas', type: 'text', duration: '8min', desc: 'Tolerâncias, desconto proporcional e impacto nas avaliações de desempenho.' },
          { id: 'fa2', title: 'Como avisar ausências', type: 'text', duration: '7min', desc: 'Canais corretos, antecedência mínima e documentação necessária.' },
          { id: 'fa3', title: 'Atestados e abonos', type: 'text', duration: '5min', desc: 'Quais documentos são aceitos, prazo de entrega e processo de análise.' },
        ]
      },
      {
        id: 'checklists',
        title: 'Checklists Operacionais',
        subtitle: '21 checklists — como e por quê',
        duration: '28min', xp: 140,
        lessons: [
          { id: 'ch1', title: 'Por que usamos checklists', type: 'video', duration: '6min', desc: 'A importância da consistência operacional e como os checklists protegem todos.' },
          { id: 'ch2', title: 'Abertura e fechamento', type: 'text', duration: '10min', desc: 'Os 7 checklists de abertura e 6 de fechamento: o que verificar e registrar.' },
          { id: 'ch3', title: 'Checklists de produção', type: 'text', duration: '12min', desc: 'Controle de temperatura, validade, limpeza e estoque durante o turno.' },
        ]
      },
      {
        id: 'fornecedores',
        title: 'Recebimento de Fornecedores',
        subtitle: 'Conferência, qualidade, template',
        duration: '22min', xp: 110,
        lessons: [
          { id: 'fo1', title: 'Processo de recebimento', type: 'video', duration: '8min', desc: 'Da nota fiscal ao estoque: conferência de itens, peso e estado das embalagens.' },
          { id: 'fo2', title: 'Critérios de qualidade', type: 'text', duration: '8min', desc: 'O que recusar, como registrar divergências e comunicar ao gestor.' },
          { id: 'fo3', title: 'Preenchendo o template', type: 'text', duration: '6min', desc: 'Planilha de recebimento: campos obrigatórios, assinatura e arquivamento.' },
        ]
      },
      {
        id: 'escalas',
        title: 'Escalas e Folgas',
        subtitle: 'Como ler a escala, trocas',
        duration: '18min', xp: 95,
        lessons: [
          { id: 'es1', title: 'Lendo sua escala', type: 'text', duration: '6min', desc: 'Como interpretar o quadro de horários, turnos e dias de folga.' },
          { id: 'es2', title: 'Trocas de turno', type: 'text', duration: '7min', desc: 'Processo oficial de troca: quem avisar, prazo e confirmação.' },
          { id: 'es3', title: 'Banco de horas', type: 'text', duration: '5min', desc: 'Como funciona o banco, como consultar e solicitar compensação.' },
        ]
      },
    ]
  }
];

export const QUIZ_QUESTIONS = {
  smash: [
    { q: 'Qual é a temperatura ideal da chapa para o smashburger?', options: ['150°C', '200°C', '230°C', '180°C'], correct: 2 },
    { q: 'Por quanto tempo se aplica pressão na carne após o smash?', options: ['30 segundos', '10 segundos', '2 minutos', '1 minuto'], correct: 1 },
    { q: 'O que indica o ponto correto da carne no smashburger?', options: ['Cor rosada no centro', 'Bordas crocantes e superfície sem brilho', 'Cor completamente cinza', 'Fumaça excessiva'], correct: 1 },
  ],
  onboarding: [
    { q: 'Qual é a missão da Galliate Hamburgueria?', options: ['Ser a maior rede do Brasil', 'Fazer o melhor smashburger com excelência e consistência', 'Vender o hambúrguer mais barato', 'Expandir para todo o país'], correct: 1 },
    { q: 'Em caso de dúvida no primeiro mês, quem deve ser consultado?', options: ['O cliente', 'Qualquer colega de trabalho', 'Supervisor ou coordenador de turno', 'Recursos humanos apenas'], correct: 2 },
  ],
  qualidade: [
    { q: 'Qual é a temperatura mínima interna para carne bovina cozida?', options: ['55°C', '60°C', '70°C', '80°C'], correct: 2 },
    { q: 'O que significa PEPS no controle de estoque?', options: ['Produto Em Perfeito Estado', 'Primeiro a Entrar, Primeiro a Sair', 'Padrão Especial Para Smash', 'Preço Especial Para Estoque'], correct: 1 },
    { q: 'Com que frequência deve ser feita a limpeza da chapa?', options: ['Só no fechamento', 'A cada 2 horas', 'Entre cada pedido', 'Uma vez por semana'], correct: 2 },
  ]
};

export const getTrilha = (id) => TRILHAS.find(t => t.id === id);
export const getCourse = (tid, cid) => getTrilha(tid)?.courses.find(c => c.id === cid);
export const pctOf = (done, total) => total ? Math.round(done / total * 100) : 0;

export const courseProgress = (course, prog) => {
  const done = course.lessons.filter(l => prog[l.id]).length;
  return { done, total: course.lessons.length, pct: pctOf(done, course.lessons.length) };
};

export const trailProgress = (trail, prog) => {
  const lessons = trail.courses.flatMap(c => c.lessons);
  const done = lessons.filter(l => prog[l.id]).length;
  return { done, total: lessons.length, pct: pctOf(done, lessons.length) };
};

export const totalXP = (prog) => {
  let xp = 0;
  TRILHAS.forEach(t => t.courses.forEach(c => {
    c.lessons.forEach(l => { if (prog[l.id]) xp += 30; });
    if (c.lessons.every(l => prog[l.id])) xp += 50;
  }));
  return xp;
};
