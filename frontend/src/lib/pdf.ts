import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CLINIC } from "@/lib/brand";

const PRIMARY: [number, number, number] = [26, 111, 181];
const ACCENT: [number, number, number] = [76, 175, 80];

function header(doc: jsPDF, title: string) {
  const w = doc.internal.pageSize.getWidth();
  const steps = 60;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const r = Math.round(PRIMARY[0] + (ACCENT[0] - PRIMARY[0]) * t);
    const g = Math.round(PRIMARY[1] + (ACCENT[1] - PRIMARY[1]) * t);
    const b = Math.round(PRIMARY[2] + (ACCENT[2] - PRIMARY[2]) * t);
    doc.setFillColor(r, g, b);
    doc.rect((w / steps) * i, 0, w / steps + 0.5, 28, "F");
  }
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(CLINIC.shortName, 14, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(CLINIC.name, 14, 17);
  doc.text(CLINIC.address, 14, 21);
  doc.text(`${CLINIC.phone} · ${CLINIC.instagram}`, 14, 25);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(title, w - 14, 18, { align: "right" });
  doc.setTextColor(40, 40, 40);
}

function footer(doc: jsPDF) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.6);
  doc.line(14, h - 18, w - 14, h - 18);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...PRIMARY);
  doc.text(CLINIC.owner, 14, h - 12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text(CLINIC.crefito, 14, h - 7);
  doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, w - 14, h - 7, { align: "right" });
}

function withChrome(doc: jsPDF, title: string) { header(doc, title); footer(doc); }
function newDoc() { return new jsPDF({ unit: "mm", format: "a4" }); }
const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString("pt-BR") : "—";
const fmtMoney = (n: any) => n ? `R$ ${Number(n).toFixed(2).replace(".", ",")}` : "—";

function sectionTitle(doc: jsPDF, text: string, y: number) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...PRIMARY);
  doc.text(text, 14, y);
  doc.setTextColor(40, 40, 40);
}

function pageGuard(doc: jsPDF, y: number, title: string, needed = 30): number {
  const h = doc.internal.pageSize.getHeight();
  if (y > h - needed) { doc.addPage(); withChrome(doc, title); return 40; }
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
    patient.cpf && `CPF: ${patient.cpf}`,
    patient.insurance && `Plano: ${patient.insurance}`,
  ].filter(Boolean).join("  ·  ");
  doc.text(info, 14, y);
  return y + 6;
}

