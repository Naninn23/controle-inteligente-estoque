import { createFileRoute } from "@tanstack/react-router";
import { Pagina, EmBreve } from "@/components/pagina";

export const Route = createFileRoute("/_authenticated/saidas")({
  head: () => ({
    meta: [
      { title: "Saídas — Estoque Fácil" },
      { name: "description", content: "Documentos de saída multi-item com bloqueio de estoque negativo." },
      { property: "og:title", content: "Saídas — Estoque Fácil" },
      { property: "og:description", content: "Documentos de saída multi-item com bloqueio de estoque negativo." },
    ],
  }),
  component: () => (
    <Pagina titulo="Saídas" descricao="Documentos de saída multi-item com bloqueio de estoque negativo.">
      <EmBreve texto="A lista e o cadastro de saídas serão exibidos aqui." />
    </Pagina>
  ),
});
