import { createFileRoute } from "@tanstack/react-router";
import { Pagina, EmBreve } from "@/components/pagina";

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
    <Pagina titulo="Produtos" descricao="Cadastro de produtos com SKU único.">
      <EmBreve texto="A lista de produtos será exibida aqui." />
    </Pagina>
  ),
});
