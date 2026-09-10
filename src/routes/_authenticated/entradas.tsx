import { createFileRoute } from "@tanstack/react-router";
import { Pagina, EmBreve } from "@/components/pagina";

export const Route = createFileRoute("/_authenticated/entradas")({
  head: () => ({
    meta: [
      { title: "Entradas — Estoque Fácil" },
      { name: "description", content: "Documentos de entrada multi-item com custo médio ponderado." },
      { property: "og:title", content: "Entradas — Estoque Fácil" },
      { property: "og:description", content: "Documentos de entrada multi-item com custo médio ponderado." },
    ],
  }),
  component: () => (
    <Pagina titulo="Entradas" descricao="Documentos de entrada multi-item com custo médio ponderado.">
      <EmBreve texto="A lista e o cadastro de entradas serão exibidos aqui." />
    </Pagina>
  ),
});
