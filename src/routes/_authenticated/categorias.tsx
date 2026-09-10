import { createFileRoute } from "@tanstack/react-router";
import { Pagina, EmBreve } from "@/components/pagina";

export const Route = createFileRoute("/_authenticated/categorias")({
  head: () => ({
    meta: [
      { title: "Categorias — Estoque Fácil" },
      { name: "description", content: "Categorias e subcategorias para organizar seus produtos." },
      { property: "og:title", content: "Categorias — Estoque Fácil" },
      { property: "og:description", content: "Categorias e subcategorias para organizar seus produtos." },
    ],
  }),
  component: () => (
    <Pagina titulo="Categorias" descricao="Categorias e subcategorias dos produtos.">
      <EmBreve texto="A árvore de categorias será exibida aqui." />
    </Pagina>
  ),
});
