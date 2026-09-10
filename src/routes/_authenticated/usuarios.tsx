import { createFileRoute } from "@tanstack/react-router";
import { Pagina, EmBreve } from "@/components/pagina";

export const Route = createFileRoute("/_authenticated/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuários — Estoque Fácil" },
      { name: "description", content: "Gestão de usuários e perfis de acesso da equipe." },
      { property: "og:title", content: "Usuários — Estoque Fácil" },
      { property: "og:description", content: "Gestão de usuários e perfis de acesso da equipe." },
    ],
  }),
  component: () => (
    <Pagina titulo="Usuários" descricao="Usuários e perfis de acesso.">
      <EmBreve texto="A gestão de usuários será exibida aqui." />
    </Pagina>
  ),
});
