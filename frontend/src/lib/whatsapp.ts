export function digits(phone?: string | null): string {
  return (phone ?? "").replace(/\D/g, "");
}

/** Returns wa.me URL with country code 55 (Brasil). */
export function waLink(phone?: string | null, text?: string): string | null {
  const d = digits(phone);
  if (d.length < 10) return null;
  const withCountry = d.startsWith("55") ? d : `55${d}`;
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${withCountry}${q}`;
}
