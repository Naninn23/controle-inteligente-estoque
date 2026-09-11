import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  CircleSlash,
  Package,
  Wallet,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { brl, dataHora, qtd } from "@/lib/format";
import { classeStatus, rotuloStatus, statusEstoque } from "@/lib/estoque";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Painel — Estoque Fácil" },
      { name: "description", content: "Indicadores, gráficos e alertas do seu estoque em tempo real." },
      { property: "og:title", content: "Painel — Estoque Fácil" },
      { property: "og:description", content: "Indicadores, gráficos e alertas do seu estoque em tempo real." },
    ],
  }),
  component: Painel,
});

type Periodo = "7d" | "30d" | "90d" | "12m";
const DIAS: Record<Periodo, number> = { "7d": 7, "30d": 30, "90d": 90, "12m": 365 };
const CORES = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2, 173 58% 39%))",
  "hsl(var(--chart-3, 197 37% 44%))",
  "hsl(var(--chart-4, 43 74% 56%))",
  "hsl(var(--chart-5, 27 87% 57%))",
  "hsl(var(--muted-foreground))",
];

function Kpi({
  titulo,
  valor,
  icone: Icone,
  detalhe,
  tom = "normal",
}: {
  titulo: string;
  valor: string;
  icone: typeof Package;
  detalhe?: string;
  tom?: "normal" | "alerta" | "perigo" | "sucesso";
}) {
  const tons = {
    normal: "bg-primary/10 text-primary",
    alerta: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    perigo: "bg-destructive/15 text-destructive",
    sucesso: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  };
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`grid size-11 shrink-0 place-items-center rounded-xl ${tons[tom]}`}>
          <Icone className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {titulo}
          </p>
          <p className="truncate text-2xl font-bold tabular-nums">{valor}</p>
          {detalhe && <p className="truncate text-xs text-muted-foreground">{detalhe}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function Painel() {
  const [periodo, setPeriodo] = useState<Periodo>("30d");

  const { data: produtos = [] } = useQuery({
    queryKey: ["painel", "produtos"],
    queryFn: async () =>
      (
        await supabase
          .from("produtos")
          .select("id, nome, sku, saldo, estoque_min, custo_medio, unidade, categorias(nome)")
          .eq("ativo", true)
      ).data ?? [],
  });

  const { data: movimentos = [] } = useQuery({
    queryKey: ["painel", "movimentos"],
    queryFn: async () => {
      const desde = new Date(Date.now() - 365 * 86400000).toISOString();
      return (
        (
          await supabase
            .from("movimentos")
            .select("id, tipo, quantidade, custo_unitario, created_at, saldo_posterior, produtos(nome, sku, unidade)")
            .gte("created_at", desde)
            .order("created_at", { ascending: false })
            .limit(4000)
        ).data ?? []
      );
    },
  });

  const dias = DIAS[periodo];
  const inicio = useMemo(() => Date.now() - dias * 86400000, [dias]);
  const noPeriodo = useMemo(
    () => movimentos.filter((m) => new Date(m.created_at).getTime() >= inicio),
    [movimentos, inicio],
  );

  const kpis = useMemo(() => {
    const total = produtos.length;
    const unidades = produtos.reduce((s, p) => s + Number(p.saldo), 0);
    const valor = produtos.reduce((s, p) => s + Number(p.saldo) * Number(p.custo_medio), 0);
    const baixo = produtos.filter(
      (p) => statusEstoque(Number(p.saldo), Number(p.estoque_min)) === "baixo",
    ).length;
    const zerado = produtos.filter((p) => Number(p.saldo) <= 0).length;

    const mes = new Date();
    mes.setDate(1);
    mes.setHours(0, 0, 0, 0);
    const doMes = movimentos.filter((m) => new Date(m.created_at) >= mes);
    const entradas = doMes
      .filter((m) => m.tipo === "entrada")
      .reduce((s, m) => s + Number(m.quantidade), 0);
    const saidas = doMes
      .filter((m) => m.tipo === "saida")
      .reduce((s, m) => s + Number(m.quantidade), 0);
    return { total, unidades, valor, baixo, zerado, entradas, saidas };
  }, [produtos, movimentos]);

  const serieMovimento = useMemo(() => {
    const mensal = periodo === "12m";
    const mapa = new Map<string, { rotulo: string; entradas: number; saidas: number }>();
    const chave = (d: Date) =>
      mensal
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        : d.toISOString().slice(0, 10);
    const rotulo = (d: Date) =>
      mensal
        ? d.toLocaleDateString("pt-BR", { month: "short" })
        : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

    const passos = mensal ? 12 : dias;
    for (let i = passos - 1; i >= 0; i--) {
      const d = new Date();
      if (mensal) d.setMonth(d.getMonth() - i);
      else d.setDate(d.getDate() - i);
      mapa.set(chave(d), { rotulo: rotulo(d), entradas: 0, saidas: 0 });
    }
    for (const m of noPeriodo) {
      const item = mapa.get(chave(new Date(m.created_at)));
      if (!item) continue;
      if (m.tipo === "saida") item.saidas += Number(m.quantidade);
      else item.entradas += Number(m.quantidade);
    }
    return [...mapa.values()];
  }, [noPeriodo, periodo, dias]);

  const ranking = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const m of noPeriodo) {
      if (m.tipo !== "saida") continue;
      const nome = m.produtos?.nome ?? "—";
      mapa.set(nome, (mapa.get(nome) ?? 0) + Number(m.quantidade));
    }
    return [...mapa.entries()]
      .map(([nome, total]) => ({ nome: nome.length > 22 ? `${nome.slice(0, 22)}…` : nome, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 7);
  }, [noPeriodo]);

  const porCategoria = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const p of produtos) {
      const nome = p.categorias?.nome ?? "Sem categoria";
      mapa.set(nome, (mapa.get(nome) ?? 0) + Number(p.saldo) * Number(p.custo_medio));
    }
    return [...mapa.entries()]
      .map(([nome, valor]) => ({ nome, valor: Math.round(valor * 100) / 100 }))
      .filter((c) => c.valor > 0)
      .sort((a, b) => b.valor - a.valor);
  }, [produtos]);

  const evolucaoValor = useMemo(() => {
    // valor atual e reconstrução retroativa pelo fluxo de movimentos
    const atual = produtos.reduce((s, p) => s + Number(p.saldo) * Number(p.custo_medio), 0);
    const mensal = periodo === "12m";
    const passos = mensal ? 12 : Math.min(dias, 90);
    const pontos: { rotulo: string; valor: number }[] = [];
    let valor = atual;
    const ordenados = [...movimentos].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    let idx = 0;
    for (let i = 0; i < passos; i++) {
      const limite = new Date();
      if (mensal) limite.setMonth(limite.getMonth() - i);
      else limite.setDate(limite.getDate() - i);
      while (idx < ordenados.length && new Date(ordenados[idx]!.created_at) > limite) {
        const m = ordenados[idx]!;
        const delta = Number(m.quantidade) * Number(m.custo_unitario || 0);
        valor += m.tipo === "saida" ? delta : -delta;
        idx++;
      }
      pontos.push({
        rotulo: mensal
          ? limite.toLocaleDateString("pt-BR", { month: "short" })
          : limite.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        valor: Math.max(0, Math.round(valor * 100) / 100),
      });
    }
    return pontos.reverse();
  }, [movimentos, produtos, periodo, dias]);

  const reposicao = useMemo(
    () =>
      produtos
        .filter((p) => statusEstoque(Number(p.saldo), Number(p.estoque_min)) !== "normal")
        .sort((a, b) => Number(a.saldo) - Number(b.saldo))
        .slice(0, 8),
    [produtos],
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight">Painel</h1>
          <p className="text-sm text-muted-foreground">Visão geral do seu estoque.</p>
        </div>
        <Tabs value={periodo} onValueChange={(v) => setPeriodo(v as Periodo)}>
          <TabsList>
            <TabsTrigger value="7d">7d</TabsTrigger>
            <TabsTrigger value="30d">30d</TabsTrigger>
            <TabsTrigger value="90d">90d</TabsTrigger>
            <TabsTrigger value="12m">12m</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi titulo="Produtos cadastrados" valor={String(kpis.total)} icone={Package} />
        <Kpi titulo="Unidades em estoque" valor={qtd(kpis.unidades)} icone={Boxes} />
        <Kpi titulo="Valor do estoque" valor={brl(kpis.valor)} icone={Wallet} tom="sucesso" />
        <Kpi
          titulo="Estoque baixo"
          valor={String(kpis.baixo)}
          icone={AlertTriangle}
          tom="alerta"
          detalhe="Saldo igual ou abaixo do mínimo"
        />
        <Kpi titulo="Produtos zerados" valor={String(kpis.zerado)} icone={CircleSlash} tom="perigo" />
        <Kpi
          titulo="Entradas do mês"
          valor={qtd(kpis.entradas)}
          icone={ArrowDownToLine}
          tom="sucesso"
        />
        <Kpi titulo="Saídas do mês" valor={qtd(kpis.saidas)} icone={ArrowUpFromLine} tom="alerta" />
        <Kpi
          titulo="Movimentações no período"
          valor={String(noPeriodo.length)}
          icone={Boxes}
          detalhe={`Últimos ${periodo}`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Movimentação de estoque</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={serieMovimento}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="rotulo" fontSize={11} tickLine={false} minTickGap={20} />
                <YAxis fontSize={11} tickLine={false} width={40} />
                <Tooltip formatter={(v: number) => qtd(v)} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="entradas"
                  name="Entradas"
                  stroke={CORES[0]}
                  fill={CORES[0]}
                  fillOpacity={0.2}
                />
                <Area
                  type="monotone"
                  dataKey="saidas"
                  name="Saídas"
                  stroke={CORES[4]}
                  fill={CORES[4]}
                  fillOpacity={0.15}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Produtos com maior saída</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ranking} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} horizontal={false} />
                <XAxis type="number" fontSize={11} />
                <YAxis dataKey="nome" type="category" width={150} fontSize={11} />
                <Tooltip formatter={(v: number) => qtd(v)} />
                <Bar dataKey="total" name="Saídas" fill={CORES[0]} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Estoque por categoria (R$)</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={porCategoria} dataKey="valor" nameKey="nome" outerRadius={90} label={false}>
                  {porCategoria.map((_, i) => (
                    <Cell key={i} fill={CORES[i % CORES.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => brl(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Evolução do valor de estoque</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolucaoValor}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="rotulo" fontSize={11} minTickGap={20} />
                <YAxis fontSize={11} width={70} tickFormatter={(v: number) => brl(v).replace("R$", "")} />
                <Tooltip formatter={(v: number) => brl(v)} />
                <Line type="monotone" dataKey="valor" name="Valor" stroke={CORES[0]} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Últimas movimentações</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/movimentacoes">Ver todas</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {movimentos.slice(0, 8).map((m) => (
              <div key={m.id} className="flex items-center gap-3">
                <div
                  className={`grid size-8 shrink-0 place-items-center rounded-md ${
                    m.tipo === "saida"
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {m.tipo === "saida" ? (
                    <ArrowUpFromLine className="size-4" />
                  ) : (
                    <ArrowDownToLine className="size-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{m.produtos?.nome ?? "—"}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {dataHora(m.created_at)} · saldo {qtd(m.saldo_posterior)}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-medium tabular-nums">
                  {m.tipo === "saida" ? "-" : "+"}
                  {qtd(m.quantidade)}
                </span>
              </div>
            ))}
            {movimentos.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhuma movimentação registrada.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Reposição imediata</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/estoque">Ver estoque</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {reposicao.map((p) => {
              const s = statusEstoque(Number(p.saldo), Number(p.estoque_min));
              return (
                <div key={p.id} className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.nome}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {p.sku} · saldo {qtd(p.saldo)} {p.unidade} · mínimo {qtd(p.estoque_min)}
                    </p>
                  </div>
                  <Badge variant="outline" className={`shrink-0 ${classeStatus[s]}`}>
                    {rotuloStatus[s]}
                  </Badge>
                </div>
              );
            })}
            {reposicao.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Todos os produtos estão acima do estoque mínimo.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
