export function brl(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function qtd(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  return n.toLocaleString("pt-BR", { maximumFractionDigits: 3 });
}

export function dataHora(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function data(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR");
}
