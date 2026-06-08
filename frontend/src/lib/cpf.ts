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

/** Mascara CPF para exibição em PDFs/relatórios (mantém só primeiros e últimos dígitos). */
export function maskCpfDisplay(value?: string | null): string {
  const d = (value ?? "").replace(/\D/g, "");
  if (d.length !== 11) return value ?? "—";
  return `${d.slice(0, 3)}.***.***-${d.slice(9)}`;
}
