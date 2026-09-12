import { createFileRoute } from "@tanstack/react-router";
import { Pagina } from "@/components/pagina";
import { TabelaProdutos } from "@/components/tabela-produtos";

export const Route = createFileRoute("/_authenticated/produtos")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search['q'] === "string" ? (search['q'] as string) : "",
  }),
  head: () => ({
    meta: [
      { title: "Produtos — Estoque Fácil" },
      { name: "description", content: "Cadastro de produtos com SKU único, preços e estoque mínimo." },
      { property: "og:title", content: "Produtos — Estoque Fácil" },
      { property: "og:description", content: "Cadastro de produtos com SKU único, preços e estoque mínimo." },
    ],
  }),
  component: PaginaProdutos,
});

function PaginaProdutos() {
  const { q } = Route.useSearch();
  return (
    <Pagina titulo="Produtos" descricao="Cadastro de produtos com SKU único, custos e margens.">
      <TabelaProdutos modo="produtos" buscaInicial={q} />
    </Pagina>
  );
}
