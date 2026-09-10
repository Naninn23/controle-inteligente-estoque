import { createFileRoute } from "@tanstack/react-router";
import { Pagina, EmBreve } from "@/components/pagina";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Estoque Fácil" },
      { name: "description", content: "Dados da empresa, alertas e regras de estoque negativo." },
      { property: "og:title", content: "Configurações — Estoque Fácil" },
      { property: "og:description", content: "Dados da empresa, alertas e regras de estoque negativo." },
    ],
  }),
  component: () => (
    <Pagina titulo="Configurações" descricao="Dados da empresa e regras de estoque.">
      <EmBreve texto="As configurações serão exibidas aqui." />
    </Pagina>
  ),
});
