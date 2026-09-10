import { createFileRoute } from "@tanstack/react-router";
import { Pagina, EmBreve } from "@/components/pagina";

export const Route = createFileRoute("/_authenticated/movimentacoes")({
  head: () => ({
    meta: [
      { title: "Movimentações — Estoque Fácil" },
      { name: "description", content: "Histórico imutável com saldo anterior e posterior de cada item." },
      { property: "og:title", content: "Movimentações — Estoque Fácil" },
      { property: "og:description", content: "Histórico imutável com saldo anterior e posterior de cada item." },
    ],
  }),
  component: () => (
    <Pagina titulo="Movimentações" descricao="Histórico imutável com saldo anterior e posterior.">
      <EmBreve texto="O histórico de movimentações será exibido aqui." />
    </Pagina>
  ),
});
