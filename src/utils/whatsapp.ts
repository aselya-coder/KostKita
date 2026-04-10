export function sanitizePhone(input: string): string {
  if (!input) return "";
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "62" + digits.slice(1);
  else if (digits.startsWith("8")) digits = "62" + digits;
  if (digits.length < 10) return "";
  return digits;
}

export function buildWaLink(phone: string, text: string): string {
  const p = sanitizePhone(phone);
  if (!p) return "";
  return `https://wa.me/${p}?text=${encodeURIComponent(text)}`;
}
