import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CLINIC } from "@/lib/brand";
import { maskCpfDisplay, fmtBRL } from "@/lib/cpf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

// =============================================================================
// Cores dinâmicas associadas a cada tema para o PDF
// =============================================================================
const THEME_COLORS: Record<string, { primary: [number, number, number]; accent: [number, number, number] }> = {
  default: { primary: [26, 111, 181], accent: [76, 175, 80] },      // Azul Equilíbrio
  ocean: { primary: [10, 85, 130], accent: [50, 160, 180] },         // Oceano Profundo
  forest: { primary: [40, 110, 80], accent: [90, 170, 100] },        // Floresta Calma
  sunset: { primary: [210, 80, 45], accent: [240, 150, 50] },         // Pôr do Sol
  violet: { primary: [120, 65, 175], accent: [180, 100, 190] },       // Violeta Sereno
  graphite: { primary: [70, 75, 85], accent: [110, 120, 130] },      // Grafite Profissional
  dark: { primary: [56, 189, 248], accent: [139, 92, 246] }          // Modo Escuro Premium
};

// =============================================================================
// Utilitário para conversão de imagens para Base64 (evita problemas com CORS/RLS)
// =============================================================================
async function urlToBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Erro ao converter imagem para base64:", error);
    return null;
  }
}

interface PdfConfig {
  primary: [number, number, number];
  accent: [number, number, number];
  clinicName: string;
  clinicShortName: string;
  address: string;
  phone: string;
  instagram: string;
  owner: string;
  crefito: string;
  logoBase64: string | null;
}

async function resolvePdfConfig(): Promise<PdfConfig> {
  let settings: any = null;
  try {
    const { data } = await supabase.from("clinic_settings").select("*").maybeSingle();
    settings = data;
  } catch (e) {
    console.error("Erro ao obter clinic_settings para PDF:", e);
  }

  const themeKey = settings?.theme || "default";
  const colors = THEME_COLORS[themeKey] ?? THEME_COLORS.default;

  let logoBase64: string | null = null;
  if (settings?.logo_url) {
    logoBase64 = await urlToBase64(settings.logo_url);
  }

  const name = settings?.name || CLINIC.name;
  const shortName = settings?.name ? settings.name.split(" ")[0] : CLINIC.shortName;

  return {
    primary: colors.primary,
    accent: colors.accent,
    clinicName: name,
    clinicShortName: shortName,
    address: settings?.address || CLINIC.address,
    phone: settings?.phone || CLINIC.phone,
    instagram: settings?.instagram || CLINIC.instagram,
    owner: settings?.professional_name || CLINIC.owner,
    crefito: settings?.crefito || CLINIC.crefito,
    logoBase64
  };
}

// =============================================================================
// PDF chrome — cabeçalho (gradiente e logo) e rodapé dinâmicos
// =============================================================================

