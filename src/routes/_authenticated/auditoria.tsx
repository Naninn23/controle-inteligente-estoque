import { createFileRoute } from "@tanstack/react-router";
import { Pagina, EmBreve } from "@/components/pagina";

export const Route = createFileRoute("/_authenticated/auditoria")({
  head: () => ({
    meta: [
      { title: "Auditoria — Estoque Fácil" },
      { name: "description", content: "Trilha de auditoria de todas as alterações do sistema." },
      { property: "og:title", content: "Auditoria — Estoque Fácil" },
      { property: "og:description", content: "Trilha de auditoria de todas as alterações do sistema." },
    ],
  }),
  component: () => (
    <Pagina titulo="Auditoria" descricao="Trilha de alterações do sistema.">
      <EmBreve texto="Os registros de auditoria serão exibidos aqui." />
    </Pagina>
  ),
});
