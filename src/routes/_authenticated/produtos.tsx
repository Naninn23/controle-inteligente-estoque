import { createFileRoute } from "@tanstack/react-router";
import { Pagina } from "@/components/pagina";
import { TabelaProdutos } from "@/components/tabela-produtos";

export const Route = createFileRoute("/_authenticated/produtos")({
  head: () => ({
    meta: [
      { title: "Produtos — Estoque Fácil" },
      { name: "description", content: "Cadastro de produtos com SKU único, preços e estoque mínimo." },
      { property: "og:title", content: "Produtos — Estoque Fácil" },
      { property: "og:description", content: "Cadastro de produtos com SKU único, preços e estoque mínimo." },
    ],
  }),
  component: () => (
    <Pagina titulo="Produtos" descricao="Cadastro de produtos com SKU único, custos e margens.">
      <TabelaProdutos modo="produtos" />
    </Pagina>
  ),
});