function header(doc: jsPDF, title: string, config: PdfConfig) {
  const w = doc.internal.pageSize.getWidth();
  const steps = 60;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const r = Math.round(config.primary[0] + (config.accent[0] - config.primary[0]) * t);
    const g = Math.round(config.primary[1] + (config.accent[1] - config.primary[1]) * t);
    const b = Math.round(config.primary[2] + (config.accent[2] - config.primary[2]) * t);
    doc.setFillColor(r, g, b);
    doc.rect((w / steps) * i, 0, w / steps + 0.5, 28, "F");
  }

  let textX = 14;
  if (config.logoBase64) {
    try {
      doc.addImage(config.logoBase64, "PNG", 14, 5, 18, 18);
      textX = 36;
    } catch (e) {
      console.error("Erro ao adicionar logo ao PDF:", e);
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  
  // Ajusta o tamanho da fonte dinamicamente com base no comprimento do nome completo da clínica
  let fontSize = 14;
  if (config.clinicName.length > 45) {
    fontSize = 9;
  } else if (config.clinicName.length > 35) {
    fontSize = 11;
  } else if (config.clinicName.length > 25) {
    fontSize = 12;
  }
  doc.setFontSize(fontSize);
  doc.text(config.clinicName, textX, 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(config.address, textX, 16);
  doc.text(`${config.phone} · ${config.instagram}`, textX, 20);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(title, w - 14, 18, { align: "right" });
  doc.setTextColor(40, 40, 40);
}

function footer(doc: jsPDF, config: PdfConfig) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  doc.setDrawColor(...config.accent);
  doc.setLineWidth(0.6);
  doc.line(14, h - 14, w - 14, h - 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(90, 90, 90);
  const now = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  
  // Se o nome completo for razoavelmente curto, usa ele no rodapé. Senão, usa a abreviação.
  const footerName = config.clinicName.length < 30 ? config.clinicName : config.clinicShortName;
  const footerParts = [footerName, config.owner, config.crefito, `Gerado em ${now}`].filter(Boolean);
  const line = footerParts.join(" · ");
  doc.text(line, 14, h - 9);
}

function paginate(doc: jsPDF) {
  const pageCount = (doc as any).internal.getNumberOfPages();
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(90, 90, 90);
    doc.text(`Página ${i} de ${pageCount}`, w - 14, h - 9, { align: "right" });
  }
}

function withChrome(doc: jsPDF, title: string, config: PdfConfig) {
  header(doc, title, config);
  footer(doc, config);
}
function newDoc() { return new jsPDF({ unit: "mm", format: "a4" }); }

// =============================================================================
// Formatadores
// =============================================================================
const fmtDate = (d: any) => {
  if (!d) return "—";
  if (typeof d === "string") {
    const match = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      const day = parseInt(match[3], 10);
      return format(new Date(year, month - 1, day), "dd/MM/yyyy", { locale: ptBR });
    }
  }
  if (d instanceof Date) {
    return format(d, "dd/MM/yyyy", { locale: ptBR });
  }
  try {
    const dateObj = new Date(d);
    if (!isNaN(dateObj.getTime())) {
      return format(dateObj, "dd/MM/yyyy", { locale: ptBR });
    }
  } catch (e) {}
  return "—";
};
const fmtDateTime = (d: any) => d ? format(new Date(d), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "—";

function sectionTitle(doc: jsPDF, text: string, y: number, config: PdfConfig) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...config.primary);
  doc.text(text, 14, y);
  doc.setTextColor(40, 40, 40);
}

function pageGuard(doc: jsPDF, y: number, title: string, config: PdfConfig, needed = 30): number {
  const h = doc.internal.pageSize.getHeight();
  if (y > h - needed) { doc.addPage(); withChrome(doc, title, config); return 40; }
  return y;
}

function patientHeader(doc: jsPDF, patient: any, y: number) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(patient.full_name, 14, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const info = [
    patient.phone && `Tel: ${patient.phone}`,
    patient.email && `E-mail: ${patient.email}`,
    patient.birth_date && `Nasc: ${fmtDate(patient.birth_date)}`,
    patient.cpf && `CPF: ${maskCpfDisplay(patient.cpf)}`,
    patient.insurance_plan && `Plano: ${patient.insurance_plan}`,
  ].filter(Boolean).join("  ·  ");
  doc.text(info, 14, y);
  return y + 6;
}

