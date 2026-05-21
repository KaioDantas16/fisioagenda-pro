import { useState, useEffect, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

// ============================================================
// THEMES
// ============================================================
const THEMES = {
  clinico_claro: {
    name: 'Clínico Claro',
    colors: ['#ffffff', '#0891b2', '#164e63'],
    bg: '#f0f9ff',
    card: '#ffffff',
    sidebar: '#0c4a6e',
    sidebarText: '#ffffff',
    accent: '#0891b2',
    accent2: '#06b6d4',
    text: '#0f172a',
    textMuted: '#64748b',
    border: '#e0f2fe',
    navBg: '#ffffff',
    navActive: '#0891b2',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    badge: '#e0f2fe',
    badgeText: '#0e7490',
    inputBg: '#f8fafc',
    headerBg: '#0c4a6e',
    gradient: 'linear-gradient(135deg, #0c4a6e 0%, #0891b2 100%)',
  },
  clinico_escuro: {
    name: 'Clínico Escuro',
    colors: ['#0f172a', '#0d9488', '#94a3b8'],
    bg: '#0f172a',
    card: '#1e293b',
    sidebar: '#020617',
    sidebarText: '#e2e8f0',
    accent: '#0d9488',
    accent2: '#14b8a6',
    text: '#f1f5f9',
    textMuted: '#94a3b8',
    border: '#334155',
    navBg: '#1e293b',
    navActive: '#0d9488',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    badge: '#134e4a',
    badgeText: '#5eead4',
    inputBg: '#0f172a',
    headerBg: '#020617',
    gradient: 'linear-gradient(135deg, #020617 0%, #0d9488 100%)',
  },
  verde_saude: {
    name: 'Verde Saúde',
    colors: ['#ffffff', '#16a34a', '#14532d'],
    bg: '#f0fdf4',
    card: '#ffffff',
    sidebar: '#14532d',
    sidebarText: '#ffffff',
    accent: '#16a34a',
    accent2: '#22c55e',
    text: '#0f172a',
    textMuted: '#6b7280',
    border: '#bbf7d0',
    navBg: '#ffffff',
    navActive: '#16a34a',
    success: '#16a34a',
    warning: '#f59e0b',
    danger: '#ef4444',
    badge: '#dcfce7',
    badgeText: '#166534',
    inputBg: '#f8fafc',
    headerBg: '#14532d',
    gradient: 'linear-gradient(135deg, #14532d 0%, #16a34a 100%)',
  },
  roxo_moderno: {
    name: 'Roxo Moderno',
    colors: ['#1e1b4b', '#7c3aed', '#c4b5fd'],
    bg: '#1e1b4b',
    card: '#2e1065',
    sidebar: '#13111e',
    sidebarText: '#e9d5ff',
    accent: '#7c3aed',
    accent2: '#a78bfa',
    text: '#f5f3ff',
    textMuted: '#c4b5fd',
    border: '#4c1d95',
    navBg: '#2e1065',
    navActive: '#7c3aed',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#f43f5e',
    badge: '#4c1d95',
    badgeText: '#c4b5fd',
    inputBg: '#13111e',
    headerBg: '#13111e',
    gradient: 'linear-gradient(135deg, #13111e 0%, #7c3aed 100%)',
  },
  coral_energia: {
    name: 'Coral Energia',
    colors: ['#ffffff', '#f43f5e', '#1e293b'],
    bg: '#fff1f2',
    card: '#ffffff',
    sidebar: '#881337',
    sidebarText: '#ffffff',
    accent: '#f43f5e',
    accent2: '#fb7185',
    text: '#0f172a',
    textMuted: '#64748b',
    border: '#fecdd3',
    navBg: '#ffffff',
    navActive: '#f43f5e',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    badge: '#ffe4e6',
    badgeText: '#be123c',
    inputBg: '#f8fafc',
    headerBg: '#881337',
    gradient: 'linear-gradient(135deg, #881337 0%, #f43f5e 100%)',
  },
  neutro_pro: {
    name: 'Neutro Pro',
    colors: ['#1c1917', '#d97706', '#fef3c7'],
    bg: '#1c1917',
    card: '#292524',
    sidebar: '#0c0a09',
    sidebarText: '#fef3c7',
    accent: '#d97706',
    accent2: '#f59e0b',
    text: '#fef9f0',
    textMuted: '#a8a29e',
    border: '#44403c',
    navBg: '#292524',
    navActive: '#d97706',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    badge: '#44403c',
    badgeText: '#fbbf24',
    inputBg: '#0c0a09',
    headerBg: '#0c0a09',
    gradient: 'linear-gradient(135deg, #0c0a09 0%, #d97706 100%)',
  },
};

// ============================================================
// MOCK DATA
// ============================================================
const initialPatients = [
  {
    id: 1,
    name: 'Maria Silva',
    age: 47,
    cpf: '123.456.789-00',
    phone: '(11) 99999-1111',
    email: 'maria@email.com',
    insurance: 'Unimed',
    cid: 'M17.0',
    diagnosis: 'Gonartrose primária bilateral',
    physiodiag:
      'Disfunção biomecânica do joelho com limitação de ADM e dor crônica',
    sessions: 8,
    eva: 1,
    active: true,
    nextAppt: '21/05 09:00',
    area: 'Traumato-ortopedia',
  },
  {
    id: 2,
    name: 'João Santos',
    age: 29,
    cpf: '987.654.321-00',
    phone: '(11) 98888-2222',
    email: 'joao@email.com',
    insurance: 'Particular',
    cid: 'S83.5',
    diagnosis: 'Pós-op reconstrução LCA joelho direito',
    physiodiag: 'Reabilitação pós-cirúrgica de LCA - fase funcional',
    sessions: 12,
    eva: 2,
    active: true,
    nextAppt: '21/05 11:00',
    area: 'Traumato-ortopedia',
  },
  {
    id: 3,
    name: 'Ana Oliveira',
    age: 35,
    cpf: '456.789.123-00',
    phone: '(11) 97777-3333',
    email: 'ana@email.com',
    insurance: 'Bradesco Saúde',
    cid: 'M54.5',
    diagnosis: 'Lombalgia crônica',
    physiodiag: 'Síndrome miofascial lombar com hipomobilidade segmentar',
    sessions: 6,
    eva: 3,
    active: true,
    nextAppt: '21/05 14:00',
    area: 'Geral',
  },
  {
    id: 4,
    name: 'Carlos Lima',
    age: 52,
    cpf: '321.654.987-00',
    phone: '(11) 96666-4444',
    email: 'carlos@email.com',
    insurance: 'SulAmérica',
    cid: 'M75.1',
    diagnosis: 'Síndrome do manguito rotador',
    physiodiag: 'Tendinopatia do supraespinal com bursoproteção comprometida',
    sessions: 4,
    eva: 4,
    active: true,
    nextAppt: '22/05 10:00',
    area: 'Traumato-ortopedia',
  },
];

const initialSessions = [
  {
    id: 1,
    patientId: 1,
    date: '17/05/2026',
    time: '09:00',
    session: 8,
    complaint: 'Dor moderada, melhora após sessão anterior',
    findings: 'Redução do edema, ADM melhorado em 10°',
    resources: ['Crioterapia', 'Cinesioterapia', 'TENS'],
    techniques: 'Mobilização patelofemoral grau III',
    exercises: 'Leg press, extensão de joelho isométrica',
    evolution: 'Evolução positiva, redução da dor e ganho de ADM',
    evaBefore: 3,
    evaAfter: 1,
    goal: 'Sim',
    plan: 'Aumentar carga nos exercícios',
    status: 'Finalizado',
  },
  {
    id: 2,
    patientId: 1,
    date: '14/05/2026',
    time: '09:00',
    session: 7,
    complaint: 'Dor ao subir escadas',
    findings: 'Crepitação patelofemoral, força reduzida em VMO',
    resources: ['Ultrassom', 'Cinesioterapia'],
    techniques: 'Liberação miofascial do TIB',
    exercises: 'Agachamento parcial, step',
    evolution: 'Melhora parcial da dor funcional',
    evaBefore: 4,
    evaAfter: 2,
    goal: 'Parcialmente',
    plan: 'Incluir propriocepção',
    status: 'Finalizado',
  },
  {
    id: 3,
    patientId: 2,
    date: '16/05/2026',
    time: '11:00',
    session: 12,
    complaint: 'Dor residual após treino',
    findings: 'Força Q/IQ 85%, propriocepção boa',
    resources: ['FES', 'Cinesioterapia'],
    techniques: 'PNF membro inferior',
    exercises: 'Pliometria bilateral, corrida em linha reta',
    evolution: 'Próximo da alta, retorno esportivo em 2 semanas',
    evaBefore: 2,
    evaAfter: 0,
    goal: 'Sim',
    plan: 'Protocolo de retorno ao esporte',
    status: 'Finalizado',
  },
  {
    id: 4,
    patientId: 3,
    date: '17/05/2026',
    time: '14:00',
    session: 6,
    complaint: 'Dor lombar ao sentar por longa jornada',
    findings: 'Hipomobilidade L4-L5, hipertonia paravertebral',
    resources: ['Termoterapia', 'TENS', 'Cinesioterapia'],
    techniques: 'Manipulação lombar, liberação dos paravertebrais',
    exercises: 'Cat-camel, bird-dog, dead bug',
    evolution: 'Melhora da mobilidade lombar',
    evaBefore: 5,
    evaAfter: 3,
    goal: 'Parcialmente',
    plan: 'Incluir estabilização profunda',
    status: 'Finalizado',
  },
];

const initialAppointments = [
  {
    id: 1,
    patientId: 1,
    patientName: 'Maria Silva',
    date: '2026-05-21',
    time: '09:00',
    duration: 45,
    type: 'Sessão',
    status: 'Confirmado',
  },
  {
    id: 2,
    patientId: 2,
    patientName: 'João Santos',
    date: '2026-05-21',
    time: '10:30',
    duration: 60,
    type: 'Sessão',
    status: 'Confirmado',
  },
  {
    id: 3,
    patientId: 3,
    patientName: 'Ana Oliveira',
    date: '2026-05-21',
    time: '14:00',
    duration: 45,
    type: 'Sessão',
    status: 'Pendente',
  },
  {
    id: 4,
    patientId: 4,
    patientName: 'Carlos Lima',
    date: '2026-05-22',
    time: '10:00',
    duration: 60,
    type: 'Reavaliação',
    status: 'Confirmado',
  },
  {
    id: 5,
    patientId: 1,
    patientName: 'Maria Silva',
    date: '2026-05-23',
    time: '09:00',
    duration: 45,
    type: 'Sessão',
    status: 'Pendente',
  },
];

const PROTOCOLS = [
  {
    id: 1,
    name: 'Lombalgia Crônica',
    area: 'Coluna',
    cid: 'M54.5',
    phases: [
      {
        name: 'Fase Aguda (1-2 sem)',
        goals: 'Reduzir dor e espasmo muscular',
        interventions:
          'TENS, termoterapia, massagem, orientações posturais, mobilizações passivas suaves',
      },
      {
        name: 'Fase Subaguda (3-6 sem)',
        goals: 'Restaurar ADM e iniciar fortalecimento',
        interventions:
          'Mobilização articular, alongamentos, estabilização segmentar, Pilates terapêutico',
      },
      {
        name: 'Fase Funcional (7+ sem)',
        goals: 'Retorno às AVDs e prevenção de recidiva',
        interventions:
          'Fortalecimento global, reeducação postural, exercícios funcionais, ergonomia',
      },
    ],
  },
  {
    id: 2,
    name: 'Reconstrução LCA',
    area: 'Joelho',
    cid: 'S83.5',
    phases: [
      {
        name: 'Pós-op Imediato (0-2 sem)',
        goals: 'Controle da dor/edema, proteção do enxerto',
        interventions:
          'Crioterapia, mobilização patelar, isométricos do quadríceps, descarga parcial',
      },
      {
        name: 'Fortalecimento (3-12 sem)',
        goals: 'Recuperar força e ADM completa',
        interventions:
          'Cadeia cinética fechada, leg press, step, bicicleta, propriocepção básica',
      },
      {
        name: 'Funcional/Esportivo (3-6 meses)',
        goals: 'Retorno esportivo seguro',
        interventions:
          'Pliometria, corrida, agilidade, testes funcionais (Hop test, força Q/IQ ≥85%)',
      },
    ],
  },
  {
    id: 3,
    name: 'Manguito Rotador',
    area: 'Ombro',
    cid: 'M75.1',
    phases: [
      {
        name: 'Fase Aguda (1-3 sem)',
        goals: 'Reduzir inflamação e dor',
        interventions:
          'Crioterapia, TENS, ultrassom, exercícios pendulares, ADM passivo',
      },
      {
        name: 'Fase Intermediária (4-8 sem)',
        goals: 'Ganho de ADM e fortalecimento inicial',
        interventions:
          'ADM ativo-assistido, rotadores com theraband, estabilização escapular',
      },
      {
        name: 'Fase Avançada (9+ sem)',
        goals: 'Força funcional e retorno às atividades',
        interventions:
          'Fortalecimento progressivo, exercícios funcionais acima da cabeça, treino esportivo específico',
      },
    ],
  },
  {
    id: 4,
    name: 'Gonartrose',
    area: 'Joelho',
    cid: 'M17.0',
    phases: [
      {
        name: 'Fase de Controle (1-3 sem)',
        goals: 'Reduzir dor e edema',
        interventions:
          'Crioterapia, TENS, mobilização patelar, isométricos, orientações de carga',
      },
      {
        name: 'Fase de Ganho (4-8 sem)',
        goals: 'Aumentar ADM e força',
        interventions:
          'ADM ativo, fortalecimento de quadríceps e glúteos, bicicleta, hidroterapia',
      },
      {
        name: 'Fase Funcional (9+ sem)',
        goals: 'Independência funcional',
        interventions:
          'Treino de marcha, escadas, equilíbrio, orientações de AVD',
      },
    ],
  },
  {
    id: 5,
    name: 'Hérnia de Disco Lombar',
    area: 'Coluna',
    cid: 'M51.1',
    phases: [
      {
        name: 'Fase Aguda (1-2 sem)',
        goals: 'Reduzir compressão nervosa e dor',
        interventions:
          'Tração lombar, TENS, posicionamento antálgico, orientações de carga',
      },
      {
        name: 'Fase Subaguda (3-6 sem)',
        goals: 'Descentralizar sintomas, fortalecer core',
        interventions:
          'Extensão de McKenzie ou flexão de Williams, estabilização segmentar',
      },
      {
        name: 'Fase Funcional (7+ sem)',
        goals: 'Retorno ao trabalho e prevenção',
        interventions: 'Fortalecimento global, ergonomia, escola da postura',
      },
    ],
  },
  {
    id: 6,
    name: 'Fasciíte Plantar',
    area: 'Tornozelo/Pé',
    cid: 'M72.2',
    phases: [
      {
        name: 'Fase Aguda',
        goals: 'Reduzir inflamação e dor matinal',
        interventions:
          'Crioterapia, TENS, ultrassom, palmilha de silicone, fita de bandagem',
      },
      {
        name: 'Fase de Reabilitação',
        goals: 'Alongar fáscia e fortalecer musculatura',
        interventions:
          'Alongamento da fáscia e panturrilha, fortalecimento intrínseco do pé',
      },
      {
        name: 'Fase de Retorno',
        goals: 'Retorno completo às atividades',
        interventions:
          'Progressão de impacto, treino de marcha e corrida, prevenção de recidiva',
      },
    ],
  },
];

const RED_FLAGS = [
  {
    region: 'Coluna',
    flags: [
      'Déficit neurológico progressivo',
      'Disfunção vesical/intestinal (cauda equina)',
      'Perda de peso inexplicada >10%',
      'Dor noturna intensa que não melhora em repouso',
      'Histórico de câncer',
      'Febre associada à dor',
      'Trauma de alta energia',
      'Uso prolongado de corticóides',
    ],
    color: 'danger',
  },
  {
    region: 'Ombro',
    flags: [
      'Dor em repouso severa sem melhora',
      'Massa palpável suspeita',
      'Déficit neurológico (paralisia do nervo axilar)',
      'Luxação irredutível',
      'Fratura não diagnosticada',
      'Dor referida de origem cardíaca (ombro esquerdo)',
    ],
    color: 'danger',
  },
  {
    region: 'Joelho',
    flags: [
      'Derrame articular com calor intenso (artrite séptica?)',
      'Bloqueio mecânico do joelho',
      'Instabilidade grave com impotência funcional total',
      'Suspeita de fratura (Ottawa Rules positivo)',
      'Massa palpável suspeita de neoplasia',
    ],
    color: 'danger',
  },
  {
    region: 'Neurológico',
    flags: [
      'Déficit motor progressivo nos membros',
      'Alteração de consciência ou confusão mental',
      'Cefaleia súbita e intensa (trovoada)',
      'Diplopia, disfagia, disartria',
      'Incontinência urinária/fecal de instalação súbita',
      'Sintomas bilaterais nos membros',
    ],
    color: 'danger',
  },
];

const EXERCISES = {
  Coluna: [
    {
      name: 'Cat-Camel',
      goal: 'Mobilidade',
      sets: '3',
      reps: '10',
      level: 'Iniciante',
      desc: 'Em 4 apoios, alterne extensão e flexão da coluna lentamente',
    },
    {
      name: 'Bird-Dog',
      goal: 'Estabilização',
      sets: '3',
      reps: '10 cada lado',
      level: 'Intermediário',
      desc: 'Em 4 apoios, estenda braço e perna opostos mantendo o tronco estável',
    },
    {
      name: 'Dead Bug',
      goal: 'Core',
      sets: '3',
      reps: '8 cada lado',
      level: 'Intermediário',
      desc: 'Deitado, coluna neutra, alterne extensão de braço e perna opostos',
    },
    {
      name: 'Ponte Glútea',
      goal: 'Fortalecimento',
      sets: '3',
      reps: '15',
      level: 'Iniciante',
      desc: 'Deitado em decúbito dorsal, eleve o quadril contraindo glúteos',
    },
  ],
  Joelho: [
    {
      name: 'Agachamento Parcial',
      goal: 'Fortalecimento',
      sets: '3',
      reps: '15',
      level: 'Iniciante',
      desc: 'Pés na largura dos ombros, desça até 60° flexão mantendo joelhos alinhados',
    },
    {
      name: 'Extensão Isométrica',
      goal: 'Ativação VMO',
      sets: '3',
      reps: '30s',
      level: 'Iniciante',
      desc: 'Sentado, contraia o quadríceps sem movimento, enfatizando o VMO',
    },
    {
      name: 'Step Up',
      goal: 'Funcional',
      sets: '3',
      reps: '12 cada perna',
      level: 'Intermediário',
      desc: 'Suba e desça de um step com controle excêntrico',
    },
    {
      name: 'Leg Press',
      goal: 'Fortalecimento',
      sets: '3',
      reps: '15',
      level: 'Intermediário',
      desc: 'Na máquina, empurre a plataforma até extensão parcial (não travas)',
    },
  ],
  Ombro: [
    {
      name: 'Exercícios Pendulares',
      goal: 'Mobilidade',
      sets: '3',
      reps: '20',
      level: 'Iniciante',
      desc: 'Debruçado, deixe o braço balançar livremente em círculos pequenos',
    },
    {
      name: 'Rotação Externa c/ Theraband',
      goal: 'Fortalecimento',
      sets: '3',
      reps: '15',
      level: 'Iniciante',
      desc: 'Cotovelo a 90°, rotacione o braço para fora contra a resistência',
    },
    {
      name: 'Retração Escapular',
      goal: 'Estabilização',
      sets: '3',
      reps: '15',
      level: 'Iniciante',
      desc: 'Junte as escápulas como se fosse segurar um lápis entre elas',
    },
    {
      name: 'Elevação Lateral',
      goal: 'Fortalecimento',
      sets: '3',
      reps: '12',
      level: 'Intermediário',
      desc: 'Eleve os braços lateralmente até 90° com controle',
    },
  ],
  Quadril: [
    {
      name: 'Abdução em Decúbito',
      goal: 'Fortalecimento',
      sets: '3',
      reps: '15 cada lado',
      level: 'Iniciante',
      desc: 'Deitado de lado, eleve a perna de cima mantendo quadril estável',
    },
    {
      name: 'Clamshell',
      goal: 'Glúteo Médio',
      sets: '3',
      reps: '15 cada lado',
      level: 'Iniciante',
      desc: 'Deitado de lado com quadril/joelho a 45°, abra os joelhos como uma concha',
    },
    {
      name: 'Agachamento Unipodal',
      goal: 'Funcional',
      sets: '3',
      reps: '10 cada lado',
      level: 'Avançado',
      desc: 'Em apoio unipodal, agache controlando o valgo do joelho',
    },
  ],
  Tornozelo: [
    {
      name: 'Panturrilha em Pé',
      goal: 'Fortalecimento',
      sets: '3',
      reps: '20',
      level: 'Iniciante',
      desc: 'Em pé, eleve-se na ponta dos pés com controle excêntrico na descida',
    },
    {
      name: 'Equilíbrio Unipodal',
      goal: 'Propriocepção',
      sets: '3',
      reps: '30s cada pé',
      level: 'Iniciante',
      desc: 'Em apoio unipodal, mantenha o equilíbrio com olhos abertos',
    },
    {
      name: 'Resistência com Theraband',
      goal: 'Fortalecimento',
      sets: '3',
      reps: '15 cada direção',
      level: 'Intermediário',
      desc: 'Movimente o pé em flexão plantar, dorsiflexão, inversão e eversão',
    },
  ],
};

// ============================================================
// ICONS (SVG inline)
// ============================================================
const Icon = ({ name, size = 20, color = 'currentColor' }) => {
  const icons = {
    home: (
      <svg
        width={size}
        height={size}
        fill="none"
        stroke={color}
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    users: (
      <svg
        width={size}
        height={size}
        fill="none"
        stroke={color}
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    calendar: (
      <svg
        width={size}
        height={size}
        fill="none"
        stroke={color}
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    clipboard: (
      <svg
        width={size}
        height={size}
        fill="none"
        stroke={color}
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      </svg>
    ),
    activity: (
      <svg
        width={size}
        height={size}
        fill="none"
        stroke={color}
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    dumbbell: (
      <svg
        width={size}
        height={size}
        fill="none"
        stroke={color}
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M6.5 6.5h11" />
        <path d="M6.5 17.5h11" />
        <path d="M3 9.5h18v5H3z" />
      </svg>
    ),
    book: (
      <svg
        width={size}
        height={size}
        fill="none"
        stroke={color}
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
    alert: (
      <svg
        width={size}
        height={size}
        fill="none"
        stroke={color}
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    settings: (
      <svg
        width={size}
        height={size}
        fill="none"
        stroke={color}
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    plus: (
      <svg
        width={size}
        height={size}
        fill="none"
        stroke={color}
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
    menu: (
      <svg
        width={size}
        height={size}
        fill="none"
        stroke={color}
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    ),
    x: (
      <svg
        width={size}
        height={size}
        fill="none"
        stroke={color}
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
    chevron: (
      <svg
        width={size}
        height={size}
        fill="none"
        stroke={color}
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    ),
    check: (
      <svg
        width={size}
        height={size}
        fill="none"
        stroke={color}
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    print: (
      <svg
        width={size}
        height={size}
        fill="none"
        stroke={color}
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <polyline points="6 9 6 2 18 2 18 9" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" />
      </svg>
    ),
    whatsapp: (
      <svg width={size} height={size} fill={color} viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.549 4.103 1.508 5.836L0 24l6.338-1.493A11.953 11.953 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.006-1.369l-.358-.214-3.724.878.894-3.629-.234-.372A9.818 9.818 0 1 1 12 21.818z" />
      </svg>
    ),
    trending: (
      <svg
        width={size}
        height={size}
        fill="none"
        stroke={color}
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
    eye: (
      <svg
        width={size}
        height={size}
        fill="none"
        stroke={color}
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    back: (
      <svg
        width={size}
        height={size}
        fill="none"
        stroke={color}
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <polyline points="15 18 9 12 15 6" />
      </svg>
    ),
    palette: (
      <svg
        width={size}
        height={size}
        fill="none"
        stroke={color}
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12s1-4 4-4 4 4 4 4" />
        <circle cx="9" cy="10" r="1" fill={color} />
        <circle cx="15" cy="10" r="1" fill={color} />
      </svg>
    ),
    user: (
      <svg
        width={size}
        height={size}
        fill="none"
        stroke={color}
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  };
  return icons[name] || null;
};

// ============================================================
// MAIN APP
// ============================================================
export default function FisioAgendaPro() {
  const [theme, setTheme] = useState('clinico_claro');
  const [page, setPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [patients, setPatients] = useState(initialPatients);
  const [sessions, setSessions] = useState(initialSessions);
  const [appointments, setAppointments] = useState(initialAppointments);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedProtocol, setSelectedProtocol] = useState(null);
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [showNewSession, setShowNewSession] = useState(false);
  const [showNewAppt, setShowNewAppt] = useState(false);
  const [viewSession, setViewSession] = useState(null);
  const [patientTab, setPatientTab] = useState('dados');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [searchPatient, setSearchPatient] = useState('');
  const [exerciseRegion, setExerciseRegion] = useState('Coluna');
  const [redFlagRegion, setRedFlagRegion] = useState(0);
  const t = THEMES[theme];

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppts = appointments.filter((a) => a.date === todayStr);

  const navItems = [
    { id: 'dashboard', label: 'Início', icon: 'home' },
    { id: 'patients', label: 'Pacientes', icon: 'users' },
    { id: 'agenda', label: 'Agenda', icon: 'calendar' },
    { id: 'records', label: 'Prontuários', icon: 'clipboard' },
    { id: 'evolution', label: 'Evolução', icon: 'activity' },
    { id: 'exercises', label: 'Exercícios', icon: 'dumbbell' },
    { id: 'protocols', label: 'Protocolos', icon: 'book' },
    { id: 'redflags', label: 'Red Flags', icon: 'alert' },
    { id: 'settings', label: 'Configurações', icon: 'settings' },
  ];

  const bottomNav = [
    { id: 'dashboard', label: 'Início', icon: 'home' },
    { id: 'patients', label: 'Pacientes', icon: 'users' },
    { id: 'agenda', label: 'Agenda', icon: 'calendar' },
    { id: 'records', label: 'Prontuários', icon: 'clipboard' },
    { id: 'exercises', label: 'Exercícios', icon: 'dumbbell' },
  ];

  const s = {
    app: {
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh',
      width: '100%',
      maxWidth: 430,
      margin: '0 auto',
      background: t.bg,
      color: t.text,
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      position: 'relative',
      overflow: 'hidden',
    },
    overlay: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      zIndex: 40,
      maxWidth: 430,
      margin: '0 auto',
    },
    sidebar: {
      position: 'fixed',
      top: 0,
      left: sidebarOpen ? 0 : -280,
      width: 265,
      height: '100dvh',
      background: t.sidebar,
      zIndex: 50,
      transition: 'left 0.3s ease',
      padding: '0 0 20px 0',
      display: 'flex',
      flexDirection: 'column',
      maxWidth: 430,
    },
    sidebarHeader: {
      padding: '24px 20px 20px',
      background: t.gradient,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    },
    sidebarTitle: { color: '#fff', fontWeight: 700, fontSize: 18 },
    sidebarItem: (active) => ({
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 20px',
      cursor: 'pointer',
      background: active ? `${t.accent}25` : 'transparent',
      borderLeft: active ? `3px solid ${t.accent}` : '3px solid transparent',
      transition: 'all 0.2s',
    }),
    topBar: {
      background: t.headerBg,
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
    },
    mainContent: {
      flex: 1,
      overflowY: 'auto',
      overflowX: 'hidden',
      WebkitOverflowScrolling: 'touch',
      padding: '16px 16px 80px',
      touchAction: 'pan-y',
    },
    bottomNavBar: {
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: 430,
      background: t.navBg,
      borderTop: `1px solid ${t.border}`,
      display: 'flex',
      zIndex: 30,
      flexShrink: 0,
    },
    navItem: (active) => ({
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '8px 4px',
      cursor: 'pointer',
      color: active ? t.navActive : t.textMuted,
      gap: 2,
    }),
    card: {
      background: t.card,
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
      border: `1px solid ${t.border}`,
    },
    statCard: {
      background: t.card,
      borderRadius: 14,
      padding: 16,
      border: `1px solid ${t.border}`,
      flex: 1,
    },
    btn: (variant = 'primary') => ({
      background:
        variant === 'primary'
          ? t.accent
          : variant === 'ghost'
          ? 'transparent'
          : t.card,
      color: variant === 'primary' ? '#fff' : t.text,
      border: variant === 'ghost' ? `1px solid ${t.border}` : 'none',
      padding: '10px 16px',
      borderRadius: 10,
      cursor: 'pointer',
      fontSize: 14,
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    }),
    badge: (type) => {
      const colors = {
        success: { bg: '#dcfce7', text: '#166534' },
        warning: { bg: '#fef3c7', text: '#92400e' },
        danger: { bg: '#fee2e2', text: '#991b1b' },
        info: { bg: t.badge, text: t.badgeText },
      };
      const c = colors[type] || colors.info;
      return {
        background: c.bg,
        color: c.text,
        padding: '3px 10px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        display: 'inline-block',
      };
    },
    input: {
      width: '100%',
      background: t.inputBg,
      border: `1px solid ${t.border}`,
      borderRadius: 10,
      padding: '10px 12px',
      color: t.text,
      fontSize: 14,
      outline: 'none',
      boxSizing: 'border-box',
    },
    label: {
      fontSize: 12,
      fontWeight: 600,
      color: t.textMuted,
      marginBottom: 4,
      display: 'block',
    },
    sectionTitle: { fontSize: 22, fontWeight: 700, marginBottom: 4 },
    subTitle: { fontSize: 13, color: t.textMuted, marginBottom: 16 },
    modal: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      maxWidth: 430,
      margin: '0 auto',
    },
    modalContent: {
      background: t.card,
      borderRadius: '20px 20px 0 0',
      padding: 20,
      width: '100%',
      maxHeight: '90dvh',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
    },
    chip: (active) => ({
      padding: '6px 14px',
      borderRadius: 20,
      fontSize: 13,
      fontWeight: 600,
      cursor: 'pointer',
      background: active ? t.accent : t.card,
      color: active ? '#fff' : t.textMuted,
      border: `1px solid ${active ? t.accent : t.border}`,
      whiteSpace: 'nowrap',
    }),
    evaSlider: { width: '100%', accentColor: t.accent },
    tabBtn: (active) => ({
      padding: '8px 14px',
      borderRadius: 8,
      fontSize: 13,
      fontWeight: 600,
      cursor: 'pointer',
      background: active ? t.accent : 'transparent',
      color: active ? '#fff' : t.textMuted,
      border: 'none',
    }),
  };

  const getStatusColor = (status) => {
    if (status === 'Confirmado') return 'success';
    if (status === 'Pendente') return 'warning';
    if (status === 'Cancelado' || status === 'Falta') return 'danger';
    return 'info';
  };

  // ============================================================
  // PAGES
  // ============================================================

  const Dashboard = () => (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 24, fontWeight: 700 }}>
          {greeting}, Dr(a).! 👋
        </div>
        <div style={{ fontSize: 13, color: t.textMuted, marginTop: 2 }}>
          {today}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          style={s.btn('primary')}
          onClick={() => setShowNewPatient(true)}
        >
          <Icon name="plus" size={16} color="#fff" /> Novo Paciente
        </button>
        <button
          style={s.btn('ghost')}
          onClick={() => {
            setPage('agenda');
            setShowNewAppt(true);
          }}
        >
          <Icon name="plus" size={16} color={t.text} /> Agendar
        </button>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          marginBottom: 16,
        }}
      >
        {[
          { label: 'Pacientes hoje', value: todayAppts.length, icon: 'users' },
          {
            label: 'Pacientes ativos',
            value: patients.filter((p) => p.active).length,
            icon: 'activity',
          },
          {
            label: 'Sessões este mês',
            value: sessions.length + 18,
            icon: 'calendar',
          },
          { label: 'Evolução positiva', value: '100%', icon: 'trending' },
        ].map((stat, i) => (
          <div key={i} style={s.statCard}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <div style={{ fontSize: 12, color: t.textMuted }}>
                {stat.label}
              </div>
              <Icon name={stat.icon} size={18} color={t.accent} />
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                marginTop: 6,
                color: t.text,
              }}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>
      <div style={s.card}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 15 }}>
            Agendamentos de hoje
          </div>
          <span
            style={{ color: t.accent, fontSize: 13, cursor: 'pointer' }}
            onClick={() => setPage('agenda')}
          >
            Ver agenda
          </span>
        </div>
        {todayAppts.length === 0 ? (
          <div
            style={{
              color: t.textMuted,
              fontSize: 13,
              textAlign: 'center',
              padding: '20px 0',
            }}
          >
            Nenhum agendamento hoje
          </div>
        ) : (
          todayAppts.map((a) => (
            <div
              key={a.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 0',
                borderBottom: `1px solid ${t.border}`,
              }}
            >
              <div
                style={{
                  background: `${t.accent}20`,
                  borderRadius: 8,
                  padding: '6px 10px',
                  color: t.accent,
                  fontWeight: 700,
                  fontSize: 13,
                  minWidth: 52,
                  textAlign: 'center',
                }}
              >
                {a.time}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  {a.patientName}
                </div>
                <div style={{ fontSize: 12, color: t.textMuted }}>
                  {a.type} · {a.duration}min
                </div>
              </div>
              <span style={s.badge(getStatusColor(a.status))}>{a.status}</span>
            </div>
          ))
        )}
      </div>
      <div style={s.card}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>
          Média EVA da semana
        </div>
        <ResponsiveContainer width="100%" height={120}>
          <LineChart
            data={[
              { d: 'Seg', eva: 3.5 },
              { d: 'Ter', eva: 2.8 },
              { d: 'Qua', eva: 2.2 },
              { d: 'Qui', eva: 2.0 },
              { d: 'Sex', eva: 1.8 },
            ]}
          >
            <XAxis
              dataKey="d"
              tick={{ fill: t.textMuted, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 10]}
              tick={{ fill: t.textMuted, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: t.card,
                border: `1px solid ${t.border}`,
                borderRadius: 8,
                color: t.text,
              }}
            />
            <Line
              type="monotone"
              dataKey="eva"
              stroke={t.accent}
              strokeWidth={2.5}
              dot={{ fill: t.accent, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const Patients = () => {
    const filtered = patients.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchPatient.toLowerCase()) ||
        p.cid.toLowerCase().includes(searchPatient.toLowerCase()) ||
        p.diagnosis.toLowerCase().includes(searchPatient.toLowerCase());
      const matchFilter =
        filterStatus === 'Todos' ||
        (filterStatus === 'Ativos' && p.active) ||
        (filterStatus === 'Em Alta' && !p.active) ||
        (filterStatus === 'Aguardando' && p.sessions === 0);
      return matchSearch && matchFilter;
    });
    return (
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 16,
          }}
        >
          <div>
            <div style={s.sectionTitle}>Pacientes</div>
            <div style={s.subTitle}>{patients.length} cadastrados</div>
          </div>
          <button
            style={s.btn('primary')}
            onClick={() => setShowNewPatient(true)}
          >
            <Icon name="plus" size={16} color="#fff" /> Novo
          </button>
        </div>
        <input
          style={{ ...s.input, marginBottom: 12 }}
          placeholder="🔍 Buscar por nome, CPF ou diagnóstico..."
          value={searchPatient}
          onChange={(e) => setSearchPatient(e.target.value)}
        />
        <div
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            marginBottom: 16,
            paddingBottom: 4,
          }}
        >
          {['Todos', 'Ativos', 'Em Alta', 'Aguardando'].map((f) => (
            <button
              key={f}
              style={s.chip(filterStatus === f)}
              onClick={() => setFilterStatus(f)}
            >
              {f}
            </button>
          ))}
        </div>
        {filtered.map((p) => (
          <div key={p.id} style={s.card}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  background: `${t.accent}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  color: t.accent,
                  flexShrink: 0,
                }}
              >
                {p.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: t.textMuted }}>
                  {p.cid} · {p.diagnosis}
                </div>
                <div style={{ fontSize: 12, color: t.textMuted }}>
                  {p.age} anos · {p.insurance}
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 6,
                    marginTop: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={s.badge('info')}>{p.sessions} sessões</span>
                  <span
                    style={s.badge(
                      p.eva <= 2 ? 'success' : p.eva <= 5 ? 'warning' : 'danger'
                    )}
                  >
                    EVA {p.eva}/10
                  </span>
                  {p.nextAppt && (
                    <span style={s.badge('success')}>Próx: {p.nextAppt}</span>
                  )}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button
                style={{ ...s.btn('ghost'), flex: 1, justifyContent: 'center' }}
                onClick={() => {
                  setSelectedPatient(p);
                  setPatientTab('dados');
                  setPage('patient_detail');
                }}
              >
                Ver perfil
              </button>
              <button
                style={{ ...s.btn('ghost'), flex: 1, justifyContent: 'center' }}
                onClick={() =>
                  window.open(
                    `https://wa.me/55${p.phone.replace(/\D/g, '')}`,
                    '_blank'
                  )
                }
              >
                <Icon name="whatsapp" size={15} color="#25d366" /> WhatsApp
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const PatientDetail = () => {
    if (!selectedPatient) return null;
    const p = selectedPatient;
    const ptSessions = sessions.filter((s) => s.patientId === p.id);
    const evaData = ptSessions.map((s, i) => ({
      sessao: `S${s.session}`,
      antes: s.evaBefore,
      depois: s.evaAfter,
    }));
    return (
      <div>
        <button
          style={{ ...s.btn('ghost'), marginBottom: 16, padding: '8px 0' }}
          onClick={() => setPage('patients')}
        >
          <Icon name="back" size={18} color={t.text} /> Voltar
        </button>
        <div style={s.card}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                background: t.gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                color: '#fff',
                fontSize: 20,
              }}
            >
              {p.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 17 }}>{p.name}</div>
              <div style={{ fontSize: 13, color: t.textMuted }}>
                {p.age} anos · CREFITO-{p.insurance}
              </div>
              <div style={{ fontSize: 12, color: t.accent, marginTop: 2 }}>
                {p.area}
              </div>
            </div>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            marginBottom: 16,
          }}
        >
          {['dados', 'prontuários', 'evolução'].map((tab) => (
            <button
              key={tab}
              style={s.tabBtn(patientTab === tab)}
              onClick={() => setPatientTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        {patientTab === 'dados' && (
          <div style={s.card}>
            {[
              ['CPF', p.cpf],
              ['Telefone', p.phone],
              ['Email', p.email],
              ['Convênio', p.insurance],
              ['CID-10', p.cid],
              ['Diagnóstico', p.diagnosis],
              ['Diag. Fisioterapêutico', p.physiodiag],
              ['Área', p.area],
            ].map(([k, v]) => (
              <div key={k} style={{ marginBottom: 14 }}>
                <div style={s.label}>{k}</div>
                <div style={{ fontSize: 14 }}>{v}</div>
              </div>
            ))}
          </div>
        )}
        {patientTab === 'prontuários' && (
          <div>
            <button
              style={{
                ...s.btn('primary'),
                width: '100%',
                justifyContent: 'center',
                marginBottom: 12,
              }}
              onClick={() => setShowNewSession(true)}
            >
              <Icon name="plus" size={16} color="#fff" /> Nova Sessão
            </button>
            {ptSessions.length === 0 ? (
              <div
                style={{
                  color: t.textMuted,
                  textAlign: 'center',
                  padding: '30px 0',
                }}
              >
                Nenhum prontuário ainda
              </div>
            ) : (
              ptSessions.reverse().map((sess) => (
                <div key={sess.id} style={s.card}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>
                    Sessão #{sess.session}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: t.textMuted,
                      marginBottom: 8,
                    }}
                  >
                    {sess.date} às {sess.time}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: 6,
                      marginBottom: 10,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span style={s.badge('info')}>
                      EVA {sess.evaBefore} → {sess.evaAfter}
                    </span>
                    <span style={s.badge('success')}>{sess.status}</span>
                  </div>
                  <div style={{ fontSize: 13, marginBottom: 4 }}>
                    <b>Queixa:</b> {sess.complaint}
                  </div>
                  <div style={{ fontSize: 13 }}>
                    <b>Evolução:</b> {sess.evolution}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button
                      style={{
                        ...s.btn('ghost'),
                        flex: 1,
                        justifyContent: 'center',
                      }}
                      onClick={() => setViewSession(sess)}
                    >
                      Abrir
                    </button>
                    <button
                      style={{
                        ...s.btn('ghost'),
                        flex: 1,
                        justifyContent: 'center',
                      }}
                      onClick={() => window.print()}
                    >
                      <Icon name="print" size={14} color={t.text} /> Imprimir
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        {patientTab === 'evolução' && (
          <div>
            <div style={s.card}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>
                Evolução da Dor (EVA)
              </div>
              {evaData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={evaData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
                    <XAxis
                      dataKey="sessao"
                      tick={{ fill: t.textMuted, fontSize: 11 }}
                    />
                    <YAxis
                      domain={[0, 10]}
                      tick={{ fill: t.textMuted, fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: t.card,
                        border: `1px solid ${t.border}`,
                        borderRadius: 8,
                        color: t.text,
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="antes"
                      name="Antes"
                      stroke={t.danger || '#ef4444'}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="depois"
                      name="Depois"
                      stroke={t.accent}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div
                  style={{
                    color: t.textMuted,
                    textAlign: 'center',
                    padding: '20px 0',
                  }}
                >
                  Sem dados suficientes
                </div>
              )}
            </div>
            <div style={s.card}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>
                Resumo das Sessões
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: 8,
                  textAlign: 'center',
                }}
              >
                <div>
                  <div
                    style={{ fontSize: 22, fontWeight: 800, color: t.accent }}
                  >
                    {ptSessions.length}
                  </div>
                  <div style={{ fontSize: 11, color: t.textMuted }}>
                    Sessões
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: t.success || '#10b981',
                    }}
                  >
                    {ptSessions.length > 0
                      ? Math.round(
                          (ptSessions.reduce(
                            (a, s) => a + (s.evaBefore - s.evaAfter),
                            0
                          ) /
                            ptSessions.length) *
                            10
                        ) / 10
                      : 0}
                  </div>
                  <div style={{ fontSize: 11, color: t.textMuted }}>
                    Redução EVA média
                  </div>
                </div>
                <div>
                  <div
                    style={{ fontSize: 22, fontWeight: 800, color: t.accent }}
                  >
                    100%
                  </div>
                  <div style={{ fontSize: 11, color: t.textMuted }}>
                    Melhora
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const Agenda = () => {
    const [calView, setCalView] = useState('semana');
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const months = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];
    const now = new Date();
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - now.getDay() + i);
      return d;
    });
    return (
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 16,
          }}
        >
          <div style={s.sectionTitle}>Agenda</div>
          <button style={s.btn('primary')} onClick={() => setShowNewAppt(true)}>
            <Icon name="plus" size={16} color="#fff" /> Novo
          </button>
        </div>
        <div style={s.card}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <div style={{ display: 'flex', gap: 8 }}>
              {['semana', 'dia'].map((v) => (
                <button
                  key={v}
                  style={s.tabBtn(calView === v)}
                  onClick={() => setCalView(v)}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>
              {months[now.getMonth()]} {now.getFullYear()}
            </div>
          </div>
          {calView === 'semana' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 4,
              }}
            >
              {weekDays.map((d, i) => {
                const ds = d.toISOString().split('T')[0];
                const hasAppt = appointments.some((a) => a.date === ds);
                const isToday = ds === todayStr;
                return (
                  <div
                    key={i}
                    style={{ textAlign: 'center', cursor: 'pointer' }}
                    onClick={() => setCalView('dia')}
                  >
                    <div style={{ fontSize: 11, color: t.textMuted }}>
                      {days[d.getDay()]}
                    </div>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        background: isToday ? t.accent : 'transparent',
                        color: isToday ? '#fff' : t.text,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '4px auto',
                        fontWeight: isToday ? 700 : 400,
                        fontSize: 14,
                      }}
                    >
                      {d.getDate()}
                    </div>
                    {hasAppt && (
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          background: t.accent,
                          margin: '2px auto',
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>
          Próximos agendamentos
        </div>
        {appointments
          .sort((a, b) => a.date.localeCompare(b.date))
          .map((a) => (
            <div key={a.id} style={s.card}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div
                  style={{
                    background: `${t.accent}20`,
                    borderRadius: 10,
                    padding: '8px 10px',
                    textAlign: 'center',
                    minWidth: 52,
                  }}
                >
                  <div
                    style={{ fontSize: 16, fontWeight: 800, color: t.accent }}
                  >
                    {a.time}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>
                    {a.patientName}
                  </div>
                  <div style={{ fontSize: 12, color: t.textMuted }}>
                    {a.type} · {a.duration}min ·{' '}
                    {new Date(a.date).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <span style={s.badge(getStatusColor(a.status))}>
                  {a.status}
                </span>
              </div>
            </div>
          ))}
      </div>
    );
  };

  const Records = () => {
    const [selPat, setSelPat] = useState(patients[0]?.id);
    const patSessions = sessions.filter((s) => s.patientId === selPat);
    return (
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 16,
          }}
        >
          <div>
            <div style={s.sectionTitle}>Prontuários</div>
            <div style={s.subTitle}>Registros das sessões clínicas</div>
          </div>
          <button
            style={s.btn('primary')}
            onClick={() => setShowNewSession(true)}
          >
            <Icon name="plus" size={16} color="#fff" /> Novo
          </button>
        </div>
        <div style={s.card}>
          <div style={s.label}>Paciente</div>
          <select
            style={s.input}
            value={selPat}
            onChange={(e) => setSelPat(Number(e.target.value))}
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            style={{ ...s.input, marginTop: 10 }}
            placeholder="🔍 Buscar nas sessões..."
          />
          <div style={{ fontSize: 13, color: t.textMuted, marginTop: 8 }}>
            {patSessions.length} sessão(ões)
          </div>
        </div>
        {patSessions
          .sort((a, b) => b.session - a.session)
          .map((sess) => (
            <div key={sess.id} style={s.card}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>
                Sessão #{sess.session}
              </div>
              <div
                style={{ fontSize: 12, color: t.textMuted, marginBottom: 8 }}
              >
                {sess.date} às {sess.time}
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  marginBottom: 10,
                  flexWrap: 'wrap',
                }}
              >
                <span style={s.badge('info')}>
                  EVA {sess.evaBefore} → {sess.evaAfter}
                </span>
                <span style={s.badge('success')}>{sess.status}</span>
              </div>
              <div style={{ fontSize: 13, marginBottom: 4 }}>
                <b>Queixa:</b> {sess.complaint}
              </div>
              <div style={{ fontSize: 13, marginBottom: 10 }}>
                <b>Evolução:</b> {sess.evolution}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  style={{
                    ...s.btn('ghost'),
                    flex: 1,
                    justifyContent: 'center',
                  }}
                  onClick={() => setViewSession(sess)}
                >
                  Abrir
                </button>
                <button
                  style={{
                    ...s.btn('ghost'),
                    flex: 1,
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="print" size={14} color={t.text} /> Imprimir
                </button>
              </div>
            </div>
          ))}
      </div>
    );
  };

  const Evolution = () => {
    const allEvaData = patients.map((p) => {
      const ptS = sessions.filter((s) => s.patientId === p.id);
      return {
        name: p.name.split(' ')[0],
        sessions: ptS.length,
        evaInicial: ptS.length ? ptS[0]?.evaBefore : p.eva,
        evaAtual: ptS.length ? ptS[ptS.length - 1]?.evaAfter : p.eva,
      };
    });
    return (
      <div>
        <div style={s.sectionTitle}>Evolução Clínica</div>
        <div style={{ ...s.subTitle, marginBottom: 16 }}>
          Acompanhamento de todos os pacientes
        </div>
        <div style={s.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>
            Comparativo EVA — Inicial vs Atual
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={allEvaData}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
              <XAxis
                dataKey="name"
                tick={{ fill: t.textMuted, fontSize: 11 }}
              />
              <YAxis
                domain={[0, 10]}
                tick={{ fill: t.textMuted, fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  background: t.card,
                  border: `1px solid ${t.border}`,
                  borderRadius: 8,
                  color: t.text,
                }}
              />
              <Legend />
              <Bar
                dataKey="evaInicial"
                name="EVA Inicial"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="evaAtual"
                name="EVA Atual"
                fill={t.accent}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {patients.map((p) => {
          const ptS = sessions.filter((s) => s.patientId === p.id);
          const melhora =
            ptS.length > 0
              ? ptS.reduce((a, s) => a + (s.evaBefore - s.evaAfter), 0)
              : 0;
          return (
            <div key={p.id} style={s.card}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: t.textMuted }}>
                    {p.diagnosis}
                  </div>
                </div>
                {melhora > 0 && (
                  <span style={s.badge('success')}>✅ Evolução positiva</span>
                )}
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: 8,
                  marginTop: 12,
                  textAlign: 'center',
                }}
              >
                <div>
                  <div
                    style={{ fontSize: 18, fontWeight: 800, color: t.accent }}
                  >
                    {ptS.length}
                  </div>
                  <div style={{ fontSize: 10, color: t.textMuted }}>
                    Sessões
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: t.danger || '#ef4444',
                    }}
                  >
                    {ptS.length ? ptS[0]?.evaBefore : p.eva}
                  </div>
                  <div style={{ fontSize: 10, color: t.textMuted }}>
                    EVA Inicial
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: t.success || '#10b981',
                    }}
                  >
                    {ptS.length ? ptS[ptS.length - 1]?.evaAfter : p.eva}
                  </div>
                  <div style={{ fontSize: 10, color: t.textMuted }}>
                    EVA Atual
                  </div>
                </div>
              </div>
              <button
                style={{
                  ...s.btn('ghost'),
                  width: '100%',
                  justifyContent: 'center',
                  marginTop: 10,
                }}
                onClick={() => {
                  setSelectedPatient(p);
                  setPatientTab('evolução');
                  setPage('patient_detail');
                }}
              >
                Ver detalhes
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  const Exercises = () => (
    <div>
      <div style={s.sectionTitle}>Biblioteca de Exercícios</div>
      <div style={{ ...s.subTitle, marginBottom: 16 }}>
        Organizados por região anatômica
      </div>
      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          marginBottom: 16,
          paddingBottom: 4,
        }}
      >
        {Object.keys(EXERCISES).map((r) => (
          <button
            key={r}
            style={s.chip(exerciseRegion === r)}
            onClick={() => setExerciseRegion(r)}
          >
            {r}
          </button>
        ))}
      </div>
      {(EXERCISES[exerciseRegion] || []).map((ex, i) => (
        <div key={i} style={s.card}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 15 }}>{ex.name}</div>
            <span
              style={s.badge(
                ex.level === 'Iniciante'
                  ? 'success'
                  : ex.level === 'Intermediário'
                  ? 'warning'
                  : 'danger'
              )}
            >
              {ex.level}
            </span>
          </div>
          <div
            style={{
              fontSize: 12,
              color: t.accent,
              marginTop: 2,
              fontWeight: 600,
            }}
          >
            {ex.goal} · {exerciseRegion}
          </div>
          <div style={{ fontSize: 13, color: t.textMuted, marginTop: 8 }}>
            {ex.desc}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
            <div>
              <span style={{ fontSize: 11, color: t.textMuted }}>Séries </span>
              <span style={{ fontWeight: 700 }}>{ex.sets}</span>
            </div>
            <div>
              <span style={{ fontSize: 11, color: t.textMuted }}>
                Repetições{' '}
              </span>
              <span style={{ fontWeight: 700 }}>{ex.reps}</span>
            </div>
          </div>
          <button
            style={{
              ...s.btn('primary'),
              width: '100%',
              justifyContent: 'center',
              marginTop: 12,
            }}
          >
            Prescrever para paciente
          </button>
        </div>
      ))}
    </div>
  );

  const Protocols = () => {
    if (selectedProtocol) {
      const p = selectedProtocol;
      return (
        <div>
          <button
            style={{ ...s.btn('ghost'), marginBottom: 16, padding: '8px 0' }}
            onClick={() => setSelectedProtocol(null)}
          >
            <Icon name="back" size={18} color={t.text} /> Voltar
          </button>
          <div style={s.sectionTitle}>{p.name}</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <span style={s.badge('info')}>{p.area}</span>
            <span style={s.badge('info')}>{p.cid}</span>
          </div>
          {p.phases.map((ph, i) => (
            <div key={i} style={s.card}>
              <div
                style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    background: t.accent,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>
                <div>
                  <div
                    style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}
                  >
                    {ph.name}
                  </div>
                  <div style={s.label}>Objetivos</div>
                  <div style={{ fontSize: 13, marginBottom: 8 }}>
                    {ph.goals}
                  </div>
                  <div style={s.label}>Intervenções</div>
                  <div style={{ fontSize: 13, color: t.textMuted }}>
                    {ph.interventions}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }
    return (
      <div>
        <div style={s.sectionTitle}>Protocolos Clínicos</div>
        <div style={{ ...s.subTitle, marginBottom: 16 }}>
          Por patologia e região
        </div>
        {['Coluna', 'Joelho', 'Ombro', 'Tornozelo/Pé'].map((area) => (
          <div key={area}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: t.accent,
                marginBottom: 8,
                marginTop: 8,
              }}
            >
              {area}
            </div>
            {PROTOCOLS.filter((p) => p.area === area).map((p) => (
              <div
                key={p.id}
                style={{ ...s.card, cursor: 'pointer' }}
                onClick={() => setSelectedProtocol(p)}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: 12, color: t.textMuted }}>
                      CID {p.cid} · {p.phases.length} fases
                    </div>
                  </div>
                  <Icon name="chevron" size={18} color={t.textMuted} />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  const RedFlags = () => {
    const rf = RED_FLAGS[redFlagRegion];
    return (
      <div>
        <div style={s.sectionTitle}>⚠️ Red Flags</div>
        <div style={{ ...s.subTitle, marginBottom: 16 }}>
          Sinais de alerta por região
        </div>
        <div
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            marginBottom: 16,
            paddingBottom: 4,
          }}
        >
          {RED_FLAGS.map((r, i) => (
            <button
              key={i}
              style={s.chip(redFlagRegion === i)}
              onClick={() => setRedFlagRegion(i)}
            >
              {r.region}
            </button>
          ))}
        </div>
        <div style={{ ...s.card, border: `2px solid #ef4444` }}>
          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <Icon name="alert" size={20} color="#ef4444" />
            <div style={{ fontWeight: 700, fontSize: 15, color: '#ef4444' }}>
              Red Flags — {rf.region}
            </div>
          </div>
          <div style={{ fontSize: 13, color: t.textMuted, marginBottom: 12 }}>
            Sinais que indicam encaminhamento médico imediato:
          </div>
          {rf.flags.map((f, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'flex-start',
                padding: '8px 0',
                borderBottom:
                  i < rf.flags.length - 1 ? `1px solid ${t.border}` : 'none',
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  background: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon name="alert" size={12} color="#ef4444" />
              </div>
              <div style={{ fontSize: 13 }}>{f}</div>
            </div>
          ))}
        </div>
        <div style={s.card}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 14,
              marginBottom: 10,
              color: t.warning || '#f59e0b',
            }}
          >
            ⚡ Regras de Ottawa
          </div>
          <div style={{ fontSize: 13, color: t.textMuted }}>
            Solicite radiografia do tornozelo se: dor na região maleolar +
            incapacidade de apoio + dor à palpação do maléolo posterior ou ponta
            do maléolo medial/lateral.
          </div>
        </div>
        <div style={s.card}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 14,
              marginBottom: 10,
              color: t.accent,
            }}
          >
            🧠 Bandeiras Amarelas (Psicossociais)
          </div>
          {[
            'Catastrofização da dor',
            'Medo do movimento (cinesiofobia)',
            'Crenças negativas sobre o trabalho',
            'Depressão ou ansiedade associada',
            'Histórico de tratamentos frustrados',
          ].map((f, i) => (
            <div
              key={i}
              style={{
                fontSize: 13,
                padding: '6px 0',
                borderBottom: i < 4 ? `1px solid ${t.border}` : 'none',
                color: t.textMuted,
              }}
            >
              ⚠️ {f}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const Settings = () => (
    <div>
      <div style={s.sectionTitle}>Configurações</div>
      <div style={s.card}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>
          🎨 Tema visual
        </div>
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}
        >
          {Object.entries(THEMES).map(([key, th]) => (
            <div
              key={key}
              style={{
                border: `2px solid ${theme === key ? th.accent : t.border}`,
                borderRadius: 12,
                padding: 10,
                cursor: 'pointer',
                background: theme === key ? `${th.accent}10` : t.inputBg,
              }}
              onClick={() => setTheme(key)}
            >
              <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                {th.colors.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      background: c,
                      border: `1px solid ${t.border}`,
                    }}
                  />
                ))}
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                {th.name}
                {theme === key && (
                  <Icon name="check" size={14} color={th.accent} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={s.card}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>
          👤 Dados do profissional
        </div>
        {[
          ['Nome', 'Dr(a). Fisioterapeuta'],
          ['CREFITO', 'CREFITO-0/000000-F'],
          ['Especialidade', 'Fisioterapia Traumato-Ortopédica'],
          ['Clínica', 'Clínica Fisio Pro'],
        ].map(([label, placeholder]) => (
          <div key={label} style={{ marginBottom: 14 }}>
            <label style={s.label}>{label}</label>
            <input style={s.input} defaultValue={placeholder} />
          </div>
        ))}
        <button
          style={{
            ...s.btn('primary'),
            width: '100%',
            justifyContent: 'center',
          }}
        >
          Salvar dados
        </button>
      </div>
      <div style={s.card}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>
          📱 Instalar app
        </div>
        <div style={{ fontSize: 13, color: t.textMuted, marginBottom: 12 }}>
          Adicione o FisioAgenda Pro à tela inicial do seu celular para acesso
          rápido.
        </div>
        <button
          style={{
            ...s.btn('primary'),
            width: '100%',
            justifyContent: 'center',
          }}
        >
          Instalar no celular
        </button>
      </div>
      <div style={s.card}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>
          🔗 Compartilhar com colegas
        </div>
        <div style={{ fontSize: 13, color: t.textMuted, marginBottom: 12 }}>
          Compartilhe o app com outros fisioterapeutas.
        </div>
        <button
          style={{ ...s.btn('ghost'), width: '100%', justifyContent: 'center' }}
        >
          Copiar link de compartilhamento
        </button>
      </div>
    </div>
  );

  // ============================================================
  // MODALS
  // ============================================================
  const NewPatientModal = () => {
    const [form, setForm] = useState({
      name: '',
      age: '',
      cpf: '',
      phone: '',
      email: '',
      insurance: 'Particular',
      cid: '',
      diagnosis: '',
      physiodiag: '',
      area: 'Traumato-ortopedia',
    });
    const save = () => {
      if (!form.name) return;
      setPatients((prev) => [
        ...prev,
        {
          ...form,
          id: Date.now(),
          sessions: 0,
          eva: 0,
          active: true,
          nextAppt: null,
        },
      ]);
      setShowNewPatient(false);
    };
    return (
      <div style={s.modal} onClick={() => setShowNewPatient(false)}>
        <div style={s.modalContent} onClick={(e) => e.stopPropagation()}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 17 }}>Novo Paciente</div>
            <button
              style={s.btn('ghost')}
              onClick={() => setShowNewPatient(false)}
            >
              <Icon name="x" size={18} color={t.text} />
            </button>
          </div>
          {[
            ['name', 'Nome completo *', 'text'],
            ['age', 'Idade', 'number'],
            ['cpf', 'CPF', 'text'],
            ['phone', 'Telefone/WhatsApp', 'text'],
            ['email', 'E-mail', 'email'],
            ['cid', 'CID-10', 'text'],
            ['diagnosis', 'Diagnóstico médico', 'text'],
            ['physiodiag', 'Diagnóstico fisioterapêutico', 'text'],
          ].map(([k, l, type]) => (
            <div key={k} style={{ marginBottom: 12 }}>
              <label style={s.label}>{l}</label>
              <input
                style={s.input}
                type={type}
                value={form[k]}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [k]: e.target.value }))
                }
              />
            </div>
          ))}
          <div style={{ marginBottom: 12 }}>
            <label style={s.label}>Convênio</label>
            <select
              style={s.input}
              value={form.insurance}
              onChange={(e) =>
                setForm((f) => ({ ...f, insurance: e.target.value }))
              }
            >
              {[
                'Particular',
                'Unimed',
                'Bradesco Saúde',
                'SulAmérica',
                'Amil',
                'Hapvida',
                'NotreDame',
              ].map((i) => (
                <option key={i}>{i}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={s.label}>Área</label>
            <select
              style={s.input}
              value={form.area}
              onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
            >
              {[
                'Traumato-ortopedia',
                'Neurologia',
                'Esportiva',
                'Cardiorrespiratória',
                'Pediátrica',
                'Geriátrica',
                'Geral',
              ].map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </div>
          <button
            style={{
              ...s.btn('primary'),
              width: '100%',
              justifyContent: 'center',
            }}
            onClick={save}
          >
            Cadastrar Paciente
          </button>
        </div>
      </div>
    );
  };

  const NewSessionModal = () => {
    const [form, setForm] = useState({
      patientId: patients[0]?.id || '',
      session: sessions.length + 1,
      date: new Date().toLocaleDateString('pt-BR'),
      time: '09:00',
      complaint: '',
      findings: '',
      resources: [],
      techniques: '',
      exercises: '',
      evolution: '',
      evaBefore: 5,
      evaAfter: 3,
      goal: 'Sim',
      plan: '',
    });
    const allResources = [
      'TENS',
      'FES',
      'Ultrassom',
      'Laser',
      'Crioterapia',
      'Termoterapia',
      'Tração',
      'Mobilização articular',
      'Bandagem',
      'RPG',
      'Pilates',
      'Cinesioterapia',
    ];
    const save = () => {
      setSessions((prev) => [
        ...prev,
        { ...form, id: Date.now(), status: 'Finalizado' },
      ]);
      setShowNewSession(false);
    };
    return (
      <div style={s.modal} onClick={() => setShowNewSession(false)}>
        <div style={s.modalContent} onClick={(e) => e.stopPropagation()}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 17 }}>Nova Sessão</div>
            <button
              style={s.btn('ghost')}
              onClick={() => setShowNewSession(false)}
            >
              <Icon name="x" size={18} color={t.text} />
            </button>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={s.label}>Paciente</label>
            <select
              style={s.input}
              value={form.patientId}
              onChange={(e) =>
                setForm((f) => ({ ...f, patientId: Number(e.target.value) }))
              }
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          {[
            ['complaint', 'Queixa principal'],
            ['findings', 'Achados clínicos'],
            ['techniques', 'Técnicas manuais'],
            ['exercises', 'Exercícios realizados'],
            ['evolution', 'Evolução do paciente'],
            ['plan', 'Plano para próxima sessão'],
          ].map(([k, l]) => (
            <div key={k} style={{ marginBottom: 12 }}>
              <label style={s.label}>{l}</label>
              <textarea
                style={{ ...s.input, minHeight: 60, resize: 'vertical' }}
                value={form[k]}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [k]: e.target.value }))
                }
              />
            </div>
          ))}
          <div style={{ marginBottom: 12 }}>
            <label style={s.label}>Recursos utilizados</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {allResources.map((r) => (
                <button
                  key={r}
                  style={s.chip(form.resources.includes(r))}
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      resources: f.resources.includes(r)
                        ? f.resources.filter((x) => x !== r)
                        : [...f.resources, r],
                    }))
                  }
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={s.label}>
              EVA antes da sessão: {form.evaBefore}/10
            </label>
            <input
              type="range"
              min={0}
              max={10}
              value={form.evaBefore}
              onChange={(e) =>
                setForm((f) => ({ ...f, evaBefore: Number(e.target.value) }))
              }
              style={s.evaSlider}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={s.label}>
              EVA depois da sessão: {form.evaAfter}/10
            </label>
            <input
              type="range"
              min={0}
              max={10}
              value={form.evaAfter}
              onChange={(e) =>
                setForm((f) => ({ ...f, evaAfter: Number(e.target.value) }))
              }
              style={s.evaSlider}
            />
          </div>
          <button
            style={{
              ...s.btn('primary'),
              width: '100%',
              justifyContent: 'center',
            }}
            onClick={save}
          >
            Salvar Prontuário
          </button>
        </div>
      </div>
    );
  };

  const NewApptModal = () => {
    const [form, setForm] = useState({
      patientId: patients[0]?.id || '',
      date: todayStr,
      time: '09:00',
      duration: 45,
      type: 'Sessão',
      status: 'Confirmado',
    });
    const save = () => {
      const p = patients.find((x) => x.id === Number(form.patientId));
      setAppointments((prev) => [
        ...prev,
        { ...form, id: Date.now(), patientName: p?.name || '' },
      ]);
      setShowNewAppt(false);
    };
    return (
      <div style={s.modal} onClick={() => setShowNewAppt(false)}>
        <div style={s.modalContent} onClick={(e) => e.stopPropagation()}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 17 }}>
              Novo Agendamento
            </div>
            <button
              style={s.btn('ghost')}
              onClick={() => setShowNewAppt(false)}
            >
              <Icon name="x" size={18} color={t.text} />
            </button>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={s.label}>Paciente</label>
            <select
              style={s.input}
              value={form.patientId}
              onChange={(e) =>
                setForm((f) => ({ ...f, patientId: Number(e.target.value) }))
              }
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          {[
            ['date', 'Data', 'date'],
            ['time', 'Horário', 'time'],
          ].map(([k, l, type]) => (
            <div key={k} style={{ marginBottom: 12 }}>
              <label style={s.label}>{l}</label>
              <input
                type={type}
                style={s.input}
                value={form[k]}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [k]: e.target.value }))
                }
              />
            </div>
          ))}
          <div style={{ marginBottom: 12 }}>
            <label style={s.label}>Duração</label>
            <select
              style={s.input}
              value={form.duration}
              onChange={(e) =>
                setForm((f) => ({ ...f, duration: Number(e.target.value) }))
              }
            >
              {[30, 45, 60, 90].map((d) => (
                <option key={d} value={d}>
                  {d} minutos
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={s.label}>Tipo</label>
            <select
              style={s.input}
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            >
              {['Avaliação', 'Sessão', 'Reavaliação', 'Alta', 'Retorno'].map(
                (t) => (
                  <option key={t}>{t}</option>
                )
              )}
            </select>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={s.label}>Status</label>
            <select
              style={s.input}
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value }))
              }
            >
              {['Confirmado', 'Pendente', 'Cancelado'].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <button
            style={{
              ...s.btn('primary'),
              width: '100%',
              justifyContent: 'center',
            }}
            onClick={save}
          >
            Agendar
          </button>
        </div>
      </div>
    );
  };

  const ViewSessionModal = () => {
    if (!viewSession) return null;
    const v = viewSession;
    return (
      <div style={s.modal} onClick={() => setViewSession(null)}>
        <div style={s.modalContent} onClick={(e) => e.stopPropagation()}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 17 }}>
              Sessão #{v.session}
            </div>
            <button style={s.btn('ghost')} onClick={() => setViewSession(null)}>
              <Icon name="x" size={18} color={t.text} />
            </button>
          </div>
          <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 16 }}>
            {v.date} às {v.time}
          </div>
          {[
            ['Queixa principal', v.complaint],
            ['Achados clínicos', v.findings],
            ['Técnicas manuais', v.techniques],
            ['Exercícios realizados', v.exercises],
            ['Evolução', v.evolution],
            ['Plano próxima sessão', v.plan],
          ].map(([l, val]) =>
            val ? (
              <div key={l} style={{ marginBottom: 14 }}>
                <div style={s.label}>{l}</div>
                <div style={{ fontSize: 14 }}>{val}</div>
              </div>
            ) : null
          )}
          {v.resources?.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={s.label}>Recursos utilizados</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {v.resources.map((r) => (
                  <span key={r} style={s.badge('info')}>
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
            <div>
              <div style={s.label}>EVA Antes</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#ef4444' }}>
                {v.evaBefore}/10
              </div>
            </div>
            <div>
              <div style={s.label}>EVA Depois</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: t.accent }}>
                {v.evaAfter}/10
              </div>
            </div>
            <div>
              <div style={s.label}>Objetivo</div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: t.success || '#10b981',
                }}
              >
                {v.goal}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <Dashboard />;
      case 'patients':
        return <Patients />;
      case 'patient_detail':
        return <PatientDetail />;
      case 'agenda':
        return <Agenda />;
      case 'records':
        return <Records />;
      case 'evolution':
        return <Evolution />;
      case 'exercises':
        return <Exercises />;
      case 'protocols':
        return <Protocols />;
      case 'redflags':
        return <RedFlags />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div style={s.app}>
      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div style={s.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div style={s.sidebar}>
        <div style={s.sidebarHeader}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              color: '#fff',
              fontSize: 16,
            }}
          >
            F
          </div>
          <div style={s.sidebarTitle}>FisioAgenda Pro</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', paddingTop: 8 }}>
          {navItems.map((item) => (
            <div
              key={item.id}
              style={s.sidebarItem(
                page === item.id ||
                  (item.id === 'patients' && page === 'patient_detail')
              )}
              onClick={() => {
                setPage(item.id);
                setSidebarOpen(false);
              }}
            >
              <Icon
                name={item.icon}
                size={18}
                color={page === item.id ? t.accent2 : `${t.sidebarText}99`}
              />
              <span
                style={{
                  fontSize: 14,
                  color: page === item.id ? t.accent2 : `${t.sidebarText}cc`,
                  fontWeight: page === item.id ? 700 : 400,
                }}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
        <div
          style={{
            padding: '12px 20px',
            borderTop: `1px solid rgba(255,255,255,0.1)`,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: `${t.sidebarText}66`,
              textAlign: 'center',
            }}
          >
            FisioAgenda Pro v1.0
          </div>
        </div>
      </div>

      {/* Top Bar */}
      <div style={s.topBar}>
        <button
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
          }}
          onClick={() => setSidebarOpen(true)}
        >
          <Icon name="menu" size={22} color="#fff" />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              color: '#fff',
              fontSize: 12,
            }}
          >
            F
          </div>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>
            FisioAgenda Pro
          </span>
        </div>
        <div style={{ width: 30 }} />
      </div>

      {/* Main Content */}
      <div style={s.mainContent}>{renderPage()}</div>

      {/* Bottom Nav */}
      <div style={s.bottomNavBar}>
        {bottomNav.map((item) => (
          <div
            key={item.id}
            style={s.navItem(page === item.id)}
            onClick={() => setPage(item.id)}
          >
            <Icon
              name={item.icon}
              size={20}
              color={page === item.id ? t.navActive : t.textMuted}
            />
            <span style={{ fontSize: 10 }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Modals */}
      {showNewPatient && <NewPatientModal />}
      {showNewSession && <NewSessionModal />}
      {showNewAppt && <NewApptModal />}
      {viewSession && <ViewSessionModal />}
    </div>
  );
}
