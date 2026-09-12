import { createFileRoute } from "@tanstack/react-router";
import { Pagina } from "@/components/pagina";
import { TabelaProdutos } from "@/components/tabela-produtos";

export const Route = createFileRoute("/_authenticated/estoque")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search['q'] === "string" ? (search['q'] as string) : "",
  }),
  head: () => ({
    meta: [
      { title: "Posição de Estoque — Estoque Fácil" },
      { name: "description", content: "Saldos atuais, custo médio e alertas de estoque mínimo." },
      { property: "og:title", content: "Posição de Estoque — Estoque Fácil" },
      { property: "og:description", content: "Saldos atuais, custo médio e alertas de estoque mínimo." },
    ],
  }),
  component: PaginaEstoque,
});

function PaginaEstoque() {
  const { q } = Route.useSearch();
  return (
    <Pagina titulo="Posição de Estoque" descricao="Saldos atuais, valor imobilizado e alertas de mínimo.">
      <TabelaProdutos modo="estoque" buscaInicial={q} />
    </Pagina>
  );
}
