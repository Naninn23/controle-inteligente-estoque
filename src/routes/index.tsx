import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { BarChart3, Boxes, ClipboardList, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Estoque Fácil — Mini ERP de estoque para PMEs" },
      {
        name: "description",
        content:
          "Sistema web de gestão de estoque: produtos e SKUs, entradas e saídas, custo médio ponderado, inventário, relatórios e auditoria.",
      },
      { property: "og:title", content: "Estoque Fácil — Mini ERP de estoque para PMEs" },
      {
        property: "og:description",
        content:
          "Controle completo do seu estoque com movimentações rastreáveis, alertas e relatórios.",
      },
    ],
  }),
  component: Home,
});

const recursos = [
  { icon: Boxes, titulo: "Produtos e SKUs", texto: "Cadastro com categorias, fornecedores e níveis mínimo e máximo." },
  { icon: ClipboardList, titulo: "Entradas e saídas", texto: "Documentos multi-item com custo médio ponderado automático." },
  { icon: BarChart3, titulo: "Indicadores", texto: "Painel com valor em estoque, giro e produtos em ponto de reposição." },
  { icon: ShieldCheck, titulo: "Rastreabilidade", texto: "Movimentações imutáveis, inventário com ajustes e trilha de auditoria." },
];

function Home() {
  const { session, carregando } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!carregando && session) navigate({ to: "/painel", replace: true });
  }, [carregando, session, navigate]);

  return (
    <main className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
          <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <Boxes className="size-5" />
          </span>
          Estoque Fácil
        </span>
        <Button asChild size="sm">
          <Link to="/auth">Entrar</Link>
        </Button>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-16 pt-10 md:pt-20">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Mini ERP de estoque</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
          O controle de estoque da sua empresa, sem planilha e sem retrabalho.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
          Cadastre produtos, registre entradas e saídas, acompanhe saldo, custo médio e faça inventário
          com histórico completo de tudo o que aconteceu.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/auth">Criar conta grátis</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/auth">Já tenho conta</Link>
          </Button>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {recursos.map((r) => (
            <div key={r.titulo} className="rounded-xl border bg-card p-5 shadow-sm">
              <r.icon className="size-6 text-primary" />
              <h2 className="mt-4 font-semibold">{r.titulo}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{r.texto}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
