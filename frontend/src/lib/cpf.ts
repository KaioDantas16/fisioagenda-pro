/** Aplica máscara 000.000.000-00 enquanto o usuário digita. */
export function maskCPF(value: string): string {
  const d = (value ?? "").replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function unmaskCPF(value: string): string {
  return (value ?? "").replace(/\D/g, "");
}

/**
 * Mascara CPF para exibição em PDFs/relatórios.
 * Formato: ***.***.NNN-NN (apenas os últimos 5 dígitos visíveis).
 */
export function maskCpfDisplay(value?: string | null): string {
  const d = (value ?? "").replace(/\D/g, "");
  if (d.length !== 11) return value ?? "—";
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "***.***.$3-$4");
}

/** Formata valor em reais (pt-BR). Ex: 1234.5 → "R$ 1.234,50". */
export function fmtBRL(value?: number | string | null): string {
  if (value === null || value === undefined || value === "") return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
