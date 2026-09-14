import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownToLine, ArrowUpFromLine, Download, Scale, Wallet } from "lucide-react";

import { Pagina } from "@/components/pagina";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { brl, data as fData, qtd } from "@/lib/format";

type Periodo = "7d" | "30d" | "90d" | "12m";
const DIAS: Record<Periodo, number> = { "7d": 7, "30d": 30, "90d": 90, "12m": 365 };

function Kpi({
  titulo,
  valor,
  detalhe,
  icone: Icone,
  tom,
}: {
  titulo: string;
  valor: string;
  detalhe: string;
  icone: typeof Wallet;
  tom: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{titulo}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{valor}</p>
          <p className="mt-1 text-xs text-muted-foreground">{detalhe}</p>
        </div>
        <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${tom}`}>
          <Icone className="size-5" />
        </span>
      </CardContent>
    </Card>
  );
}

function Relatorios() {
  const [periodo, setPeriodo] = useState<Periodo>("30d");
  const [tipo, setTipo] = useState("todos");

  const desde = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - DIAS[periodo]);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, [periodo]);

  const { data: movimentos = [], isLoading } = useQuery({
    queryKey: ["relatorio-movimentos", periodo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movimentos")
        .select(
          "id, tipo, quantidade, custo_unitario, custo_medio_posterior, created_at, produtos(nome, sku, unidade)",
        )
        .gte("created_at", desde)
        .order("created_at", { ascending: false })
        .limit(2000);
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtrados = useMemo(
    () => movimentos.filter((m) => tipo === "todos" || m.tipo === tipo),
    [movimentos, tipo],
  );

  const totais = useMemo(() => {
    let entradas = 0,
      saidas = 0,
      ajustes = 0,
      valorEntradas = 0,
      valorSaidas = 0;
    for (const m of filtrados) {
      const q = Math.abs(Number(m.quantidade ?? 0));
      const v = q * Number(m.custo_unitario ?? m.custo_medio_posterior ?? 0);
      if (m.tipo === "entrada") {
        entradas += q;
        valorEntradas += v;
      } else if (m.tipo === "saida") {
        saidas += q;
        valorSaidas += v;
      } else {
        ajustes += q;
      }
    }
    return { entradas, saidas, ajustes, valorEntradas, valorSaidas };
  }, [filtrados]);

  const serie = useMemo(() => {
    const mapa = new Map<string, { dia: string; entrada: number; saida: number; ajuste: number }>();
    for (const m of filtrados) {
      const chave = new Date(m.created_at).toISOString().slice(0, 10);
      const item =
        mapa.get(chave) ?? { dia: chave, entrada: 0, saida: 0, ajuste: 0 };
      const q = Math.abs(Number(m.quantidade ?? 0));
      if (m.tipo === "entrada") item.entrada += q;
      else if (m.tipo === "saida") item.saida += q;
      else item.ajuste += q;
      mapa.set(chave, item);
    }
    return [...mapa.values()]
      .sort((a, b) => a.dia.localeCompare(b.dia))
      .map((i) => ({ ...i, rotulo: fData(i.dia) }));
  }, [filtrados]);

  const ranking = useMemo(() => {
    const mapa = new Map<
      string,
      { nome: string; sku: string; unidade: string; entrada: number; saida: number; valor: number }
    >();
    for (const m of filtrados) {
      const sku = m.produtos?.sku ?? "—";
      const item =
        mapa.get(sku) ?? {
          nome: m.produtos?.nome ?? "—",
          sku,
          unidade: m.produtos?.unidade ?? "un",
          entrada: 0,
          saida: 0,
          valor: 0,
        };
      const q = Math.abs(Number(m.quantidade ?? 0));
      if (m.tipo === "entrada") item.entrada += q;
      else if (m.tipo === "saida") item.saida += q;
      item.valor += q * Number(m.custo_unitario ?? m.custo_medio_posterior ?? 0);
      mapa.set(sku, item);
    }
    return [...mapa.values()].sort((a, b) => b.valor - a.valor).slice(0, 15);
  }, [filtrados]);

  function exportarCsv() {
    const linhas = [
      ["Data", "Produto", "SKU", "Tipo", "Quantidade", "Custo unitário"],
      ...filtrados.map((m) => [
        new Date(m.created_at).toLocaleString("pt-BR"),
        m.produtos?.nome ?? "",
        m.produtos?.sku ?? "",
        m.tipo,
        String(m.quantidade ?? 0),
        String(m.custo_unitario ?? 0),
      ]),
    ];
    const csv = linhas.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-movimentacoes-${periodo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Pagina
      titulo="Relatórios"
      descricao="Movimentações por período e tipo, com valores e ranking de produtos."
      acoes={
        <Button variant="outline" onClick={exportarCsv} disabled={filtrados.length === 0}>
          <Download className="mr-2 size-4" />
          Exportar CSV
        </Button>
      }
    >
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={periodo} onValueChange={(v) => setPeriodo(v as Periodo)}>
          <TabsList>
            <TabsTrigger value="7d">7 dias</TabsTrigger>
            <TabsTrigger value="30d">30 dias</TabsTrigger>
            <TabsTrigger value="90d">90 dias</TabsTrigger>
            <TabsTrigger value="12m">12 meses</TabsTrigger>
          </TabsList>
        </Tabs>
        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger className="w-[190px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="entrada">Entradas</SelectItem>
            <SelectItem value="saida">Saídas</SelectItem>
            <SelectItem value="ajuste">Ajustes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          titulo="Entradas"
          valor={qtd(totais.entradas)}
          detalhe={`${brl(totais.valorEntradas)} em compras`}
          icone={ArrowDownToLine}
          tom="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
        />
        <Kpi
          titulo="Saídas"
          valor={qtd(totais.saidas)}
          detalhe={`${brl(totais.valorSaidas)} em custo de saída`}
          icone={ArrowUpFromLine}
          tom="bg-destructive/15 text-destructive"
        />
        <Kpi
          titulo="Ajustes de inventário"
          valor={qtd(totais.ajustes)}
          detalhe="Quantidades corrigidas por contagem"
          icone={Scale}
          tom="bg-amber-500/15 text-amber-600 dark:text-amber-400"
        />
        <Kpi
          titulo="Saldo do período"
          valor={qtd(totais.entradas - totais.saidas)}
          detalhe={`${filtrados.length} movimentação(ões)`}
          icone={Wallet}
          tom="bg-primary/10 text-primary"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Movimentação por dia</CardTitle>
        </CardHeader>
        <CardContent className="h-[320px]">
          {serie.length === 0 ? (
            <div className="grid h-full place-items-center text-sm text-muted-foreground">
              {isLoading ? "Carregando..." : "Nenhuma movimentação no período."}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serie}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="rotulo" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={48} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    color: "var(--popover-foreground)",
                  }}
                />
                <Legend />
                <Bar dataKey="entrada" name="Entradas" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saida" name="Saídas" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ajuste" name="Ajustes" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">Produtos mais movimentados</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[220px]">Produto</TableHead>
                <TableHead className="text-right">Entradas</TableHead>
                <TableHead className="text-right">Saídas</TableHead>
                <TableHead className="text-right">Saldo líquido</TableHead>
                <TableHead className="text-right">Valor movimentado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranking.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    {isLoading ? "Carregando..." : "Sem dados para o filtro selecionado."}
                  </TableCell>
                </TableRow>
              )}
              {ranking.map((r) => (
                <TableRow key={r.sku}>
                  <TableCell>
                    <div className="font-medium">{r.nome}</div>
                    <div className="text-xs text-muted-foreground">{r.sku}</div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{qtd(r.entrada)}</TableCell>
                  <TableCell className="text-right tabular-nums">{qtd(r.saida)}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {qtd(r.entrada - r.saida)} {r.unidade}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{brl(r.valor)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </Pagina>
  );
}

export const Route = createFileRoute("/_authenticated/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios — Estoque Fácil" },
      {
        name: "description",
        content: "Relatórios de movimentações por período e tipo, com valores e ranking de produtos.",
      },
      { property: "og:title", content: "Relatórios — Estoque Fácil" },
      {
        property: "og:description",
        content: "Relatórios de movimentações por período e tipo, com valores e ranking de produtos.",
      },
    ],
  }),
  component: Relatorios,
});