// =============================================================================
// 1) PRONTUÁRIO COMPLETO
// =============================================================================
export async function downloadProntuarioPDF(args: {
  patient: any; records: any[]; vitals: any[]; sessions: any[];
  anamnese?: any; functional?: any[]; painMap?: any[]; rom?: any[]; tests?: any[]; perimetry?: any[];
}) {
  const config = await resolvePdfConfig();
  const TITLE = "Prontuário do Paciente";
  const doc = newDoc(); withChrome(doc, TITLE, config);
  let y = 36;
  y = patientHeader(doc, args.patient, y);

  if (args.anamnese) {
    y = pageGuard(doc, y + 4, TITLE, config, 60); sectionTitle(doc, "Anamnese", y, config); y += 4;
    const an = args.anamnese;
    const rows: [string, string][] = [
      ["Queixa principal", an.chief_complaint], ["HMA", an.history_present], ["HMP", an.history_past],
      ["Cirurgias", an.surgeries], ["Medicações", an.medications], ["Alergias", an.allergies],
      ["Hábitos", an.habits], ["Familiares", an.family_history], ["Ocupação", an.occupation],
      ["Ativ. física", an.physical_activity], ["Sono", an.sleep], ["Obs", an.notes],
    ].filter(([, v]) => v) as [string, string][];
    if (rows.length) {
      autoTable(doc, { startY: y + 2, body: rows, styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: { 0: { fontStyle: "bold", fillColor: [240, 247, 255], cellWidth: 35 } },
        didDrawPage: () => withChrome(doc, TITLE, config) });
      y = (doc as any).lastAutoTable.finalY + 4;
    }
  }

  if (args.painMap && args.painMap.length) {
    y = pageGuard(doc, y + 4, TITLE, config); sectionTitle(doc, "Mapa de dor", y, config);
    autoTable(doc, { startY: y + 2,
      head: [["Data", "Região", "Lado", "Intensidade", "Obs"]],
      body: args.painMap.map((p) => [fmtDate(p.entry_date), p.region, p.side ?? "—", `${p.intensity}/10`, p.notes ?? "—"]),
      headStyles: { fillColor: config.primary, textColor: 255 }, styles: { fontSize: 8, cellPadding: 2 },
      didDrawPage: () => withChrome(doc, TITLE, config) });
    y = (doc as any).lastAutoTable.finalY + 4;
  }

  if (args.rom && args.rom.length) {
    y = pageGuard(doc, y + 4, TITLE, config); sectionTitle(doc, "Amplitude de movimento (ADM)", y, config);
    autoTable(doc, { startY: y + 2,
      head: [["Data", "Articulação", "Movimento", "Lado", "Ativo", "Passivo"]],
      body: args.rom.map((r) => [fmtDate(r.measured_at), r.joint, r.movement, r.side ?? "—", r.active_degrees ? `${r.active_degrees}°` : "—", r.passive_degrees ? `${r.passive_degrees}°` : "—"]),
      headStyles: { fillColor: config.primary, textColor: 255 }, styles: { fontSize: 8, cellPadding: 2 },
      didDrawPage: () => withChrome(doc, TITLE, config) });
    y = (doc as any).lastAutoTable.finalY + 4;
  }

  if (args.tests && args.tests.length) {
    y = pageGuard(doc, y + 4, TITLE, config); sectionTitle(doc, "Testes especiais", y, config);
    autoTable(doc, { startY: y + 2,
      head: [["Data", "Teste", "Região", "Resultado", "Obs"]],
      body: args.tests.map((t) => [fmtDate(t.performed_at), t.test_name, t.region ?? "—", t.result, t.notes ?? "—"]),
      headStyles: { fillColor: config.primary, textColor: 255 }, styles: { fontSize: 8, cellPadding: 2 },
      didDrawPage: () => withChrome(doc, TITLE, config) });
    y = (doc as any).lastAutoTable.finalY + 4;
  }

  if (args.perimetry && args.perimetry.length) {
    y = pageGuard(doc, y + 4, TITLE, config); sectionTitle(doc, "Perimetria", y, config);
    autoTable(doc, { startY: y + 2,
      head: [["Data", "Segmento", "Lado", "Medida (cm)"]],
      body: args.perimetry.map((p) => [fmtDate(p.measured_at), p.segment, p.side ?? "—", String(p.measurement_cm)]),
      headStyles: { fillColor: config.primary, textColor: 255 }, styles: { fontSize: 8, cellPadding: 2 },
      didDrawPage: () => withChrome(doc, TITLE, config) });
    y = (doc as any).lastAutoTable.finalY + 4;
  }

  y = pageGuard(doc, y + 4, TITLE, config); sectionTitle(doc, "Prontuários SOAP", y, config);
  if (args.records.length === 0) {
    doc.setFont("helvetica", "italic"); doc.setFontSize(10);
    doc.text("Sem registros.", 14, y + 6); y += 10;
  } else {
    autoTable(doc, { startY: y + 2,
      head: [["Data", "EVA", "CID / Regiões", "S", "O", "A", "P"]],
      body: args.records.map((r) => [
        fmtDate(r.record_date),
        r.pain_scale ?? "—",
        `${r.cid10 ?? ""}${r.cid10 && r.body_regions?.length ? "\n" : ""}${r.body_regions && r.body_regions.length > 0 ? r.body_regions.map((reg: string) => reg.replace(/ \((Anterior|Posterior)\)/, "")).join(", ") : ""}` || "—",
        r.subjective ?? "—",
        r.objective ?? "—",
        r.assessment ?? "—",
        r.plan ?? "—"
      ]),
      headStyles: { fillColor: config.primary, textColor: 255 }, styles: { fontSize: 7, cellPadding: 1.5 },
      columnStyles: { 0: { cellWidth: 16 }, 1: { cellWidth: 10, halign: "center" }, 2: { cellWidth: 26 } },
      didDrawPage: () => withChrome(doc, TITLE, config) });
    y = (doc as any).lastAutoTable.finalY + 4;
  }

  if (args.vitals.length) {
    y = pageGuard(doc, y + 4, TITLE, config); sectionTitle(doc, "Sinais Vitais", y, config);
    autoTable(doc, { startY: y + 2,
      head: [["Data", "PA", "FC", "FR", "Temp", "SpO2", "Peso", "Alt", "IMC"]],
      body: args.vitals.map((v) => [fmtDate(v.measured_at), v.systolic && v.diastolic ? `${v.systolic}/${v.diastolic}` : "—", v.heart_rate ?? "—", v.respiratory_rate ?? "—", v.temperature ?? "—", v.spo2 ?? "—", v.weight ?? "—", v.height ?? "—", v.bmi ?? "—"]),
      headStyles: { fillColor: config.accent, textColor: 255 }, styles: { fontSize: 8, cellPadding: 2 },
      didDrawPage: () => withChrome(doc, TITLE, config) });
    y = (doc as any).lastAutoTable.finalY + 4;
  }

  if (args.sessions.length) {
    y = pageGuard(doc, y + 4, TITLE, config); sectionTitle(doc, "Histórico de Sessões", y, config);
    autoTable(doc, { startY: y + 2,
      head: [["Data", "Procedimento", "Status", "Valor"]],
      body: args.sessions.map((s) => [fmtDateTime(s.starts_at ?? s.session_date), s.procedure ?? "—", s.status ?? "—", fmtBRL(s.price)]),
      headStyles: { fillColor: config.primary, textColor: 255 }, styles: { fontSize: 9, cellPadding: 2 },
      didDrawPage: () => withChrome(doc, TITLE, config) });
  }

  paginate(doc);
  doc.save(`prontuario-${args.patient.full_name.replace(/\s+/g, "_")}.pdf`);
}

