import { createFileRoute } from "@tanstack/react-router";
import { Pagina, EmBreve } from "@/components/pagina";

export const Route = createFileRoute("/_authenticated/inventario")({
  head: () => ({
    meta: [
      { title: "Inventário — Estoque Fácil" },
      { name: "description", content: "Contagens de inventário com ajustes automáticos de saldo." },
      { property: "og:title", content: "Inventário — Estoque Fácil" },
      { property: "og:description", content: "Contagens de inventário com ajustes automáticos de saldo." },
    ],
  }),
  component: () => (
    <Pagina titulo="Inventário" descricao="Contagens com ajustes automáticos de saldo.">
      <EmBreve texto="As contagens de inventário serão exibidas aqui." />
    </Pagina>
  ),
});
