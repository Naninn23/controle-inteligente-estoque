import { createFileRoute } from "@tanstack/react-router";
import { Pagina } from "@/components/pagina";
import { Documentos } from "@/components/documentos";

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
      <Documentos tipo="entrada" />
    </Pagina>
  ),
});