// =============================================================================
// 2) COMPROVANTE DE SESSÃO
// =============================================================================
export async function downloadSessionReceiptPDF(args: { patient: any; session: any }) {
  const config = await resolvePdfConfig();
  const TITLE = "Comprovante de Sessão";
  const doc = newDoc(); withChrome(doc, TITLE, config);
  let y = 42;
  doc.setFont("helvetica", "bold"); doc.setFontSize(13);
  doc.text("Recibo de Atendimento", 14, y); y += 8;
  autoTable(doc, { startY: y,
    body: [
      ["Paciente", args.patient.full_name],
      ["CPF", maskCpfDisplay(args.patient.cpf)],
      ["Data", fmtDateTime(args.session.starts_at ?? args.session.session_date)],
      ["Procedimento", args.session.procedure ?? "—"],
      ["Duração", args.session.duration_minutes ? `${args.session.duration_minutes} min` : "—"],
      ["Forma de pagamento", args.session.payment_method ?? "—"],
      ["Valor", fmtBRL(args.session.price)],
      ["Status", args.session.status ?? "—"],
    ],
    styles: { fontSize: 11, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: "bold", fillColor: [240, 247, 255], cellWidth: 50 } },
    didDrawPage: () => withChrome(doc, TITLE, config) });
  paginate(doc);
  doc.save(`comprovante-${args.patient.full_name.replace(/\s+/g, "_")}.pdf`);
}

// =============================================================================
// 3) RELATÓRIO MENSAL
// =============================================================================
export async function downloadMonthlyReportPDF(args: {
  monthLabel: string; patients: any[];
  totals: { totalPatients: number; totalSessions: number; attendance: number; revenue: number; pendingTotal?: number };
}) {
  const config = await resolvePdfConfig();
  const TITLE = `Relatório Mensal — ${args.monthLabel}`;
  const doc = newDoc(); withChrome(doc, TITLE, config);
  let y = 42;
  sectionTitle(doc, "Resumo do mês", y, config); y += 4;
  
  const bodyRows = [
    ["Pacientes ativos", String(args.totals.totalPatients)],
    ["Total de sessões", String(args.totals.totalSessions)],
    ["Taxa de presença", `${args.totals.attendance.toFixed(1)}%`],
    ["Receita recebida (Pago)", fmtBRL(args.totals.revenue)],
  ];

  if (args.totals.pendingTotal !== undefined && args.totals.pendingTotal !== null) {
    bodyRows.push(["Pendências em aberto", fmtBRL(args.totals.pendingTotal)]);
  }

  autoTable(doc, { startY: y + 2,
    body: bodyRows,
    styles: { fontSize: 11, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: "bold", fillColor: [240, 247, 255], cellWidth: 60 } },
    didDrawPage: () => withChrome(doc, TITLE, config) });
  y = (doc as any).lastAutoTable.finalY + 8;
  sectionTitle(doc, "Pacientes", y, config);
  autoTable(doc, { startY: y + 2,
    head: [["Nome", "Telefone", "Classificação", "Sessões no mês"]],
    body: args.patients.map((p) => [p.full_name, p.phone ?? "—", p.classification ?? "—", String(p.session_count ?? 0)]),
    headStyles: { fillColor: config.primary, textColor: 255 }, styles: { fontSize: 9, cellPadding: 2 },
    didDrawPage: () => withChrome(doc, TITLE, config) });
  paginate(doc);
  doc.save(`relatorio-${args.monthLabel.replace(/\s+/g, "_")}.pdf`);
}