// ============ 1) PRONTUÁRIO COMPLETO ============
export function downloadProntuarioPDF(args: {
  patient: any; records: any[]; vitals: any[]; sessions: any[];
  anamnese?: any; functional?: any[]; painMap?: any[]; rom?: any[]; tests?: any[]; perimetry?: any[];
}) {
  const TITLE = "Prontuário do Paciente";
  const doc = newDoc(); withChrome(doc, TITLE);
  let y = 36;
  y = patientHeader(doc, args.patient, y);

  if (args.anamnese) {
    y = pageGuard(doc, y + 4, TITLE, 60); sectionTitle(doc, "Anamnese", y); y += 4;
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
        didDrawPage: () => withChrome(doc, TITLE) });
      y = (doc as any).lastAutoTable.finalY + 4;
    }
  }

  if (args.painMap && args.painMap.length) {
    y = pageGuard(doc, y + 4, TITLE); sectionTitle(doc, "Mapa de dor", y);
    autoTable(doc, { startY: y + 2,
      head: [["Data", "Região", "Lado", "Intensidade", "Obs"]],
      body: args.painMap.map((p) => [fmtDate(p.entry_date), p.region, p.side ?? "—", `${p.intensity}/10`, p.notes ?? "—"]),
      headStyles: { fillColor: PRIMARY, textColor: 255 }, styles: { fontSize: 8, cellPadding: 2 },
      didDrawPage: () => withChrome(doc, TITLE) });
    y = (doc as any).lastAutoTable.finalY + 4;
  }

  if (args.rom && args.rom.length) {
    y = pageGuard(doc, y + 4, TITLE); sectionTitle(doc, "Amplitude de movimento (ADM)", y);
    autoTable(doc, { startY: y + 2,
      head: [["Data", "Articulação", "Movimento", "Lado", "Ativo", "Passivo"]],
      body: args.rom.map((r) => [fmtDate(r.measured_at), r.joint, r.movement, r.side ?? "—", r.active_degrees ? `${r.active_degrees}°` : "—", r.passive_degrees ? `${r.passive_degrees}°` : "—"]),
      headStyles: { fillColor: PRIMARY, textColor: 255 }, styles: { fontSize: 8, cellPadding: 2 },
      didDrawPage: () => withChrome(doc, TITLE) });
    y = (doc as any).lastAutoTable.finalY + 4;
  }

  if (args.tests && args.tests.length) {
    y = pageGuard(doc, y + 4, TITLE); sectionTitle(doc, "Testes especiais", y);
    autoTable(doc, { startY: y + 2,
      head: [["Data", "Teste", "Região", "Resultado", "Obs"]],
      body: args.tests.map((t) => [fmtDate(t.performed_at), t.test_name, t.region ?? "—", t.result, t.notes ?? "—"]),
      headStyles: { fillColor: PRIMARY, textColor: 255 }, styles: { fontSize: 8, cellPadding: 2 },
      didDrawPage: () => withChrome(doc, TITLE) });
    y = (doc as any).lastAutoTable.finalY + 4;
  }

  if (args.perimetry && args.perimetry.length) {
    y = pageGuard(doc, y + 4, TITLE); sectionTitle(doc, "Perimetria", y);
    autoTable(doc, { startY: y + 2,
      head: [["Data", "Segmento", "Lado", "Medida (cm)"]],
      body: args.perimetry.map((p) => [fmtDate(p.measured_at), p.segment, p.side ?? "—", String(p.measurement_cm)]),
      headStyles: { fillColor: PRIMARY, textColor: 255 }, styles: { fontSize: 8, cellPadding: 2 },
      didDrawPage: () => withChrome(doc, TITLE) });
    y = (doc as any).lastAutoTable.finalY + 4;
  }

  y = pageGuard(doc, y + 4, TITLE); sectionTitle(doc, "Prontuários SOAP", y);
  if (args.records.length === 0) {
    doc.setFont("helvetica", "italic"); doc.setFontSize(10);
    doc.text("Sem registros.", 14, y + 6); y += 10;
  } else {
    autoTable(doc, { startY: y + 2,
      head: [["Data", "EVA", "CID-10", "S", "O", "A", "P"]],
      body: args.records.map((r) => [fmtDate(r.record_date), r.pain_scale ?? "—", r.cid10 ?? "—", r.subjective ?? "—", r.objective ?? "—", r.assessment ?? "—", r.plan ?? "—"]),
      headStyles: { fillColor: PRIMARY, textColor: 255 }, styles: { fontSize: 7, cellPadding: 1.5 },
      columnStyles: { 0: { cellWidth: 16 }, 1: { cellWidth: 10, halign: "center" }, 2: { cellWidth: 16 } },
      didDrawPage: () => withChrome(doc, TITLE) });
    y = (doc as any).lastAutoTable.finalY + 4;
  }

  if (args.vitals.length) {
    y = pageGuard(doc, y + 4, TITLE); sectionTitle(doc, "Sinais Vitais", y);
    autoTable(doc, { startY: y + 2,
      head: [["Data", "PA", "FC", "FR", "Temp", "SpO2", "Peso", "Alt", "IMC"]],
      body: args.vitals.map((v) => [fmtDate(v.measured_at), v.systolic && v.diastolic ? `${v.systolic}/${v.diastolic}` : "—", v.heart_rate ?? "—", v.respiratory_rate ?? "—", v.temperature ?? "—", v.spo2 ?? "—", v.weight ?? "—", v.height ?? "—", v.bmi ?? "—"]),
      headStyles: { fillColor: ACCENT, textColor: 255 }, styles: { fontSize: 8, cellPadding: 2 },
      didDrawPage: () => withChrome(doc, TITLE) });
    y = (doc as any).lastAutoTable.finalY + 4;
  }

  if (args.sessions.length) {
    y = pageGuard(doc, y + 4, TITLE); sectionTitle(doc, "Histórico de Sessões", y);
    autoTable(doc, { startY: y + 2,
      head: [["Data", "Procedimento", "Status", "Valor"]],
      body: args.sessions.map((s) => [new Date(s.starts_at).toLocaleString("pt-BR"), s.procedure ?? "—", s.status ?? "—", fmtMoney(s.price)]),
      headStyles: { fillColor: PRIMARY, textColor: 255 }, styles: { fontSize: 9, cellPadding: 2 },
      didDrawPage: () => withChrome(doc, TITLE) });
    y = (doc as any).lastAutoTable.finalY + 14;
  }

  y = pageGuard(doc, y, TITLE, 30);
  doc.setDrawColor(120, 120, 120); doc.line(14, y, 90, y);
  doc.setFontSize(9); doc.setTextColor(80, 80, 80);
  doc.text("Assinatura do profissional", 14, y + 5);

  doc.save(`prontuario-${args.patient.full_name.replace(/\s+/g, "_")}.pdf`);
}

