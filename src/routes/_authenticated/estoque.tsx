import { createFileRoute } from "@tanstack/react-router";
import { Pagina, EmBreve } from "@/components/pagina";

export const Route = createFileRoute("/_authenticated/estoque")({
  head: () => ({
    meta: [
      { title: "Posição de Estoque — Estoque Fácil" },
      { name: "description", content: "Saldos atuais, custo médio e alertas de estoque mínimo." },
      { property: "og:title", content: "Posição de Estoque — Estoque Fácil" },
      { property: "og:description", content: "Saldos atuais, custo médio e alertas de estoque mínimo." },
    ],
  }),
  component: () => (
    <Pagina titulo="Posição de Estoque" descricao="Saldos atuais, custo médio e alertas de mínimo.">
      <EmBreve texto="A tabela de posição de estoque será exibida aqui." />
    </Pagina>
  ),
});
