export const BODY_REGIONS = [
  "Cabeça", "Cervical", "Trapézio", "Ombro", "Braço", "Cotovelo", "Antebraço",
  "Punho", "Mão", "Torácica", "Lombar", "Sacro", "Quadril", "Glúteo", "Coxa",
  "Joelho", "Perna", "Tornozelo", "Pé",
] as const;

export const SIDES = ["Esquerdo", "Direito", "Bilateral", "Central"] as const;

export const JOINTS = [
  "Cervical", "Ombro", "Cotovelo", "Punho", "Coluna torácica", "Coluna lombar",
  "Quadril", "Joelho", "Tornozelo",
] as const;

export const MOVEMENTS = [
  "Flexão", "Extensão", "Abdução", "Adução", "Rotação interna", "Rotação externa",
  "Rotação", "Inclinação lateral", "Pronação", "Supinação", "Eversão", "Inversão",
  "Dorsiflexão", "Flexão plantar",
] as const;

export const PERIMETRY_SEGMENTS = [
  "Pescoço", "Cintura", "Quadril", "Tórax", "Abdome",
  "Braço", "Antebraço", "Coxa", "Perna", "Tornozelo", "Punho",
] as const;

export const SPECIAL_TEST_RESULTS = ["positivo", "negativo", "inconclusivo"] as const;

export const COMMON_CID10 = [
  { code: "M54.5", name: "Lombalgia" },
  { code: "M54.2", name: "Cervicalgia" },
  { code: "M54.4", name: "Lumbago com ciática" },
  { code: "M75.1", name: "Síndrome do manguito rotador" },
  { code: "M75.0", name: "Capsulite adesiva (ombro congelado)" },
  { code: "M51.1", name: "Hérnia de disco lombar" },
  { code: "M50.1", name: "Hérnia de disco cervical" },
  { code: "M17.1", name: "Gonartrose" },
  { code: "M16.1", name: "Coxartrose" },
  { code: "M19.0", name: "Artrose primária" },
  { code: "M41.1", name: "Escoliose idiopática" },
  { code: "M40.0", name: "Cifose postural" },
  { code: "M79.7", name: "Fibromialgia" },
  { code: "M62.8", name: "Outros transtornos musculares" },
  { code: "M77.9", name: "Tendinite (entesopatia)" },
  { code: "M77.0", name: "Epicondilite medial" },
  { code: "M77.1", name: "Epicondilite lateral" },
  { code: "M76.6", name: "Tendinite do calcâneo" },
  { code: "M25.5", name: "Dor articular" },
  { code: "M65.9", name: "Sinovite e tenossinovite" },
  { code: "S83.5", name: "Entorse de joelho (LCA/LCP)" },
  { code: "S83.2", name: "Lesão de menisco" },
  { code: "S93.4", name: "Entorse de tornozelo" },
  { code: "S46.0", name: "Lesão do manguito rotador" },
  { code: "S52", name: "Fratura do antebraço" },
  { code: "S72", name: "Fratura do fêmur" },
  { code: "G54.3", name: "Compressão de raiz nervosa torácica" },
  { code: "G56.0", name: "Síndrome do túnel do carpo" },
  { code: "G57.3", name: "Síndrome do túnel do tarso" },
  { code: "I69.3", name: "Sequelas de AVC isquêmico" },
  { code: "I69.4", name: "Sequelas de AVC não especificado" },
  { code: "G81", name: "Hemiplegia" },
  { code: "G80", name: "Paralisia cerebral" },
  { code: "G20", name: "Doença de Parkinson" },
  { code: "M62.5", name: "Atrofia muscular" },
  { code: "R26.2", name: "Dificuldade para caminhar" },
  { code: "Z96.6", name: "Pós-prótese articular" },
  { code: "T93.1", name: "Sequelas de fratura de membro inferior" },
];

export const COMORBIDITIES = [
  "Hipertensão Arterial", "Diabetes Mellitus Tipo 1", "Diabetes Mellitus Tipo 2",
  "Cardiopatia", "Osteoporose", "Artrite/Artrose", "Obesidade", "Depressão/Ansiedade",
  "Fibromialgia", "Câncer (em tratamento)", "Marca-passo", "Gestação", "DPOC",
  "Asma", "Hipotireoidismo", "Hipertireoidismo", "Insuficiência renal",
] as const;

export const TREATMENT_OBJECTIVES = [
  "Alívio da dor", "Ganho de amplitude de movimento", "Fortalecimento muscular",
  "Melhora do equilíbrio", "Retorno ao esporte", "Reabilitação pós-cirúrgica",
  "Melhora da postura", "Redução do edema", "Melhora da qualidade de vida",
  "Reeducação proprioceptiva", "Retorno ao trabalho", "Prevenção de lesões",
] as const;