// ============ 2) RECIBO DE SESSÃO ============
export function downloadSessionReceiptPDF(args: { patient: any; session: any }) {
  const TITLE = "Comprovante de Sessão";
  const doc = newDoc(); withChrome(doc, TITLE);
  let y = 42;
  doc.setFont("helvetica", "bold"); doc.setFontSize(13);
  doc.text("Recibo de Atendimento", 14, y); y += 10;
  autoTable(doc, { startY: y,
    body: [
      ["Paciente", args.patient.full_name],
      ["Data", new Date(args.session.starts_at).toLocaleString("pt-BR")],
      ["Procedimento", args.session.procedure ?? "—"],
      ["Duração", `${args.session.duration_minutes} min`],
      ["Forma de pagamento", args.session.payment_method ?? "—"],
      ["Valor", fmtMoney(args.session.price)],
      ["Status", args.session.status ?? "—"],
    ],
    styles: { fontSize: 11, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: "bold", fillColor: [240, 247, 255], cellWidth: 50 } },
    didDrawPage: () => withChrome(doc, TITLE) });
  const fy = (doc as any).lastAutoTable.finalY + 20;
  doc.setDrawColor(120, 120, 120); doc.line(14, fy, 90, fy);
  doc.setFontSize(9); doc.text("Assinatura do profissional", 14, fy + 5);
  doc.save(`comprovante-${args.patient.full_name.replace(/\s+/g, "_")}.pdf`);
}

// ============ 3) RELATÓRIO MENSAL ============
export function downloadMonthlyReportPDF(args: {
  monthLabel: string; patients: any[];
  totals: { totalPatients: number; totalSessions: number; attendance: number; revenue: number };
}) {
  const TITLE = `Relatório Mensal — ${args.monthLabel}`;
  const doc = newDoc(); withChrome(doc, TITLE);
  let y = 42;
  sectionTitle(doc, "Resumo do mês", y); y += 4;
  autoTable(doc, { startY: y + 2,
    body: [
      ["Pacientes ativos", String(args.totals.totalPatients)],
      ["Total de sessões", String(args.totals.totalSessions)],
      ["Taxa de presença", `${args.totals.attendance.toFixed(1)}%`],
      ["Receita estimada", fmtMoney(args.totals.revenue)],
    ],
    styles: { fontSize: 11, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: "bold", fillColor: [240, 247, 255], cellWidth: 60 } },
    didDrawPage: () => withChrome(doc, TITLE) });
  y = (doc as any).lastAutoTable.finalY + 8;
  sectionTitle(doc, "Pacientes", y);
  autoTable(doc, { startY: y + 2,
    head: [["Nome", "Telefone", "Classificação", "Sessões no mês"]],
    body: args.patients.map((p) => [p.full_name, p.phone ?? "—", p.classification ?? "—", String(p.session_count ?? 0)]),
    headStyles: { fillColor: PRIMARY, textColor: 255 }, styles: { fontSize: 9, cellPadding: 2 },
    didDrawPage: () => withChrome(doc, TITLE) });
  doc.save(`relatorio-${args.monthLabel.replace(/\s+/g, "_")}.pdf`);
}

// ============ 4) FREQUÊNCIA ============
export function downloadFrequenciaPDF(args: { patient: any; sessions: any[]; periodLabel: string }) {
  const TITLE = `Frequência — ${args.periodLabel}`;
  const doc = newDoc(); withChrome(doc, TITLE);
  let y = 36;
  y = patientHeader(doc, args.patient, y);
  const realizadas = args.sessions.filter((s) => s.status === "realizado").length;
  const faltas = args.sessions.filter((s) => s.status === "faltou").length;
  const canceladas = args.sessions.filter((s) => s.status === "cancelado").length;
  const total = args.sessions.length;
  const taxa = total > 0 ? ((realizadas / total) * 100).toFixed(1) : "0";
  y += 4; sectionTitle(doc, "Resumo", y);
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
    didDrawPage: () => withChrome(doc, TITLE) });
  y = (doc as any).lastAutoTable.finalY + 6;
  sectionTitle(doc, "Detalhamento", y);
  autoTable(doc, { startY: y + 2,
    head: [["Data", "Procedimento", "Status"]],
    body: args.sessions.map((s) => [new Date(s.starts_at).toLocaleString("pt-BR"), s.procedure ?? "—", s.status]),
    headStyles: { fillColor: PRIMARY, textColor: 255 }, styles: { fontSize: 9, cellPadding: 2 },
    didDrawPage: () => withChrome(doc, TITLE) });
  doc.save(`frequencia-${args.patient.full_name.replace(/\s+/g, "_")}.pdf`);
}

