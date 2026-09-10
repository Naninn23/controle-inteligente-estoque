import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Painel — Estoque Fácil" },
      { name: "description", content: "Indicadores do seu estoque em tempo real." },
      { property: "og:title", content: "Painel — Estoque Fácil" },
      { property: "og:description", content: "Indicadores do seu estoque em tempo real." },
    ],
  }),
  component: Painel,
});

function Painel() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Painel</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sua área de gestão está pronta. As telas de produtos, movimentações e relatórios entram em seguida.
      </p>
    </div>
  );
}