export const PAIN_QUALITY = [
  "Queimação", "Pontada", "Latejamento", "Peso", "Formigamento",
  "Choque", "Pressão", "Irradiação", "Aperto", "Fisgada",
] as const;

/** Valores normais de ADM (graus) por articulação + movimento. */
export const ROM_NORMAL: Record<string, Record<string, number>> = {
  "Cervical": { "Flexão": 45, "Extensão": 45, "Inclinação lateral": 45, "Rotação": 60 },
  "Ombro": { "Flexão": 180, "Extensão": 60, "Abdução": 180, "Adução": 50, "Rotação interna": 70, "Rotação externa": 90 },
  "Cotovelo": { "Flexão": 145, "Extensão": 0, "Pronação": 80, "Supinação": 80 },
  "Punho": { "Flexão": 80, "Extensão": 70 },
  "Coluna lombar": { "Flexão": 80, "Extensão": 25, "Inclinação lateral": 25, "Rotação": 30 },
  "Coluna torácica": { "Flexão": 45, "Extensão": 25, "Rotação": 35 },
  "Quadril": { "Flexão": 120, "Extensão": 30, "Abdução": 45, "Adução": 30, "Rotação interna": 40, "Rotação externa": 50 },
  "Joelho": { "Flexão": 135, "Extensão": 0 },
  "Tornozelo": { "Dorsiflexão": 20, "Flexão plantar": 50, "Inversão": 35, "Eversão": 15 },
};

export function getRomNormal(joint: string, movement: string): number | undefined {
  return ROM_NORMAL[joint]?.[movement];
}

/** Catálogo de testes especiais agrupados por região. */
export const TEST_CATALOG: { region: string; tests: string[] }[] = [
  { region: "Coluna", tests: ["Lasègue", "Bragard", "Slump Test", "Spurling", "Compressão Cervical", "Distração Cervical", "Valsalva"] },
  { region: "Ombro", tests: ["Neer", "Hawkins-Kennedy", "Jobe (lata vazia)", "Speed", "Yocum", "Sulco", "Apreensão", "O'Brien", "Drop Arm"] },
  { region: "Cotovelo / Punho", tests: ["Cozen", "Mill", "Phalen", "Tinel", "Finkelstein"] },
  { region: "Joelho", tests: ["Gaveta Anterior", "Gaveta Posterior", "Lachman", "McMurray", "Apley", "Valgo Stress", "Varo Stress", "Pivot Shift", "Compressão Patelar"] },
  { region: "Quadril", tests: ["FABER (Patrick)", "FADIR", "Thomas", "Trendelenburg", "Ober"] },
  { region: "Tornozelo", tests: ["Gaveta Anterior do Tornozelo", "Inversão Forçada", "Squeeze Test", "Thompson"] },
];

/** Dermátomos (sensibilidade neurológica). */
export const DERMATOMES = [
  "C2", "C3", "C4", "C5", "C6", "C7", "C8",
  "T1", "T2", "T4", "T6", "T10", "T12",
  "L1", "L2", "L3", "L4", "L5",
  "S1", "S2", "S3-S5",
] as const;

/** Grupos musculares para teste de força (escala 0-5 Kendall). */
export const MUSCLE_GROUPS = [
  "Deltoide", "Bíceps braquial", "Tríceps braquial", "Flexores de punho", "Extensores de punho",
  "Quadríceps", "Isquiotibiais", "Glúteo médio", "Glúteo máximo", "Tibial anterior",
  "Tríceps sural (panturrilha)", "Iliopsoas", "Adutores de quadril", "Abdominais",
] as const;

export const STRENGTH_SCALE = [
  { value: 0, label: "0 — Ausência de contração" },
  { value: 1, label: "1 — Esboço de contração" },
  { value: 2, label: "2 — Movimento sem gravidade" },
  { value: 3, label: "3 — Movimento contra gravidade" },
  { value: 4, label: "4 — Movimento contra resistência moderada" },
  { value: 5, label: "5 — Força normal" },
];

export const MARITAL_STATUS = ["Solteiro(a)", "Casado(a)", "União estável", "Divorciado(a)", "Viúvo(a)"] as const;
export const EDUCATION_LEVELS = ["Fundamental", "Médio", "Superior", "Pós-graduação"] as const;
export const PAYMENT_METHODS = ["Particular", "Dinheiro", "PIX", "Cartão débito", "Cartão crédito", "Convênio", "Boleto"] as const;