// =============================================================================
// 4) FREQUÊNCIA
// =============================================================================
export async function downloadFrequenciaPDF(args: { patient: any; sessions: any[]; periodLabel: string }) {
  const config = await resolvePdfConfig();
  const TITLE = `Frequência — ${args.periodLabel}`;
  const doc = newDoc(); withChrome(doc, TITLE, config);
  let y = 36;
  y = patientHeader(doc, args.patient, y);
  const realizadas = args.sessions.filter((s) => s.status === "realizado").length;
  const faltas = args.sessions.filter((s) => s.status === "faltou").length;
  const canceladas = args.sessions.filter((s) => s.status === "cancelado").length;
  const total = args.sessions.length;
  const taxa = total > 0 ? ((realizadas / total) * 100).toFixed(1) : "0";
  y += 4; sectionTitle(doc, "Resumo", y, config);
  autoTable(doc, { startY: y + 2,
    body: [
      ["Total de sessões", String(total)],
      ["Realizadas", String(realizadas)],
      ["Faltas", String(faltas)],
      ["Canceladas", String(canceladas)],
      ["Taxa de presença", `${taxa}%`],
    ],
    styles: { fontSize: 11, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: "bold", fillColor: [240, 247, 255], cellWidth: 60 } },
    didDrawPage: () => withChrome(doc, TITLE, config) });
  y = (doc as any).lastAutoTable.finalY + 6;
  sectionTitle(doc, "Detalhamento", y, config);
  autoTable(doc, { startY: y + 2,
    head: [["Data", "Procedimento", "Status"]],
    body: args.sessions.map((s) => [fmtDateTime(s.starts_at), s.procedure ?? "—", s.status]),
    headStyles: { fillColor: config.primary, textColor: 255 }, styles: { fontSize: 9, cellPadding: 2 },
    didDrawPage: () => withChrome(doc, TITLE, config) });
  paginate(doc);
  doc.save(`frequencia-${args.patient.full_name.replace(/\s+/g, "_")}.pdf`);
}

// =============================================================================
// 5) ANAMNESE — único PDF com assinatura DO PACIENTE.
// =============================================================================
export async function downloadAnamnesePDF(args: { patient: any; anamnese: any }) {
  const config = await resolvePdfConfig();
  const TITLE = "Anamnese";
  const doc = newDoc(); withChrome(doc, TITLE, config);
  let y = 36;
  y = patientHeader(doc, args.patient, y);
  y += 4;
  const an = args.anamnese ?? {};
  const rows: [string, string][] = [
    ["Queixa principal", an.chief_complaint], ["HMA", an.history_present], ["HMP", an.history_past],
    ["Cirurgias", an.surgeries], ["Medicações", an.medications], ["Alergias", an.allergies],
    ["Hábitos", an.habits], ["Antecedentes familiares", an.family_history], ["Ocupação", an.occupation],
    ["Atividade física", an.physical_activity], ["Sono", an.sleep], ["Observações", an.notes],
  ].filter(([, v]) => v) as [string, string][];
  if (rows.length === 0) {
    doc.setFont("helvetica", "italic"); doc.text("Anamnese ainda não preenchida.", 14, y + 6);
  } else {
    autoTable(doc, { startY: y, body: rows, styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: "bold", fillColor: [240, 247, 255], cellWidth: 50 } },
      didDrawPage: () => withChrome(doc, TITLE, config) });
    y = (doc as any).lastAutoTable.finalY + 20;
  }
  y = pageGuard(doc, y, TITLE, config, 40);
  doc.setDrawColor(120, 120, 120); doc.line(14, y, 90, y);
  doc.setFontSize(9); doc.setTextColor(80, 80, 80);
  doc.text("Assinatura do paciente", 14, y + 5);
  doc.text(`Data: ____/____/______`, 14, y + 12);
  paginate(doc);
  doc.save(`anamnese-${args.patient.full_name.replace(/\s+/g, "_")}.pdf`);
}