// ============ 5) ANAMNESE ============
export function downloadAnamnesePDF(args: { patient: any; anamnese: any }) {
  const TITLE = "Anamnese";
  const doc = newDoc(); withChrome(doc, TITLE);
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
      didDrawPage: () => withChrome(doc, TITLE) });
  }
  doc.save(`anamnese-${args.patient.full_name.replace(/\s+/g, "_")}.pdf`);
}

// ============ 6) FINANCEIRO ============
export function downloadFinancialPDF(args: {
  periodLabel: string;
  byMethod: { method: string; total: number; count: number }[];
  topPatients: { full_name: string; total: number; sessions: number }[];
  grandTotal: number;
}) {
  const TITLE = `Relatório Financeiro — ${args.periodLabel}`;
  const doc = newDoc(); withChrome(doc, TITLE);
  let y = 42;
  sectionTitle(doc, "Receita total", y);
  doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.setTextColor(...ACCENT);
  doc.text(fmtMoney(args.grandTotal), 14, y + 12);
  doc.setTextColor(40, 40, 40);
  y += 22;

  sectionTitle(doc, "Por forma de pagamento", y);
  autoTable(doc, { startY: y + 2,
    head: [["Forma", "Sessões", "Receita"]],
    body: args.byMethod.map((r) => [r.method, String(r.count), fmtMoney(r.total)]),
    headStyles: { fillColor: PRIMARY, textColor: 255 }, styles: { fontSize: 10, cellPadding: 2 },
    didDrawPage: () => withChrome(doc, TITLE) });
  y = (doc as any).lastAutoTable.finalY + 6;

  sectionTitle(doc, "Top pacientes", y);
  autoTable(doc, { startY: y + 2,
    head: [["Paciente", "Sessões", "Receita"]],
    body: args.topPatients.map((p) => [p.full_name, String(p.sessions), fmtMoney(p.total)]),
    headStyles: { fillColor: PRIMARY, textColor: 255 }, styles: { fontSize: 10, cellPadding: 2 },
    didDrawPage: () => withChrome(doc, TITLE) });

  doc.save(`financeiro-${args.periodLabel.replace(/\s+/g, "_")}.pdf`);
}

// ============ 7) EVOLUÇÃO CLÍNICA ============
export function downloadClinicalEvolutionPDF(args: { patient: any; records: any[] }) {
  const TITLE = "Evolução Clínica";
  const doc = newDoc(); withChrome(doc, TITLE);
  let y = 36;
  y = patientHeader(doc, args.patient, y);
  y += 4; sectionTitle(doc, "Evolução cronológica (EVA / escore)", y); y += 2;

  // Sparkline simples (ASCII-free), barras horizontais por registro
  const records = args.records.slice().sort((a, b) => +new Date(a.record_date) - +new Date(b.record_date));
  if (records.length === 0) {
    doc.setFont("helvetica", "italic"); doc.text("Sem registros para gerar gráfico.", 14, y + 6);
  } else {
    autoTable(doc, { startY: y + 2,
      head: [["Data", "EVA", "Score", "Avaliação"]],
      body: records.map((r) => [fmtDate(r.record_date), r.pain_scale ?? "—", r.evolution_score ?? "—", (r.assessment ?? r.subjective ?? "—").slice(0, 80)]),
      headStyles: { fillColor: PRIMARY, textColor: 255 },
      styles: { fontSize: 9, cellPadding: 2 },
      didDrawPage: () => withChrome(doc, TITLE) });
    y = (doc as any).lastAutoTable.finalY + 8;

    // Gráfico de barras EVA
    y = pageGuard(doc, y, TITLE, 80);
    sectionTitle(doc, "EVA ao longo do tempo", y); y += 4;
    const chartX = 20, chartY = y, chartW = 170, chartH = 60;
    doc.setDrawColor(200, 200, 200); doc.rect(chartX, chartY, chartW, chartH);
    const max = 10;
    const barW = chartW / records.length;
    records.forEach((r, i) => {
      const v = r.pain_scale ?? 0;
      const h = (v / max) * chartH;
      const color: [number, number, number] = v <= 3 ? [76, 175, 80] : v <= 6 ? [245, 158, 11] : [239, 68, 68];
      doc.setFillColor(...color);
      doc.rect(chartX + i * barW + 1, chartY + chartH - h, Math.max(barW - 2, 1), h, "F");
    });
    doc.setFontSize(7); doc.setTextColor(120, 120, 120);
    doc.text("0", chartX - 4, chartY + chartH);
    doc.text("10", chartX - 5, chartY + 3);
  }
  doc.save(`evolucao-${args.patient.full_name.replace(/\s+/g, "_")}.pdf`);
}
