import { createFileRoute } from "@tanstack/react-router";
import { Pagina, EmBreve } from "@/components/pagina";

export const Route = createFileRoute("/_authenticated/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios — Estoque Fácil" },
      { name: "description", content: "Relatórios de giro, valorização de estoque e movimentações." },
      { property: "og:title", content: "Relatórios — Estoque Fácil" },
      { property: "og:description", content: "Relatórios de giro, valorização de estoque e movimentações." },
    ],
  }),
  component: () => (
    <Pagina titulo="Relatórios" descricao="Giro, valorização e movimentações do estoque.">
      <EmBreve texto="Os relatórios serão exibidos aqui." />
    </Pagina>
  ),
});