// =============================================================================
// 6) RELATÓRIO FINANCEIRO
// =============================================================================
export async function downloadFinancialPDF(args: {
  periodLabel: string;
  byMethod: { method: string; total: number; count: number }[];
  topPatients: { full_name: string; total: number; sessions: number }[];
  grandTotal: number;
  pendingTotal?: number;
}) {
  const config = await resolvePdfConfig();
  const TITLE = `Relatório Financeiro — ${args.periodLabel}`;
  const doc = newDoc(); withChrome(doc, TITLE, config);
  let y = 42;
  sectionTitle(doc, "Receita recebida (Pago)", y, config);
  doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.setTextColor(...config.accent);
  doc.text(fmtBRL(args.grandTotal), 14, y + 12);
  
  if (args.pendingTotal !== undefined && args.pendingTotal !== null) {
    doc.setTextColor(40, 40, 40);
    const w = doc.internal.pageSize.getWidth();
    doc.setFont("helvetica", "bold"); doc.setFontSize(11);
    doc.text("Total Pendente:", w - 14, y + 4, { align: "right" });
    doc.setFontSize(16); doc.setTextColor(245, 158, 11); // Amber
    doc.text(fmtBRL(args.pendingTotal), w - 14, y + 12, { align: "right" });
  }

  doc.setTextColor(40, 40, 40);
  y += 22;

  sectionTitle(doc, "Por forma de pagamento", y, config);
  autoTable(doc, { startY: y + 2,
    head: [["Forma", "Sessões", "Receita"]],
    body: args.byMethod.map((r) => [r.method, String(r.count), fmtBRL(r.total)]),
    headStyles: { fillColor: config.primary, textColor: 255 }, styles: { fontSize: 10, cellPadding: 2 },
    didDrawPage: () => withChrome(doc, TITLE, config) });
  y = (doc as any).lastAutoTable.finalY + 6;

  sectionTitle(doc, "Top pacientes", y, config);
  autoTable(doc, { startY: y + 2,
    head: [["Paciente", "Sessões", "Receita"]],
    body: args.topPatients.map((p) => [p.full_name, String(p.sessions), fmtBRL(p.total)]),
    headStyles: { fillColor: config.primary, textColor: 255 }, styles: { fontSize: 10, cellPadding: 2 },
    didDrawPage: () => withChrome(doc, TITLE, config) });

  paginate(doc);
  doc.save(`financeiro-${args.periodLabel.replace(/\s+/g, "_")}.pdf`);
}

// =============================================================================
// 7) EVOLUÇÃO CLÍNICA
// =============================================================================
export async function downloadClinicalEvolutionPDF(args: { patient: any; records: any[] }) {
  const config = await resolvePdfConfig();
  const TITLE = "Evolução Clínica";
  const doc = newDoc(); withChrome(doc, TITLE, config);
  let y = 36;
  y = patientHeader(doc, args.patient, y);
  y += 4; sectionTitle(doc, "Evolução cronológica (EVA / escore)", y, config); y += 2;

  const records = args.records.slice().sort((a, b) => +new Date(a.record_date) - +new Date(b.record_date));
  if (records.length === 0) {
    doc.setFont("helvetica", "italic"); doc.text("Sem registros para gerar gráfico.", 14, y + 6);
  } else {
    autoTable(doc, { startY: y + 2,
      head: [["Data", "EVA", "Score", "Avaliação"]],
      body: records.map((r) => [fmtDate(r.record_date), r.pain_scale ?? "—", r.evolution_score ?? "—", (r.assessment ?? r.subjective ?? "—").slice(0, 80)]),
      headStyles: { fillColor: config.primary, textColor: 255 },
      styles: { fontSize: 9, cellPadding: 2 },
      didDrawPage: () => withChrome(doc, TITLE, config) });
    y = (doc as any).lastAutoTable.finalY + 8;

    y = pageGuard(doc, y, TITLE, config, 80);
    sectionTitle(doc, "EVA ao longo do tempo", y, config); y += 4;
    const chartX = 20, chartY = y, chartW = 170, chartH = 60;
    doc.setDrawColor(200, 200, 200); doc.rect(chartX, chartY, chartW, chartH);
    const max = 10;
    const barW = chartW / records.length;
    records.forEach((r, i) => {
      const v = r.pain_scale ?? 0;
      const hBar = (v / max) * chartH;
      const color: [number, number, number] = v <= 3 ? [76, 175, 80] : v <= 6 ? [245, 158, 11] : [239, 68, 68];
      doc.setFillColor(...color);
      doc.rect(chartX + i * barW + 1, chartY + chartH - hBar, Math.max(barW - 2, 1), hBar, "F");
    });
    doc.setFontSize(7); doc.setTextColor(120, 120, 120);
    doc.text("0", chartX - 4, chartY + chartH);
    doc.text("10", chartX - 5, chartY + 3);
    const first = records[0].pain_scale ?? 0;
    const last = records[records.length - 1].pain_scale ?? 0;
    if (records.length > 1 && first > 0) {
      const pct = (((first - last) / first) * 100).toFixed(1);
      doc.setFontSize(10); doc.setTextColor(40, 40, 40);
      doc.text(`Melhora percentual: ${pct}% (de ${first}/10 para ${last}/10)`, 14, chartY + chartH + 10);
    }
  }
  paginate(doc);
  doc.save(`evolucao-${args.patient.full_name.replace(/\s+/g, "_")}.pdf`);
}

