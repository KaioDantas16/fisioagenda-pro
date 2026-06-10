export interface SoapTemplate {
  name: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export const SOAP_TEMPLATES: SoapTemplate[] = [
  {
    name: "Coluna Lombar",
    subjective: "Paciente relata dor na região lombar (L4-S1), de início insidioso, tipo queimação/peso, com piora ao permanecer sentado por longos períodos e alívio ao deitar. Nega irradiação ou parestesia em membros inferiores.",
    objective: "Inspeção: Retificação da lordose lombar. Palpação: Presença de espasmo protetor em eretores da espinha e quadrado lombar bilateralmente. ADM: Flexão de tronco limitada por dor no final do movimento. Testes: Lasègue negativo bilateralmente.",
    assessment: "Lombalgia mecânica crônica, apresentando redução de mobilidade segmentar e espasmo paravertebral compensatório.",
    plan: "1. Termoterapia/Eletroterapia analgésica (TENS).\n2. Terapia manual para liberação miofascial de eretores de espinha.\n3. Exercícios de mobilidade pélvica (báscula de quadril).\n4. Exercícios leves de estabilização segmentar (ponte).\n5. Orientações posturais e ergométricas."
  },
  {
    name: "Ombro",
    subjective: "Paciente queixa-se de dor no ombro anterior/lateral, tipo pontada, que piora com movimentos acima da cabeça (abdução/flexão) e ao deitar sobre o lado afetado. Relata início há cerca de 3 meses.",
    objective: "Inspeção: Leve anteriorização de ombro e discinesia escapular leve. Palpação: Ponto gatilho em trapézio superior e dor na região do tendão do supraespinhal. ADM: Arco doloroso entre 60° e 120° de abdução. Testes: Neer positivo, Hawkins-Kennedy positivo.",
    assessment: "Síndrome do impacto do ombro (tendinopatia do supraespinhal), cursando com restrição mecânica e dor associada a movimentos de elevação.",
    plan: "1. Termoterapia/Crioterapia para controle de inflamação local.\n2. Mobilização escapulotorácica e liberação de trapézio superior.\n3. Fortalecimento isométrico inicial de rotadores externos e internos.\n4. Exercícios de estabilização escapular (trapézio inferior e serrátil anterior).\n5. Orientações para evitar posições de impacto no dia a dia."
  },
  {
    name: "Joelho",
    subjective: "Paciente relata dor na região anterior do joelho, tipo dor surda, que piora ao descer escadas, agachar ou permanecer muito tempo com o joelho flexionado (sinal do cinema). Nega bloqueios articulares.",
    objective: "Inspeção: Leve valgo dinâmico. Palpação: Hipersensibilidade na faceta patelar lateral e dor à compressão patelar. ADM: Flexão completa dolorosa no final do arco. Testes: Teste de apreensão patelar positivo, Clarke positivo. Grau de força reduzido em quadríceps.",
    assessment: "Disfunção femoropatelar (condromalácia patelar), com desequilíbrio muscular e desalinhamento femoropatelar dinâmico.",
    plan: "1. Crioterapia pós-conduta.\n2. Liberação miofascial de banda iliotibial e reto femoral.\n3. Fortalecimento isolado de quadríceps com foco no vasto medial oblíquo (VMO) em cadeia cinética fechada.\n4. Treino de controle motor (alinhamento de joelho em agachamento unilateral).\n5. Orientações sobre calçados e controle de carga."
  },
  {
    name: "Cervical",
    subjective: "Paciente relata dor na cervical alta/média, tipo peso/tensão, que piora no final do dia de trabalho (computador) e ao realizar rotações extremas da cabeça. Associa cefaleia tensional ocasional.",
    objective: "Inspeção: Protrusão cefálica. Palpação: Presença de pontos gatilhos ativos em trapézio superior, elevador da escápula e suboccipitais. ADM: Rotação cervical cervical bilateral e flexão lateral ligeiramente reduzidas por rigidez. Testes: Spurling negativo.",
    assessment: "Cervicalgia tensional/mecânica de origem postural, com encurtamento da musculatura posterior e diminuição de mobilidade articular.",
    plan: "1. Termoterapia relaxante (bolsa de água quente) cervical.\n2. Terapia manual: Pompage cervical, liberação miofascial de suboccipitais e trapézio superior.\n3. Exercícios de retração cervical (queixo duplo) para fortalecimento de flexores profundos.\n4. Mobilização articular passiva cervical alta.\n5. Orientações ergonômicas no trabalho."
  },
  {
    name: "Tornozelo/Pé",
    subjective: "Paciente relata dor aguda na região inferior do calcanhar ao dar os primeiros passos da manhã, com melhora gradual após caminhar um pouco, e piora novamente após repouso prolongado.",
    objective: "Inspeção: Pé plano/pronado bilateral. Palpação: Dor intensa à palpação na inserção proximal da fáscia plantar no calcâneo e tensão em tríceps sural. ADM: Limitação de dorsiflexão por encurtamento da cadeia posterior. Testes: Windlass test positivo.",
    assessment: "Fasciite plantar clássica associada a encurtamento da cadeia muscular posterior e pronação excessiva do retropé.",
    plan: "1. Ultrassom terapêutico ou crioterapia local.\n2. Liberação miofascial da fáscia plantar e tríceps sural.\n3. Alongamento estático e dinâmico de panturrilha e fáscia plantar.\n4. Fortalecimento da musculatura intrínseca do pé (garra com toalha, elevação do arco medial).\n5. Orientações de auto-massagem e uso de calçados adequados."
  },
  {
    name: "Pós-cirúrgico",
    subjective: "Paciente no DPO (ex: Reconstrução de LCA ou Artroplastia de Quadril/Joelho). Queixa-se de dor moderada (EVA 4-5/10), edema persistente e limitação importante de movimentos.",
    objective: "Inspeção: Edema articular evidente (+2/+4), cicatriz cirúrgica limpa e em processo de cicatrização. Palpação: Aumento de temperatura local, aderência cicatricial inicial. ADM: Restrita de acordo com protocolo médico (ex: 0° a 90° para joelho). Testes: Marcha com auxílio de muletas e descarga parcial de peso.",
    assessment: "Pós-operatório imediato, evoluindo com edema inflamatório, limitação funcional e redução de força e arco de movimento.",
    plan: "1. Crioterapia compressiva (Cryocure/bolsa de gelo).\n2. Drenagem linfática manual local para redução do edema.\n3. Mobilização passiva/ativa-assistida dentro do limite seguro do protocolo cirúrgico.\n4. Exercícios isométricos (quadríceps/glúteo) e ativação circulatória ativa de tornozelo.\n5. Orientações de cuidados pós-operatórios, posicionamento e uso correto de órteses/muletas."
  }
];
