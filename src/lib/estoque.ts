export type StatusEstoque = "sem" | "baixo" | "normal";

export function statusEstoque(saldo: number, minimo: number): StatusEstoque {
  if (saldo <= 0) return "sem";
  if (minimo > 0 && saldo <= minimo) return "baixo";
  return "normal";
}

export const rotuloStatus: Record<StatusEstoque, string> = {
  sem: "Sem estoque",
  baixo: "Baixo",
  normal: "Normal",
};

export const classeStatus: Record<StatusEstoque, string> = {
  sem: "bg-destructive/15 text-destructive border-destructive/30",
  baixo: "bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400",
  normal: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400",
};

export function gerarSku(nomeCategoria: string | undefined, nomeProduto: string) {
  const prefixo = (nomeCategoria ?? nomeProduto ?? "PRD")
    .normalize("NFD")
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, "X");
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefixo}-${num}`;
}