// Auxiliar para desenhar o boneco anatômico (frente/costas) no PDF individual
function drawBodyMapPDF(doc: jsPDF, xOffset: number, yOffset: number, selectedRegions: string[]) {
  // Cores de contorno e preenchimento para as silhuetas anatômicas
  doc.setFillColor(243, 244, 246); // Cinza bem claro (bg)
  doc.setDrawColor(209, 213, 219); // Borda cinza médio
  doc.setLineWidth(0.8);

  const sides = [
    { name: "anterior", centerX: xOffset + 22 },
    { name: "posterior", centerX: xOffset + 68 }
  ];

  sides.forEach((side) => {
    const cx = side.centerX;
    
    // Cabeça
    doc.circle(cx, yOffset + 5, 3, "FD");
    
    // Pescoço
    doc.line(cx, yOffset + 8, cx, yOffset + 10);
    
    // Tronco
    doc.rect(cx - 5, yOffset + 10, 10, 14, "FD");
    
    // Braço Esquerdo
    doc.line(cx - 5, yOffset + 11, cx - 9, yOffset + 22);
    // Braço Direito
    doc.line(cx + 5, yOffset + 11, cx + 9, yOffset + 22);
    
    // Pelve
    doc.rect(cx - 5, yOffset + 24, 10, 3, "FD");
    
    // Perna Esquerda
    doc.line(cx - 2.5, yOffset + 27, cx - 2.5, yOffset + 40);
    // Perna Direita
    doc.line(cx + 2.5, yOffset + 27, cx + 2.5, yOffset + 40);
    
    // Rótulo da vista do boneco
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text(side.name === "anterior" ? "VISTA ANTERIOR" : "VISTA POSTERIOR", cx, yOffset + 45, { align: "center" });
  });

  // Mapeamento das coordenadas absolutas dos círculos vermelhos interativos
  const points: Record<string, { x: number; y: number }> = {
    // ANTERIOR (cx = xOffset + 22)
    "Cervical (Anterior)": { x: xOffset + 22, y: yOffset + 9 },
    "Ombro Direito": { x: xOffset + 15.5, y: yOffset + 11 },
    "Ombro Esquerdo": { x: xOffset + 28.5, y: yOffset + 11 },
    "Tórax/Abdômen": { x: xOffset + 22, y: yOffset + 16 },
    "Cotovelo/Mão D": { x: xOffset + 12.5, y: yOffset + 21 },
    "Cotovelo/Mão E": { x: xOffset + 31.5, y: yOffset + 21 },
    "Quadril (Anterior)": { x: xOffset + 22, y: yOffset + 25 },
    "Joelho Direito": { x: xOffset + 19.5, y: yOffset + 33 },
    "Joelho Esquerdo": { x: xOffset + 24.5, y: yOffset + 33 },
    "Tornozelo/Pé D": { x: xOffset + 19.5, y: yOffset + 40 },
    "Tornozelo/Pé E": { x: xOffset + 24.5, y: yOffset + 40 },

    // POSTERIOR (cx = xOffset + 68)
    "Cervical (Posterior)": { x: xOffset + 68, y: yOffset + 9 },
    "Coluna Torácica": { x: xOffset + 68, y: yOffset + 14 },
    "Coluna Lombar": { x: xOffset + 68, y: yOffset + 20 },
    "Quadril/Glúteos": { x: xOffset + 68, y: yOffset + 25 },
    "Joelho D (Posterior)": { x: xOffset + 65.5, y: yOffset + 33 },
    "Joelho E (Posterior)": { x: xOffset + 70.5, y: yOffset + 33 },
    "Tornozelo/Pé D (Posterior)": { x: xOffset + 65.5, y: yOffset + 40 },
    "Tornozelo/Pé E (Posterior)": { x: xOffset + 70.5, y: yOffset + 40 },
  };

  // Desenhar círculos vermelhos/laranja para os pontos selecionados
  doc.setFillColor(239, 68, 68); // Vermelho coral vibrante
  doc.setDrawColor(255, 255, 255); // Borda branca de destaque
  doc.setLineWidth(0.4);

  selectedRegions.forEach((regionId) => {
    const pt = points[regionId];
    if (pt) {
      doc.circle(pt.x, pt.y, 2, "FD");
    }
  });
}

