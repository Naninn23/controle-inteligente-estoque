import { createFileRoute } from "@tanstack/react-router";
import { Pagina } from "@/components/pagina";
import { TabelaProdutos } from "@/components/tabela-produtos";

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
    <Pagina titulo="Posição de Estoque" descricao="Saldos atuais, valor imobilizado e alertas de mínimo.">
      <TabelaProdutos modo="estoque" />
    </Pagina>
  ),
});
