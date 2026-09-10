import { createFileRoute } from "@tanstack/react-router";
import { Pagina, EmBreve } from "@/components/pagina";

export const Route = createFileRoute("/_authenticated/fornecedores")({
  head: () => ({
    meta: [
      { title: "Fornecedores — Estoque Fácil" },
      { name: "description", content: "Cadastro de fornecedores vinculados às entradas de estoque." },
      { property: "og:title", content: "Fornecedores — Estoque Fácil" },
      { property: "og:description", content: "Cadastro de fornecedores vinculados às entradas de estoque." },
    ],
  }),
  component: () => (
    <Pagina titulo="Fornecedores" descricao="Cadastro de fornecedores.">
      <EmBreve texto="A lista de fornecedores será exibida aqui." />
    </Pagina>
  ),
});