// =============================================================================
// 8) PRONTUÁRIO INDIVIDUAL (SOAP + MAPA CORPORAL)
// =============================================================================
export async function downloadProntuarioIndividualPDF(args: {
  patient: any;
  record: any;
}) {
  const config = await resolvePdfConfig();
  const TITLE = "Evolução Diária (SOAP)";
  const doc = newDoc();
  withChrome(doc, TITLE, config);
  let y = 36;
  
  // Cabeçalho do Paciente
  y = patientHeader(doc, args.patient, y);
  y += 4;
  
  // Data e Informações Gerais em Tabela
  const r = args.record;
  const generalData = [
    ["Data do Atendimento", fmtDate(r.record_date)],
    ["Escala de Dor (EVA)", r.pain_scale !== null && r.pain_scale !== undefined ? `${r.pain_scale}/10` : "—"],
    ["Escore de Evolução", r.evolution_score !== null && r.evolution_score !== undefined ? `${r.evolution_score}/10` : "—"],
    ["CID-10", r.cid10 || "—"],
    ["Localização da dor (Relatada)", r.pain_location_text || "—"],
    ["Regiões Marcadas (Mapa)", r.body_regions && r.body_regions.length > 0 ? r.body_regions.map((reg: string) => reg.replace(/ \((Anterior|Posterior)\)/, "")).join(", ") : "—"],
  ];
  
  autoTable(doc, {
    startY: y,
    body: generalData,
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: { 0: { fontStyle: "bold", fillColor: [240, 247, 255], cellWidth: 50 } },
    didDrawPage: () => withChrome(doc, TITLE, config)
  });
  
  let currentY = (doc as any).lastAutoTable.finalY + 6;

  // Seção: Mapa Corporal Visual
  currentY = pageGuard(doc, currentY, TITLE, config, 65);
  sectionTitle(doc, "Mapa Corporal / Regiões Marcadas", currentY, config);
  currentY += 4;
  
  // Desenhar silhuetas e os pontos clicados
  const mapWidth = 90; // largura do mapa
  const mapX = (doc.internal.pageSize.getWidth() - mapWidth) / 2;
  drawBodyMapPDF(doc, mapX, currentY, r.body_regions || []);
  currentY += 52; // Espaço do mapa e rótulo
  
  // Detalhe textual das regiões abaixo do mapa
  currentY = pageGuard(doc, currentY, TITLE, config, 25);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  const regionsListText = r.body_regions && r.body_regions.length > 0
    ? `Regiões marcadas no mapa: ${r.body_regions.map((reg: string) => reg.replace(/ \((Anterior|Posterior)\)/, "")).join(", ")}`
    : "Nenhuma região marcada no mapa.";
  
  const splitText = doc.splitTextToSize(regionsListText, doc.internal.pageSize.getWidth() - 28);
  doc.text(splitText, 14, currentY);
  currentY += (splitText.length * 4) + 6;
  
  // Detalhes SOAP em tabela
  currentY = pageGuard(doc, currentY, TITLE, config, 45);
  sectionTitle(doc, "Evolução SOAP", currentY, config);
  currentY += 4;
  
  const soapData = [
    ["S — Subjetivo", r.subjective || "—"],
    ["O — Objetivo", r.objective || "—"],
    ["A — Avaliação", r.assessment || "—"],
    ["P — Plano", r.plan || "—"],
  ];
  
  autoTable(doc, {
    startY: currentY,
    body: soapData,
    styles: { fontSize: 9, cellPadding: 3.5, overflow: "linebreak" },
    columnStyles: { 
      0: { fontStyle: "bold", fillColor: [240, 247, 255], cellWidth: 35 },
      1: { cellWidth: 145 }
    },
    didDrawPage: () => withChrome(doc, TITLE, config)
  });
  
  paginate(doc);
  const formattedDate = r.record_date || format(new Date(), "yyyy-MM-dd");
  doc.save(`evolucao-${args.patient.full_name.replace(/\s+/g, "_")}-${formattedDate}.pdf`);
}
